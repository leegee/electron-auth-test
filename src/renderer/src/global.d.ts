import type { ApiBridge } from '../../shared/bridge-types'

declare global {
    interface Window {
        api: ApiBridge
    }
}

export { }

