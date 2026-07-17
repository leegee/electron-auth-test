// preload/index.ts

import { contextBridge, ipcRenderer } from 'electron';
// import 'electron-log/preload';

import type { ApiBridge, KeytarApi, OAuthApi, ActivationApi, UpdatesApi } from '../shared/bridge-types';

const keytarApi: KeytarApi = {
  getPassword: (service, account, provider) => ipcRenderer.invoke('keytar-get-password', service, account + '-' + String(provider)),
  deletePassword: (service, account, provider) => ipcRenderer.send('delete-password', service, account + '-' + String(provider)),
};

const oauthApi: OAuthApi = {
  oauthLogin: (provider) => ipcRenderer.invoke('oauth-login', provider),
  getToken: (provider) => ipcRenderer.invoke('oauth-get-token', provider),
  getUserInfo: (provider) => ipcRenderer.invoke('oauth-get-user-info', provider),
  logout: (provider) => ipcRenderer.invoke('oauth-logout', provider),
  getOauthProviders: () => ipcRenderer.invoke('oauth-providers'),
};

const activationApi: ActivationApi = {
  activateApp: (key, provider) => ipcRenderer.invoke('oauth-activate-app', key, provider),
};

const updatesApi: UpdatesApi = {
  onUpdateAvailable: (cb) => {
    const listener = (_e: Electron.IpcRendererEvent, version: string) =>
      cb(version);

    ipcRenderer.on('update-available', listener);

    return () => {
      ipcRenderer.removeListener('update-available', listener);
    };
  },

  onUpdateError: (cb: (message: string) => void) => ipcRenderer.on('update-error', (_e, msg) => cb(msg)),
  onUpdateDownloaded: (cb: () => void) => ipcRenderer.on('update-downloaded', cb),
  downloadUpdate: () => ipcRenderer.send('download-update'),
  installUpdate: () => ipcRenderer.send('install-update'),
};

const api: ApiBridge = {
  ...keytarApi,
  ...oauthApi,
  ...activationApi,
  ...updatesApi,
};

contextBridge.exposeInMainWorld('api', api);
