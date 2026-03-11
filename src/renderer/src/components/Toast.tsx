import { createSignal, For, type JSX } from 'solid-js'
import { Transition } from 'solid-transition-group'
import './Toast.css'

type ToastType = 'success' | 'error' | 'info' | 'warning'

type Toast = {
    id: number
    message: string
    type: ToastType
    confirm?: (result: boolean) => void
}

let showToastFn: (msg: string, type?: ToastType, duration?: number) => void
let confirmToastFn: (msg: string) => Promise<boolean>

export function ToastRoot(): JSX.Element {
    const [toasts, setToasts] = createSignal<Toast[]>([])
    let idCounter = 0

    const removeToast = (id: number) => {
        setToasts(t => t.filter(x => x.id !== id))
    }

    const show = (msg: string, type: ToastType = 'info', duration = 5000) => {
        const id = ++idCounter

        setToasts(t => [...t, { id, message: msg, type }])

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration)
        }
    }

    const confirmToast = (msg: string): Promise<boolean> => {
        return new Promise(resolve => {
            const id = ++idCounter

            const confirm = (result: boolean) => {
                removeToast(id)
                resolve(result)
            }

            setToasts(t => [
                ...t,
                { id, message: msg, type: 'info', confirm }
            ])
        })
    }

    showToastFn = show
    confirmToastFn = confirmToast

    return (
        <div class="toast-component">
            <For each={toasts()}>
                {(toast) => (
                    <Transition
                        enterClass="mysnackbar-enter"
                        enterActiveClass="mysnackbar-enter-active"
                        exitClass="mysnackbar-exit"
                        exitActiveClass="mysnackbar-exit-active"
                    >
                        <div class={`mysnackbar square ${toast.type}`}>
                            <div>{toast.message}</div>

                            {toast.confirm && (
                                <nav class="right-align">
                                    <button onClick={() => toast.confirm!(false)} class="transparent square small"><i>close_small</i></button>
                                    <button onClick={() => toast.confirm!(true)} class="transparent square small"><i>check_circle</i></button>
                                </nav>
                            )}
                        </div>
                    </Transition>
                )}
            </For >
        </div >
    )
}

export function showToast(msg: string, type: ToastType = 'info', duration = 5000) {
    showToastFn?.(msg, type, duration)
}

export function confirmToast(msg: string): Promise<boolean> {
    return confirmToastFn?.(msg) ?? Promise.resolve(false)
}
