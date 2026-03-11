import * as crypto from "node:crypto";

/*
Activation key format:

version | provider | salt | iv | ciphertext | tag | hmac | checksum

Then:

JSON -> base32 -> chunked human-readable key
*/

const KEY_VERSION = 1;
const PBKDF2_ITERATIONS = 200_000;
const HMAC_LEN = 8;        // bytes
const CHECKSUM_LEN = 4;    // bytes

/**
 * Derive AES key from password, provider, and salt
 */
function deriveKey(password: string, provider: string, salt: Buffer) {
    return crypto.pbkdf2Sync(password + provider, salt, PBKDF2_ITERATIONS, 32, "sha256");
}

/**
 * Simple checksum (first 4 bytes of SHA256)
 */
function checksum(buf: Buffer) {
    return crypto.createHash("sha256").update(buf).digest().subarray(0, CHECKSUM_LEN);
}

/**
 * Base32 encode buffer
 */
function base32Encode(buffer: Buffer) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = 0;
    let value = 0;
    let output = "";

    for (const byte of buffer) {
        value = (value << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            output += alphabet[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) {
        output += alphabet[(value << (5 - bits)) & 31];
    }
    return output;
}

/**
 * Base32 decode string
 */
function base32Decode(input: string) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const map: Record<string, number> = {};
    alphabet.split("").forEach((c, i) => (map[c] = i));

    let bits = 0;
    let value = 0;
    const output: number[] = [];

    for (const char of input.replace(/=+$/, "")) {
        value = (value << 5) | map[char];
        bits += 5;
        if (bits >= 8) {
            output.push((value >>> (bits - 8)) & 0xff);
            bits -= 8;
        }
    }

    return Buffer.from(output);
}

/**
 * Chunk key for human readability
 */
function formatKey(encoded: string) {
    return encoded.match(/.{1,5}/g)?.join("-") ?? encoded;
}

/**
 * Remove formatting from key
 */
function parseKey(key: string) {
    return key.replace(/-/g, "").toUpperCase();
}

/**
 * Encrypt a client secret into a human-safe activation key
 */
export async function encryptActivationKey(
    secret: string,
    password: string,
    provider: string
) {
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);

    const key = deriveKey(password, provider, salt);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    const payloadObj = {
        v: KEY_VERSION,
        p: provider,
        s: salt.toString("base64"),
        i: iv.toString("base64"),
        d: ciphertext.toString("base64"),
        t: tag.toString("base64")
    };

    const payloadBuffer = Buffer.from(JSON.stringify(payloadObj));

    // HMAC to protect against offline brute force
    const hmac = crypto.createHmac("sha256", password + provider)
        .update(payloadBuffer)
        .digest()
        .subarray(0, HMAC_LEN);

    // Combine payload + HMAC, then append checksum
    const combined = Buffer.concat([payloadBuffer, hmac]);
    const full = Buffer.concat([combined, checksum(combined)]);

    const encoded = base32Encode(full);

    return formatKey(encoded);
}


export async function decryptActivationKey(
    activationKey: string,
    password: string
): Promise<{ provider: string; secret: string }> {
    const raw = base32Decode(parseKey(activationKey));

    // Split: payload | hmac | checksum
    const payload = raw.subarray(0, raw.length - (HMAC_LEN + CHECKSUM_LEN));
    const hmac = raw.subarray(raw.length - (HMAC_LEN + CHECKSUM_LEN), raw.length - CHECKSUM_LEN);
    const cs = raw.subarray(raw.length - CHECKSUM_LEN);

    const computedChecksum = checksum(Buffer.concat([payload, hmac]));
    if (!computedChecksum.equals(cs)) {
        throw new Error("Invalid activation key (checksum mismatch)");
    }

    let decoded: {
        v: number;
        p: string;
        s: string;
        i: string;
        d: string;
        t: string;
    };
    try {
        decoded = JSON.parse(payload.toString());
    } catch (err) {
        throw new Error("Failed to parse activation key payload: " + err);
    }

    const expectedHmac = crypto.createHmac("sha256", password + decoded.p)
        .update(payload)
        .digest()
        .subarray(0, HMAC_LEN);

    if (!expectedHmac.equals(hmac)) {
        throw new Error("Activation key integrity check failed: HMAC mismatch in \n" +
            [
                "Expected: " + expectedHmac.toString("hex"),
                "Actual  : " + hmac.toString("hex"),
                "Payload : " + payload.toString(),
                "Provider: " + decoded.p,
            ].join("\n")
        );
    }

    const salt = Buffer.from(decoded.s, "base64");
    const iv = Buffer.from(decoded.i, "base64");
    const ciphertext = Buffer.from(decoded.d, "base64");
    const tag = Buffer.from(decoded.t, "base64");

    const key = deriveKey(password, decoded.p, salt);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    const secret = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString();

    return {
        provider: decoded.p,
        secret
    };
}
