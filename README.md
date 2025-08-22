An small example of Electron authorising via OAuth 2.0 and storing locally using `keytar`.

    bun dev
    # Or
    bun run bundle

In dev mode, uses Node's `http` module to receive redirects from GitHub.

In prod mode, uses a [custom protocol handler](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/registerProtocolHandler) to receive redirects. This behaves differently on a Mac to Windoze, and I only have the latter to hand.

OAuth 2.0 config is via `.env.production` and `.env.development`:

    NODE_ENV=production
    CLIENT_ID=xxxxxxxxxx
    CLIENT_SECRET=xxxxxxxxxxxxxxxxx
    SERVICE_NAME=electron-github-oauth
    ACCOUNT_NAME=github-token

See [GitHub OAuth Apps](https://github.com/settings/developers).