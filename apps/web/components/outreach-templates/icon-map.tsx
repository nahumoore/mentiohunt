import {
  IconMail,
  IconMessageCircle,
  IconMicrophone,
  IconPencil,
  IconTools,
} from "@tabler/icons-react"

export function getOutreachTemplateIcon(slug: string) {
  if (slug === "blogger-outreach") return IconMessageCircle
  if (slug === "guest-post") return IconPencil
  if (slug === "backlink-request") return IconMail
  if (slug === "broken-link-building") return IconTools
  if (slug === "podcast") return IconMicrophone
  return IconMail
}
