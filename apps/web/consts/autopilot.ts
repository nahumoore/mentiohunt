import {
  IconCircleCheck,
  IconMailFast,
  IconSearch,
} from "@tabler/icons-react"
import type { ElementType } from "react"

export type AutopilotStep = {
  Icon: ElementType
  title: string
  text: string
}

/**
 * The three-line explanation of how the autopilot works. Shared by the
 * first-login walkthrough and the discovery wait state so a new user reads the
 * same story in both places.
 */
export const AUTOPILOT_STEPS: AutopilotStep[] = [
  {
    Icon: IconSearch,
    title: "Daily discovery",
    text: "We find and enrich matching sites for your pages every day.",
  },
  {
    Icon: IconMailFast,
    title: "Automatic outreach",
    text: "Emails and follow-ups send from your mailbox — no action needed.",
  },
  {
    Icon: IconCircleCheck,
    title: "You just review",
    text: "Cancel anything that isn't a fit. We'll email you when someone replies.",
  },
]
