import type { Plugin } from 'vite';
import { createServer, type Server } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';

console.log(`[electron-update-server] Loading`);

export function electronUpdateServer({ dir, port, }: {
    dir: string,
    port: number,
}): Plugin {
    let server: Server | undefined;

    return {
        name: 'electron-update-server',

        configureServer() {
            if (!existsSync(dir)) {
                console.warn(`[electron-update-server] Missing ${ dir }`);
                return;
            }

            server = createServer((req, res) => {
                const urlPath = new URL(
                    req.url ?? "/",
                    `http://${ req.headers.host }`
                ).pathname;

                console.log("[update-server]", req.method, req.url, urlPath);

                const filePath = path.join(
                    dir,
                    urlPath === '/' ? 'latest.yml' : urlPath
                );

                if (!existsSync(filePath)) {
                    res.statusCode = 404;
                    res.end('Not found');
                    return;
                }

                const stat = statSync(filePath);

                if (!stat.isFile()) {
                    res.statusCode = 404;
                    res.end('Not a file');
                    return;
                }

                res.statusCode = 200;

                if (filePath.endsWith('.yml')) {
                    res.setHeader(
                        'Content-Type',
                        'text/yaml'
                    );
                }

                createReadStream(filePath).pipe(res);
            });

            server.listen(port, () => {
                console.log(`[electron-update-server] http://localhost:${ port }`);
                console.log(`[electron-update-server] serving ${ dir }`);
            });
        },

        closeBundle() {
            server?.close(() => console.log(`[electron-update-server] Closed connection.`));
        },
    };
}
