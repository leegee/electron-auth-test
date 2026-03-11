
import { type OAUTH_PROVIDERS } from '@shared/oauthConfig';

/**
 * Get environment variable as string.
 * Throws if missing and no default provided.
 */
export function getEnv(name: string, defaultValue?: string | boolean): string {
    // const envVal = process.env[name];
    const envVal = import.meta.env[name];
    const value = envVal !== undefined ? envVal : defaultValue;
    if (value === undefined) throw new Error(`Missing env var ${name}`);
    return String(value);
}

function normaliseBoolean(value?: string | boolean, defaultVal = false): boolean {
    if (value === undefined) return defaultVal;
    if (typeof value === 'boolean') return value;
    return ['true', '1'].includes(value.toLowerCase());
}

export const config = {
    VITE_SERVICE_NAME: getEnv('VITE_SERVICE_NAME', 'electronelectron-secure-test'),
    VITE_BUILD_PASSWORD: getEnv('VITE_BUILD_PASSWORD'),
    VITE_DEV_MODE: normaliseBoolean(getEnv('VITE_DEV_MODE', false)),
    VITE_CUSTOM_URL_PROTOCOL: getEnv('VITE_CUSTOM_URL_PROTOCOL', 'electronsectest'),
    VITE_CACHE_USER_SESSIONS: normaliseBoolean(getEnv('VITE_CACHE_USER_SESSIONS', false)),
    VITE_GITHUB_CLIENT_ID: getEnv('VITE_GITHUB_CLIENT_ID'),
    // VITE_ACTIVATION_FILE_PATH,
    VITE_SESSION_TOKEN: getEnv('VITE_SESSION_TOKEN', 'oauth-token'),
    VITE_SECRET_SERVICE_NAME: getEnv('VITE_SECRET_SERVICE_NAME', 'account-activation'),

    getClientId: (provider: keyof typeof OAUTH_PROVIDERS) => {
        const varName = 'VITE_' + provider.toUpperCase() + '_CLIENT_ID';
        const rv = getEnv(varName);
        if (!rv) throw new TypeError(`Environment variable ${varName} is not configured.`)
        return rv;
    },

    getClientSecret: (provider: keyof typeof OAUTH_PROVIDERS) => {
        const varName = 'VITE_' + provider.toUpperCase() + '_CLIENT_SECRET';
        const rv = getEnv(varName);
        if (!rv) throw new TypeError(`Environment variable ${varName} is not configured.`)
        return rv;
    }
} as const;


