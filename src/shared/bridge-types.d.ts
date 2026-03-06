import type { GitHubTokenResponseBad } from './github-types';

export interface KeytarApi {
    getPassword(service: string, account: string): Promise<string | null>;
    deletePassword(service: string, account: string): void;
}

export interface OAuthApi {
    loginGitHub(): void;
    onRequireActivation(cb: () => void): void;
    onOAuthSuccess(cb: () => void): void;
    onOAuthError(cb: (err: GitHubTokenResponseBad) => void): void;
}

export interface ActivationApi {
    activateApp(activationKey: string): Promise<{ success: boolean; error?: string }>;
}

export type ApiBridge = KeytarApi & OAuthApi & ActivationApi;
