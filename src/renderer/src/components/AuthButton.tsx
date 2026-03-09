import { createSignal, For, Show, onCleanup, onMount, createEffect } from 'solid-js'
import { useAuth } from '../contexts/AuthContext'
import { OAUTH_PROVIDERS } from '@shared/oauthConfig'

const PROVIDER_KEYS = Object.keys(OAUTH_PROVIDERS) as (keyof typeof OAUTH_PROVIDERS)[]

export default function AuthButton() {
    const auth = useAuth()!;
    const [fabOpen, setFabOpen] = createSignal(false)

    let container!: HTMLDivElement

    function toggleFab() {
        setFabOpen(!fabOpen())
    }

    function closeFab() {
        setFabOpen(false)
    }

    function handleClickOutside(e: MouseEvent) {
        if (!container.contains(e.target as Node)) {
            closeFab()
        }
    }

    onMount(() => document.addEventListener('click', handleClickOutside));

    onCleanup(() => document.removeEventListener('click', handleClickOutside));

    createEffect(() => {
        if (auth.authorised()) setFabOpen(false)
    });

    return (
        <Show
            when={!auth.authorised()}
            fallback={
                <button
                    aria-label="Log out"
                    class="extend circle fill"
                    onClick={auth.logout}
                    disabled={auth.loading()}
                >
                    <img
                        src={OAUTH_PROVIDERS[auth.selectedProvider()].icon}
                        alt={`${OAUTH_PROVIDERS[auth.selectedProvider()].name} logo`}
                    />
                    <span>
                        Sign out of {OAUTH_PROVIDERS[auth.selectedProvider()].name}
                    </span>
                </button>
            }
        >
            <div ref={container} style="position:relative">

                {/* FAB button */}
                <button
                    aria-label="Sign in options"
                    class="circle extend"
                    onClick={toggleFab}
                    disabled={auth.loading()}
                >
                    <i>login</i>
                    <span>
                        {auth.loading() ? 'Signing in ...' : 'Sign In'}
                    </span>
                </button>

                {/* FAB menu */}
                <Show when={fabOpen()}>
                    <menu class="no-wrap small-space left active fab-menu">

                        <For each={PROVIDER_KEYS}>
                            {(provider) => {
                                const p = OAUTH_PROVIDERS[provider]

                                return (
                                    <li>
                                        <button
                                            class="fill"
                                            aria-label={`Sign in with ${p.name}`}
                                            onClick={() => {
                                                closeFab()
                                                auth.login(provider)
                                            }}
                                        >
                                            <img src={p.icon} width="24" height="24" alt={`${p.name} logo`} />
                                            <span>Sign in with {p.name}</span>
                                        </button>
                                    </li>
                                )
                            }}
                        </For>

                    </menu>
                </Show>

            </div>
        </Show>
    )
}