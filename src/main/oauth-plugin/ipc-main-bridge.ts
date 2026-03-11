// src/main/ipc-main-bridge.ts
import { ipcMain } from 'electron';

import type { OAUTH_PROVIDERS } from '@shared/oauthConfig';
import type { ElectronOAuthPlugin } from '.';

export function initAuthIpc(oauthPlugin: ElectronOAuthPlugin) {
    ipcMain.handle("activate-app", async (_event, activationKey: string, provider: keyof typeof OAUTH_PROVIDERS) => {
        try {
            return await oauthPlugin.activate(provider, activationKey);
        } catch (err) {
            return {
                success: false,
                error: (err as Error).message
            };
        }
    });

    ipcMain.handle("oauth-login", async (_e, providerName: string) => {
        const token = await oauthPlugin.login(providerName);
        return { success: !!token, token };
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
}
