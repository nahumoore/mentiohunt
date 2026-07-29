import type { Metadata } from "next"
import { LegalPage } from "@/components/landing/legal-page"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing your access to and use of Mentiohunt.",
}

const sections = [
  {
    title: "Using Mentiohunt",
    body: [
      "By accessing or using Mentiohunt, you agree to use the product only for lawful business purposes and in a way that does not interfere with the service, other users, or third-party platforms connected to your workflow.",
      "You are responsible for the accuracy of the information you provide, the activity that occurs in your account, and keeping your account credentials secure.",
    ],
  },
  {
    title: "Subscriptions and billing",
    body: [
      "Paid plans renew automatically unless cancelled before the next billing cycle. You authorize us and our payment processors to charge the applicable subscription fees, taxes, and other disclosed charges.",
      "Unless required by law, fees are non-refundable once billed. If pricing or plan structure changes, we will provide notice before the new pricing takes effect for a renewal term.",
    ],
  },
  {
    title: "Product outputs and limits",
    body: [
      "Mentiohunt helps surface backlink and mention opportunities, fit rationale, and outreach drafts, but it does not guarantee outreach responses, placements, traffic, rankings, or business results.",
      "You are responsible for reviewing generated outputs before acting on them, including any suggested contacts, outreach angles, or opportunity recommendations.",
    ],
  },
  {
    title: "Acceptable use",
    body: [
      "You may not misuse the service, reverse engineer the product, attempt unauthorized access, scrape data beyond permitted workflows, upload unlawful content, or use Mentiohunt to send spam or deceptive outreach.",
      "We may suspend or terminate access if we reasonably believe your use creates security, legal, or operational risk.",
    ],
  },
  {
    title: "Liability and changes",
    body: [
      "Mentiohunt is provided on an as-is and as-available basis to the fullest extent permitted by law. We disclaim warranties not expressly stated, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.",
      "We may update these terms from time to time. Continued use of the service after updated terms take effect means you accept the revised terms.",
    ],
  },
] as const

export default function TermsOfServicePage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of Service"
      intro="These terms govern your access to Mentiohunt and clarify the responsibilities, limits, and expectations that apply when using the service."
      updatedAt="May 6, 2026"
      sections={sections.map((section) => ({
        title: section.title,
        body: [...section.body],
      }))}
    />
  )
}
