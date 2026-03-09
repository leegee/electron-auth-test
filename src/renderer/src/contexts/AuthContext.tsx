import { createContext, useContext, createSignal, onMount, type JSX, Match, Switch } from 'solid-js';
import { api } from '@renderer/renderer-bridge';

import { type GitHubTokenResponseBad } from '@shared/github-types';
import log from '@shared/logger';
import { showToast } from '../components/Toast';
import { ActivationModal } from '../components/ActivationModal';

type AuthContextType = {
    authorised: () => boolean
    loading: () => boolean
    selectedProvider: () => 'github' | 'google'
    login: (provider: 'github' | 'google') => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>()

export function AuthProvider(props): JSX.Element {
    const [authorised, setAuthorised] = createSignal(false);
    const [loading, setLoading] = createSignal(false);
    const [showActivationModal, setShowActivationModal] = createSignal(false);
    const [selectedProvider, setSelectedProvider] = createSignal<'github' | 'google'>('github');

    api.onOAuthSuccess(() => {
        setAuthorised(true);
        setLoading(false);
        showToast('Login successful!', 'success', 3000);
    });

    api.onOAuthError(async (errorMsg: GitHubTokenResponseBad) => {
        log.log('OAuth error received:', errorMsg);
        setLoading(false);

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
                api.oauthLogin(selectedProvider());
                break;
        }
    });

    api.onRequireActivation(() => {
        setShowActivationModal(true);
    });

    const logout = async () => {
        log.log('logout')
        await api.deletePassword(import.meta.env.VITE_SERVICE_NAME, import.meta.env.VITE_SESSION_TOKEN);
        setAuthorised(false);
    }

    const login = async (provider: 'github' | 'google') => { // TODO keyof typeof OAUTH_PROVIDERS
        setLoading(true);

        try {
            // Check if activation secret exists in Keytar
            const clientSecret = await api.getPassword(import.meta.env.VITE_SERVICE_NAME, import.meta.env.VITE_ACCOUNT_ACTIVATION);
            log.log('got client secret')

            // Already activated so start OAuth flow
            if (clientSecret !== null) {
                if (!provider) throw new Error('No provider')

                setSelectedProvider(provider);
                await api.oauthLogin(provider);
                setLoading(false);
            }

            // Not activated so show activation modal
            else {
                setShowActivationModal(true);
                setLoading(false);
            }
        }

        catch (err) {
            showToast('Login failed: ' + err, 'error');
            setLoading(false);
        }
    };

    onMount(() => {
        // Login on mount
        // login(selectedProvider());
    });

    // Guard children 
    return (
        <AuthContext.Provider value={{ authorised, loading, login, logout, selectedProvider }}>
            <Switch>
                <Match when={showActivationModal()}>
                    <ActivationModal
                        onSuccess={async () => {
                            setShowActivationModal(false);
                            await api.oauthLogin(selectedProvider());
                            setLoading(false);
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
