import pRetry from "p-retry";

const BODY_SIZE_LIMIT = 2 * 1024 * 1024; // 2 MB
const COOKIE_JAR_MAX = 500;

type BrowserProfile = {
  ua: string;
  chUa: string; // empty string = Firefox (no Client Hints)
  platform: string;
};

const BROWSER_PROFILES: BrowserProfile[] = [
  {
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    chUa: '"Chromium";v="131", "Not_A Brand";v="24", "Google Chrome";v="131"',
    platform: '"macOS"',
  },
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    chUa: '"Chromium";v="131", "Not_A Brand";v="24", "Google Chrome";v="131"',
    platform: '"Windows"',
  },
  {
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    chUa: '"Chromium";v="130", "Not_A Brand";v="24", "Google Chrome";v="130"',
    platform: '"macOS"',
  },
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    chUa: '"Chromium";v="130", "Not_A Brand";v="24", "Google Chrome";v="130"',
    platform: '"Windows"',
  },
  {
    ua: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    chUa: '"Chromium";v="131", "Not_A Brand";v="24", "Google Chrome";v="131"',
    platform: '"Linux"',
  },
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
    chUa: "",
    platform: '"Windows"',
  },
];

function urlHash(url: string): number {
  let h = 0;
  for (let i = 0; i < url.length; i++) {
    h = (Math.imul(31, h) + url.charCodeAt(i)) >>> 0;
  }
  return h;
}

// In-memory per-host cookie jar — persists across requests for the lifetime of the process
const cookieJar = new Map<string, string>();

function jarGet(host: string): string | undefined {
  return cookieJar.get(host);
}

function jarSet(host: string, setCookieHeaders: string[]): void {
  if (!setCookieHeaders.length) return;
  const incoming = new Map<string, string>();
  for (const raw of setCookieHeaders) {
    const nameValue = raw.split(";")[0]?.trim();
    if (!nameValue) continue;
    const eqIdx = nameValue.indexOf("=");
    if (eqIdx > 0) incoming.set(nameValue.slice(0, eqIdx), nameValue.slice(eqIdx + 1));
  }
  if (!incoming.size) return;

  const merged = new Map<string, string>();
  const existing = cookieJar.get(host);
  if (existing) {
    for (const pair of existing.split("; ")) {
      const eqIdx = pair.indexOf("=");
      if (eqIdx > 0) merged.set(pair.slice(0, eqIdx), pair.slice(eqIdx + 1));
    }
  }
  for (const [k, v] of incoming) merged.set(k, v);

  if (!cookieJar.has(host) && cookieJar.size >= COOKIE_JAR_MAX) {
    const firstKey = cookieJar.keys().next().value;
    if (firstKey !== undefined) cookieJar.delete(firstKey as string);
  }
  cookieJar.set(host, [...merged.entries()].map(([k, v]) => `${k}=${v}`).join("; "));
}

export type FetchResult = {
  status: number;
  url: string;
  body: string;
  contentType: string;
  headers: Record<string, string>;
};

export class HttpStatusError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`HTTP ${status} for ${url}`);
    this.name = "HttpStatusError";
  }
}

export async function fetchWithRetry(
  url: string,
  opts: {
    timeoutMs?: number;
    maxAttempts?: number;
    accept?: string;
    rangeBytes?: number;
    referer?: string;
  } = {},
): Promise<FetchResult> {
  const { timeoutMs = 15_000, maxAttempts = 3, rangeBytes, referer } = opts;

  const profile = BROWSER_PROFILES[urlHash(url) % BROWSER_PROFILES.length]!;

  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    host = url;
  }

  return pRetry(
    async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const headers: Record<string, string> = {
        "User-Agent": profile.ua,
        Accept:
          opts.accept ??
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
      };

      if (profile.chUa) {
        headers["Sec-Ch-Ua"] = profile.chUa;
        headers["Sec-Ch-Ua-Mobile"] = "?0";
        headers["Sec-Ch-Ua-Platform"] = profile.platform;
      }

      if (referer) headers["Referer"] = referer;
      if (rangeBytes !== undefined) headers["Range"] = `bytes=0-${rangeBytes - 1}`;

      const stored = jarGet(host);
      if (stored) headers["Cookie"] = stored;

      let response: Response;
      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers,
          redirect: "follow",
        });
      } catch (err) {
        clearTimeout(timer);
        throw err;
      }
      clearTimeout(timer);

      // Persist any cookies the server sets (cf_clearance, __cf_bm, session, etc.)
      const headersObj = response.headers as Headers & { getSetCookie?(): string[] };
      const setCookieRaw =
        typeof headersObj.getSetCookie === "function"
          ? headersObj.getSetCookie()
          : [response.headers.get("set-cookie") ?? ""].filter(Boolean);
      jarSet(host, setCookieRaw);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key.toLowerCase()] = value;
      });

      // 206 Partial Content counts as success when Range was requested
      const effectiveStatus =
        rangeBytes !== undefined && response.status === 206 ? 200 : response.status;

      if (effectiveStatus >= 400) {
        throw new HttpStatusError(response.status, url);
      }

      const contentType = responseHeaders["content-type"] ?? "";

      const reader = response.body?.getReader();
      if (!reader) {
        return { status: response.status, url: response.url, body: "", contentType, headers: responseHeaders };
      }

      const cap = rangeBytes !== undefined ? Math.min(rangeBytes, BODY_SIZE_LIMIT) : BODY_SIZE_LIMIT;
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;
      let capped = false;

      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        totalBytes += chunk.value.byteLength;
        if (totalBytes > cap) {
          reader.cancel();
          capped = true;
          break;
        }
        chunks.push(chunk.value);
      }

      const byteLength = capped ? cap : totalBytes;
      const merged = new Uint8Array(byteLength);
      let offset = 0;
      for (const c of chunks) {
        const slice = c.byteLength + offset > byteLength ? c.slice(0, byteLength - offset) : c;
        merged.set(slice, offset);
        offset += slice.byteLength;
      }

      const body = new TextDecoder().decode(merged);
      return { status: response.status, url: response.url, body, contentType, headers: responseHeaders };
    },
    {
      retries: maxAttempts - 1,
      minTimeout: 800,
      factor: 2.5,
      randomize: true,
      shouldRetry: (err) => {
        if (err instanceof HttpStatusError) {
          const s = err.status;
          if (s === 401 || s === 404 || s === 410 || s === 451) return false;
          // Retry 403 (CF challenge) and 429 (rate limit); skip all other 4xx
          if (s >= 400 && s < 500 && s !== 403 && s !== 429) return false;
        }
        return true;
      },
      onFailedAttempt: (err) => {
        console.warn(
          `[http] attempt ${err.attemptNumber}/${maxAttempts} failed for ${url}: ${err.message}`,
        );
      },
    },
  );
}
