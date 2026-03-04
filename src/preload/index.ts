import { contextBridge, ipcRenderer } from 'electron'
import type { ApiBridge } from '../shared/bridge'

const api: ApiBridge = {
  loginGitHub: () => {
    ipcRenderer.send('login-github')
  },

  deletePassword: (service: string, account: string) => {
    ipcRenderer.send('delete-password', service, account)
  },

  onOAuthSuccess: (callback) => {
    const wrapper = (_event: unknown) => {
      callback()
      ipcRenderer.removeListener('oauth-success', wrapper)
    }

    ipcRenderer.on('oauth-success', wrapper)
  },

  getPassword: (service, account) => {
    return ipcRenderer.invoke('keytar-get-password', service, account)
  }

  // setPassword: (service, account, password) => {
  //   return ipcRenderer.invoke('keytar-set-password', service, account, password)
  // },
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  // fallback
  // @ts-ignore
  window.api = api
}
