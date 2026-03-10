
export interface OAuthTokenSuccess {
    access_token: string;
    token_type?: string;
    scope?: string;

    // optional fields used by Google and maybe others
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