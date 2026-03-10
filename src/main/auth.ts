// import fs from 'node:fs/promises';
import * as crypto from 'node:crypto';
import keytar from 'keytar';

import { app, BrowserWindow, session } from 'electron';

import { OAUTH_PROVIDERS } from '@shared/oauthConfig';
import type { OAuthTokenSuccess, OAuthTokenResponseBad, OAuthTokenResponse } from '@shared/oauth-types';
import log from '@shared/logger';
import { config } from './config';
import { decryptActivationKey } from './crypt';

export type OAuthCallbacks = {
    onSuccess: () => void;
    onError: (err: OAuthTokenResponseBad) => void;
    onRequireActivation: () => void;
};


const pkceMap = new Map<string, { code_verifier: string; provider: keyof typeof OAUTH_PROVIDERS }>();

export function storePkce(state: string, provider: keyof typeof OAUTH_PROVIDERS, code_verifier: string) {
    pkceMap.set(state, { provider, code_verifier });
}

export function getPkce(state: string) {
    const entry = pkceMap.get(state);
    pkceMap.delete(state); // remove after use
    return entry;
}

export async function getClientSecret(provider: keyof typeof OAUTH_PROVIDERS): Promise<string | null> {
    log.log('Enter getClientSecret for', provider);

    if (!provider) throw new Error('No provider provided to auth.getClientSecret');

    const existing = await keytar.getPassword(config.VITE_SERVICE_NAME, config.VITE_ACCOUNT_ACTIVATION + '-' + provider);

    log.log(`In getClientSecret for ${provider} with`, (existing ? 'existing token' : 'nout'), existing);

    if (existing) return existing;

    return null;

    /*
    try {
        const secret = await accountantActivationFromFile(provider);
        return secret;
    } catch {
        //  neither Keytar nor file exists → manual activation required
        return null;
    }
    */
}


// First-run initialization of CLIENT_SECRET into Keytar - current unused
/*
async function accountantActivationFromFile(provider: keyof typeof OAUTH_PROVIDERS): Promise<string> {
    log.log('enter initializeSecret');

    try {
        await fs.access(config.VITE_ACTIVATION_FILE_PATH);
    } catch {
        throw new Error(`Secret file missing, cannot initialize Keytar from ${config.VITE_ACTIVATION_FILE_PATH}`);
    }

    log.log('Try initializing secret from file');

    let secretData: any;
    try {
        const raw = await fs.readFile(config.VITE_ACTIVATION_FILE_PATH, 'utf-8');
        secretData = JSON.parse(raw);
        log.log('Got secret from file', secretData);
        fs.unlink(config.VITE_ACTIVATION_FILE_PATH);
    } catch {
        throw new Error('Invalid activation file format');
    }

    if (!secretData.ACTIVATION_KEY) {
        throw new Error('ACTIVATION_KEY missing in activation file');
    }

    let secret = '';

    try {
        secret = await storeActivationKey(secretData.ACTIVATION_KEY, provider);
    } catch (err) {
        log.log('auth: error =', err)
        throw new Error(String(err));
    }

    log.log('leave initializeSecret - secret stored in keytar');

    return secret;
}
*/


export async function storeActivationKey(activation_key: string, provider: keyof typeof OAUTH_PROVIDERS) {
    log.log(`auth.storeActivationKey enter for ${provider}`)
    const secret = await decryptActivationKey(activation_key, config.VITE_BUILD_PASSWORD);
    log.log(`auth.storeActivationKey created for ${provider}`)
    await keytar.setPassword(config.VITE_SERVICE_NAME, config.VITE_ACCOUNT_ACTIVATION + '-' + provider, secret);
    return secret;
}


// Starts OAuth popup flow. Sends results via callbacks.
export async function startOauth(
    provider: keyof typeof OAUTH_PROVIDERS,
    callbacks: OAuthCallbacks
) {
    const clientSecret = await getClientSecret(provider);

    if (!clientSecret) {
        callbacks.onRequireActivation();
        return;
    }

    const allowedUrlPrefixes = [config.VITE_REDIRECT_URI, ...OAUTH_PROVIDERS[provider].allowedUrls];

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

    oauthWindow.on('closed', () => oauthWindow.destroy());

    let handled = false;

    const handleOAuthCallback = async (url: string) => {
        if (handled) return;
        handled = true;

        const u = new URL(url);
        const returnedState = u.searchParams.get('state');
        const code = u.searchParams.get('code');
        const error = u.searchParams.get('error');

        oauthWindow.close();

        if (error) {
            callbacks.onError({ error, error_description: 'OAuth redirect returned error' });
            return;
        }

        if (returnedState !== csrfGaurd) {
            callbacks.onError({ error: 'state_mismatch', error_description: 'OAuth state does not match' });
            return;
        }

        if (code) {
            await exchangeCodeForToken(provider, code, code_verifier, callbacks);
        }
    };

    oauthWindow.webContents.on('will-navigate', (event, url) => {
        if (!allowedUrlPrefixes.some((prefix) => url.startsWith(prefix))) {
            log.log('Blocked navigation to', url);
            event.preventDefault();
        } else {
            handleOAuthCallback(url);
        }
    });

    oauthWindow.webContents.on('will-redirect', (event, url) => {
        if (!allowedUrlPrefixes.some((prefix) => url.startsWith(prefix))) {
            log.log('Blocked redirect to', url);
            event.preventDefault();
        } else {
            handleOAuthCallback(url);
        }
    });

    oauthWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (allowedUrlPrefixes.some((prefix) => url.startsWith(prefix))) {
            handleOAuthCallback(url);
        } else {
            log.log('Blocked new window to', url);
        }
        return { action: 'deny' };
    });

    const { code_verifier, code_challenge } = generatePKCE();
    const csrfGaurd = crypto.randomUUID();

    const params = new URLSearchParams({
        client_id: config.getClientId(provider),
        redirect_uri: buildRedirectUri(provider),
        response_type: 'code',
        state: csrfGaurd,
        code_challenge,
        code_challenge_method: 'S256',
    });

    const oauthUrl = OAUTH_PROVIDERS[provider].authUrl + params.toString();

    oauthWindow.loadURL(oauthUrl);
    oauthWindow.show();
    oauthWindow.focus();
}

