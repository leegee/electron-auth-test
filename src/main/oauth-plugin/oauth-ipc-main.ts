// src/main/oauth-plugin/ipc-main-bridge.ts
import { ipcMain } from 'electron';

import type { OAUTH_PROVIDERS, OAuthProviderConfig } from 'src/main/oauth-plugin/oauth-config';
import type { ElectronOAuthPlugin } from '.';

export function initAuthIpc(oauthPlugin: ElectronOAuthPlugin) {
    ipcMain.handle("oauth-activate-app",
        (_event, activationKey: string, provider: keyof typeof OAUTH_PROVIDERS) => oauthPlugin.activate(provider, activationKey)
    );

    ipcMain.handle("oauth-login",
        (_e, providerName: string) => oauthPlugin.login(providerName)
    );

    ipcMain.handle("oauth-get-token",
        (_e, providerName: string) => oauthPlugin.getToken(providerName)
    );

    ipcMain.handle("oauth-get-user-info",
        (_e, providerName: string) => oauthPlugin.getUserInfo(providerName)
    );

    ipcMain.handle("oauth-logout",
        (_e, providerName: string) => oauthPlugin.logout(providerName)
    );

    ipcMain.handle('oauth-providers',
        (): OAuthProviderConfig => oauthPlugin.getOauthProviders()
    )
}
