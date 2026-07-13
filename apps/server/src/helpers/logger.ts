import { AsyncLocalStorage } from "node:async_hooks";
import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import { inspect } from "node:util";
import { supabaseAdmin } from "@workspace/supabase/admin";

type LogLevel = "info" | "success" | "warn" | "error" | "debug";

type LogDetails = Record<string, unknown>;
type LogEntry = {
  timestamp: string;
  level: LogLevel;
  scope: string;
  message: string;
  details?: LogDetails;
};

type RouteLogContext =
  | { mode: "file"; filePath: string; writeQueue: Promise<void> }
  | { mode: "db"; entries: LogEntry[] };

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

function formatFileLine(entry: LogEntry): string {
  const config = levels[entry.level];
  const detailText = entry.details
    ? ` ${inspect(entry.details, { colors: false, depth: null, breakLength: Infinity, maxStringLength: Infinity })}`
    : "";

  return `${entry.timestamp} ${config.label} [${entry.scope}] ${entry.message}${detailText}\n`;
}

function recordEntry(entry: LogEntry): void {
  const context = routeLogStorage.getStore();
  if (!context) return;

  if (context.mode === "file") {
    context.writeQueue = context.writeQueue
      .then(() => appendFile(context.filePath, formatFileLine(entry), "utf8"))
      .catch((error: unknown) => {
        console.warn(`Failed to write route log ${context.filePath}:`, error);
      });
    return;
  }

  context.entries.push(entry);
}

function write(level: LogLevel, scope: string, message: string, details?: LogDetails): void {
  recordEntry({ timestamp: new Date().toISOString(), level, scope, message, details });

  const isAlwaysLog = level === "error" || level === "warn";
  if (!isDev && !isAlwaysLog) return;

  const config = levels[level];
  const timestamp = new Date().toISOString().slice(11, 23);
  const prefix = `${dim}${timestamp}${reset} ${config.color}${config.label}${reset} ${dim}[${scope}]${reset}`;

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

async function runWithFileLog<T>(routeName: string, run: () => Promise<T>): Promise<T> {
  const fileName = `${formatRouteNameForFilename(routeName)}-${formatDatetimeForFilename(new Date())}.txt`;
  const filePath = path.resolve(process.cwd(), ".logs", fileName);

  try {
    await mkdir(path.dirname(filePath), { recursive: true });
  } catch (error) {
    console.warn(`Failed to create route log directory for ${routeName}:`, error);
    return run();
  }

  const context: RouteLogContext = { mode: "file", filePath, writeQueue: Promise.resolve() };

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

async function runWithDbLog<T>(routeName: string, run: () => Promise<T>): Promise<T> {
  const context: RouteLogContext = { mode: "db", entries: [] };
  const startedAt = new Date();

  return routeLogStorage.run(context, async () => {
    write("info", routeName, "route execution started");

    try {
      const result = await run();
      write("info", routeName, "route execution finished");
      await persistDbLog(routeName, context, startedAt, "success");
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      write("error", routeName, "route execution failed", { error: message });
      await persistDbLog(routeName, context, startedAt, "error", message);
      throw error;
    }
  });
}

async function persistDbLog(
  routeName: string,
  context: Extract<RouteLogContext, { mode: "db" }>,
  startedAt: Date,
  status: "success" | "error",
  error?: string,
): Promise<void> {
  const finishedAt = new Date();

  const { error: insertError } = await supabaseAdmin.from("route_execution_logs").insert({
    route_name: routeName,
    status,
    started_at: startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
    duration_ms: finishedAt.getTime() - startedAt.getTime(),
    entries: context.entries,
    error: error ?? null,
  });

  if (insertError) {
    console.warn(`Failed to persist route log for ${routeName}:`, insertError.message);
  }
}

export async function withRouteLog<T>(routeName: string, run: () => Promise<T>): Promise<T> {
  return isDev ? runWithFileLog(routeName, run) : runWithDbLog(routeName, run);
}
