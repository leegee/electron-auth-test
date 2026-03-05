import path from 'path';
import fs from 'fs';
import { config as dotenvConfig } from 'dotenv';
import { app } from 'electron';
import keytar from 'keytar';

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

// Secret file path
const secretFileName = getEnv('SECRET_FILE_PATH', 'secret.tmp.json');
const SECRET_FILE_PATH = isPackaged
    ? path.join(path.dirname(app.getAppPath()), secretFileName) // next to ASAR
    : path.join(process.cwd(), secretFileName);                 // dev root

// Normalize booleans
function parseBoolean(value?: string | boolean, defaultVal = false): boolean {
    if (value === undefined) return defaultVal;
    if (typeof value === 'boolean') return value;
    return ['true', '1'].includes(value.toLowerCase());
}

// Config object
export const config = {
    isPackaged,
    envFile,
    INIT_BUILD_PASSWORD: getEnv('INIT_BUILD_PASSWORD'),
    SHOW_DEV_TOOLS: parseBoolean(getEnv('SHOW_DEV_TOOLS', false)),
    CUSTOM_URL_PROTOCOL: getEnv('CUSTOM_URL_PROTOCOL', 'myapp'),
    CACHE_USER_SESSIONS: parseBoolean(getEnv('CACHE_USER_SESSIONS', false)),
    CLIENT_ID: getEnv('CLIENT_ID'),
    SECRET_FILE_PATH,
    SERVICE_NAME: getEnv('SERVICE_NAME', 'electron-github-oauth'),
    ACCOUNT_NAME: getEnv('ACCOUNT_NAME', 'github-token'),
    DEV_REDIRECT_URI: 'http://localhost:3000/callback',
    REDIRECT_URI: isPackaged
        ? `${getEnv('CUSTOM_URL_PROTOCOL', 'myapp')}://callback`
        : 'http://localhost:3000/callback'
} as const;


/**
 * First-run initialization of CLIENT_SECRET into Keytar
 */
export async function initializeSecret(): Promise<string> {
    const existing = await keytar.getPassword(config.SERVICE_NAME, config.ACCOUNT_NAME);
    if (existing) return existing;

    if (!fs.existsSync(config.SECRET_FILE_PATH)) {
        throw new Error(`Secret file missing, cannot initialize Keytar from ${config.SECRET_FILE_PATH}`);
    }

    const secretData = JSON.parse(fs.readFileSync(config.SECRET_FILE_PATH, 'utf-8'));
    if (!secretData.CLIENT_SECRET) throw new Error("CLIENT_SECRET missing in temp file");

    const secret = secretData.CLIENT_SECRET;

    await keytar.setPassword(config.SERVICE_NAME, config.ACCOUNT_NAME, secret);

    fs.unlinkSync(config.SECRET_FILE_PATH);

    return secret;
}
