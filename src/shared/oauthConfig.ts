export const OAUTH_PROVIDERS = {
    github: {
        name: 'GitHub',
        icon: '/assets/GitHub_Invertocat_Black.svg',
        authUrl: 'https://github.com/login/oauth/authorize?scope=read:user&client_id=',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        allowedUrls: ['https://github.com'],
    },
    google: {
        name: 'Google',
        icon: '/assets/Google_G_Logo.svg',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?scope=openid&client_id=',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        allowedUrls: ['https://oauth2.googleapis.com'],
    },
};
