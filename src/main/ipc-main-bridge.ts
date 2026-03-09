// src\main\ipc-main-bridge.ts
import { BrowserWindow, ipcMain } from 'electron';
import keytar from 'keytar';
import { startOauth, OAuthCallbacks } from './auth';

export function initIpc(mainWindow: BrowserWindow) {
    ipcMain.on('login-github', () =>
        startOauth(
            'github',
            {
                onSuccess: () => mainWindow.webContents.send('oauth-success'),
                onError: (err) => mainWindow.webContents.send('oauth-error', err),
                onRequireActivation: () => mainWindow.webContents.send('require-activation'),
            } as OAuthCallbacks)
    );

    ipcMain.handle('keytar-get-password', async (_event, service: string, account: string) => {
        return keytar.getPassword(service, account);
    });
}
