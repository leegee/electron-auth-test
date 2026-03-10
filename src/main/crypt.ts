import * as crypto from 'node:crypto';
import argon2 from 'argon2';

/**
 * Encrypt a secret using AES-256-GCM with Argon2-derived key
 */
export async function encryptActivationKey(secret: string, password: string) {
    // 16-byte random salt
    const salt = crypto.randomBytes(16);
    // Derive a 32-byte key using Argon2id
    const key = await argon2.hash(password, {
        type: argon2.argon2id,
        salt,
        hashLength: 32,
        raw: true,       // get raw bytes instead of encoded string
        timeCost: 3,
        memoryCost: 2 ** 16,
        parallelism: 1,
    });

    const iv = crypto.randomBytes(12); // 12-byte IV
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Store as: salt + iv + tag + encrypted
    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

/**
 * Decrypt a secret encrypted with encryptActivationKey
 */
export async function decryptActivationKey(keyBase64: string, password: string): Promise<string> {
    const data = Buffer.from(keyBase64, 'base64');

    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const tag = data.slice(28, 44);
    const encrypted = data.slice(44);

    const key = await argon2.hash(password, {
        type: argon2.argon2id,
        salt,
        hashLength: 32,
        raw: true,
        timeCost: 3,
        memoryCost: 2 ** 16,
        parallelism: 1,
    });

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString();
}
