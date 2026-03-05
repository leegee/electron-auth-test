import fs from 'node:fs/promises';
import keytar from 'keytar';

import { config } from './config';

/**
 * First-run initialization of CLIENT_SECRET into Keytar
 */
export async function initializeSecret(): Promise<string> {
    console.log('enter initializeSecret');

    try {
        await fs.access(config.SECRET_FILE_PATH);
    } catch {
        throw new Error(`Secret file missing, cannot initialize Keytar from ${config.SECRET_FILE_PATH}`);
    }

    console.log('initializing secret from file');

    let secretData: any;
    try {
        const raw = await fs.readFile(config.SECRET_FILE_PATH, 'utf-8');
        secretData = JSON.parse(raw);
    } catch {
        throw new Error('Invalid activation file format');
    }

    if (!secretData.CLIENT_SECRET) {
        throw new Error('CLIENT_SECRET missing in activation file');
    }

    const secret = secretData.CLIENT_SECRET;

    await keytar.setPassword(
        config.SERVICE_NAME,
        config.ACCOUNT_ACTIVATION,
        secret
    );

    await fs.unlink(config.SECRET_FILE_PATH);

    console.log('leave initializeSecret - secret stored in keytar');

    return secret;
}