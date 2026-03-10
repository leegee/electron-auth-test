import * as fs from 'node:fs';
import * as path from 'node:path';
import { encryptActivationKey } from '../src/main/crypt';
import keytar from 'keytar';

const VITE_BUILD_PASSWORD = process.env.VITE_BUILD_PASSWORD;
const VITE_ACTIVATION_FILE_PATH = process.env.VITE_ACTIVATION_FILE_PATH || 'activation-key.json';
const outputPath = path.resolve(process.cwd(), VITE_ACTIVATION_FILE_PATH);

const providers: Record<string, string | undefined> = {
    github: process.env.VITE_GITHUB_CLIENT_SECRET,
    google: process.env.VITE_GOOGLE_CLIENT_SECRET,
};

const VITE_ACCOUNT_ACTIVATION = process.env.VITE_ACCOUNT_ACTIVATION;
const VITE_SERVICE_NAME = process.env.VITE_SERVICE_NAME;
const VITE_SESSION_TOKEN = process.env.VITE_SESSION_TOKEN;

if (!VITE_BUILD_PASSWORD) {
    console.error('Missing VITE_BUILD_PASSWORD environment variable');
    process.exit(1);
}

if (!VITE_ACCOUNT_ACTIVATION || !VITE_SERVICE_NAME || !VITE_SESSION_TOKEN) {
    console.error('Missing Keytar-related environment variables');
    process.exit(1);
}

if (process.env.CLEAN) {
    // Remove any old activation file
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    // Remove Keytar credentials for each provider
    for (const provider of Object.keys(providers)) {
        await keytar.deletePassword(VITE_SERVICE_NAME, `${VITE_ACCOUNT_ACTIVATION}-${provider}`);
        await keytar.deletePassword(VITE_SERVICE_NAME, `${VITE_SESSION_TOKEN}-${provider}`);
    }

    console.info(`Cleaned credentials for ${VITE_SERVICE_NAME}`);
}

const activationKeys: Record<string, string> = {};

for (const [provider, clientSecret] of Object.entries(providers)) {
    if (!clientSecret) {
        console.warn(`Skipping ${provider} because client ID is missing`);
        continue;
    }

    const activationKey = await encryptActivationKey(clientSecret, VITE_BUILD_PASSWORD);
    activationKeys[`${VITE_ACCOUNT_ACTIVATION}-${provider}`] = activationKey;

    console.log(`Created activation key for ${provider}: ${activationKey}`);
}

fs.writeFileSync(outputPath, JSON.stringify(activationKeys, null, 2), { encoding: 'utf-8' });
console.log(`Activation keys written to ${outputPath}`);


