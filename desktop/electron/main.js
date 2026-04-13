const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');

const DEFAULT_APP_URL = process.env.EASYSTORE_APP_URL || 'http://localhost:3000';
const CONFIG_FILE_NAME = 'desktop-config.json';

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
