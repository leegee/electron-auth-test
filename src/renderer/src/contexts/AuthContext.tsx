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
    const [selectedProviderName, setSelectedProviderName] = createSignal<string | null>(null);

    onMount(async () => {
        try {
            const loadedProviders = await api.getOauthProviders();
            setProviders(loadedProviders);
            setSelectedProviderName(Object.keys(loadedProviders)[0] ?? null);
        } catch (err) {
            log.error('Failed to load OAuth providers', err);
        }
    });

    const login = async (providerName: string) => {
        setLoading(true);
        setSelectedProviderName(providerName);

        try {
            const token = await api.getToken(providerName);
            if (token) {
                setAuthorised(true);
                showToast(`You have been signed into ${providerName}`, 'success', 3000);
                return;
            }

            const loginRv = await api.oauthLogin(providerName);
            log.log('AuthContext.login rv from api.oauthLogin for', providerName, loginRv)
            if (loginRv?.error === 'incorrect_client_credentials' || loginRv.activationRequired) {
                setActivationRequired(true);
                setAuthorised(false);
            } else if (loginRv?.error) {
                setAuthorised(false);
                showToast(`Failed to sign in to ${providerName}: ${loginRv.error}`, 'error', 5000);
            } else {
                setAuthorised(true);
                showToast(`Signed in to ${providerName}`, 'success', 3000);
            }
        } catch (err) {
            setAuthorised(false);
            showToast(`Error signing in to ${providerName}: ${(err as Error).message}`, 'error', 5000);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        const providerName = selectedProviderName();
        if (!providerName) return;

        setLoading(true);
        try {
            await api.logout(providerName);
            setAuthorised(false);
            showToast(`You have been signed out of ${providerName}`, 'success', 3000);
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
            value={{ authorised, loading, selectedProvider: selectedProviderName, login, logout, getProviders }}
        >
            {activationRequired() && selectedProviderName() ? (
                <ActivationModal
                    provider={selectedProviderName()!} // guaranteed defined here
                    onSuccess={async () => {
                        setActivationRequired(false);
                        await login(selectedProviderName()!);
                    }}
                />
            ) : (
                props.children
            )}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext)!;
