import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';
import { app } from 'electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load package.json for the protocol scheme
const packageJsonPath = path.join(__dirname, '../../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
console.log(packageJson.name, packageJson.version);

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

console.info(packageJson);

const CUSTOM_URL_PROTOCOL = packageJson.build.protocols[0].schemes[0];

console.info('custom protocol', CUSTOM_URL_PROTOCOL);

// Build config object
export const config = {
    isPackaged,
    envFile,
    SHOW_DEV_TOOLS: getEnv('SHOW_DEV_TOOLS'),
    DEV_REDIRECT_URI: 'http://localhost:3000/callback',
    CUSTOM_URL_PROTOCOL: CUSTOM_URL_PROTOCOL,
    PROD_REDIRECT_URI: `${CUSTOM_URL_PROTOCOL}://callback`,
    CACHE_USER_SESSIONS: ['true', '1'].includes((process.env['CACHE_USER_SESSIONS'] ?? '').toLowerCase()),
    CLIENT_ID: getEnv('CLIENT_ID'),
    CLIENT_SECRET: getEnv('CLIENT_SECRET'),
    SERVICE_NAME: getEnv('SERVICE_NAME'),
    ACCOUNT_NAME: getEnv('ACCOUNT_NAME'),
    REDIRECT_URI: isPackaged
        ? `${CUSTOM_URL_PROTOCOL}://callback`
        : 'http://localhost:3000/callback'
} as const;

