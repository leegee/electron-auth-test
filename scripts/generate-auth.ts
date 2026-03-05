import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

const CLIENT_SECRET = process.env.INIT_CLIENT_SECRET;
const INIT_BUILD_PASSWORD = process.env.INIT_BUILD_PASSWORD;
const ACTIVATION_FILE_PATH = process.env.ACTIVATION_FILE_PATH || 'secret.tmp.json';

if (!CLIENT_SECRET) {
    console.error(`${process.argv[1]} CLIENT_SECRET missing from environment`);
    process.exit(1);
}

if (!INIT_BUILD_PASSWORD) {
    console.error(`${process.argv[1]} INIT_BUILD_PASSWORD missing from environment`);
    process.exit(1);
}


function encryptSecret(secret: string, password: string) {
    const iv = crypto.randomBytes(12); // 12-byte IV for AES-GCM
    const key = crypto.createHash('sha256').update(password).digest(); // 32-byte key
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    // IV + tag + ciphertext
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
}


const activationKey = encryptSecret(CLIENT_SECRET, INIT_BUILD_PASSWORD);

const outputPath = path.resolve(process.cwd(), ACTIVATION_FILE_PATH);
fs.writeFileSync(
    outputPath,
    JSON.stringify({ ACTIVATION_KEY: activationKey }, null, 2),
    { encoding: 'utf-8' }
);

console.log(`${process.argv[1]} wrote to ${outputPath}`);
console.log(`${process.argv[1]} created activation key: ${activationKey}`);

