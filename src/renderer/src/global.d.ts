import type { ApiBridge } from '../../shared/bridge-types'

declare global {
    interface Window {
        api: ApiBridge
    }
}

declare const __BUILD_PASSWORD__: string;
declare const __CLIENT_ID__: string;

export { }

