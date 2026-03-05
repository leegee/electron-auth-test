import { contextBridge, ipcRenderer } from 'electron'
import type { ApiBridge } from '../shared/bridge'

async function init() {
  const CUSTOM_URL_PROTOCOL: string = await ipcRenderer.invoke('get-custom-protocol')

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

    config: {
      CUSTOM_URL_PROTOCOL
    }
  }

  if (process.contextIsolated) {
    contextBridge.exposeInMainWorld('api', api)
  } else {
    // fallback
    // @ts-ignore
    window.api = api
  }
}

init()



