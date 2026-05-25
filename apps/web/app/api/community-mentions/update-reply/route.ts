import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

const bodySchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["replied", "dismissed"]),
})

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function PATCH(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return err("Unauthorized", 401)
  }

  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Invalid request payload.")
  }

  const { id, status } = parsed.data

  const { error: updateError } = await supabase
    .from("reply_queue_items")
    .update({ user_status: status })
    .eq("id", id)
    .eq("user_id", user.id)

  if (updateError) {
    console.error("Error updating reply queue item:", updateError)
    return err("Failed to update mention.", 500)
  }

  return NextResponse.json({ id, status })
}
