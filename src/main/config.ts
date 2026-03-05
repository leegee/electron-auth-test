import path from 'node:path';

import { app } from 'electron';

import { config as dotenvConfig } from 'dotenv';


/**
 * Get environment variable as string.
 * Throws if missing and no default provided.
 */
export function getEnv(name: string, defaultValue?: string | boolean): string {
    const envVal = process.env[name];
    const value = envVal !== undefined ? envVal : defaultValue;
    if (value === undefined) throw new Error(`Missing env var ${name}`);
    return String(value);
}

// Determine environment
const isPackaged = app.isPackaged;
const envFile = isPackaged ? '.env.production' : '.env.development';
dotenvConfig({ path: path.resolve(process.cwd(), envFile) });

const secretFileName = getEnv('SECRET_FILE_PATH', 'secret.tmp.json');
const SECRET_FILE_PATH = isPackaged
    ? path.join(path.dirname(app.getAppPath()), secretFileName) // next to ASAR
    : path.join(process.cwd(), secretFileName);                 // dev root

function normaliseBoolean(value?: string | boolean, defaultVal = false): boolean {
    if (value === undefined) return defaultVal;
    if (typeof value === 'boolean') return value;
    return ['true', '1'].includes(value.toLowerCase());
}

// Config object
export const config = {
    isPackaged,
    envFile,
    INIT_BUILD_PASSWORD: getEnv('INIT_BUILD_PASSWORD'),
    SHOW_DEV_TOOLS: normaliseBoolean(getEnv('SHOW_DEV_TOOLS', false)),
    CUSTOM_URL_PROTOCOL: getEnv('CUSTOM_URL_PROTOCOL', 'myapp'),
    CACHE_USER_SESSIONS: normaliseBoolean(getEnv('CACHE_USER_SESSIONS', false)),
    CLIENT_ID: getEnv('CLIENT_ID'),
    SECRET_FILE_PATH,
    SERVICE_NAME: getEnv('SERVICE_NAME', 'electron-github-oauth'),
    SESSION_TOKEN: getEnv('SESSION_TOKEN', 'github-token'),
    ACCOUNT_ACTIVATION: getEnv('ACCOUNT_ACTIVATION', 'account-activation'),
    DEV_REDIRECT_URI: 'http://localhost:3000/callback',
    REDIRECT_URI: isPackaged
        ? `${getEnv('CUSTOM_URL_PROTOCOL', 'myapp')}://callback`
        : 'http://localhost:3000/callback'
} as const;


