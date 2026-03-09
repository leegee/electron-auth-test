import { contextBridge, ipcRenderer } from 'electron';
import type { ApiBridge, KeytarApi, OAuthApi, ActivationApi, UpdatesApi } from '../shared/bridge-types';
import type { GitHubTokenResponseBad } from '../shared/github-types';

function listenOnce<T>(channel: string, callback: (payload: T) => void, removeChannels: string[] = []) {
  const wrapper = (_event: Electron.IpcRendererEvent, payload: T) => {
    callback(payload);
    ipcRenderer.removeAllListeners(channel);
    removeChannels.forEach((ch) => ipcRenderer.removeAllListeners(ch));
  };
  ipcRenderer.on(channel, wrapper);
}

const keytarApi: KeytarApi = {
  getPassword: (service, account) => ipcRenderer.invoke('keytar-get-password', service, account),
  deletePassword: (service, account) => ipcRenderer.send('delete-password', service, account),
};

const oauthApi: OAuthApi = {
  loginGitHub: () => ipcRenderer.send('oauth-login'),
  onRequireActivation: (cb) => ipcRenderer.on('require-activation', cb),
  onOAuthSuccess: (cb) => listenOnce('oauth-success', cb, ['oauth-error']),
  onOAuthError: (cb) => listenOnce<GitHubTokenResponseBad>('oauth-error', cb, ['oauth-success']),
};

const activationApi: ActivationApi = {
  activateApp: (key) => ipcRenderer.invoke('activate-app', key),
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
