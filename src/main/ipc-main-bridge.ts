// src\main\ipc-main-bridge.ts
import { BrowserWindow, ipcMain } from 'electron';
import keytar from 'keytar';
import { startOauth, OAuthCallbacks } from './auth';
import log from '@shared/logger';
import { OAUTH_PROVIDERS } from '@shared/oauthConfig';

export function initIpc(mainWindow: BrowserWindow) {
    log.log('ipc-main-bridge.oauth-login');

    ipcMain.on('oauth-login', (_event, provider: keyof typeof OAUTH_PROVIDERS) => {
        if (!provider) throw new Error('No provider provided to ipc-main-bridge.oauth-login');
        startOauth(
            provider,
            {
                onSuccess: () => mainWindow.webContents.send('oauth-success'),
                onError: (err) => mainWindow.webContents.send('oauth-error', err),
                onRequireActivation: () => mainWindow.webContents.send('require-activation'),
            } as OAuthCallbacks)
    });

    ipcMain.handle('keytar-get-password', async (_event, service: string, account: string) => {
        log.log('ipc-main-bridge.keytar-get-password for', service, account);
        return keytar.getPassword(service, account);
    });
}
