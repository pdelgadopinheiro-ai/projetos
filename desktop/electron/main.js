const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');

const DEFAULT_APP_URL = process.env.EASYSTORE_APP_URL || 'http://localhost:3000';
const CONFIG_FILE_NAME = 'desktop-config.json';
const CSS_PIXEL_TO_MICRONS = 25400 / 96;
const PRINT_LOAD_TIMEOUT_MS = 15000;

let mainWindow = null;

function normalizeUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) {
        return '';
    }
    return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

function isValidHttpUrl(value) {
    try {
        const parsed = new URL(String(value || ''));
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (error) {
        return false;
    }
}

function getConfigPath() {
    return path.join(app.getPath('userData'), CONFIG_FILE_NAME);
}

function loadDesktopConfig() {
    const filePath = getConfigPath();
    try {
        if (!fs.existsSync(filePath)) {
            return {};
        }
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
            return {};
        }
        return parsed;
    } catch (error) {
        console.error('Falha ao ler configuracao desktop:', error);
        return {};
    }
}

function saveDesktopConfig(config) {
    const filePath = getConfigPath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
}

function normalizePrinterSearch(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '');
}

function normalizePrintProfile(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return ['a4', 'thermal80', 'thermal58'].includes(normalized) ? normalized : 'a4';
}

function getPrintProfileConfig(profile) {
    const normalized = normalizePrintProfile(profile);
    const profiles = {
        a4: {
            pageSize: 'A4',
            margins: { marginType: 'none' },
            width: 794,
            height: 1123
        },
        thermal80: {
            pageSize: { width: 80000, height: 240000 },
            paperWidthMicrons: 80000,
            minHeightMicrons: 50000,
            maxHeightMicrons: 3000000,
            margins: { marginType: 'none' },
            width: 304,
            height: 900
        },
        thermal58: {
            pageSize: { width: 58000, height: 240000 },
            paperWidthMicrons: 58000,
            minHeightMicrons: 50000,
            maxHeightMicrons: 3000000,
            margins: { marginType: 'none' },
            width: 220,
            height: 900
        }
    };

    return profiles[normalized];
}

async function getPrintersForWebContents(webContents) {
    const source = webContents || mainWindow?.webContents;
    if (!source || typeof source.getPrintersAsync !== 'function') {
        return [];
    }

    return source.getPrintersAsync();
}

function resolvePrinterDeviceName(printers, requestedPrinterName) {
    const requested = String(requestedPrinterName || '').trim();
    if (!requested) {
        return {
            deviceName: '',
            displayName: '',
            matched: false,
            required: false
        };
    }

    const normalizedRequested = normalizePrinterSearch(requested);
    const exactMatch = printers.find((printer) => {
        return normalizePrinterSearch(printer.name) === normalizedRequested
            || normalizePrinterSearch(printer.displayName) === normalizedRequested;
    });

    const partialMatch = exactMatch || printers.find((printer) => {
        const normalizedName = normalizePrinterSearch(printer.name);
        const normalizedDisplayName = normalizePrinterSearch(printer.displayName);
        return (normalizedName && (
            normalizedName.includes(normalizedRequested)
            || normalizedRequested.includes(normalizedName)
        )) || (normalizedDisplayName && (
            normalizedDisplayName.includes(normalizedRequested)
            || normalizedRequested.includes(normalizedDisplayName)
        ));
    });

    if (!partialMatch) {
        return {
            deviceName: '',
            displayName: requested,
            matched: false,
            required: true
        };
    }

    return {
        deviceName: partialMatch.name,
        displayName: partialMatch.displayName || partialMatch.name,
        matched: true,
        required: true
    };
}

async function waitForPrintableAssets(webContents) {
    try {
        await webContents.executeJavaScript(`
            new Promise((resolve) => {
                const finish = () => setTimeout(resolve, 80);
                const images = Array.from(document.images || []);
                if (!images.length) {
                    finish();
                    return;
                }
                let pending = images.length;
                const done = () => {
                    pending -= 1;
                    if (pending <= 0) {
                        finish();
                    }
                };
                window.setTimeout(finish, 2500);
                images.forEach((img) => {
                    if (img.complete) {
                        done();
                        return;
                    }
                    img.addEventListener('load', done, { once: true });
                    img.addEventListener('error', done, { once: true });
                });
            });
        `);
    } catch (error) {
        console.warn('Falha ao aguardar recursos da impressao:', error);
    }
}

