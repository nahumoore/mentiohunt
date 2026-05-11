import { AbortError, fetchWithRetry } from "../../helpers/http.js";

type Directory = {
  domain: string;
  submit_url: string;
  slug_pattern: string | null;
  check_method: string;
};

export type CheckResult = {
  status: "listed" | "gap" | "error";
  url: string;
  reason?: string;
};

export async function headCheck(directory: Directory, slug: string): Promise<CheckResult> {
  if (!directory.slug_pattern) {
    return { status: "error", url: directory.submit_url, reason: "no slug_pattern configured" };
  }

  const url = directory.slug_pattern.replace("{slug}", encodeURIComponent(slug));

  try {
    // TODO: Some directories return soft 404s with 200 status (e.g. G2, Capterra).
    // Add per-domain content checks when false-positive rate is observed.
    await fetchWithRetry(url, { maxAttempts: 2, timeoutMs: 10_000 });
    return { status: "listed", url };
  } catch (err) {
    if (err instanceof AbortError) {
      return { status: "gap", url };
    }
    return { status: "error", url, reason: String(err) };
  }
}
