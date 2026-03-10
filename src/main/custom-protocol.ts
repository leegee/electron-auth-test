import url from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

import mime from 'mime';
import { app, net, protocol } from 'electron';

import log from './logger';
import { config } from './config';


function _nodeStreamToWebStream(nodeStream: fs.ReadStream): ReadableStream<Uint8Array> {
    return new ReadableStream({
        start(controller) {
            nodeStream.on('data', (chunk: Buffer | string) => {
                controller.enqueue(
                    typeof chunk === 'string'
                        ? new TextEncoder().encode(chunk)
                        : new Uint8Array(chunk)
                )
            })
            nodeStream.on('end', () => controller.close());
            nodeStream.on('error', (err) => controller.error(err));
        },
        cancel() {
            nodeStream.destroy();
        },
    });
}


function init() {
    protocol.registerSchemesAsPrivileged([
        { scheme: config.VITE_CUSTOM_URL_PROTOCOL, privileges: { standard: true, secure: true } },
    ]);
}

// Register custom protocol for deep links
function register() {
    protocol.handle(config.VITE_CUSTOM_URL_PROTOCOL, (req: GlobalRequest) => {
        try {
            const { pathname } = new URL(req.url);
            let urlPath = decodeURIComponent(pathname);

            if (!urlPath || urlPath === '/') {
                urlPath = 'index.html';
            }

            const base = path.join(app.getAppPath(), 'dist', 'renderer');
            const filePath = path.resolve(base, '.' + urlPath);

            // SPA routes:
            if (!path.extname(filePath)) {
                if (config.VITE_DEV_MODE) {
                    log.info('PROTOCOL:', req.url, '->', filePath, '-> index.html');
                }
                return net.fetch(url.pathToFileURL(path.join(base, 'index.html')).toString());
            }

            // Prevent directory traversal
            if (!filePath.startsWith(base)) {
                return new Response('Forbidden', { status: 403 });
            }

            const exists = fs.existsSync(filePath);
            if (config.VITE_DEV_MODE) {
                log.info('PROTOCOL:', req.url, '->', filePath, exists ? '[FOUND]' : '[MISSING]');
            }

            if (!fs.existsSync(filePath)) {
                return new Response('Not found', { status: 404 });
            }

            if (!path.extname(filePath)) {
                return net.fetch(url.pathToFileURL(path.join(base, 'index.html')).toString());
            }

            log.log(`Serving ${config.VITE_CUSTOM_URL_PROTOCOL}://  ${filePath}`)

            // return net.fetch(url.pathToFileURL(filePath).toString());
            const contentType = mime.getType(filePath) || 'application/octet-stream';

            const stream = fs.createReadStream(filePath);
            return new Response(_nodeStreamToWebStream(stream), {
                headers: { 'Content-Type': contentType },
            });
        }

        catch (err) {
            log.error(`Failed to serve "${req.url}"`, err)
            return new Response('Internal error', {
                status: 500,
                headers: { 'content-type': 'text/plain' }
            });
        }
    })
}

export default { register, init }


