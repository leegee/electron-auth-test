import { contextBridge, ipcRenderer } from 'electron';
import type { ApiBridge, KeytarApi, OAuthApi, ActivationApi, UpdatesApi } from '../shared/bridge-types';
import type { GitHubTokenResponseBad } from '../shared/github-types';
import '@shared/logger'; // Required
import { OAUTH_PROVIDERS } from '@shared/oauthConfig';

const keytarApi: KeytarApi = {
  getPassword: (service, account) => ipcRenderer.invoke('keytar-get-password', service, account),
  deletePassword: (service, account) => ipcRenderer.send('delete-password', service, account),
};

// No need to return unsubscribed functions afaict
const oauthApi: OAuthApi = {
  oauthLogin: (provider: keyof typeof OAUTH_PROVIDERS) => ipcRenderer.send('oauth-login', provider),
  onRequireActivation: (cb) => ipcRenderer.on('require-activation', cb),
  onOAuthSuccess: (cb: () => void) => ipcRenderer.on('oauth-success', () => cb()),
  onOAuthError: (cb: (payload: GitHubTokenResponseBad) => void) =>
    ipcRenderer.on('oauth-error', (_event, payload: GitHubTokenResponseBad) => cb(payload)),
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
