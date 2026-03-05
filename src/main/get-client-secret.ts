import keytar from 'keytar';

import { config } from './config';
import { initializeSecret } from './initialize-secret';

export async function getClientSecret(): Promise<string | null> {
    const existing = await keytar.getPassword(config.SERVICE_NAME, config.ACCOUNT_ACTIVATION);
    if (existing) return existing;

    //  try secret file, optional
    try {
        const secret = await initializeSecret();
        return secret;
    } catch {
        //  neither Keytar nor file exists → manual activation required
        return null;
    }
}