// Exchanges OAuth code for access token.
export async function exchangeCodeForToken(
    provider: keyof typeof OAUTH_PROVIDERS,
    code: string,
    code_verifier: string,
    callbacks: OAuthCallbacks,
) {
    const clientSecret = await getClientSecret(provider);
    if (!clientSecret) {
        log.log('exchangeCodeForToken: do not have client secret, reauthorisation required')
        callbacks.onRequireActivation();
        return;
    }

    try {
        log.log('exchangeCodeForToken: trying to get token')
        const tokenResponse = await fetch(OAUTH_PROVIDERS[provider].tokenUrl, {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: new URLSearchParams({
                client_id: config.getClientId(provider),
                client_secret: clientSecret,
                code,
                code_verifier,
                redirect_uri: buildRedirectUri(provider),
            }),
        });

        const tokenData = (await tokenResponse.json()) as OAuthTokenResponse;
        const accessToken = (tokenData as OAuthTokenSuccess).access_token;

        if (accessToken) {
            log.log('exchangeCodeForToken: got token')
            await keytar.setPassword(config.VITE_SERVICE_NAME, config.VITE_SESSION_TOKEN + '-' + provider, accessToken);
            callbacks.onSuccess();
        } else {
            log.log('exchangeCodeForToken: failed to get token', tokenData)
            callbacks.onError(tokenData as OAuthTokenResponseBad);
        }
    }

    catch (err) {
        log.error('exchangeCodeForToken: error exchanging code for token:', err);
        const errorRes: OAuthTokenResponseBad = {
            error: 'network_error',
            error_description: (err as Error).message,
        };
        callbacks.onError(errorRes);
    }
}


function buildRedirectUri(provider: keyof typeof OAUTH_PROVIDERS) {
    return config.VITE_REDIRECT_URI + '?provider=' + provider
}


function generatePKCE(): { code_verifier: string; code_challenge: string } {
    const code_verifier = crypto.randomBytes(32).toString('base64url'); // 43–128 chars
    const hash = crypto.createHash('sha256').update(code_verifier).digest();
    const code_challenge = hash.toString('base64url');
    return { code_verifier, code_challenge };
}


export function handleDeepLinks(mainWindow: BrowserWindow) {
    const callbacksFactory = (): OAuthCallbacks => ({
        onSuccess: () => mainWindow.webContents.send('oauth-success'),
        onError: (err) => mainWindow.webContents.send('oauth-error', err),
        onRequireActivation: () => mainWindow.webContents.send('require-activation'),
    });

    // Windows/Linux
    app.on('second-instance', async (_event, argv) => {
        const urlArg = argv.find(a => a.startsWith(`${config.VITE_CUSTOM_URL_PROTOCOL}://`));
        if (!urlArg) return;
        await handleDeepLinkUrl(urlArg, mainWindow, callbacksFactory);
    });

    // macOS
    app.on('open-url', async (event, urlStr) => {
        event.preventDefault();
        await handleDeepLinkUrl(urlStr, mainWindow, callbacksFactory);
    });

    return true;
}


async function handleDeepLinkUrl(urlStr: string, mainWindow: BrowserWindow, callbacksFactory: () => OAuthCallbacks) {
    try {
        const url = new URL(urlStr);
        const code = url.searchParams.get('code');
        const provider = url.searchParams.get('provider') as keyof typeof OAUTH_PROVIDERS;
        const state = url.searchParams.get('state');

        if (!code || !provider || !state) return;

        const pkceEntry = getPkce(state);
        if (!pkceEntry || pkceEntry.provider !== provider) {
            mainWindow.webContents.send('oauth-error', { error: 'invalid_state' });
            return;
        }

        await exchangeCodeForToken(provider, code, pkceEntry.code_verifier, callbacksFactory());
        mainWindow.focus();
    } catch (err) {
        log.error('handleDeepLinkUrl error:', err);
        mainWindow.webContents.send('oauth-error', { error: 'invalid_url', error_description: String(err) });
    }
}
