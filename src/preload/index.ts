import { contextBridge, ipcRenderer } from 'electron';
import type { ApiBridge, KeytarApi, OAuthApi, ActivationApi } from '../shared/bridge-types';
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
  loginGitHub: () => ipcRenderer.send('login-github'),
  onRequireActivation: (cb) => ipcRenderer.on('require-activation', cb),
  onOAuthSuccess: (cb) => listenOnce('oauth-success', cb, ['oauth-error']),
  onOAuthError: (cb) => listenOnce<GitHubTokenResponseBad>('oauth-error', cb, ['oauth-success']),
};

const activationApi: ActivationApi = {
  activateApp: (key) => ipcRenderer.invoke('activate-app', key),
};

const api: ApiBridge = {
  ...keytarApi,
  ...oauthApi,
  ...activationApi,
};

contextBridge.exposeInMainWorld('api', api);
