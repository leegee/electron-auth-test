import GoogleIcon from '../renderer/assets/Google_G_Logo.svg';
import GitHubIcon from '../renderer/assets/GitHub_Invertocat_Black.svg';
import { config } from './config';
import { ProviderConfig } from "@shared/oauth-types"

export type OAuthProviderConfig = Record<string, ProviderConfig>;

export const OAUTH_PROVIDERS: OAuthProviderConfig = {
    github: {
        name: 'GitHub',
        icon: GitHubIcon,
        authUrl: "https://github.com/login/oauth/authorize",
        tokenUrl: "https://github.com/login/oauth/access_token",
        scopes: ["read:user"],
        clientId: config.getClientId('github'),
        requiresClientSecret: true,
        port: 3099,

    },
    google: {
        name: 'Google',
        icon: GoogleIcon,
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?prompt=consent&response_type=code&access_type=offline&scope=openid%20email%20profile&',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        clientId: config.getClientId('google'),
        scopes: ["openid", "profile", "email"],
        extraAuthParams: {
            access_type: "offline",
            prompt: "consent"
        },
        refreshTokenUrl: "https://oauth2.googleapis.com/token",
    },
};
