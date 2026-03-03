interface Window {
    electronAPI: {
        loginGitHub: () => void;
        onOAuthSuccess: (callback: () => void) => void;

        setPassword: (service: string, account: string, password: string) => Promise<void>;
        getPassword: (service: string, account: string) => Promise<string | null>;
    };
}


