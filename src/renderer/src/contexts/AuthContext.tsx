import { createContext, useContext, createSignal, onMount, type JSX, Match, Switch } from 'solid-js';
import { api } from '@renderer/renderer-bridge';
import { showToast } from '../components/Toast';
import { ActivationModal } from '../components/ActivationModal';

const AuthContext = createContext<any>();

export function AuthProvider(props): JSX.Element {
    const [authorised, setAuthorised] = createSignal(false);
    const [loading, setLoading] = createSignal(false);
    const [showActivationModal, setShowActivationModal] = createSignal(false);

    let oauthListenerAttached = false;

    const login = async () => {
        setLoading(true);
        try {
            // Check if activation secret exists in Keytar
            const clientSecret = await api.getPassword(api.config.VITE_SERVICE_NAME, api.config.VITE_ACCOUNT_ACTIVATION);

            if (clientSecret !== null) {
                // Already activated so start GitHub OAuth
                await api.loginGitHub();
            } else {
                // Not activated so show activation modal
                setShowActivationModal(true);
            }
        } catch (err) {
            showToast('Login failed: ' + err, 'error');
        } finally {
            setLoading(false);
        }
    };

    onMount(() => {
        if (!oauthListenerAttached) {
            api.onOAuthSuccess(() => {
                setAuthorised(true);
                showToast('Login successful!', 'success', 3000);
            });

            api.onOAuthError((msg: string) => {
                showToast('Login failed: ' + msg, 'error', 5000);
            });

            api.onRequireActivation(() => {
                setShowActivationModal(true);
            });

            oauthListenerAttached = true;
        }

        // attempt login on mount
        login();
    });

    return (
        <AuthContext.Provider value={{ authorised, loading, login }}>
            <Switch>
                <Match when={showActivationModal()}>
                    <ActivationModal
                        onSuccess={async () => {
                            setShowActivationModal(false);
                            await api.loginGitHub();
                        }}
                    />
                </Match>
                <Match when={!showActivationModal()}>
                    {props.children}
                </Match>
            </Switch>
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
