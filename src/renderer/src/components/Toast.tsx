import { createSignal, Show, type JSX } from 'solid-js'

import './Toast.css'

type ToastType = 'success' | 'error' | 'info'

let showToastFn: (msg: string, type?: ToastType, duration?: number) => void

export function ToastRoot(): JSX.Element {
    const [message, setMessage] = createSignal('')
    const [type, setType] = createSignal<ToastType>('info')

    const show = (msg: string, t: ToastType = 'info', duration = 5000) => {
        setMessage(msg)
        setType(t)
        setTimeout(() => setMessage(''), duration)
    }

    showToastFn = show

    return (
        <Show when={message()}>
            <div class={`snackbar ${type()}`}>
                {message()}
            </div>
        </Show>
    )
}

export function showToast(msg: string, type: ToastType = 'info', duration?: number) {
    if (showToastFn) showToastFn(msg, type, duration)
    else console.warn('Toast not mounted yet')
}
