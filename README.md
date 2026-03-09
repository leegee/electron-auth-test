# electron-secure-test

An Electron application with Solid and TypeScript

1. Configure GitHub OAuth2.0 in [Developer Settings](https://github.com/settings/developers) 
1. Configure Google OAuth2.0 at https://console.cloud.google.com/auth/clients?project=electron-secure-test and https://console.cloud.google.com/auth/clients?project=electron-secure-test
1. Edit  `src/main/config.ts` and/or `.env`.
1. Run the `package.json` script `dev`.
    - An activation key will be generated, stored in a file, used, and the file deleted.
1. Run one of the `package.json` `build:*` scripts.
    - Use the same activation key or manually run `bun scripts/generate-auth.ts`.
1. After using the activation key or file, the next launch will not require activation.
1. To regenerate, run `CLEAN=1 bun dev`.
1. Activation files are not bundled.

## TODO

*  Move to PBKDF2/Argon2
