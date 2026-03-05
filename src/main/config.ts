import path from 'path';
import { config as dotenvConfig } from 'dotenv';
import { app } from 'electron';


// Gets environment variables, throws if missing
export function getEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing env var ${name}`);
    return value;
}

// Determine environment
const isPackaged = app.isPackaged;
const envFile = isPackaged ? '.env.production' : '.env.development';
dotenvConfig({ path: path.resolve(process.cwd(), envFile) });

// Build config object
export const config = {
    isPackaged,
    envFile,
    SHOW_DEV_TOOLS: getEnv('SHOW_DEV_TOOLS'),
    CUSTOM_URL_PROTOCOL: getEnv('CUSTOM_URL_PROTOCOL'),
    CACHE_USER_SESSIONS: ['true', '1'].includes((process.env['CACHE_USER_SESSIONS'] ?? '').toLowerCase()),
    CLIENT_ID: getEnv('CLIENT_ID'),
    CLIENT_SECRET: getEnv('CLIENT_SECRET'),
    SERVICE_NAME: getEnv('SERVICE_NAME'),
    ACCOUNT_NAME: getEnv('ACCOUNT_NAME'),
    DEV_REDIRECT_URI: 'http://localhost:3000/callback',
    REDIRECT_URI: isPackaged
        ? `${getEnv('CUSTOM_URL_PROTOCOL')}://callback`
        : 'http://localhost:3000/callback'
} as const;

