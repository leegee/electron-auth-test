import { useAuth } from '../contexts/AuthContext'

export default function AuthPanel() {
    const auth = useAuth()
    return (
        <button
            onClick={auth.login}
            disabled={auth.loading()}
            aria-label="Log in with GitHub"
        >
            <i>login</i>
            {auth.loading() ? 'Logging in…' : 'Log In with GitHub'}
        </button>
    )
}
