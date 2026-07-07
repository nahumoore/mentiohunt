import { supabaseAdmin } from "@workspace/supabase/admin"

const id = process.argv[2]

const channel = supabaseAdmin
  .channel("test-service-role-2")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "backlink_prospects" },
    (payload) => {
      console.log("EVENT RECEIVED:", JSON.stringify(payload, null, 2))
    }
  )
  .subscribe((status, err) => {
    console.log("SUBSCRIBE STATUS:", status, err)
  })

setTimeout(() => {
  console.log("Done waiting, exiting.")
  process.exit(0)
}, 20000)
