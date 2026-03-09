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
                onClick={() => auth.login('github')}
                disabled={auth.loading()}
            >
                <img src="/assets/GitHub_Invertocat_Black.svg" width={24} height={24} alt="GitHub Logo" />
                <span>
                    {auth.loading() ? 'Logging in ...' : 'Log In'}
                </span>
                <span class="tooltip left">Log in with your GitHub account</span>
            </button>
        </Show>


    )
}
