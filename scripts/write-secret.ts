import fs from "fs";
import path from "path";

// Read INIT_CLIENT_SECRET from environment
const CLIENT_SECRET = process.env.INIT_CLIENT_SECRET;
if (!CLIENT_SECRET) {
    console.error("Missing CLIENT_SECRET in environment");
    process.exit(1);
}

// Build secret object
const secretData = {
    CLIENT_SECRET
};

// Path where we will write the temporary secret
// This should match what your first-run helper expects
const outputPath = path.resolve(process.cwd(), "secret.tmp.json");

// Write JSON file
fs.writeFileSync(outputPath, JSON.stringify(secretData, null, 2), { encoding: "utf-8" });

console.log(`secret.tmp.json written to ${outputPath}`);
