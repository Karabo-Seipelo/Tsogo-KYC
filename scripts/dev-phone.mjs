import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access } from "node:fs/promises";
import { connect } from "node:net";

const port = 3000;
const localUrl = `http://127.0.0.1:${port}`;

const cloudflared = await findCloudflared();
if (!cloudflared) {
  console.error(
    "cloudflared was not found on PATH.\nInstall it, then run this again:\n  brew install cloudflared",
  );
  process.exit(1);
}

if (await portOpen(port)) {
  console.error(
    `Port ${port} is already in use. Stop the other dev server, then run pnpm dev:phone again.`,
  );
  process.exit(1);
}

const children = [];
let stopping = false;

function stop(code = 0) {
  if (stopping) {
    return;
  }
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null) {
      child.kill("SIGTERM");
    }
  }
  setTimeout(() => process.exit(code), 250);
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

const dev = spawn("pnpm", ["dev"], { stdio: "inherit" });
children.push(dev);
dev.on("exit", (code, signal) => {
  if (!stopping && signal !== "SIGTERM") {
    stop(code ?? 1);
  }
});

const readyAt = Date.now();
while (!(await portOpen(port))) {
  if (dev.exitCode !== null) {
    process.exit(dev.exitCode ?? 1);
  }
  if (Date.now() - readyAt > 30_000) {
    console.error("The dev server did not open port 3000.");
    stop(1);
  }
  await delay(200);
}

const tunnel = spawn(cloudflared, ["tunnel", "--url", localUrl], {
  stdio: ["ignore", "pipe", "pipe"],
});
children.push(tunnel);

let buffer = "";
let announced = false;
const onOutput = (chunk) => {
  const text = String(chunk);
  process.stderr.write(text);
  buffer += text;
  if (announced) {
    return;
  }
  const match = buffer.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (!match) {
    return;
  }
  announced = true;
  console.log(`\nOpen this on your computer:\n  ${match[0]}\n`);
};

tunnel.stdout.on("data", onOutput);
tunnel.stderr.on("data", onOutput);
tunnel.on("exit", (code, signal) => {
  if (!stopping && signal !== "SIGTERM") {
    console.error("The tunnel stopped.");
    stop(code ?? 1);
  }
});

async function findCloudflared() {
  for (const dir of (process.env.PATH ?? "").split(":")) {
    if (!dir) {
      continue;
    }
    const candidate = `${dir}/cloudflared`;
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Try the next directory.
    }
  }
  return null;
}

function portOpen(target) {
  return new Promise((resolve) => {
    const socket = connect({ host: "127.0.0.1", port: target });
    const finish = (open) => {
      socket.destroy();
      resolve(open);
    };
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
