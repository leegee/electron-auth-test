const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loginGitHub: () => ipcRenderer.send('login-github'),
    onOAuthSuccess: (callback) => {
        const wrapper = (_event, ...args) => {
            callback(...args);
            ipcRenderer.removeListener('oauth-success', wrapper);
        };
        ipcRenderer.on('oauth-success', wrapper);
    }
});
