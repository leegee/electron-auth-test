export interface RendererConfig {
    CUSTOM_URL_PROTOCOL: string
}

export interface ApiBridge {
    loginGitHub: () => void

    onOAuthSuccess: (callback: () => void) => void

    deletePassword: (
        service: string,
        account: string,
    ) => void

    getPassword: (
        service: string,
        account: string
    ) => Promise<string | null>

    // setPassword: (
    //     service: string,
    //     account: string,
    //     password: string
    // ) => Promise<void>

    config: RendererConfig
}

