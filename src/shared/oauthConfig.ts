export const OAUTH_CONFIG = {
    github: {
        authUrl: 'https://github.com/login/oauth/authorize?scope=read:user&client_id=',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        allowedUrls: ['https://github.com'],
    },
    google: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?scope=openid&client_id=',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        allowedUrls: ['https://oauth2.googleapis.com'],
    },
};
