# electron-secure-test

An Electron application with Solid and TypeScript

1. Edit  `src/main/config.ts`
1. Set the environment variable `INIT_CLIENT_SECRET` with the OAuth2 client secret.
1. Run the `package.json` script `dev` or one of the `build` scripts.
1. The file `secret.tmp.json` (env var `ACTIVATION_FILE_PATH`) is written and deleted on first use.

## To Do

* Make optional the whole `secret.tmp.json` trip.
* Prompt the user for an 'activation key' that is an AES-encrypted version of the client secret.
