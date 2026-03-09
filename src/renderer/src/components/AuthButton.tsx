import { createSignal, For, Show } from 'solid-js'
import { useAuth } from '../contexts/AuthContext'

const provider2icon = {
    github: {
        name: 'GitHub',
        icon: '/assets/GitHub_Invertocat_Black.svg'
    },
    google: {
        name: 'GitHub',
        icon: '/assets/GitHub_Invertocat_Black.svg',
    },
}

export default function AuthButton() {
    const auth = useAuth();
    const [fabOpen, setFabOpen] = createSignal(false);

    const providers = Object.keys(provider2icon); // ['github', 'google']

    return (

        <Show when={!auth.authorised()} fallback={
            <button aria-label="Log out"
                class="extend square round fill"
                onClick={auth.logout}
                disabled={auth.loading()}
            >
                <img src={provider2icon[auth.selectedProvider()].icon} width={24} height={24} alt="GitHub Logo" />
                <span>
                    Log out of
                    {' '}
                    {provider2icon[auth.selectedProvider()].name}
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
                    <For each={providers}>
                        {(provider: string) => (
                            <li>
                                <button
                                    class="fill"
                                    onClick={() => {
                                        setFabOpen(false);
                                        auth.login(provider2icon[provider].name);
                                    }}
                                >
                                    <img src={provider2icon[provider].icon} width={24} height={24} alt={`${provider2icon[provider].name} logo`} />
                                    <span>{provider2icon[provider].name}</span>
                                </button>
                            </li>
                        )}
                    </For>
                </menu>
            </div>
        </Show>
    )
}
