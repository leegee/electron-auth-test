export interface RendererConfig {
    CUSTOM_URL_PROTOCOL: string
    SERVICE_NAME: string
    ACCOUNT_NAME: string
}

export interface ApiBridge {
    config: RendererConfig
    activateApp: (activationKey: string) => Promise<{ success: boolean; error?: string }>
    deletePassword: (service: string, account: string) => void
    getPassword: (service: string, account: string) => Promise<string | null>
    loginGitHub: () => void
    onOAuthSuccess: (callback: () => void) => void
}
