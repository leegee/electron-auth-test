import { contextBridge, ipcRenderer } from 'electron'
import type { ApiBridge } from '../shared/bridge'

async function init() {
  const CONFIG = await ipcRenderer.invoke('get-config')

  const api: ApiBridge = {
    loginGitHub: () => {
      ipcRenderer.send('login-github')
    },

    deletePassword: (service: string, account: string) => {
      ipcRenderer.send('delete-password', service, account)
    },

    onOAuthSuccess: (callback) => {
      const wrapper = () => {
        callback()
        ipcRenderer.removeListener('oauth-success', wrapper)
      }

      ipcRenderer.on('oauth-success', wrapper)
    },

    getPassword: (service, account) => {
      return ipcRenderer.invoke('keytar-get-password', service, account)
    },

    activateApp(activationKey: string) {
      return ipcRenderer.invoke('activate-app', activationKey);
    },

    config: CONFIG,
  }

  contextBridge.exposeInMainWorld('api', api)
}

init()



