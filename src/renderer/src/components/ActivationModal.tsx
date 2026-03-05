import { createSignal, onMount } from 'solid-js';

import { showToast } from './Toast';
import { api } from '@renderer/bridge';

export function ActivationModal(props: { onSuccess: () => void }) {
    const [key, setKey] = createSignal('');
    const [loading, setLoading] = createSignal(false);
    const [active, setActive] = createSignal(true);

    const submit = async () => {
        setLoading(true);
        const res = await api.activateApp(key());
        console.debug(res);
        setLoading(false);
        setActive(false)
        if (res.success) {
            showToast('Activation successful!', 'success');
            props.onSuccess();
        } else {
            showToast('Activation failed: ' + res.error, 'error');
        }
    };

    onMount(() => {
        setActive(true)
        showToast('Try', 'success')
    })

    return (
        <>
            <dialog class={`modal ${active() ? 'active' : ''}`}>
                <h2>Enter Activation Key</h2>
                <div class="field">
                    <input
                        type="text"
                        value={key()}
                        onInput={(e) => setKey(e.currentTarget.value)}
                        placeholder="Activation Key"
                    />
                </div>
                <nav class="right-align no-space">
                    <button onClick={submit} disabled={loading()}>
                        {loading() ? 'Activating...' : 'Activate'}
                    </button>
                </nav>
            </dialog>
        </>
    );
}