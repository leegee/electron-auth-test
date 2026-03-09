// src\main\auth.ts
import fs from 'node:fs/promises';
import keytar from 'keytar';
import * as crypto from 'node:crypto';

import { BrowserWindow, session } from 'electron';

import type { GitHubTokenResponseGood, GitHubTokenResponseBad } from '../shared/github-types';
import { config } from './config';

export type GitHubTokenResponse = GitHubTokenResponseGood | GitHubTokenResponseBad;

export type OAuthCallbacks = {
    onSuccess: () => void;
    onError: (err: GitHubTokenResponseBad) => void;
    onRequireActivation: () => void;
};

const allowedNavigate = ['https://github.com', config.VITE_REDIRECT_URI];

export async function getClientSecret(): Promise<string | null> {
    console.trace('Enter getClientSecret');
    const existing = await keytar.getPassword(config.VITE_SERVICE_NAME, config.VITE_ACCOUNT_ACTIVATION);

    console.log('In getClientSecret with', (existing ? 'existing token' : 'nout'), existing);

    if (existing) return existing;

    return null;

    try {
        const secret = await accountantActivationFromFile();
        return secret;
    } catch {
        //  neither Keytar nor file exists → manual activation required
        return null;
    }
}


// First-run initialization of CLIENT_SECRET into Keytar
async function accountantActivationFromFile(): Promise<string> {
    console.log('enter initializeSecret');

    try {
        await fs.access(config.VITE_ACTIVATION_FILE_PATH);
    } catch {
        throw new Error(`Secret file missing, cannot initialize Keytar from ${config.VITE_ACTIVATION_FILE_PATH}`);
    }

    console.log('Try initializing secret from file');

    let secretData: any;
    try {
        const raw = await fs.readFile(config.VITE_ACTIVATION_FILE_PATH, 'utf-8');
        secretData = JSON.parse(raw);
        console.log('Got secret from file', secretData);
        fs.unlink(config.VITE_ACTIVATION_FILE_PATH);
    } catch {
        throw new Error('Invalid activation file format');
    }

    if (!secretData.ACTIVATION_KEY) {
        throw new Error('ACTIVATION_KEY missing in activation file');
    }

    let secret = '';

    try {
        await storeActivationKey(secretData.ACTIVATION_KEY);
    } catch (err) {
        console.log('auth: error =', err)
        throw new Error(String(err));
    }

    console.log('leave initializeSecret - secret stored in keytar');

    return secret;
}

export async function storeActivationKey(activation_key: string) {
    const secret = decryptActivationKey(activation_key, config.VITE_BUILD_PASSWORD);
    console.log('auth: secret =', secret)
    await keytar.setPassword(config.VITE_SERVICE_NAME, config.VITE_ACCOUNT_ACTIVATION, secret);
}

export function decryptActivationKey(keyBase64: string, password: string): string {
    console.log('enter decryptActivationKey')
    const data = Buffer.from(keyBase64, 'base64');
    const iv = data.slice(0, 12);
    const tag = data.slice(12, 28);
    const encrypted = data.slice(28);

    const key = crypto.createHash('sha256').update(password).digest(); // 32 bytes
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString();
}




/**
 * Starts GitHub OAuth popup flow. Sends results via callbacks.
 */
export async function startGithubOAuth(callbacks: OAuthCallbacks) {
    const clientSecret = await getClientSecret();

    if (!clientSecret) {
        callbacks.onRequireActivation();
        return;
    }

    const ses = session.fromPartition('persist:oauthWindow', { cache: config.VITE_CACHE_USER_SESSIONS });

    const oauthWindow = new BrowserWindow({
        width: config.VITE_DEV_MODE ? 600 : 500,
        height: 600,
        alwaysOnTop: true,
        focusable: true,
        webPreferences: {
            sandbox: true,
            backgroundThrottling: false,
            contextIsolation: true,
            devTools: config.VITE_DEV_MODE,
            nodeIntegration: false,
            session: ses,
        },
    });

    oauthWindow.setMenu(null);

    oauthWindow.webContents.on('will-navigate', (event, url) => {
        if (!allowedNavigate.some((prefix) => url.startsWith(prefix))) {
            console.log('will-navigate: Blocked navigation to', url);
            event.preventDefault();
        } else {
            console.log('will-navigate: Allowed navigation to', url);
        }
    });

    oauthWindow.webContents.on('will-redirect', async (event, url) => {
        console.log('will-redirect', url, 'test for', config.VITE_REDIRECT_URI)
        if (url.startsWith(config.VITE_REDIRECT_URI)) {
            event.preventDefault();
            oauthWindow.close();
            console.log('will-direct matched', config.VITE_REDIRECT_URI)
            const code = new URL(url).searchParams.get('code');
            console.log('will-direct code', code)
            if (code) await exchangeCodeForToken(code, callbacks);
        }
    });

    const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${config.VITE_CLIENT_ID}&scope=read:user`;
    oauthWindow.loadURL(oauthUrl);
    oauthWindow.show();
    oauthWindow.focus();
}

/**
 * Exchanges GitHub OAuth code for access token.
 */
export async function exchangeCodeForToken(code: string, callbacks: OAuthCallbacks) {
    const clientSecret = await getClientSecret();
    if (!clientSecret) {
        console.log('exchangeCodeForToken: do not have client secret, reauthorisation required')
        callbacks.onRequireActivation();
        return;
    }

    try {
        console.log('exchangeCodeForToken: trying to get token')
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: new URLSearchParams({
                client_id: config.VITE_CLIENT_ID,
                client_secret: clientSecret,
                code,
                redirect_uri: config.VITE_REDIRECT_URI,
            }),
        });

        const tokenData = (await tokenResponse.json()) as GitHubTokenResponse;
        const accessToken = (tokenData as GitHubTokenResponseGood).access_token;

        if (accessToken) {
            console.log('exchangeCodeForToken: got token')
            await keytar.setPassword(config.VITE_SERVICE_NAME, config.VITE_SESSION_TOKEN, accessToken);
            callbacks.onSuccess();
        } else {
            console.log('exchangeCodeForToken: failed to get token', tokenData)
            callbacks.onError(tokenData as GitHubTokenResponseBad);
        }
    } catch (err) {
        console.error('exchangeCodeForToken: error exchanging code for token:', err);
        const errorRes: GitHubTokenResponseBad = {
            error: 'network_error',
            error_description: (err as Error).message,
        };
        callbacks.onError(errorRes);
    }
}
