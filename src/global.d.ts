/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_VITE_BUILD_PASSWORD: string
    readonly VITE_VITE_CLIENT_ID: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

