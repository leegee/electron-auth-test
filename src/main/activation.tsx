import * as crypto from 'node:crypto';

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
