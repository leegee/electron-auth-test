import * as fs from "node:fs";
import * as path from "node:path";
import keytar from "keytar";

import { decryptActivationKey, encryptActivationKey } from "../src/main/oauth-plugin/oauth-crypt";

const VITE_BUILD_PASSWORD = process.env.VITE_BUILD_PASSWORD;
const VITE_ACTIVATION_FILE_PATH = process.env.VITE_ACTIVATION_FILE_PATH || "activation-key.json";

const VITE_SECRET_SERVICE_NAME = process.env.VITE_SECRET_SERVICE_NAME;
const VITE_SERVICE_NAME = process.env.VITE_SERVICE_NAME;

const outputPath = path.resolve(process.cwd(), VITE_ACTIVATION_FILE_PATH);

const providers: Record<string, string | undefined> = {
    github: process.env.VITE_GITHUB_CLIENT_SECRET,
    google: process.env.VITE_GOOGLE_CLIENT_SECRET
};

if (!VITE_BUILD_PASSWORD) {
    console.error("Missing VITE_BUILD_PASSWORD environment variable");
    process.exit(1);
}

if (!VITE_SECRET_SERVICE_NAME || !VITE_SERVICE_NAME) {
    console.error("Missing Keytar-related environment variables");
    process.exit(1);
}

if (Object.keys(providers).length === 0) {
    console.error("No providers configured");
    process.exit(1);
}

if (process.env.CLEAN) {
    if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
    }

    for (const provider of Object.keys(providers)) {
        await keytar.deletePassword(VITE_SECRET_SERVICE_NAME, provider);
        console.log('Delete keytar ', VITE_SECRET_SERVICE_NAME, provider);
        await keytar.deletePassword(VITE_SERVICE_NAME, provider);
        console.log('Delete keytar ', VITE_SERVICE_NAME, provider);
        await keytar.deletePassword(VITE_SERVICE_NAME + '-user', provider);
        console.log('Delete keytar ', VITE_SERVICE_NAME + '-user', provider);
    }

    console.info(`Cleaned credentials for ${VITE_SERVICE_NAME}`);
}


const activationKeys: Record<string, string> = {};

for (const [provider, clientSecret] of Object.entries(providers)) {
    if (!clientSecret) {
        console.warn(`Skipping ${provider} because client secret is missing`);
        continue;
    }

    const activationKey = await encryptActivationKey(
        clientSecret,
        VITE_BUILD_PASSWORD,
        provider,
    );

    // Throws on error
    await decryptActivationKey(activationKey, VITE_BUILD_PASSWORD);

    activationKeys[provider] = activationKey;

    console.log(`Created activation key for ${provider}\n${activationKey}\n`);
}

fs.writeFileSync(outputPath, JSON.stringify(activationKeys, null, 2), {
    encoding: "utf-8"
});

console.log(`Activation keys written to ${outputPath}`);

