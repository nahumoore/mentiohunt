import pRetry, { AbortError } from "p-retry";

const USER_AGENT = "MentiohuntBot/1.0 (+https://mentiohunt.com/bot)";
const BODY_SIZE_LIMIT = 2 * 1024 * 1024; // 2 MB

export type FetchResult = {
  status: number;
  body: string;
  contentType: string;
};

export { AbortError };

export async function fetchWithRetry(
  url: string,
  opts: {
    timeoutMs?: number;
    maxAttempts?: number;
    accept?: string;
  } = {},
): Promise<FetchResult> {
  const {
    timeoutMs = 15_000,
    maxAttempts = 3,
    accept = "text/html,application/xhtml+xml,application/xml;q=0.9",
  } = opts;

  return pRetry(
    async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;
      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": USER_AGENT,
            Accept: accept,
            "Accept-Encoding": "gzip, deflate, br",
          },
          redirect: "follow",
        });
      } catch (err) {
        clearTimeout(timer);
        throw err;
      }
      clearTimeout(timer);

      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new AbortError(`HTTP ${response.status} for ${url}`);
      }

      if (response.status >= 500 || response.status === 429) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      const contentType = response.headers.get("content-type") ?? "";

      const reader = response.body?.getReader();
      if (!reader) {
        return { status: response.status, body: "", contentType };
      }

      const chunks: Uint8Array[] = [];
      let totalBytes = 0;
      let capped = false;

      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        totalBytes += chunk.value.byteLength;
        if (totalBytes > BODY_SIZE_LIMIT) {
          reader.cancel();
          capped = true;
          break;
        }
        chunks.push(chunk.value);
      }

      const byteLength = capped ? BODY_SIZE_LIMIT : totalBytes;
      const merged = new Uint8Array(byteLength);
      let offset = 0;
      for (const c of chunks) {
        const slice = c.byteLength + offset > byteLength ? c.slice(0, byteLength - offset) : c;
        merged.set(slice, offset);
        offset += slice.byteLength;
      }

      const body = new TextDecoder().decode(merged);
      return { status: response.status, body, contentType };
    },
    {
      retries: maxAttempts - 1,
      minTimeout: 500,
      factor: 2,
      randomize: true,
      onFailedAttempt: (err) => {
        console.warn(
          `[http] attempt ${err.attemptNumber}/${maxAttempts} failed for ${url}: ${err.message}`,
        );
      },
    },
  );
}
