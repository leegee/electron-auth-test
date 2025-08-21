const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loginGitHub: () => ipcRenderer.send('login-github'),
    onOAuthSuccess: (callback) => ipcRenderer.on('oauth-success', callback)
});
