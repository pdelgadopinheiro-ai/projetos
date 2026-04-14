const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopBridge', {
    getConfig() {
        return ipcRenderer.invoke('desktop:get-config');
    },
    saveConfig(appUrl) {
        return ipcRenderer.invoke('desktop:save-config', { appUrl });
    },
    loadApp() {
        return ipcRenderer.invoke('desktop:load-app');
    },
    openExternal(url) {
        return ipcRenderer.invoke('desktop:open-external', url);
    },
    listPrinters() {
        return ipcRenderer.invoke('desktop:list-printers');
    },
    printFiscalDocument(payload) {
        return ipcRenderer.invoke('desktop:print-fiscal-document', payload);
    }
});
