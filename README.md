# electron-secure-test

An Electron application with Solid and TypeScript

1. Edit  `src/main/config.ts` and/or `.env` - be sure to set the environment variable `INIT_CLIENT_SECRET` with the OAuth2 client secret.
1. Run the `package.json` script `dev` or one of the `build` scripts.
1. An activation key will be generated, stored in a file, used, and the file deleted.
1. Next launch will not require activation.
1. To regenerate, run `CLEAN=1 bun dev` (which also prints the activation key to the terminal)

## TODO

Replace macros with import.meta.env?
