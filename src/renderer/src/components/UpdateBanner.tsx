import { createSignal, onMount, onCleanup } from 'solid-js';

export default function UpdateBanner() {
    const [version, setVersion] = createSignal<string>();

    onMount(() => {
        const cleanup = window.api.onUpdateAvailable((version) => {
            setVersion(version);
        });
        onCleanup(cleanup);
    });

    return (
        <>
            {version() && (
                <div class="snackbbar">
                    Update available: {version()}
                </div>
            )}
        </>
    );
}
