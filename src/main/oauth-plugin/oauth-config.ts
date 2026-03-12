import { config } from '../../shared/config';
import { ProviderConfig } from "@shared/oauth-types"

export type OAuthProviderConfig = Record<string, ProviderConfig>;

export const OAUTH_PROVIDERS: OAuthProviderConfig = {
    github: {
        name: 'GitHub',
        icon: ("assets/GitHub_Invertocat_Black.svg"),
        authUrl: "https://github.com/login/oauth/authorize",
        tokenUrl: "https://github.com/login/oauth/access_token",
        scopes: ["read:user"],
        clientId: config.getClientId('github'),
        requiresClientSecret: true,
        port: 3099,

    },
    google: {
        name: 'Google',
        icon: ("assets/Google_G_Logo.svg"),
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        clientId: config.getClientId('google'),
        requiresClientSecret: true,
        scopes: ["openid", "profile", "email"],
        extraAuthParams: {
            access_type: "offline",
            prompt: "consent"
        },
        refreshTokenUrl: "https://oauth2.googleapis.com/token",
    },
};
