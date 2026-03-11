// src/main/ipc-main-bridge.ts
import { type BrowserWindow, ipcMain } from 'electron';

import { ElectronOAuthPlugin } from '../main/lib/oauth2';
import { OAUTH_PROVIDERS } from '@shared/oauthConfig';
import { config } from '@shared/config';
import log from './logger';
import { decryptActivationKey } from './crypt';

export function initIpc(mainWindow: BrowserWindow) {
    const oauthPlugin = new ElectronOAuthPlugin(
        {
            serviceName: config.VITE_SERVICE_NAME,
            secretServiceName: config.VITE_SECRET_SERVICE_NAME, // rename
            providers: OAUTH_PROVIDERS
        },
        (providerName) => {
            mainWindow.webContents.send("oauth-require-activation", providerName);
        }
    );

    ipcMain.handle("oauth-login", async (_e, providerName: string) => {
        try {
            const token = await oauthPlugin.login(providerName);
            return { success: !!token, token };
        } catch (err) {
            return {
                success: false,
                error: (err as Error).message
            };
        }
    });

    ipcMain.handle("oauth-get-token", async (_e, providerName: string) => {
        return await oauthPlugin.getToken(providerName);
    });

    ipcMain.handle("oauth-logout", async (_e, providerName: string) => {
        await oauthPlugin.logout(providerName);
        return true;
    });

    ipcMain.handle("store-client-secret", async (_e, providerName: string, secret: string) => {
        await oauthPlugin.setClientSecret(providerName, secret);
        return true;
    });

    ipcMain.handle('activate-app', async (_event, activationKey: string, provider: keyof typeof OAUTH_PROVIDERS) => {
        try {
            log.log('Received activate-app', provider);

            const providerSecret = await decryptActivationKey(activationKey, config.VITE_BUILD_PASSWORD);
            if (providerSecret.provider !== provider) {
                log.log(`ipc-main-bridge.activate-app provider mismatch: wanted ${provider} but key contained ${providerSecret.provider}`)
                return { success: false, error: 'Activation key provider mismatch' };
            }

            await oauthPlugin.setClientSecret(provider, providerSecret.secret);
            return { success: true };
        }
        catch (err) {
            log.error('Activation failed for provder', provider, err);
            return { success: false, error: (err as Error).message };
        }
    });

}
