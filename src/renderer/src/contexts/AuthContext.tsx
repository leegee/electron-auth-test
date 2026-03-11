// src/renderer/contexts/AuthContext.tsx
import { createContext, useContext, createSignal, type JSX } from 'solid-js';
import { api } from '@renderer/renderer-bridge';
import { showToast } from '../components/Toast';
import { ActivationModal } from '../components/ActivationModal';
import { OAUTH_PROVIDERS } from '@shared/oauthConfig';
import log from '../lib/logger';

export type AuthContextType = {
    authorised: () => boolean;
    loading: () => boolean;
    selectedProvider: () => keyof typeof OAUTH_PROVIDERS;
    login: (provider: keyof typeof OAUTH_PROVIDERS) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>();

interface AuthProviderProps {
    children: JSX.Element;
}

export function AuthProvider(props: AuthProviderProps): JSX.Element {
    const [authorised, setAuthorised] = createSignal(false);
    const [loading, setLoading] = createSignal(false);
    const [activationRequired, setActivationRequired] = createSignal(false);
    const [selectedProvider, setSelectedProvider] = createSignal<keyof typeof OAUTH_PROVIDERS>(
        Object.keys(OAUTH_PROVIDERS)[0] as keyof typeof OAUTH_PROVIDERS
    );

    const login = async (provider: keyof typeof OAUTH_PROVIDERS) => {
        setLoading(true);
        setSelectedProvider(provider);

        try {
            // Attempt auto-login with cached token
            const token = await api.getToken(provider);
            if (token) {
                log.log('AuthContext has token', token);
                setAuthorised(true);
                showToast('Auto-login via cached token', 'success', 3000);
                return;
            }

            log.log('AuthContext has no token');

            // Trigger OAuth flow
            const result = await api.oauthLogin(provider);
            log.log('AuthContext oauthLogin rv', result);

            if (result?.error === 'incorrect_client_credentials' || result.activationRequired) {
                // Activation required before login
                log.log('AuthContext requires activation');
                setActivationRequired(true);
                setAuthorised(false);
                showToast('Activation required for this account', 'warning', 4000);
            } else if (result?.error) {
                // Other login errors
                log.warn('AuthContext api.oauthLogin errored', result);
                setAuthorised(false);
                showToast(`Login failed: ${result.error}`, 'error', 5000);
            } else {
                // Successful login
                log.log('AuthContext api.oauthLogin logged in');
                setAuthorised(true);
                showToast('Login successful!', 'success', 3000);
            }
        } catch (err) {
            log.log('AuthContext errored', err);
            setAuthorised(false);
            showToast(`Login error: ${(err as Error).message}`, 'error', 5000);
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
        } catch (err) {
            showToast(`Logout error: ${(err as Error).message}`, 'error', 5000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ authorised, loading, login, logout, selectedProvider }}>
            {activationRequired() ? (
                <ActivationModal
                    provider={selectedProvider()}
                    onSuccess={async () => {
                        setActivationRequired(false);
                        await login(selectedProvider());
                    }}
                />
            ) : (
                props.children
            )}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext)!;
