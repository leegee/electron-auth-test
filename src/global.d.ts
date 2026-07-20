/// <reference types="vite/client" />

declare module '*.png?asset' {
    const src: string;
    export default src;
}

interface ImportMetaEnv {
    readonly VITE_VITE_BUILD_PASSWORD: string
    readonly VITE_VITE_GITHUB_CLIENT_ID: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
