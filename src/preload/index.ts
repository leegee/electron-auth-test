import { contextBridge, ipcRenderer } from 'electron'
import type { ApiBridge } from '../shared/bridge'

async function init() {
  const CONFIG = await ipcRenderer.invoke('get-config')

  const api: ApiBridge = {
    loginGitHub: () => {
      ipcRenderer.send('login-github')
    },

    getPassword: (service: string, account: string) => {
      return ipcRenderer.invoke('keytar-get-password', service, account)
    },

    deletePassword: (service: string, account: string) => {
      ipcRenderer.send('delete-password', service, account)
    },

    onOAuthSuccess: (callback) => {
      const wrapper = () => {
        callback()
        ipcRenderer.removeListener('oauth-success', wrapper)
        ipcRenderer.removeListener('oauth-error', wrapper)
      }

      ipcRenderer.on('oauth-success', wrapper)
    },

    onOAuthError: (callback) => {
      const wrapper = (_event: Electron.IpcRendererEvent, error: string) => {
        callback(error)
        ipcRenderer.removeListener('oauth-success', wrapper)
        ipcRenderer.removeListener('oauth-error', wrapper)
      }

      ipcRenderer.on('oauth-error', wrapper)
    },

    activateApp(activationKey: string) {
      return ipcRenderer.invoke('activate-app', activationKey);
    },

    config: CONFIG,
  }

  contextBridge.exposeInMainWorld('api', api)
}

init()



