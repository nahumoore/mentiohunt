import { supabaseAdmin } from "@workspace/supabase/admin"

const { data, error } = await supabaseAdmin
  .from("backlink_prospects")
  .update({ status: "negotiating" })
  .eq("id", "0f10b9ac-3f5d-4423-ae28-7059c8ad39e2")
  .select("id, domain, status")

console.log({ data, error })
process.exit(0)
