import type { GitHubTokenResponseBad } from './github-types';
import type { OAUTH_CONFIG } from '@shared/oauthConfig';

export interface KeytarApi {
    getPassword(service: string, account: string): Promise<string | null>;
    deletePassword(service: string, account: string): void;
}

export interface OAuthApi {
    oauthLogin(string: keyof typeof OAUTH_CONFIG): void;
    onRequireActivation(cb: () => void): void;
    onOAuthSuccess(cb: () => void): void;
    onOAuthError(cb: (err: GitHubTokenResponseBad) => void): void;
}

export interface ActivationApi {
    activateApp(activationKey: string): Promise<{ success: boolean; error?: string }>;
}

export interface UpdatesApi {
    onUpdateAvailable(cb: (version: string) => void): void;
    onUpdateError(cb: (message: string) => void): void;
    onUpdateDownloaded(cb: () => void): void;
    downloadUpdate(): void;
    installUpdate(): void;
}

export type ApiBridge = KeytarApi & OAuthApi & ActivationApi & UpdatesApi;
