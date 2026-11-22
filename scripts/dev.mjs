import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { spawn, spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
let port = 3000;
const forwarded = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--port" || args[i] === "-p") port = Number(args[++i]);
  else if (args[i].startsWith("--port=")) port = Number(args[i].slice(7));
  else forwarded.push(args[i]);
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("Choose a valid port between 1 and 65535.");
  process.exit(1);
}
const directory = process.env.NEXT_DIST_DIR || ".next-dev";
// Never clear production output, source, environment files or persistent data.
if (!/^\.next-(?:dev|test)(?:-[a-z0-9_-]+)?$/i.test(directory)) {
  console.error(
    "Development output must be a .next-dev or .next-test directory inside the project.",
  );
  process.exit(1);
}
const output = path.resolve(root, directory);
if (path.dirname(output) !== root) throw new Error("Invalid build directory");
const runtime = path.join(root, ".runtime");
fs.mkdirSync(runtime, { recursive: true });
const lock = path.join(runtime, directory + ".lock");
function alive(pid) {
  if (!Number.isInteger(pid) || pid < 1) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM";
  }
}
let handle;
try {
  handle = fs.openSync(lock, "wx");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  let existing;
  try {
    existing = JSON.parse(fs.readFileSync(lock, "utf8"));
  } catch {}
  if (!existing || alive(existing.pid)) {
    console.error(
      `A development server is already running for ${directory}. Use http://127.0.0.1:${existing?.port || port}; stop it before starting another.`,
    );
    process.exit(1);
  }
  fs.unlinkSync(lock);
  handle = fs.openSync(lock, "wx");
}
fs.writeFileSync(handle, JSON.stringify({ pid: process.pid, port }));
function release() {
  if (handle === undefined) return;
  fs.closeSync(handle);
  handle = undefined;
  try {
    fs.unlinkSync(lock);
  } catch {}
}
process.once("exit", release);
try {
  // Refuse an occupied port instead of silently starting a second compiler.
  const probe = net.createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(port, "127.0.0.1", () => probe.close(resolve));
  });
  fs.rmSync(output, { recursive: true, force: true });
  const child = spawn(
    process.execPath,
    [
      path.join(root, "node_modules/next/dist/bin/next"),
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
      ...forwarded,
    ],
    {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, NEXT_DIST_DIR: directory },
    },
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, () => {
      if (process.platform === "win32")
        spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
          stdio: "ignore",
          windowsHide: true,
        });
      else child.kill(signal);
    });
  child.once("error", (error) => {
    console.error(error.message);
    process.exitCode = 1;
    release();
  });
  child.once("exit", (code) => {
    process.exitCode = code ?? 1;
    release();
  });
} catch (error) {
  console.error(
    error.code === "EADDRINUSE"
      ? `Port ${port} is already in use. Open http://127.0.0.1:${port} or stop that server before starting development.`
      : error.message,
  );
  process.exitCode = 1;
  release();
}
