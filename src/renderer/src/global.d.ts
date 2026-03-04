import type { ApiBridge } from '../../shared/bridge'

declare global {
    interface Window {
        api: ApiBridge
    }
}

export { }
