import GoogleIcon from '../renderer/assets/Google_G_Logo.svg';
import GitHubIcon from '../renderer/assets/GitHub_Invertocat_Black.svg';

export const OAUTH_PROVIDERS = {
    github: {
        name: 'GitHub',
        icon: GitHubIcon,
        authUrl: 'https://github.com/login/oauth/authorize?scope=read:user&',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        allowedUrls: ['https://github.com'],
    },
    google: {
        name: 'Google',
        icon: GoogleIcon,
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?prompt=consent&response_type=code&access_type=offline&scope=openid%20email%20profile&',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        allowedUrls: ['https://oauth2.googleapis.com', 'https://accounts.google.com/signin', 'https://accounts.google.com/v3/signin/'],
    },
};
