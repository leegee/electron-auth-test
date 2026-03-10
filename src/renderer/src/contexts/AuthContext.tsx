import { createContext, useContext, createSignal, onMount, type JSX, Match, Switch } from 'solid-js';
import { api } from '@renderer/renderer-bridge';

import { type OAuthTokenResponseBad } from '@shared/oauth-types';
import log from '@shared/logger';
import { showToast } from '../components/Toast';
import { ActivationModal } from '../components/ActivationModal';
import { OAUTH_PROVIDERS } from '@shared/oauthConfig';

type AuthContextType = {
    authorised: () => boolean;
    loading: () => boolean;
    selectedProvider: () => keyof typeof OAUTH_PROVIDERS;
    login: (provider: keyof typeof OAUTH_PROVIDERS) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>();

export function AuthProvider(props): JSX.Element {
    const [authorised, setAuthorised] = createSignal(false);
    const [loading, setLoading] = createSignal(false);
    const [showActivationModal, setShowActivationModal] = createSignal(false);
    const [selectedProvider, setSelectedProvider] = createSignal<keyof typeof OAUTH_PROVIDERS>(
        Object.keys(OAUTH_PROVIDERS)[0] as keyof typeof OAUTH_PROVIDERS
    );

    api.onOAuthSuccess(() => {
        setAuthorised(true);
        setLoading(false);
        showToast('Login successful!', 'success', 3000);
    });

    api.onOAuthError(async (errorMsg: OAuthTokenResponseBad) => {
        log.log('OAuth error received:', errorMsg);
        setLoading(false);

        switch (errorMsg.error) {
            case 'incorrect_client_credentials':
                await api.deletePassword(import.meta.env.VITE_SERVICE_NAME, import.meta.env.VITE_ACCOUNT_ACTIVATION, selectedProvider());
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
        await api.deletePassword(import.meta.env.VITE_SERVICE_NAME, import.meta.env.VITE_SESSION_TOKEN, selectedProvider());
        setAuthorised(false);
    }

    const login = async (provider: keyof typeof OAUTH_PROVIDERS) => {
        log.log('AuthContext.login  enter with', provider)
        setLoading(true);

        try {
            // Check if activation secret exists in Keytar
            const clientSecret = await api.getPassword(import.meta.env.VITE_SERVICE_NAME, import.meta.env.VITE_ACCOUNT_ACTIVATION, selectedProvider());
            log.log('AuthContext.login got client secret')

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
                        provider={selectedProvider()}
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

export const useAuth = () => useContext(AuthContext)!;
