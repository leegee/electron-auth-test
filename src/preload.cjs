const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loginGitHub: () => ipcRenderer.send('login-github'),
    
    onOAuthSuccess: (callback) => {
        const wrapper = (_event, ...args) => {
            callback(...args);
            ipcRenderer.removeListener('oauth-success', wrapper);
        };
        ipcRenderer.on('oauth-success', wrapper);
    },

    setPassword: (service, account, password) => ipcRenderer.invoke('keytar-set-password', service, account, password),

    getPassword: (service, account) => ipcRenderer.invoke('keytar-get-password', service, account),
});

console.debug('preload loaded, electronAPI:', window.electronAPI);
