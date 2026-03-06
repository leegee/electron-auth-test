import { BrowserWindow, ipcMain } from 'electron';
import keytar from 'keytar';
import { config } from './config';
import { startGithubOAuth, OAuthCallbacks } from './auth';

export function initIpc(mainWindow: BrowserWindow) {
    ipcMain.on('login-github', () =>
        startGithubOAuth({
            onSuccess: () => mainWindow.webContents.send('oauth-success'),
            onError: (err) => mainWindow.webContents.send('oauth-error', err),
            onRequireActivation: () => mainWindow.webContents.send('require-activation'),
        } as OAuthCallbacks)
    );

    ipcMain.handle('keytar-delete-password', async () => {
        return keytar.deletePassword(config.VITE_SERVICE_NAME, config.VITE_SESSION_TOKEN);
    });

    ipcMain.handle('keytar-get-password', async (_event, service: string, account: string) => {
        return keytar.getPassword(service, account);
    });

    ipcMain.handle('keytar-set-password', async (_event, service: string, account: string, password: string) => {
        return keytar.setPassword(service, account, password);
    });
}