async function calculateThermalPageSize(webContents, profileConfig) {
    if (!profileConfig.paperWidthMicrons) {
        return profileConfig.pageSize;
    }

    try {
        const contentHeightPx = await webContents.executeJavaScript(`
            Math.ceil(Math.max(
                document.body ? document.body.scrollHeight : 0,
                document.body ? document.body.offsetHeight : 0,
                document.body ? document.body.getBoundingClientRect().height : 0,
                document.documentElement ? document.documentElement.scrollHeight : 0,
                document.documentElement ? document.documentElement.offsetHeight : 0,
                document.documentElement ? document.documentElement.getBoundingClientRect().height : 0
            ));
        `);
        const heightMicrons = Math.ceil(Number(contentHeightPx || 0) * CSS_PIXEL_TO_MICRONS) + 30000;
        return {
            width: profileConfig.paperWidthMicrons,
            height: Math.min(
                profileConfig.maxHeightMicrons,
                Math.max(profileConfig.minHeightMicrons, heightMicrons)
            )
        };
    } catch (error) {
        console.warn('Falha ao calcular altura do cupom:', error);
        return profileConfig.pageSize;
    }
}

async function printFiscalHtml(payload, sourceWebContents) {
    const html = String(payload?.html || '').trim();
    if (!html) {
        return { ok: false, error: 'Documento de impressao vazio.' };
    }

    const profile = normalizePrintProfile(payload?.profile);
    const profileConfig = getPrintProfileConfig(profile);
    const printers = await getPrintersForWebContents(sourceWebContents);
    const requestedPrinterName = String(payload?.printerName || '').trim();
    const resolvedPrinter = resolvePrinterDeviceName(printers, requestedPrinterName);

    if (resolvedPrinter.required && !resolvedPrinter.matched) {
        const available = printers.map((printer) => printer.displayName || printer.name).filter(Boolean).join(', ');
        return {
            ok: false,
            error: available
                ? `Impressora "${requestedPrinterName}" nao encontrada. Impressoras conectadas: ${available}.`
                : `Impressora "${requestedPrinterName}" nao encontrada no computador.`
        };
    }

    let printWindow = null;
    try {
        printWindow = new BrowserWindow({
            width: profileConfig.width,
            height: profileConfig.height,
            show: false,
            autoHideMenuBar: true,
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true
            }
        });

        let loadTimeout = null;
        try {
            await Promise.race([
                printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`),
                new Promise((_resolve, reject) => {
                    loadTimeout = setTimeout(
                        () => reject(new Error('Tempo excedido ao preparar a impressao.')),
                        PRINT_LOAD_TIMEOUT_MS
                    );
                })
            ]);
        } finally {
            if (loadTimeout) {
                clearTimeout(loadTimeout);
            }
        }
        await waitForPrintableAssets(printWindow.webContents);

        const pageSize = await calculateThermalPageSize(printWindow.webContents, profileConfig);
        const printOptions = {
            silent: true,
            printBackground: true,
            color: true,
            margins: profileConfig.margins,
            pageSize,
            landscape: false,
            copies: 1
        };

        if (resolvedPrinter.deviceName) {
            printOptions.deviceName = resolvedPrinter.deviceName;
        }

        const printResult = await new Promise((resolve) => {
            printWindow.webContents.print(printOptions, (success, failureReason) => {
                resolve({
                    ok: Boolean(success),
                    error: success ? '' : (failureReason || 'Falha desconhecida ao imprimir.')
                });
            });
        });

        return {
            ...printResult,
            printerName: resolvedPrinter.displayName || resolvedPrinter.deviceName || 'Impressora padrao',
            profile
        };
    } catch (error) {
        return {
            ok: false,
            error: error?.message || 'Falha ao imprimir documento fiscal.'
        };
    } finally {
        if (printWindow && !printWindow.isDestroyed()) {
            printWindow.close();
        }
    }
}

function getAppUrlFromConfig() {
    const saved = loadDesktopConfig();
    const configured = normalizeUrl(saved.appUrl);
    if (isValidHttpUrl(configured)) {
        return configured;
    }
    return normalizeUrl(DEFAULT_APP_URL);
}

async function openServerConfigPage(errorMessage = '') {
    if (!mainWindow) {
        return;
    }
    const filePath = path.join(__dirname, 'server-config.html');
    const query = errorMessage ? { error: errorMessage } : {};
    await mainWindow.loadFile(filePath, { query });
}

async function openAppUrl() {
    if (!mainWindow) {
        return;
    }
    const appUrl = getAppUrlFromConfig();
    if (!isValidHttpUrl(appUrl)) {
        await openServerConfigPage('Informe uma URL valida para continuar.');
        return;
    }

    try {
        await mainWindow.loadURL(appUrl);
    } catch (error) {
        console.error('Falha ao abrir URL do app:', error);
        await openServerConfigPage('Nao foi possivel abrir o servidor configurado.');
    }
}

function buildApplicationMenu() {
    const template = [
        {
            label: 'EasyStore',
            submenu: [
                {
                    label: 'Abrir App',
                    click: () => openAppUrl()
                },
                {
                    label: 'Configurar Servidor',
                    click: () => openServerConfigPage()
                },
                {
                    label: 'Abrir no Navegador',
                    click: () => shell.openExternal(getAppUrlFromConfig())
                },
                { type: 'separator' },
                { role: 'quit', label: 'Sair' }
            ]
        },
        {
            label: 'Visualizar',
            submenu: [
                { role: 'reload', label: 'Recarregar' },
                { role: 'forceReload', label: 'Recarregar sem cache' },
                { role: 'toggleDevTools', label: 'Ferramentas do desenvolvedor' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1366,
        height: 860,
        minWidth: 980,
        minHeight: 680,
        show: false,
        autoHideMenuBar: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });

    mainWindow.once('ready-to-show', () => {
        if (mainWindow) {
            mainWindow.show();
        }
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        try {
            const targetUrl = new URL(url);
            if (!['http:', 'https:'].includes(targetUrl.protocol)) {
                return;
            }
            const activeOrigin = new URL(getAppUrlFromConfig()).origin;
            const targetOrigin = targetUrl.origin;
            if (targetOrigin !== activeOrigin) {
                event.preventDefault();
                shell.openExternal(url);
            }
        } catch (error) {
            // Ignore parsing errors and keep navigation behavior default.
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    openAppUrl();
}

ipcMain.handle('desktop:get-config', () => {
    return {
        appUrl: getAppUrlFromConfig(),
        defaultAppUrl: normalizeUrl(DEFAULT_APP_URL)
    };
});

ipcMain.handle('desktop:save-config', async (_event, payload) => {
    const appUrl = normalizeUrl(payload?.appUrl);
    if (!isValidHttpUrl(appUrl)) {
        return {
            ok: false,
            error: 'URL invalida. Use http:// ou https://'
        };
    }

    saveDesktopConfig({ appUrl });
    await openAppUrl();
    return {
        ok: true,
        appUrl
    };
});

ipcMain.handle('desktop:load-app', async () => {
    await openAppUrl();
    return { ok: true };
});

ipcMain.handle('desktop:open-external', async (_event, value) => {
    const url = normalizeUrl(value);
    if (!isValidHttpUrl(url)) {
        return { ok: false, error: 'URL invalida.' };
    }
    await shell.openExternal(url);
    return { ok: true };
});

ipcMain.handle('desktop:list-printers', async (event) => {
    const printers = await getPrintersForWebContents(event.sender);
    return {
        ok: true,
        printers: printers.map((printer) => ({
            name: printer.name || '',
            displayName: printer.displayName || printer.name || '',
            description: printer.description || '',
            options: printer.options || {}
        }))
    };
});

ipcMain.handle('desktop:print-fiscal-document', async (event, payload) => {
    return printFiscalHtml(payload, event.sender);
});

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (!mainWindow) {
            return;
        }
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.focus();
    });

    app.whenReady().then(() => {
        createMainWindow();
        buildApplicationMenu();
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
            buildApplicationMenu();
        }
    });
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
