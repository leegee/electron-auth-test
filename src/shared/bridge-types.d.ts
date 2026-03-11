import type { OAUTH_PROVIDERS } from '@shared/oauthConfig';
import type { StoredToken } from '../main/oauth-plugin'
import type { OAuthTokenResponseBad } from './oauth-types';

export interface KeytarApi {
    getPassword(service: string, account: string, provider: keyof typeof OAUTH_PROVIDERS): Promise<string | null>;
    deletePassword(service: string, account: string, provider: keyof typeof OAUTH_PROVIDERS): void;
}

export interface OAuthApi {
    oauthLogin(string: keyof typeof OAUTH_PROVIDERS): Promise<StoredToken>;
    getToken(provider: keyof typeof OAUTH_PROVIDERS): Promise<StoredToken | null>;
    logout(provider: keyof typeof OAUTH_PROVIDERS): Promise<boolean>;
}

export interface ActivationApi {
    activateApp(activationKey: string, provider: keyof typeof OAUTH_PROVIDERS): Promise<{ success: boolean; error?: string }>;
}

export interface UpdatesApi {
    onUpdateAvailable(cb: (version: string) => void): void;
    onUpdateError(cb: (message: string) => void): void;
    onUpdateDownloaded(cb: () => void): void;
    downloadUpdate(): void;
    installUpdate(): void;
}

export type ApiBridge = KeytarApi & OAuthApi & ActivationApi & UpdatesApi;
