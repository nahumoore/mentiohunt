// Closes an existing gap: profiles.email_settings.alerts is written by the
// unsubscribe flow (apps/web/app/api/unsubscribe/route.ts) and read by the
// settings page, but no server-side sender actually checked it before this —
// every alert sender (competitor-backlink, listicle, unlinked-mention,
// resource-page-inclusion) fires regardless of the flag. New alert senders
// should call this first; existing ones are unaffected until they opt in.

type ProfileEmailSettings = {
  email_settings?: unknown
}

export function canSendAlerts(profile: ProfileEmailSettings): boolean {
  const settings = profile.email_settings as { alerts?: boolean } | null | undefined
  return settings?.alerts !== false
}
