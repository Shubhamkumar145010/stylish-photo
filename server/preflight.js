import "node:process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const required = [
  "index.html",
  "styles.css",
  "script.js",
  "privacy.html",
  "terms.html",
  "server/app.js",
  "server/schema.sql",
  "package.json"
];
const forbiddenNames = [
  ".env",
  "service-account.json",
  "credentials.json",
  "id-card",
  "aadhaar",
  "passport",
  "driving-licence"
];
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const relative of required) {
  await fs.access(path.join(root, relative));
}

const entries = await fs.readdir(root, { withFileTypes: true });
const suspicious = entries
  .filter((entry) => entry.name !== ".env.example")
  .filter((entry) => forbiddenNames.some((name) => entry.name.toLowerCase().includes(name)))
  .map((entry) => entry.name);
if (suspicious.length > 0) {
  throw new Error(`Sensitive-looking files found at project root: ${suspicious.join(", ")}`);
}

if (process.env.NODE_ENV === "production") {
  const secret = process.env.JWT_SECRET || "";
  if (secret.length < 32) throw new Error("Production JWT_SECRET is missing or too short.");
  if (!process.env.DATABASE_URL) throw new Error("Production DATABASE_URL is missing.");
  if (!process.env.ALLOWED_ORIGINS) throw new Error("Production ALLOWED_ORIGINS is missing.");
}

console.log("LocalHelp preflight passed.");
