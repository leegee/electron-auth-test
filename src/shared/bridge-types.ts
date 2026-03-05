export interface RendererConfig {
    CUSTOM_URL_PROTOCOL: string
    SERVICE_NAME: string
    SESSION_TOKEN: string
    ACCOUNT_ACTIVATION: string;
}

export interface ApiBridge {
    config: RendererConfig
    activateApp: (activationKey: string) => Promise<{ success: boolean; error?: string }>
    onRequireActivation: (cb: () => void) => Electron.IpcRenderer
    deletePassword: (service: string, account: string) => void
    getPassword: (service: string, account: string) => Promise<string | null>
    loginGitHub: () => void
    onOAuthSuccess: (callback: () => void) => void
    onOAuthError: (callback: (string) => void) => void
}
