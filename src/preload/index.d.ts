import { ElectronAPI } from '@electron-toolkit/preload'
import type { ApiBridge } from '../../shared/bridge-types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: ApiBridge
  }
}
