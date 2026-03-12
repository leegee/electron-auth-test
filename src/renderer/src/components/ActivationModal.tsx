import { createSignal } from 'solid-js';
import { showToast } from './Toast';
import { api } from '@renderer/renderer-bridge';

const OAUTH_PROVIDERS = await api.getOauthProviders();

interface ActivationModalProps {
    onSuccess: () => void;
    provider: keyof typeof OAUTH_PROVIDERS;
};

export function ActivationModal(props: ActivationModalProps) {
    const [key, setKey] = createSignal('');
    const [loading, setLoading] = createSignal(false);

    const submit = async () => {
        if (!props.provider) {
            showToast('Provider not set!', 'error', 5_000);
            return;
        }

        setLoading(true);

        if (!props.provider) throw new Error("Provider is undefined");
        const res = await api.activateApp(key(), props.provider);

        setLoading(false);

        if (res.success) {
            showToast('Activation successful!', 'success', 1_000);
            setKey(''); // clear key
            props.onSuccess();
        } else {
            showToast('Activation failed: ' + res.error, 'error', 10_000);
        }
    };

    return (
        <dialog class="modal active">
            <h2>Activation</h2>
            <p>Please enter your {OAUTH_PROVIDERS[props.provider].name} activation key.</p>
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
    );
}
