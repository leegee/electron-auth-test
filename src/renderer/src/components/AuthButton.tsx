import { createSignal, For, Show } from 'solid-js'
import { useAuth } from '../contexts/AuthContext'
import { OAUTH_PROVIDERS } from '@shared/oauthConfig';

const PROVIDER_KEYS = Object.keys(OAUTH_PROVIDERS);

export default function AuthButton() {
    const auth = useAuth();
    const [fabOpen, setFabOpen] = createSignal(false);

    return (
        <Show when={!auth.authorised()} fallback={
            <button aria-label="Log out"
                class="extend circle fill"
                onClick={auth.logout}
                disabled={auth.loading()}
            >
                <img src={OAUTH_PROVIDERS[auth.selectedProvider()].icon} width={24} height={24} alt={OAUTH_PROVIDERS[auth.selectedProvider()].name + ' logo'} />
                <span>
                    Log out of
                    {' '}
                    {OAUTH_PROVIDERS[auth.selectedProvider()].name}
                </span>
            </button>
        }>
            <div>
                <button aria-label="Log in"
                    class="circle extend"
                    onClick={(e) => {
                        e.preventDefault()
                        setFabOpen(!fabOpen())
                    }}
                    disabled={auth.loading()}
                >
                    <i>login</i>
                    <span>
                        {auth.loading() ? 'Logging in ...' : 'Log In'}
                    </span>
                </button>

                <menu class={`group no-wrap small-space left ${fabOpen() ? 'active' : ''}`}>
                    <For each={PROVIDER_KEYS}>
                        {(provider: string) => (
                            <li>
                                <button
                                    class="fill"
                                    onClick={() => {
                                        setFabOpen(false);
                                        auth.login(OAUTH_PROVIDERS[provider].name);
                                    }}
                                >
                                    <img src={OAUTH_PROVIDERS[provider].icon} width={24} height={24} alt={`${OAUTH_PROVIDERS[provider].name} logo`} />
                                    <span>{OAUTH_PROVIDERS[provider].name}</span>
                                </button>
                            </li>
                        )}
                    </For>
                </menu>
            </div>
        </Show>
    )
}
