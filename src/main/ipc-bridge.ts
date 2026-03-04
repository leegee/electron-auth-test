import { BrowserWindow, ipcMain, session } from 'electron';
import keytar from 'keytar';

import { config } from './config';

interface GitHubTokenResponse {
    access_token: string;
    scope?: string;
    token_type?: string;
}

ipcMain.handle('keytar-get-password', async (_event, service: string, account: string) => {
    return keytar.getPassword(service, account);
});

// ipcMain.handle('keytar-set-password', async (_event, service: string, account: string, password: string) => {
//     return keytar.setPassword(service, account, password);
// });

export function initIpc(mainWindow: BrowserWindow) {
    ipcMain.on('login-github', () => startGithubOAuth(mainWindow));
    ipcMain.on('delete-password', () => keytar.deletePassword(config.SERVICE_NAME, config.ACCOUNT_NAME));
}

function startGithubOAuth(mainWindow: BrowserWindow) {
    const ses = session.fromPartition('persist:oauthWindow', { cache: config.CACHE_USER_SESSIONS });

    const oauthWindow = new BrowserWindow({
        width: 500,
        height: 600,
        alwaysOnTop: true,
        focusable: true,
        webPreferences: {
            sandbox: true,
            backgroundThrottling: false,
            contextIsolation: true,
            devTools: false,
            nodeIntegration: false,
            session: ses,
        }
    });

    oauthWindow.webContents.on('will-navigate', (event, url) => {
        if (!url.startsWith('https://github.com')) event.preventDefault();
    });

    oauthWindow.setMenu(null);

    oauthWindow.webContents.on('will-redirect', async (event, url) => {
        if (url.startsWith(config.REDIRECT_URI)) {
            event.preventDefault();
            const code = new URL(url).searchParams.get('code');
            if (code) await exchangeCodeForToken(mainWindow, code);
            oauthWindow.close();
        }
    });

    oauthWindow.show();
    oauthWindow.focus();
    oauthWindow.loadURL(
        `https://github.com/login/oauth/authorize?client_id=${config.CLIENT_ID}&redirect_uri=${encodeURIComponent(config.REDIRECT_URI)}&scope=read:user`
    );
}


export async function exchangeCodeForToken(mainWindow: BrowserWindow, code: string) {
    try {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: new URLSearchParams({
                client_id: config.CLIENT_ID,
                client_secret: config.CLIENT_SECRET,
                code,
                redirect_uri: config.REDIRECT_URI
            })
        });

        const tokenData = await tokenResponse.json() as GitHubTokenResponse;
        const accessToken = tokenData.access_token;

        if (accessToken) {
            await keytar.setPassword(
                config.SERVICE_NAME,
                config.ACCOUNT_NAME,
                accessToken
            );
            console.log("Token stored securely in keytar.");
            mainWindow?.webContents.send('oauth-success');
        } else {
            console.error("Failed to get access token");
        }
    } catch (err) {
        console.error("Error exchanging code for token:", err);
    }
}


