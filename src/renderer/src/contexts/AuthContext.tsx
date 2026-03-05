import { createContext, useContext, createSignal, onMount, type JSX, Match, Switch } from 'solid-js'
import { api } from '@renderer/bridge'

import { showToast } from '../components/Toast'
import { ActivationModal } from '@renderer/components/ActivationModal'

type AuthContextType = {
    authorised: () => boolean
    loading: () => boolean
    login: () => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>()

export function AuthProvider(props): JSX.Element {
    const [authorised, setAuthorised] = createSignal(false)
    const [loading, setLoading] = createSignal(false)
    const [showActivationModal, setShowActivationModal] = createSignal(false)

    let oauthListenerAttached = false

    const login = async () => {
        setLoading(true);

        try {
            await api.loginGitHub();
        }
        catch (err) {
            showToast('Login failed: ' + err, 'error');
        }
        finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await api.deletePassword(api.config.SERVICE_NAME, api.config.SESSION_TOKEN);
            setAuthorised(false)
            showToast('Logged out', 'success', 1_000)
        } catch (err) {
            showToast('Logout failed: ' + err, 'error', 10_000)
        }
    }

    onMount(async () => {
        if (!oauthListenerAttached) {
            api.onOAuthSuccess(() => {
                setAuthorised(true)
                showToast('Login successful!', 'success', 1_000)
            })

            api.onOAuthError((msg: string) => {
                showToast('Login failed: ' + msg, 'error', 10_000);
            })

            oauthListenerAttached = true
        }

        const config = api.config

        const activation = await api.getPassword(
            config.SERVICE_NAME,
            config.ACCOUNT_ACTIVATION
        )

        if (!activation) {
            setShowActivationModal(true)
            return
        }

        const token = await api.getPassword(
            config.SERVICE_NAME,
            config.SESSION_TOKEN
        )

        if (token) {
            setAuthorised(true)
            showToast('You are logged in', 'info', 1_000)
        } else {
            login()
        }
    })

    return (
        <AuthContext.Provider value={{ authorised, loading, login, logout }}>
            <Switch>
                <Match when={showActivationModal()}>
                    <ActivationModal onSuccess={async () => {
                        setShowActivationModal(false);
                        login();
                    }} />
                </Match>
                <Match when={!showActivationModal()}>
                    {props.children}
                </Match>
            </Switch>
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
