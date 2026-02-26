import { spawn } from "child_process";

const nextProcess = spawn("npx", ["next", "dev", "-p", "5000", "-H", "0.0.0.0"], {
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "development" },
});

nextProcess.on("error", (err) => {
  console.error("Failed to start Next.js:", err);
  process.exit(1);
});

nextProcess.on("close", (code) => {
  process.exit(code || 0);
});
