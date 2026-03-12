export default function NotLoggedIn() {
    return <>
        <h2>Please sign in</h2>
        <div class="grid">
            <div class="s6">
                <ul class="left-align">
                    <li><code>Electron-Vite</code> with TypeScript</li>
                    <li>Modularized OAuth 2.0 PKCE flow fully compliant with RFC 8252</li>
                    <li>Local token storage using <code>keytar</code> encrypts all sensitive data</li>
                    <li>RFC 8252-complain system-browser authentication only</li>
                    <li>Automatic session management with token refresh and activation flow.</li>
                </ul>
            </div>
            <div class="s6">
                <ul class="left-align">
                    <li>Restricted navigation to prevent accidental or malicious URL changes.</li>
                    <li>Configurable OAuth 2.0 providers via TypeScript and environment variables.</li>
                    <li>Easily extendable to add new providers or customize user experience.</li>
                    <li>Cross-platform support for Windows, macOS, and Linux.</li>
                </ul>
            </div>
        </div>
    </>
}