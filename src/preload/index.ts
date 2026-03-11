import { contextBridge, ipcRenderer } from 'electron';
// import 'electron-log/preload';

import type { ApiBridge, KeytarApi, OAuthApi, ActivationApi, UpdatesApi } from '../shared/bridge-types';
import { OAUTH_PROVIDERS } from '@shared/oauthConfig';

const keytarApi: KeytarApi = {
  getPassword: (service, account, provider) => ipcRenderer.invoke('keytar-get-password', service, account + '-' + provider),
  deletePassword: (service, account, provider) => ipcRenderer.send('delete-password', service, account + '-' + provider),
};

const oauthApi: OAuthApi = {
  oauthLogin: (provider: keyof typeof OAUTH_PROVIDERS) => ipcRenderer.invoke('oauth-login', provider),
  getToken: (provider: keyof typeof OAUTH_PROVIDERS) => ipcRenderer.invoke('oauth-get-token', provider),
  logout: (provider: keyof typeof OAUTH_PROVIDERS) => ipcRenderer.invoke('oauth-logout', provider),
};

const activationApi: ActivationApi = {
  activateApp: (key, provider) => ipcRenderer.invoke('activate-app', key, provider),
};

const updatesApi: UpdatesApi = {
  onUpdateAvailable: (cb: (version: string) => void) => ipcRenderer.on('update-available', (_e, version) => cb(version)),
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
