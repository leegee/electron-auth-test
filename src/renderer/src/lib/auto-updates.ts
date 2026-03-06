import { api } from '@renderer/renderer-bridge'
import { showToast, confirmToast } from '../components/Toast'

export function initUpdateHandlers() {
    api.onUpdateAvailable(async (version) => {
        const ok = await confirmToast(`Update ${version} available. Download?`)
        if (ok) api.downloadUpdate()
    })

    api.onUpdateDownloaded(async () => {
        const restart = await confirmToast('Update ready. Restart to install?')
        if (restart) api.installUpdate()
    })

    api.onUpdateError((msg) => {
        showToast(`Update error: ${msg}`, 'error')
    })

}
