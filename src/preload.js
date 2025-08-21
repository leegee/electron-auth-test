const { contextBridge } = require('electron');
const keytar = require('keytar');

contextBridge.exposeInMainWorld('secureAPI', {
    setPassword: (service, account, secret) => keytar.setPassword(service, account, secret),
    getPassword: (service, account) => keytar.getPassword(service, account)
});
