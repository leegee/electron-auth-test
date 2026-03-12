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
        userInfoUrl: "https://api.github.com/user",
        allowedImageHosts: ["https://avatars.githubusercontent.com"],
        userInfoMapper: (rawUserData: any) => ({
            id: rawUserData.id,
            name: rawUserData.name,
            avatarUrl: rawUserData.avatar_url,
            email: rawUserData.email,
        })
    },

    google: {
        name: 'Google',
        icon: "assets/Google_G_Logo.svg",
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
        userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
        allowedImageHosts: ["https://lh3.googleusercontent.com"],
        userInfoMapper: (rawUserData: any) => ({
            id: rawUserData.sub,
            name: rawUserData.name,
            avatarUrl: rawUserData.picture,
            email: rawUserData.email,
        })
    },

    /*
    linkedin: {
        name: 'LinkedIn',
        icon: "assets/LinkedIn_Logo.svg",
        authUrl: "https://www.linkedin.com/oauth/v2/authorization",
        tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
        clientId: config.getClientId('linkedin'),
        requiresClientSecret: true,
        scopes: ["r_liteprofile", "r_emailaddress"],

        // Optional extra parameters
        extraAuthParams: {
            response_type: "code",
            state: "DCEEFWF45453sdffef424", // you can generate dynamically
        },

        // User info endpoint
        userInfoUrl: "https://api.linkedin.com/v2/me",

        // For CSP-safe images: LinkedIn profile images are served from media-exp1.licdn.com
        allowedImageHosts: ["https://media-exp1.licdn.com"],

        // Mapper to normalize LinkedIn user info to your OAuthUserInfo format
        userInfoMapper: (rawUserData: any) => ({
            id: rawUserData.id,
            name: rawUserData.localizedFirstName + " " + rawUserData.localizedLastName,
            avatarUrl: rawUserData.profilePicture?.["displayImage~"]?.elements?.[0]?.identifiers?.[0]?.identifier
        })
    },
    microsoft: {
        name: 'Microsoft',
        icon: "assets/Microsoft_Logo.svg",
        authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        clientId: config.getClientId('microsoft'),
        requiresClientSecret: true,
        scopes: ["User.Read"],
        extraAuthParams: {
            response_type: "code",
            prompt: "consent",          // ensures user consents each login
        },
        userInfoUrl: "https://graph.microsoft.com/v1.0/me",
        allowedImageHosts: ["https://graph.microsoft.com"],

        userInfoMapper: (rawUserData: any) => ({
            id: rawUserData.id,
            name: rawUserData.displayName,
            avatarUrl: rawUserData.photo ? `https://graph.microsoft.com/v1.0/me/photo/$value` : undefined,
            email: rawUserData.userPrincipalName
        })
    },
    */
};
