// src/main/oauth-plugin/index.ts

import http from "node:http"
import crypto from "node:crypto"

import { shell } from "electron"
import keytar from "keytar"
import type { ProviderConfig, StoredToken } from "@shared/oauth-types"
import type { OAuthProviderConfig } from "../../shared/oauthConfig"
import log from "../logger"
import { decryptActivationKey } from "../crypt"
import { initAuthIpc } from "./ipc-main-bridge"

export interface OAuthPluginConfig {
    serviceName: string
    secretServiceName: string
    providers: OAuthProviderConfig,
    buildPassword: string
}

let loginInProgressMap = new Set<string>();

function base64url(buffer: Buffer) {
    return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function createPKCE() {
    const verifier = base64url(crypto.randomBytes(32))
    const challenge = base64url(crypto.createHash("sha256").update(verifier).digest())
    return { verifier, challenge }
}

function createState() {
    return base64url(crypto.randomBytes(16))
}


async function exchangeCode(
    provider: ProviderConfig,
    code: string,
    verifier: string,
    redirectUri: string,
    clientSecret?: string | undefined
) {
    const body: Record<string, string> = {
        client_id: provider.clientId,
        code,
        code_verifier: verifier,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
    };

    if (clientSecret) body.client_secret = clientSecret;

    const res = await fetch(provider.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
        body: new URLSearchParams(body)
    });

    if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
    const token = await res.json();
    token.obtained_at = Date.now();
    return token;
}

async function refreshToken(provider: ProviderConfig, refreshToken: string) {
    const url = provider.refreshTokenUrl || provider.tokenUrl
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        },
        body: new URLSearchParams({
            client_id: provider.clientId,
            grant_type: "refresh_token",
            refresh_token: refreshToken
        })
    })
    if (!res.ok) throw new Error(`Refresh token failed: ${res.status}`)
    const token = await res.json()
    token.refresh_token = refreshToken
    token.obtained_at = Date.now()
    return token
}

function isTokenExpired(token: StoredToken) {
    if (!token.expires_in || !token.obtained_at) return false
    const now = Date.now()
    return now >= (token.obtained_at + token.expires_in * 1_000 - 60_000)
}

export class ElectronOAuthPlugin {
    private config: OAuthPluginConfig
    private onRequireActivation?: (providerName: string) => void;

    constructor(config: OAuthPluginConfig, onRequireActivation?: (providerName: string) => void) {
        this.config = config;
        this.onRequireActivation = onRequireActivation;
    }

    initIpc() {
        initAuthIpc(this);
    }

    // async login(providerName: string): Promise<StoredToken | undefined> {
    //     const provider = this.config.providers[providerName];
    //     if (!provider) throw new Error(`Unknown provider: ${providerName}`);
    //     if (loginInProgress) throw new Error("Another OAuth login is in progress");
    //     loginInProgress = true;

    //     const { verifier, challenge } = createPKCE();
    //     const state = createState();
    //     const port = provider.port || 30000 + Math.floor(Math.random() * 10000);
    //     const redirectUrl = `http://127.0.0.1:${port}/callback`;

    //     return new Promise<StoredToken | undefined>((resolve, reject) => {

    //         let server: http.Server;

    //         const cleanup = () => {
    //             loginInProgress = false;
    //             clearTimeout(timeout);
    //             server?.close();
    //         };

    //         const finishSuccess = (token?: StoredToken) => {
    //             cleanup();
    //             resolve(token);
    //         };

    //         const finishError = (err: unknown) => {
    //             cleanup();
    //             reject(err);
    //         };

    //         const closeBrowser = (res: http.ServerResponse, message = "Login complete") => {
    //             res.writeHead(200, { "Content-Type": "text/html" });
    //             res.end(`<script>window.close()</script>${message}`);
    //         };

    //         const timeout = setTimeout(() => {
    //             finishError(new Error("OAuth login timed out"));
    //         }, 180_000);

    //         server = http.createServer(async (req, res) => {
    //             try {

    //                 const url = new URL(req.url!, redirectUrl);
    //                 if (url.pathname !== "/callback") return;

    //                 const code = url.searchParams.get("code");
    //                 const receivedState = url.searchParams.get("state");

    //                 if (!code || receivedState !== state) {
    //                     throw new Error("Invalid OAuth state");
    //                 }

    //                 let clientSecret: string | undefined;

    //                 if (provider.requiresClientSecret) {
    //                     clientSecret = await this.getClientSecret(providerName) || undefined;
    //                     if (!clientSecret) {
    //                         closeBrowser(res, "Activation required");
    //                         this.onRequireActivation?.(providerName);
    //                         return finishSuccess(undefined);
    //                     }
    //                 }

    //                 const token = await exchangeCode(
    //                     provider,
    //                     code,
    //                     verifier,
    //                     redirectUrl,
    //                     clientSecret
    //                 );

    //                 await keytar.setPassword(this.config.serviceName, providerName, JSON.stringify(token));

    //                 closeBrowser(res);
    //                 return finishSuccess(token);

    //             } catch (err) {
    //                 return finishError(err);
    //             }
    //         });

    //         server.listen(port);

    //         const authParams = new URLSearchParams({
    //             client_id: provider.clientId,
    //             redirect_uri: redirectUrl,
    //             response_type: "code",
    //             scope: provider.scopes.join(" "),
    //             code_challenge: challenge,
    //             code_challenge_method: "S256",
    //             state,
    //             ...(provider.extraAuthParams || {})
    //         });

