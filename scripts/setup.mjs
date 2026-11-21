import fs from "node:fs";
import path from "node:path";
const major = Number(process.versions.node.split(".")[0]);
if (major < 22) throw new Error("BrahmaGPT requires Node.js 22 or later.");
const root = path.resolve(import.meta.dirname, "..");
const local = path.join(root, ".env.local");
if (!fs.existsSync(local)) {
  fs.copyFileSync(
    path.join(root, ".env.example"),
    local,
    fs.constants.COPYFILE_EXCL,
  );
  console.log(
    "Created .env.local. Add your Gemini key to GEMINI_API_KEY when ready.",
  );
} else console.log("Existing .env.local preserved.");
fs.mkdirSync(path.join(root, ".data"), { recursive: true });
console.log(
  "Setup ready. Run npm.cmd run dev, then open http://127.0.0.1:3000.",
);
