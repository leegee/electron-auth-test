import { createContext, useContext, createSignal, onMount, type JSX, Match, Switch } from 'solid-js';
import { api } from '@renderer/renderer-bridge';

import { type GitHubTokenResponseBad } from '@shared/github-types';
import log from '@shared/logger';
import { showToast } from '../components/Toast';
import { ActivationModal } from '../components/ActivationModal';

const AuthContext = createContext<any>();

export function AuthProvider(props): JSX.Element {
    const [authorised, setAuthorised] = createSignal(false);
    const [loading, setLoading] = createSignal(false);
    const [showActivationModal, setShowActivationModal] = createSignal(false);

    let oauthListenerAttached = false;

    const logout = async () => {
        log.log('logout')
        await api.deletePassword(import.meta.env.VITE_SERVICE_NAME, import.meta.env.VITE_SESSION_TOKEN);
        setAuthorised(false);
    }

    const login = async () => {
        setLoading(true);
        try {
            // Check if activation secret exists in Keytar
            const clientSecret = await api.getPassword(import.meta.env.VITE_SERVICE_NAME, import.meta.env.VITE_ACCOUNT_ACTIVATION);
            log.log('got client secret')

            if (clientSecret !== null) {
                // Already activated so start GitHub OAuth
                await api.oauthLogin();
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

            api.onOAuthError(async (errorMsg: GitHubTokenResponseBad) => {
                log.log('OAuth error received:', errorMsg);

                switch (errorMsg.error) {
                    case 'incorrect_client_credentials':
                        await api.deletePassword(import.meta.env.VITE_SERVICE_NAME, import.meta.env.VITE_ACCOUNT_ACTIVATION);
                        setShowActivationModal(true);
                        break;

                    case 'access_denied':
                        showToast('Login failed: ' + errorMsg.error_description, 'error', 5000);
                        break;

                    default:
                        showToast('Login failed: ' + errorMsg.error_description, 'error', 5000);
                        api.oauthLogin();
                        break;
                }
            });

            api.onRequireActivation(() => {
                setShowActivationModal(true);
            });

            oauthListenerAttached = true;
        }

        // Login on mount
        login();
    });

    // Guard children 
    return (
        <AuthContext.Provider value={{ authorised, loading, login, logout }}>
            <Switch>
                <Match when={showActivationModal()}>
                    <ActivationModal
                        onSuccess={async () => {
                            setShowActivationModal(false);
                            await api.oauthLogin();
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
