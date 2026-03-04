// src/contexts/AuthContext.ts
import { createContext, useContext, createSignal, onMount } from 'solid-js'
import { api } from '@renderer/bridge'

import { showToast } from '../components/Toast'

const AuthContext = createContext<any>()

export function AuthProvider(props) {
    const [authorised, setAuthorised] = createSignal(false)
    const [loading, setLoading] = createSignal(false)

    let oauthListenerAttached = false

    const login = () => {
        setLoading(true)
        try {
            api.loginGitHub()
        } catch (err) {
            showToast('Login failed: ' + err, 'error')
        } finally {
            setLoading(false)
        }
    }

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
        const token = await api.getPassword('MyApp', 'user@example.com')
        if (token) {
            setAuthorised(true)
            showToast('Already logged in', 'info', 3000)
        }

        if (!oauthListenerAttached) {
            api.onOAuthSuccess(() => {
                setAuthorised(true)
                showToast('Login successful!', 'success', 3000)
            })
            oauthListenerAttached = true
        }
    })

    return (
        <AuthContext.Provider value={{ authorised, loading, login, logout }}>
            {props.children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