    //         const authUrl = `${provider.authUrl}?${authParams.toString()}`;
    //         log.log("OAuth opening browser for auth:", authUrl)
    //         shell.openExternal(authUrl);
    //     });
    // }

    //  Get stored token and refresh if expired


    async login(providerName: string): Promise<StoredToken | undefined> {
        const provider = this.config.providers[providerName];
        if (!provider) throw new Error(`Unknown provider: ${providerName}`);
        if (loginInProgressMap.has(providerName)) throw new Error("Another OAuth login is in progress");

        loginInProgressMap.add(providerName);

        try {
            let clientSecret: string | undefined;

            if (provider.requiresClientSecret) {
                const secret = await this.getClientSecret(providerName);
                if (!secret) {
                    this.onRequireActivation?.(providerName);
                    return undefined;
                }
                clientSecret = secret;
            }

            const token = await this.runOAuthFlow(provider, clientSecret);

            if (!token)
                return undefined;

            await keytar.setPassword(this.config.serviceName, providerName, JSON.stringify(token));
            return token;
        }
        finally {
            loginInProgressMap.delete(providerName);
        }
    }

    private async runOAuthFlow(
        provider: ProviderConfig,
        clientSecret?: string
    ): Promise<StoredToken | undefined> {
        const { verifier, challenge } = createPKCE();
        const state = createState();
        const port = provider.port || 30000 + Math.floor(Math.random() * 10000);
        const redirectUrl = `http://127.0.0.1:${port}/callback`;

        return new Promise<StoredToken | undefined>((resolve, reject) => {
            let server: http.Server;

            const cleanup = () => {
                clearTimeout(timeout);
                server?.close();
            };

            const finishSuccess = (token?: StoredToken) => {
                cleanup();
                resolve(token);
            };

            const finishError = (err: unknown) => {
                cleanup();
                reject(err);
            };

            const closeBrowser = (res: http.ServerResponse, message = "Login complete") => {
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(`<script>window.close()</script>${message}`);
            };

            const timeout = setTimeout(() => {
                finishError(new Error("OAuth login timed out"));
            }, 180_000);

            server = http.createServer(async (req, res) => {

                try {
                    const url = new URL(req.url!, redirectUrl);
                    if (url.pathname !== "/callback")
                        return;

                    const code = url.searchParams.get("code");
                    const receivedState = url.searchParams.get("state");

                    if (!code || receivedState !== state)
                        throw new Error("Invalid OAuth state");

                    const token = await exchangeCode(
                        provider,
                        code,
                        verifier,
                        redirectUrl,
                        clientSecret
                    );

                    closeBrowser(res);
                    finishSuccess(token);
                }
                catch (err) {
                    finishError(err);
                }
            });

            server.listen(port);

            const authParams = new URLSearchParams({
                client_id: provider.clientId,
                redirect_uri: redirectUrl,
                response_type: "code",
                scope: provider.scopes.join(" "),
                code_challenge: challenge,
                code_challenge_method: "S256",
                state,
                ...(provider.extraAuthParams || {})
            });

            const authUrl = `${provider.authUrl}?${authParams.toString()}`;

            log.log("OAuth opening browser for auth:", authUrl);
            shell.openExternal(authUrl);
        });
    }

    async getToken(providerName: string): Promise<StoredToken | null> {
        log.log('oauth2.getToken for', providerName)
        const provider = this.config.providers[providerName]
        if (!provider) throw new Error(`Unknown provider: ${providerName}`)

        const storedRaw = await keytar.getPassword(this.config.serviceName, providerName)
        log.log('oauth2.getToken storedRaw', storedRaw)
        if (!storedRaw) return null

        const token: StoredToken = JSON.parse(storedRaw)

        log.log('oauth2.getToken token parsed', token)

        if (token.error) {
            log.log('Cached token invalid:', token)
            await this.logout(providerName)
            return null
        }

        if (token.refresh_token && isTokenExpired(token)) {
            try {
                const newToken = await refreshToken(provider, token.refresh_token)
                await keytar.setPassword(this.config.serviceName, providerName, JSON.stringify(newToken))
                log.log('setPassword', this.config.serviceName, providerName)
                return newToken
            } catch {
                // Refresh failed - treat as revoked/expired
                await this.logout(providerName)
                return null
            }
        }
        return token
    }

    async logout(providerName: string): Promise<boolean> {
        log.log('logout', this.config.serviceName, providerName)
        return await keytar.deletePassword(this.config.serviceName, providerName)
    }

    async setClientSecret(providerName: string, secret: string): Promise<void> {
        log.log('setClientSecret', this.config.serviceName, providerName)
        await keytar.setPassword(this.config.secretServiceName, providerName, secret);
    }

    async getClientSecret(providerName: string): Promise<string | null> {
        return await keytar.getPassword(
            this.config.secretServiceName,
            providerName
        );
    }

    async deleteClientSecret(providerName: string): Promise<boolean> {
        log.log('deleteClientSecret', this.config.serviceName, providerName)
        return await keytar.deletePassword(this.config.secretServiceName, providerName);
    }

    async activate(providerName: string, activationKey: string) {
        log.log("Received activate-app", providerName);

        const providerSecret = await decryptActivationKey(
            activationKey,
            this.config.buildPassword,
        );

        if (providerSecret.provider !== providerName) {
            log.log(`activation provider mismatch: wanted ${providerName} but key contained ${providerSecret.provider}`);
            return {
                success: false,
                error: "Activation key provider mismatch"
            };
        }

        await this.setClientSecret(providerName, providerSecret.secret);

        return { success: true };
    }
}
