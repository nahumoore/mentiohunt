import {
  IconArrowRight,
  IconBuildingSkyscraper,
  IconCloudComputing,
  IconGavel,
  IconRocket,
  IconShoppingCart,
} from "@tabler/icons-react"

export const playbook = [
  {
    step: "01",
    title: "Match the tactic to how the industry actually links",
    text: "Legal sites cite sources differently than SaaS blogs. Real estate roundups work differently than ecommerce gift guides. Pick the tactic your niche's editors already say yes to, not a generic outreach template.",
  },
  {
    step: "02",
    title: "Find sites that publish for your exact audience",
    text: "A backlink from a site that never talks to your buyer is dead weight. Prioritize publications, directories, and blogs your prospects already read before chasing raw domain authority.",
  },
  {
    step: "03",
    title: "Lead with the page that earns the link",
    text: "Original data, a sharper comparison, or a founder's real operating experience gets cited. A thin product page rarely does, no matter how well the outreach email is written.",
  },
  {
    step: "04",
    title: "Keep the queue moving, not just the first campaign",
    text: "Most link building for a niche fails after the first burst of outreach. Treat it as a recurring queue tied to new content, not a one-time sprint.",
  },
] as const

export const relatedResources = [
  {
    label: "Pillar guide",
    title: "How to Find Backlink Opportunities",
    href: "/blog/how-to-find-backlink-opportunities",
    description:
      "The broader workflow for discovering, scoring, and prioritizing link opportunities before you narrow in on an industry-specific playbook.",
  },
  {
    label: "Product angle",
    title: "Mentiohunt Discovery Queue",
    href: "/signup",
    description:
      "Turn your articles, competitors, and keywords into a recurring queue of backlink opportunities scored for your specific industry and audience.",
  },
] as const

export function getNicheCardIcon(slug: string) {
  if (slug === "lawyers") return IconGavel
  if (slug === "saas") return IconCloudComputing
  if (slug === "real-estate") return IconBuildingSkyscraper
  if (slug === "startups") return IconRocket
  if (slug === "ecommerce") return IconShoppingCart
  return IconArrowRight
}

export { IconArrowRight }
