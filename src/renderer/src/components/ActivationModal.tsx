import { createSignal, onMount } from 'solid-js';

import { showToast } from './Toast';
import { api } from '@renderer/renderer-bridge';
import { OAUTH_PROVIDERS } from '@shared/oauthConfig';

type ActivationModalProps = {
    onSuccess: () => void;
    provider: keyof typeof OAUTH_PROVIDERS;
};

export function ActivationModal(props: ActivationModalProps) {
    const [key, setKey] = createSignal('');
    const [loading, setLoading] = createSignal(false);
    const [active, setActive] = createSignal(true);

    const submit = async () => {
        if (!props.provider) {
            showToast('Provider not set!', 'error', 5_000);
            return;
        }

        setLoading(true);
        const res = await api.activateApp(key(), props.provider);
        setLoading(false);
        if (res.success) {
            showToast('Activation successful!', 'success', 1_000);
            props.onSuccess();
        } else {
            showToast('Activation failed: ' + res.error, 'error', 10_000);
        }
    };

    onMount(() => {
        setActive(true)
    })

    return (
        <>
            <dialog class={`modal ${active() ? 'active' : ''}`}>
                <h2>Activation</h2>
                <p>Please enter your 'activation key'.</p>
                <p>You will only have to do this once.</p>
                <div class="field top-padding bottom-padding extra-padding">
                    <input
                        type="text"
                        value={key()}
                        onInput={(e) => setKey(e.currentTarget.value)}
                        placeholder="Activation Key"
                    />
                </div>
                <nav class="right-align top-padding">
                    <button onClick={submit} disabled={loading()}>
                        {loading() ? 'Activating...' : 'Activate'}
                    </button>
                </nav>
            </dialog>
        </>
    );
}