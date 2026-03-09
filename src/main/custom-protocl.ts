import url from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

import { app, net, protocol } from 'electron';
import log from 'electron-log';

import { config } from './config';

log.transports.file.level = 'info';


function init() {
    protocol.registerSchemesAsPrivileged([
        { scheme: config.VITE_CUSTOM_URL_PROTOCOL, privileges: { standard: true, secure: true } },
    ]);
}

// Register custom protocol for deep links
function register() {
    // try {
    //   protocol.registerFileProtocol(config.VITE_CUSTOM_URL_PROTOCOL, (request, callback) => {
    //     const urlPath = request.url.replace(`${config.VITE_CUSTOM_URL_PROTOCOL}://`, '');
    //     const filePath = path.join(app.getAppPath(), 'dist', 'renderer', urlPath);
    //     console.log(`Serving ${config.VITE_CUSTOM_URL_PROTOCOL}:// -> ${filePath}`);
    //     callback({ path: filePath });
    //   });
    // } catch (err) {
    //   console.error(`Failed to register "${config.VITE_CUSTOM_URL_PROTOCOL}" protocol`, err);
    // }
    protocol.handle(config.VITE_CUSTOM_URL_PROTOCOL, (req: GlobalRequest) => {
        try {
            // let urlPath = req.url.replace(`${config.VITE_CUSTOM_URL_PROTOCOL}://`, '');

            const { pathname } = new URL(req.url);
            let urlPath = decodeURIComponent(pathname);

            if (!urlPath || urlPath === '/') {
                urlPath = 'index.html';
            }

            const base = path.join(app.getAppPath(), 'dist', 'renderer');
            const filePath = path.resolve(base, '.' + urlPath);

            if (config.VITE_SHOW_DEV_TOOLS) {
                const exists = fs.existsSync(filePath)
                log.info('PROTOCOL:',
                    req.url,
                    '→',
                    filePath,
                    exists ? '[FOUND]' : '[MISSING]'
                )
            }

            // Prevent directory traversal
            if (!filePath.startsWith(base)) {
                return new Response('Forbidden', { status: 403 });
            }

            if (!path.extname(filePath)) {
                return net.fetch(url.pathToFileURL(path.join(base, 'index.html')).toString());
            }

            console.log(`Serving ${config.VITE_CUSTOM_URL_PROTOCOL}://  ${filePath}`)
            return net.fetch(url.pathToFileURL(filePath).toString());
        }

        catch (err) {
            console.error(`Failed to serve "${req.url}"`, err)
            return new Response('Internal error', {
                status: 500,
                headers: { 'content-type': 'text/plain' }
            });
        }
    })
}

export default { register, init }

