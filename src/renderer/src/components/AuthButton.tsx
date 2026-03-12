import { createSignal, For, Show, onCleanup, onMount, createEffect } from 'solid-js';
import { useAuth } from '../contexts/AuthContext';

export default function AuthButton() {
    const auth = useAuth()!;
    const [fabOpen, setFabOpen] = createSignal(false);

    let container!: HTMLDivElement;

    // Toggle FAB menu
    const toggleFab = () => setFabOpen(!fabOpen());
    const closeFab = () => setFabOpen(false);

    // Close FAB if click is outside
    const handleClickOutside = (e: MouseEvent) => {
        if (!container.contains(e.target as Node)) closeFab();
    };

    onMount(() => document.addEventListener('click', handleClickOutside));
    onCleanup(() => document.removeEventListener('click', handleClickOutside));

    // Auto-close FAB when logged in
    createEffect(() => {
        if (auth.authorised()) setFabOpen(false);
    });

    // Compute provider keys dynamically
    const providerKeys = () => Object.keys(auth.getProviders());

    return (
        <Show
            when={!auth.authorised()}
            fallback={
                <Show when={auth.selectedProvider() && providerKeys().length > 0}>
                    <>
                        {() => {
                            const key = auth.selectedProvider()!;
                            const provider = auth.getProviders()[key];
                            if (!provider) return null;

                            return (
                                <button
                                    aria-label="Log out"
                                    class="extend circle fill"
                                    onClick={auth.logout}
                                    disabled={auth.loading()}
                                >
                                    <img class="responsive" src={auth.getUserInfo()?.avatarUrl || provider.icon} alt={`${provider.name} logo`} />
                                    <span>
                                        Sign out of {provider.name}
                                    </span>
                                    <img class={"small" + auth.getUserInfo()?.avatarUrl ? '  hidden' : ''}
                                        src={provider.icon} alt={`${provider.name} logo`}
                                    />
                                </button>
                            );
                        }}
                    </>
                </Show>
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
                    <span>{auth.loading() ? 'Signing in ...' : 'Sign In'}</span>
                </button>

                {/* FAB menu */}
                <Show when={fabOpen()}>
                    <menu class="no-wrap right active ">
                        <For each={providerKeys()}>
                            {(key) => {
                                const provider = auth.getProviders()[key];
                                if (!provider) return null;

                                return (
                                    <li>
                                        <button
                                            class="fill"
                                            aria-label={`Sign in with ${provider.name}`}
                                            onClick={() => {
                                                closeFab();
                                                auth.login(key);
                                            }}
                                        >
                                            <img
                                                src={provider.icon}
                                                width="24"
                                                height="24"
                                                alt={`${provider.name} logo`}
                                            />
                                            <span>Sign in with {provider.name}</span>
                                        </button>
                                    </li>
                                );
                            }}
                        </For>
                    </menu>
                </Show>
            </div>
        </Show>
    );
}
