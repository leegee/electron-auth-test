export interface OAuthUserInfo {
    id: string
    name?: string
    avatarUrl?: string
}

export interface ProviderConfig {
    name: string;
    icon: string;
    clientId: string
    requiresClientSecret?: boolean
    authUrl: string
    port?: number
    tokenUrl: string
    scopes: string[]
    extraAuthParams?: Record<string, string>
    refreshTokenUrl?: string
    userInfoUrl?: string
    userInfoMapper?: (raw: any) => OAuthUserInfo;
}

export interface StoredToken {
    access_token: string
    refresh_token?: string
    expires_in?: number
    obtained_at?: number
    [key: string]: any
}

export interface OAuthTokenSuccess {
    access_token: string;
    token_type?: string;
    scope?: string;
    expires_in?: number;
    refresh_token?: string;
    id_token?: string;
}

export interface OAuthTokenResponseBad {
    error?: string;
    error_description?: string;
    error_url?: string;
}

export interface GoogleTokenResponseGood {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
    token_type: 'Bearer';
    id_token?: string;
}

export type OAuthTokenResponse = | OAuthTokenSuccess | OAuthTokenError;
