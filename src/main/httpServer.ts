import { createServer } from 'node:http';
import { exchangeCodeForToken } from './ipc-bridge';
import { BrowserWindow } from 'electron';
import { config } from './config';

export function startDevHttpServer(mainWindow: BrowserWindow) {
    const server = createServer(async (req, res) => {
        if (!req.url) return;
        const reqUrl = new URL(req.url, config.DEV_REDIRECT_URI);

        if (reqUrl.pathname === '/callback') {
            const code = reqUrl.searchParams.get('code');
            if (code) {
                await exchangeCodeForToken(mainWindow, code);
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Login successful! You can close this window.');
            } else {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('No code received');
            }
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found');
        }
    });

    server.listen(3000, () => {
        console.log(`Dev HTTP server running on ${config.DEV_REDIRECT_URI}`);
    });

    return server;
}
