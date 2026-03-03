# `electron-auth-test`

An small example of Electron authorising via OAuth 2.0 and storing locally using `keytar`.

```bash
bun dev
# Or
bun run bundle
```

In prod mode, uses a [custom protocol handler](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/registerProtocolHandler) to receive redirects. This behaves differently on a Mac to Windoze, and I only have the latter to hand.

In dev mode, uses Node's `http` module to receive redirects from GitHub since custom protocols do not reliably work in dev mode.

OAuth 2.0 config is via `.env.production` and `.env.development` - see [.env.eg.txt](./.env.eg.txt) for details.

## References

See [GitHub OAuth Apps](https://github.com/settings/developers).


