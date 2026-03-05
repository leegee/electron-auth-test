import fs from "fs";
import path from "path";

const CLIENT_SECRET = process.env.INIT_CLIENT_SECRET;
if (!CLIENT_SECRET) {
    console.error("Missing CLIENT_SECRET in environment");
    process.exit(1);
}

const ACTIVATION_FILE_PATH = process.env.ACTIVATION_FILE_PATH || "activation-key.json";

const secretData = {
    CLIENT_SECRET
};

const outputPath = path.resolve(process.cwd(), ACTIVATION_FILE_PATH);

// Write JSON file
fs.writeFileSync(outputPath, JSON.stringify(secretData, null, 2), { encoding: "utf-8" });

console.log(`${ACTIVATION_FILE_PATH} written to ${outputPath}`);
