import fs from 'node:fs/promises';
import keytar from 'keytar';
import * as crypto from 'node:crypto';

import { config } from './config';


export async function getClientSecret(): Promise<string | null> {
    console.log('Enter getClientSecret');
    const existing = await keytar.getPassword(config.SERVICE_NAME, config.ACCOUNT_ACTIVATION);

    console.log('In getClientSecret with', existing ? 'existing token' : 'nout');

    if (existing) return existing;

    try {
        const secret = await accountantActivation();
        return secret;
    } catch {
        //  neither Keytar nor file exists → manual activation required
        return null;
    }
}


// First-run initialization of CLIENT_SECRET into Keytar
async function accountantActivation(): Promise<string> {
    console.log('enter initializeSecret');

    try {
        await fs.access(config.ACTIVATION_FILE_PATH);
    } catch {
        throw new Error(`Secret file missing, cannot initialize Keytar from ${config.ACTIVATION_FILE_PATH}`);
    }

    console.log('initializing secret from file');

    let secretData: any;
    try {
        const raw = await fs.readFile(config.ACTIVATION_FILE_PATH, 'utf-8');
        secretData = JSON.parse(raw);
    } catch {
        throw new Error('Invalid activation file format');
    }

    if (!secretData.ACTIVATION_KEY) {
        throw new Error('ACTIVATION_KEY missing in activation file');
    }

    const secret = decryptActivationKey(secretData.ACTIVATION_KEY, config.INIT_BUILD_PASSWORD);

    await keytar.setPassword(
        config.SERVICE_NAME,
        config.ACCOUNT_ACTIVATION,
        secret
    );

    await fs.unlink(config.ACTIVATION_FILE_PATH);

    console.log('leave initializeSecret - secret stored in keytar');

    return secret;
}

export function decryptActivationKey(keyBase64: string, password: string): string {
    const data = Buffer.from(keyBase64, 'base64');
    const iv = data.slice(0, 12);
    const tag = data.slice(12, 28);
    const encrypted = data.slice(28);

    const key = crypto.createHash('sha256').update(password).digest(); // 32 bytes
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString();
}

