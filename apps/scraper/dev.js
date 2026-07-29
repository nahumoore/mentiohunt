const { spawn } = require("node:child_process");
const path = require("node:path");

const python = process.platform === "win32"
  ? path.join(".venv", "Scripts", "python.exe")
  : path.join(".venv", "bin", "python");

const args = ["-m", "uvicorn", "main:app", "--port", "8000", "--env-file", ".env"];
if (process.platform !== "win32") {
  // --reload spawns the app in a subprocess that shares sockets with the
  // reloader via SelectorEventLoop on Windows, which can't launch the
  // Playwright/Camoufox browser subprocesses this app needs at startup.
  args.push("--reload");
}

const child = spawn(python, args, {
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 0));
