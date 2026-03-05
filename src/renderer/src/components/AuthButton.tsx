import { Show } from 'solid-js'
import { useAuth } from '../contexts/AuthContext'

export default function AuthButton() {
    const auth = useAuth()
    return (

        <Show when={!auth.authorised()} fallback={
            <button aria-label="Log out"
                onClick={auth.logout}
                disabled={auth.loading()}
            >
                <i>logout</i> Log out
            </button>
        }>
            <button aria-label="Log in with GitHub"
                onClick={auth.login}
                disabled={auth.loading()}
            >
                <i>login</i>
                {auth.loading() ? 'Logging in…' : 'Log In with GitHub'}
            </button>
        </Show>


    )
}
