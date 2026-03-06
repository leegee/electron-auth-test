import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

import keytar from 'keytar';

const VITE_INIT_CLIENT_SECRET = process.env.VITE_INIT_CLIENT_SECRET;
const VITE_BUILD_PASSWORD = process.env.VITE_BUILD_PASSWORD;
const VITE_ACTIVATION_FILE_PATH = process.env.VITE_ACTIVATION_FILE_PATH || 'activation-key.json';

const outputPath = path.resolve(process.cwd(), VITE_ACTIVATION_FILE_PATH);

console.log(`${process.argv[1]} NODE_ENV = ${process.env.NODE_ENV}`);
console.log(`${process.argv[1]} VITE_CLIENT_ID = ${process.env.VITE_CLIENT_ID}`);
console.log(`${process.argv[1]} VITE_INIT_CLIENT_SECRET = ${process.env.VITE_INIT_CLIENT_SECRET}`);

if (!VITE_INIT_CLIENT_SECRET) {
    console.error(`${process.argv[1]} CLIENT_SECRET missing from environment`);
    process.exit(1);
}

if (!VITE_BUILD_PASSWORD) {
    console.error(`${process.argv[1]} VITE_BUILD_PASSWORD missing from environment`);
    process.exit(1);
}

if (process.env.CLEAN) {
    if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
        console.log(`${process.argv[1]} removed activation file from ${outputPath}`);
    } else {
        console.log(`${process.argv[1]} no activation file at ${outputPath}`);
    }

    const VITE_SERVICE_NAME = process.env.VITE_SERVICE_NAME;
    const VITE_SESSION_TOKEN = process.env.VITE_SESSION_TOKEN;
    const VITE_ACCOUNT_ACTIVATION = process.env.VITE_ACCOUNT_ACTIVATION;

    if (!VITE_SERVICE_NAME) {
        console.error(`${process.argv[1]} VITE_SERVICE_NAME missing from environment`);
        process.exit(1);
    }

    if (!VITE_SESSION_TOKEN) {
        console.error(`${process.argv[1]} VITE_SESSION_TOKEN missing from environment`);
        process.exit(1);
    }

    if (!VITE_ACCOUNT_ACTIVATION) {
        console.error(`${process.argv[1]} VITE_ACCOUNT_ACTIVATION missing from environment`);
        process.exit(1);
    }

    await keytar.deletePassword(VITE_SERVICE_NAME, VITE_ACCOUNT_ACTIVATION);
    await keytar.deletePassword(VITE_SERVICE_NAME, VITE_SESSION_TOKEN);

    console.info(`${process.argv[1]} VITE_SESSION_TOKEN and VITE_ACCOUNT_ACTIVATION removed from ${VITE_SERVICE_NAME}`);
}

const activationKey = encryptSecret(VITE_INIT_CLIENT_SECRET, VITE_BUILD_PASSWORD);

if (!process.env.CLEAN) {
    fs.writeFileSync(
        outputPath,
        JSON.stringify({ ACTIVATION_KEY: activationKey }, null, 2),
        { encoding: 'utf-8' }
    );
}

console.log(`${process.argv[1]} wrote to ${outputPath}`);
console.log(`${process.argv[1]} created activation key: ${activationKey}`);

function encryptSecret(secret: string, password: string) {
    const iv = crypto.randomBytes(12); // 12-byte IV for AES-GCM
    const key = crypto.createHash('sha256').update(password).digest(); // 32-byte key
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    // IV + tag + ciphertext
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
}
