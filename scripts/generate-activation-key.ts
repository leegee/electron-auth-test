import * as crypto from 'crypto';
import fs from 'fs';

const CLIENT_SECRET = process.env.INIT_CLIENT_SECRET;
const INIT_BUILD_PASSWORD = process.env.INIT_BUILD_PASSWORD;

if (!INIT_BUILD_PASSWORD) {
    console.error("Missing INIT_BUILD_PASSWORD in environment");
    process.exit(1);
}
if (!CLIENT_SECRET) {
    console.error("Missing CLIENT_SECRET in environment");
    process.exit(1);
}

function generateActivationKey(secret: string, password: string) {
    const iv = crypto.randomBytes(12); // AES-GCM IV
    const cipher = crypto.createCipheriv('aes-256-gcm', crypto.createHash('sha256')
        .update(password).digest(), iv);

    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    // IV + tag + ciphertext
    const result = Buffer.concat([iv, tag, encrypted]).toString('base64');
    return result;
}

const activationKey = generateActivationKey(CLIENT_SECRET, INIT_BUILD_PASSWORD);

fs.writeFileSync('activation-key.txt', activationKey);
console.log('Activation key generated:', activationKey);
