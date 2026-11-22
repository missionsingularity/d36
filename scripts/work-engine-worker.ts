import { workerTick } from "../lib/enterprise/work-engine";
let stopping = false;
process.on("SIGINT", () => {
  stopping = true;
});
process.on("SIGTERM", () => {
  stopping = true;
});
console.log(
  "BrahmaGPT database worker started. Keep this process running for schedules and approval recovery.",
);
async function main() {
  while (!stopping) {
    try {
      await workerTick();
    } catch (e) {
      console.error(e instanceof Error ? e.message : "Worker tick failed");
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
void main();
