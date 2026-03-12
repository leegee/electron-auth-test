
export default function NotLoggedIn() {
    return <>
        <h2>Please sign in</h2>
        <div class="grid">
            <div class="s6">
                <ul class="left-align">
                    <li>
                        <code>electron-vite</code> with Typescript
                    </li>
                    <li>
                        Modularised OAuth2.0 flow
                    </li>
                    <li>
                        Local token storage with <code>keytar</code>
                    </li>
                    <li>
                        Restricted navigation.
                    </li>
                </ul>
            </div>
            <div class="s6">
                <ul class="left-align">
                    <li>
                        Configurable OAUth2.0 providers via Typescript and environment variables.
                    </li>
                    <li>
                        Stores nothing on the machine that is not encrypted.
                    </li>
                </ul>
            </div>
        </div >
    </>
}