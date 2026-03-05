import { createContext, useContext, createSignal, onMount, type JSX, Match, Switch } from 'solid-js'
import { api } from '@renderer/bridge'

import { showToast } from '../components/Toast'
import { ActivationModal } from '@renderer/components/ActivationModal'

const AuthContext = createContext<any>()

export function AuthProvider(props): JSX.Element {
    const [authorised, setAuthorised] = createSignal(false)
    const [loading, setLoading] = createSignal(false)
    const [showActivationModal, setShowActivationModal] = createSignal(false)

    let oauthListenerAttached = false

    const login = async () => {
        setLoading(true);
        try {
            const config = api.config;
            const clientSecret = await api.getPassword(config.SERVICE_NAME, config.ACCOUNT_NAME);
            if (!clientSecret) {
                setShowActivationModal(true);
                return;
            }

            await api.loginGitHub();
        } catch (err) {
            showToast('Login failed: ' + err, 'error');
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await api.deletePassword('MyApp', 'user@example.com')
            setAuthorised(false)
            showToast('Logged out', 'success')
        } catch (err) {
            showToast('Logout failed: ' + err, 'error')
        }
    }

    onMount(async () => {
        if (!oauthListenerAttached) {
            api.onOAuthSuccess(() => {
                setAuthorised(true)
                showToast('Login successful!', 'success', 3000)
            })
            api.onOAuthError((msg: string) => {
                showToast('Login failed: ' + msg, 'error', 5000);
            });
            oauthListenerAttached = true
        }

        login();

        const token = await api.getPassword('MyApp', 'user@example.com')
        if (token) {
            setAuthorised(true)
            showToast('Already logged in', 'info', 3000)
        }
    })

    return (
        <AuthContext.Provider value={{ authorised, loading, login, logout }}>
            <Switch>
                <Match when={showActivationModal()}>
                    <ActivationModal onSuccess={async () => {
                        setShowActivationModal(false);
                        await api.loginGitHub();
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
