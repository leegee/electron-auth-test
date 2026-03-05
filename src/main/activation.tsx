import * as nodeCrypto from 'crypto';

export function decryptActivationKey(key: string, password: string): string {
    const data = Buffer.from(key, 'base64');
    const iv = data.slice(0, 12);
    const tag = data.slice(12, 28);
    const encrypted = data.slice(28);

    const decipher = nodeCrypto.createDecipheriv('aes-256-gcm', Buffer.from(password), iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString();
}
