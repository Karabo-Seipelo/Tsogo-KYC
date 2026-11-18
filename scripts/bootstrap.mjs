import { execSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { version as nodeVersion } from "node:process";

const MIN_NODE = [20, 9, 0];
const MIN_PNPM = [9, 0, 0];

function parseVersion(version) {
  const match = version
    .trim()
    .replace(/^v/, "")
    .match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function isBelow(found, minimum) {
  for (let index = 0; index < minimum.length; index += 1) {
    if (found[index] > minimum[index]) {
      return false;
    }
    if (found[index] < minimum[index]) {
      return true;
    }
  }
  return false;
}

function fail(tool, found, required) {
  console.error(`${tool} ${found} is below the required ${required}.`);
  process.exit(1);
}

const node = parseVersion(nodeVersion);
if (!node || isBelow(node, MIN_NODE)) {
  fail("Node.js", nodeVersion, "20.9.0");
}

let pnpmRaw;
try {
  pnpmRaw = execSync("pnpm --version", { encoding: "utf8" });
} catch {
  console.error("pnpm was not found on PATH. Required: 9.0.0 or newer.");
  process.exit(1);
}

const pnpm = parseVersion(pnpmRaw);
if (!pnpm || isBelow(pnpm, MIN_PNPM)) {
  fail("pnpm", pnpmRaw.trim(), "9.0.0");
}

if (!existsSync(".env.local")) {
  copyFileSync(".env.example", ".env.local");
  console.log("Created .env.local from .env.example");
} else {
  console.log(".env.local already present");
}

console.log(`Run modes
  pnpm dev          memory store · http://localhost:3000 · single device
  pnpm dev:phone    memory or an Upstash dev database · HTTPS tunnel for a real phone
  Vercel preview    Upstash preview database · one deploy per branch
  Production        Upstash production database · https://tsogo.karaboseipelo.com`);
