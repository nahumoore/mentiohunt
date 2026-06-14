import { AsyncLocalStorage } from "node:async_hooks";
import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import { inspect } from "node:util";

type LogLevel = "info" | "success" | "warn" | "error" | "debug";

type LogDetails = Record<string, unknown>;
type RouteLogContext = {
  filePath: string;
  writeQueue: Promise<void>;
};

const isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev";
const routeLogStorage = new AsyncLocalStorage<RouteLogContext>();

const reset = "\x1b[0m";
const dim = "\x1b[2m";

const levels: Record<
  LogLevel,
  {
    color: string;
    label: string;
    method: "log" | "warn" | "error" | "debug";
  }
> = {
  info: { color: "\x1b[36m", label: "INFO", method: "log" },
  success: { color: "\x1b[32m", label: "OK", method: "log" },
  warn: { color: "\x1b[33m", label: "WARN", method: "warn" },
  error: { color: "\x1b[31m", label: "ERR", method: "error" },
  debug: { color: "\x1b[35m", label: "DBG", method: "debug" },
};

function formatDatetimeForFilename(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function formatRouteNameForFilename(routeName: string): string {
  return routeName.trim().replace(/[^a-zA-Z0-9._-]/g, "-") || "route";
}

function formatFileLine(level: LogLevel, scope: string, message: string, details?: LogDetails): string {
  const config = levels[level];
  const timestamp = new Date().toISOString();
  const detailText = details ? ` ${inspect(details, { colors: false, depth: null, breakLength: Infinity })}` : "";

  return `${timestamp} ${config.label} [${scope}] ${message}${detailText}\n`;
}

function appendRouteLog(line: string): void {
  const context = routeLogStorage.getStore();
  if (!context) return;

  context.writeQueue = context.writeQueue
    .then(() => appendFile(context.filePath, line, "utf8"))
    .catch((error: unknown) => {
      console.warn(`Failed to write route log ${context.filePath}:`, error);
    });
}

function write(level: LogLevel, scope: string, message: string, details?: LogDetails): void {
  const isAlwaysLog = level === "error" || level === "warn";
  if (!isDev && !isAlwaysLog) return;

  const config = levels[level];
  const timestamp = new Date().toISOString().slice(11, 23);
  const prefix = `${dim}${timestamp}${reset} ${config.color}${config.label}${reset} ${dim}[${scope}]${reset}`;
  appendRouteLog(formatFileLine(level, scope, message, details));

  if (details) {
    console[config.method](`${prefix} ${message}`, details);
    return;
  }

  console[config.method](`${prefix} ${message}`);
}

export function createLogger(scope: string) {
  return {
    info: (message: string, details?: LogDetails) => write("info", scope, message, details),
    success: (message: string, details?: LogDetails) => write("success", scope, message, details),
    warn: (message: string, details?: LogDetails) => write("warn", scope, message, details),
    error: (message: string, details?: LogDetails) => write("error", scope, message, details),
    debug: (message: string, details?: LogDetails) => write("debug", scope, message, details),
  };
}

export async function withRouteLog<T>(routeName: string, run: () => Promise<T>): Promise<T> {
  if (!isDev) return run();

  const fileName = `${formatRouteNameForFilename(routeName)}-${formatDatetimeForFilename(new Date())}.txt`;
  const filePath = path.resolve(process.cwd(), ".logs", fileName);

  try {
    await mkdir(path.dirname(filePath), { recursive: true });
  } catch (error) {
    console.warn(`Failed to create route log directory for ${routeName}:`, error);
    return run();
  }

  const context: RouteLogContext = {
    filePath,
    writeQueue: Promise.resolve(),
  };

  return routeLogStorage.run(context, async () => {
    write("info", routeName, "route execution started", { logFile: filePath });

    try {
      return await run();
    } finally {
      write("info", routeName, "route execution finished");
      await context.writeQueue;
    }
  });
}
