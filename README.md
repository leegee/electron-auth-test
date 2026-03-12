# electron-secure-test

An Electron application with Solid and TypeScript

1. Configure GitHub OAuth2.0 in [Developer Settings](https://github.com/settings/developers) 
1. Configure Google OAuth2.0 at https://console.cloud.google.com/auth/clients and https://console.cloud.google.com/auth/clients (https://developers.google.com/identity/openid-connect/openid-connect)
1. Edit `.env` to set `VITE_{OAUTH_PROVIDER_NAME}_CLIENT_ID` and `VITE_{OAUTH_PROVIDER_NAME}_CLIENT_SECRET`
1. Maybe add more providers to [`oauth-config.ts`](src/main/oauth-plugin/oauth-config.ts).
1. Load an `.env` and `bun run ./scripts/generate-auth.ts`
    - An activation key will be generated per service, and for convenience stored in a file and printed to the console
1. Run `dev` or one of the `package.json` `build:*` scripts.
    - Use the same activation key or manually run `bun scripts/generate-auth.ts`.
1. After using the activation key, the next launch will not require activation.
1. Running `dev` with `CLEAN=1` will remove activation and generate new keys.

## TODO

Tests