import pLimit from "p-limit";
import { supabaseAdmin } from "@workspace/supabase/admin";
import { createLogger } from "../../helpers/logger.js";
import { headCheck } from "./head-check.js";
import { serpCheck } from "./serp-check.js";
import { deriveSlug } from "./slug.js";

const log = createLogger("listings-check");

export type ListingCheckResult = {
  productId: string;
  checked: number;
  listed: number;
  gaps: number;
  errors: number;
  prospectsCreated: number;
};

export async function checkProductListings(productId: string): Promise<ListingCheckResult> {
  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, product_name, website_url")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    throw new Error(`Product not found: ${productId}`);
  }

  if (!product.product_name) {
    throw new Error(`Product ${productId} has no product_name set`);
  }

  const { data: settings } = await supabaseAdmin
    .from("product_backlink_discovery_settings")
    .select("opportunity_types")
    .eq("product_id", productId)
    .single();

  if (settings && !settings.opportunity_types.includes("directory")) {
    log.info("directory type not enabled for product, skipping", { productId });
    return { productId, checked: 0, listed: 0, gaps: 0, errors: 0, prospectsCreated: 0 };
  }

  const { data: directories, error: dirError } = await supabaseAdmin
    .from("directories")
    .select("id, domain, submit_url, slug_pattern, check_method")
    .eq("is_active", true);

  if (dirError) throw new Error(`Failed to load directories: ${dirError.message}`);
  if (!directories || directories.length === 0) {
    log.warn("no active directories found");
    return { productId, checked: 0, listed: 0, gaps: 0, errors: 0, prospectsCreated: 0 };
  }

  const slug = deriveSlug(product.product_name);
  log.info(`checking ${directories.length} directories`, { productId, slug });

  const limit = pLimit(8);

  const results = await Promise.all(
    directories.map((dir) =>
      limit(async () => {
        try {
          const result =
            dir.check_method === "head_check"
              ? await headCheck(dir, slug)
              : await serpCheck(dir, product.product_name);

          log.info(`${dir.domain} → ${result.status}`, { method: dir.check_method });
          return { dir, result };
        } catch (err) {
          log.error(`${dir.domain} threw unexpectedly`, { err: String(err) });
          return { dir, result: { status: "error" as const, url: dir.submit_url, reason: String(err) } };
        }
      }),
    ),
  );

  const listed = results.filter((r) => r.result.status === "listed").length;
  const gaps = results.filter((r) => r.result.status === "gap");
  const errors = results.filter((r) => r.result.status === "error").length;

  let prospectsCreated = 0;

  if (gaps.length > 0) {
    const rows = gaps.map(({ dir }) => ({
      product_id: productId,
      directory_id: dir.id,
      domain: dir.domain,
      target_url: dir.submit_url,
      tier: "directory" as const,
      action_type: "self_service" as const,
      status: "new" as const,
    }));

    const { error: upsertError, count } = await supabaseAdmin
      .from("backlink_prospects")
      .upsert(rows, { ignoreDuplicates: true, count: "exact" });

    if (upsertError) throw new Error(`Failed to upsert prospects: ${upsertError.message}`);
    prospectsCreated = count ?? 0;
  }

  log.success(`done`, { listed, gaps: gaps.length, errors, prospectsCreated });

  return {
    productId,
    checked: directories.length,
    listed,
    gaps: gaps.length,
    errors,
    prospectsCreated,
  };
}
