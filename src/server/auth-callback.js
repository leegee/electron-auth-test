import express from 'express';
import keytar from 'keytar';

import { SERVICE_NAME, ACCOUNT_NAME, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } from '../auth.config.js';

export function startOAuthServer(mainWindow) {
    const app = express();

    app.get('/callback', async (req, res) => {
        const code = req.query.code;

        if (!code) {
            res.send("No code received");
            return;
        }

        // Exchange code for token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code,
                redirect_uri: REDIRECT_URI
            })
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        if (accessToken) {
            await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, accessToken);
            console.log("Token stored securely in keytar.");
            res.send("Login successful! You can close this window.");
            mainWindow.webContents.send('oauth-success');
        } else {
            res.send("Failed to get access token.");
        }
    });

    app.listen(3000, () => {
        console.log("OAuth callback server running on http://localhost:3000");
    });
}
