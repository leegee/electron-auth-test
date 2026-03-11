import { createContext, useContext, createSignal, onMount, type JSX, Match, Switch } from 'solid-js';
import { api } from '@renderer/renderer-bridge';
import log from '@renderer/lib/logger';
import { showToast } from '../components/Toast';
import { ActivationModal } from '../components/ActivationModal';
import { OAUTH_PROVIDERS } from '@shared/oauthConfig';

type AuthContextType = {
    authorised: () => boolean;
    loading: () => boolean;
    selectedProvider: () => keyof typeof OAUTH_PROVIDERS;
    login: (provider: keyof typeof OAUTH_PROVIDERS) => Promise<void>;
    logout: () => Promise<void>;
    getToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType>();

export function AuthProvider(props): JSX.Element {
    const [authorised, setAuthorised] = createSignal(false);
    const [loading, setLoading] = createSignal(false);
    const [showActivationModal, setShowActivationModal] = createSignal(false);
    const [selectedProvider, setSelectedProvider] = createSignal<keyof typeof OAUTH_PROVIDERS>(
        Object.keys(OAUTH_PROVIDERS)[0] as keyof typeof OAUTH_PROVIDERS
    );

    const login = async (provider: keyof typeof OAUTH_PROVIDERS) => {
        setLoading(true);
        setSelectedProvider(provider);

        try {
            const cachedToken = await api.getToken(provider); // string | null
            if (cachedToken) {
                setAuthorised(true);
                log.log('Using cached token:', cachedToken);
                showToast('Auto-login via cached token', 'success', 3000);
                return;
            } else {
                setAuthorised(false)
                log.log('No valid cached token, showing login screen')
            }

            log.log('No cached token, triggering OAuth login for', provider);
            const token = await api.oauthLogin(provider); // StoredToken

            if (token?.access_token) {
                setAuthorised(true);
                showToast('Login successful!', 'success', 3000);
                log.log('Logged in, token:', token.access_token);
            } else {
                setAuthorised(false);
                showToast('Login failed', 'error', 5000);
            }

        } catch (err) {
            setAuthorised(false);
            showToast('Login error: ' + err, 'error', 5000);
            log.error('Login exception:', err);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await api.logout(selectedProvider());
            setAuthorised(false);
            showToast('Logged out', 'success', 3000);
            log.log('Logged out');
        } catch (err) {
            showToast('Logout error: ' + err, 'error', 5000);
            log.error('Logout exception:', err);
        } finally {
            setLoading(false);
        }
    };

    const getToken = async (): Promise<string | null> => {
        try {
            const token = await api.getToken(selectedProvider());
            if (token) {
                log.log('Current token:', token);
                return token;
            } else {
                log.log('No token available for provider', selectedProvider());
                return null;
            }
        } catch (err) {
            log.error('GetToken exception:', err);
            return null;
        }
    };

    onMount(async () => {
        const token = await getToken();
        if (token) {
            setAuthorised(true);
            log.log('Silent login via cached token:', token);
        } else {
            log.log('No cached token, user must login manually');
        }
    });

    return (
        <AuthContext.Provider value={{ authorised, loading, login, logout, getToken, selectedProvider }}>
            <Switch>
                <Match when={showActivationModal()}>
                    <ActivationModal
                        provider={selectedProvider()}
                        onSuccess={async () => {
                            setShowActivationModal(false);
                            await login(selectedProvider());
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
