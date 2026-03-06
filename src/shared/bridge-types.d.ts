export interface ApiBridge {
    activateApp: (activationKey: string) => Promise<{ success: boolean; error?: string }>
    onRequireActivation: (cb: () => void) => Electron.IpcRenderer
    deletePassword: (service: string, account: string) => void
    getPassword: (service: string, account: string) => Promise<string | null>
    loginGitHub: () => void
    onOAuthSuccess: (callback: () => void) => void
    onOAuthError: (callback: (GitHubTokenResponseBad) => void) => void
}
