export const OAUTH_PROVIDERS = {
    github: {
        name: 'GitHub',
        icon: '/assets/GitHub_Invertocat_Black.svg',
        authUrl: 'https://github.com/login/oauth/authorize?scope=read:user&',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        allowedUrls: ['https://github.com'],
    },
    google: {
        name: 'Google',
        icon: '/assets/Google_G_Logo.svg',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?prompt=consent&response_type=code&access_type=offline&scope=openid%20email%20profile&',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        allowedUrls: ['https://oauth2.googleapis.com', 'https://accounts.google.com/signin', 'https://accounts.google.com/v3/signin/'],
    },
};
