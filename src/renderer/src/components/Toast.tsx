import { createSignal, Show, type JSX } from 'solid-js'

import './Toast.css'

type ToastType = 'success' | 'error' | 'info'

let showToastFn: (msg: string, type?: ToastType, duration?: number) => void

let cancelToastFn: () => void;

export function ToastRoot(): JSX.Element {
    const [message, setMessage] = createSignal('')
    const [type, setType] = createSignal<ToastType>('info')

    const show = (msg: string, t: ToastType = 'info', duration = 5_000) => {
        setMessage(msg)
        setType(t)
        setTimeout(() => setMessage(''), duration)
    }

    const cancel = () => {
        setMessage('')
    }

    showToastFn = show
    cancelToastFn = cancel

    return (
        <Show when={message()}>
            <div class={`snackbar active ${type()}`}>
                {message()}
            </div>
        </Show>
    )
}

export function showToast(msg: string, type: ToastType = 'info', duration = 5_000) {
    if (showToastFn) showToastFn(msg, type, duration)
    else console.warn('Toast not mounted yet')
}

export function cancelToast() {
    if (cancelToastFn) cancelToastFn()
}
