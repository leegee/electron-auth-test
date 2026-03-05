import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

import keytar from 'keytar';

const INIT_CLIENT_SECRET = process.env.INIT_CLIENT_SECRET;
const INIT_BUILD_PASSWORD = process.env.INIT_BUILD_PASSWORD;
const ACTIVATION_FILE_PATH = process.env.ACTIVATION_FILE_PATH || 'activation-key.json';

const outputPath = path.resolve(process.cwd(), ACTIVATION_FILE_PATH);

if (process.env.CLEAN) {
    if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
        console.log(`${process.argv[1]} removed activation file from ${outputPath}`);
    } else {
        console.log(`${process.argv[1]} no activation file at ${outputPath}`);
    }

    const SERVICE_NAME = process.env.SERVICE_NAME;
    const SESSION_TOKEN = process.env.SESSION_TOKEN;
    const ACCOUNT_ACTIVATION = process.env.ACCOUNT_ACTIVATION;

    if (!SERVICE_NAME) {
        console.error(`${process.argv[1]} SERVICE_NAME missing from environment`);
        process.exit(1);
    }

    if (!SESSION_TOKEN) {
        console.error(`${process.argv[1]} SESSION_TOKEN missing from environment`);
        process.exit(1);
    }

    if (!ACCOUNT_ACTIVATION) {
        console.error(`${process.argv[1]} ACCOUNT_ACTIVATION missing from environment`);
        process.exit(1);
    }

    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_ACTIVATION);
    await keytar.deletePassword(SERVICE_NAME, SESSION_TOKEN);

    console.info(`${process.argv[1]} SESSION_TOKEN and ACCOUNT_ACTIVATION removed from ${SERVICE_NAME}`);
}


if (!INIT_CLIENT_SECRET) {
    console.error(`${process.argv[1]} CLIENT_SECRET missing from environment`);
    process.exit(1);
}

if (!INIT_BUILD_PASSWORD) {
    console.error(`${process.argv[1]} INIT_BUILD_PASSWORD missing from environment`);
    process.exit(1);
}

const activationKey = encryptSecret(INIT_CLIENT_SECRET, INIT_BUILD_PASSWORD);

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
