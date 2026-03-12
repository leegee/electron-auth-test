import { createContext, useContext, createSignal, type JSX, onMount } from 'solid-js';
import { api } from '@renderer/renderer-bridge';
import { showToast } from '../components/Toast';
import { ActivationModal } from '../components/ActivationModal';
import log from '../lib/logger';

export type Provider = {
    name: string;
    icon?: string;
};

export type AuthContextType = {
    authorised: () => boolean;
    loading: () => boolean;
    selectedProvider: () => string | null;
    login: (provider: string) => Promise<void>;
    logout: () => Promise<void>;
    getProviders: () => Record<string, Provider>; // <-- accessor for renderer
};

const AuthContext = createContext<AuthContextType>();

interface AuthProviderProps {
    children: JSX.Element;
}

export function AuthProvider(props: AuthProviderProps): JSX.Element {
    const [authorised, setAuthorised] = createSignal(false);
    const [loading, setLoading] = createSignal(false);
    const [activationRequired, setActivationRequired] = createSignal(false);
    const [providers, setProviders] = createSignal<Record<string, Provider>>({});
    const [selectedProvider, setSelectedProvider] = createSignal<string | null>(null);

    onMount(async () => {
        try {
            const loadedProviders = await api.getOauthProviders();
            setProviders(loadedProviders);
            setSelectedProvider(Object.keys(loadedProviders)[0] ?? null);
        } catch (err) {
            log.error('Failed to load OAuth providers', err);
        }
    });

    const login = async (provider: string) => {
        setLoading(true);
        setSelectedProvider(provider);

        try {
            const token = await api.getToken(provider);
            if (token) {
                setAuthorised(true);
                showToast('Auto-login via cached token', 'success', 3000);
                return;
            }

            const loginRv = await api.oauthLogin(provider);
            log.log('AuthContext.login rv from api.oauthLogin for', provider, loginRv)
            if (loginRv?.error === 'incorrect_client_credentials' || loginRv.activationRequired) {
                setActivationRequired(true);
                setAuthorised(false);
                showToast('Activation required for this account', 'warning', 4000);
            } else if (loginRv?.error) {
                setAuthorised(false);
                showToast(`Login failed: ${loginRv.error}`, 'error', 5000);
            } else {
                setAuthorised(true);
                showToast('Login successful!', 'success', 3000);
            }
        } catch (err) {
            setAuthorised(false);
            showToast(`Login error: ${(err as Error).message}`, 'error', 5000);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        const provider = selectedProvider();
        if (!provider) return;

        setLoading(true);
        try {
            await api.logout(provider);
            setAuthorised(false);
            showToast('Logged out', 'success', 3000);
        } catch (err) {
            showToast(`Logout error: ${(err as Error).message}`, 'error', 5000);
        } finally {
            setLoading(false);
        }
    };

    // Expose providers as a read-only accessor
    const getProviders = () => providers();

    return (
        <AuthContext.Provider
            value={{ authorised, loading, selectedProvider, login, logout, getProviders }}
        >
            {activationRequired() && selectedProvider() ? (
                <ActivationModal
                    provider={selectedProvider()!} // guaranteed defined here
                    onSuccess={async () => {
                        setActivationRequired(false);
                        await login(selectedProvider()!);
                    }}
                />
            ) : (
                props.children
            )}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext)!;
