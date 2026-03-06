import { BrowserWindow, ipcMain, session } from 'electron';
import keytar from 'keytar';

import { GitHubTokenResponseGood, GitHubTokenResponseBad } from '../shared/github-types';
import { config } from './config';
import { getClientSecret } from './auth';

type GitHubTokenResponse = GitHubTokenResponseGood | GitHubTokenResponseBad

ipcMain.handle('keytar-get-password', async (_event, service: string, account: string) => {
    return keytar.getPassword(service, account);
});

// ipcMain.handle('keytar-set-password', async (_event, service: string, account: string, password: string) => {
//     return keytar.setPassword(service, account, password);
// });

export function initIpc(mainWindow: BrowserWindow) {
    ipcMain.on('login-github', () => startGithubOAuth(mainWindow));
    ipcMain.on('delete-password', () => keytar.deletePassword(config.VITE_SERVICE_NAME, config.VITE_SESSION_TOKEN));
}

function startGithubOAuth(mainWindow: BrowserWindow) {
    const ses = session.fromPartition('persist:oauthWindow', { cache: config.VITE_CACHE_USER_SESSIONS });

    const oauthWindow = new BrowserWindow({
        width: config.VITE_SHOW_DEV_TOOLS ? 600 : 500,
        height: 600,
        alwaysOnTop: true,
        focusable: true,
        webPreferences: {
            sandbox: true,
            backgroundThrottling: false,
            contextIsolation: true,
            devTools: config.VITE_SHOW_DEV_TOOLS,
            nodeIntegration: false,
            session: ses,
        }
    });

    oauthWindow.webContents.on('will-navigate', (event, url) => {
        console.log('oauth window will-navigate to', url)
        if (!url.startsWith('https://github.com')) event.preventDefault();
    });

    oauthWindow.setMenu(null);

    oauthWindow.webContents.on('will-redirect', async (event, url) => {
        console.log('oauth window will-redirect to', url)
        console.log('oauth window comparing  to', config.VITE_REDIRECT_URI)
        if (url.startsWith(config.VITE_REDIRECT_URI)) {
            console.log('oauth window captured URL')
            event.preventDefault();
            const code = new URL(url).searchParams.get('code');
            if (code) await exchangeCodeForToken(mainWindow, code);
            oauthWindow.close();
        }
    });

    const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${config.VITE_CLIENT_ID}&scope=read:user`;

    oauthWindow.show();
    oauthWindow.focus();
    oauthWindow.loadURL(oauthUrl);
}


export async function exchangeCodeForToken(mainWindow: BrowserWindow, code: string) {
    console.log('Enter exchangeCodeForToken')

    const clientSecret = await getClientSecret();

    if (!clientSecret) {
        console.log('No client secret found — need manual activation');
        mainWindow?.webContents.send('require-activation');
        return;
    }

    console.log('In exchangeCodeForToken - with secret');

    try {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: new URLSearchParams({
                client_id: config.VITE_CLIENT_ID,
                client_secret: clientSecret,
                code,
                redirect_uri: config.VITE_REDIRECT_URI
            })
        });

        const tokenData = await tokenResponse.json() as GitHubTokenResponse;
        const accessToken = (tokenData as GitHubTokenResponseGood).access_token;

        if (accessToken) {
            await keytar.setPassword(
                config.VITE_SERVICE_NAME,
                config.VITE_SESSION_TOKEN,
                accessToken
            );
            console.log("Token stored securely in Keytar.");
            mainWindow?.webContents.send('oauth-success');
        } else {
            const errorRes = tokenData as GitHubTokenResponseBad;
            console.warn("ipc-main-bridge: Failed to get access token from response:", errorRes);
            mainWindow?.webContents.send('oauth-error', errorRes);
        }
    } catch (err) {
        console.error("Error exchanging code for token:", err);
    }
}

