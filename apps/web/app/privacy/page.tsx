import type { Metadata } from "next"
import { LegalPage } from "@/components/landing/legal-page"

export const metadata: Metadata = {
  title: "Privacy Policy – Mentiohunt",
  description: "How Mentiohunt collects, uses, and protects your information.",
}

const sections = [
  {
    title: "What we collect",
    body: [
      "When you create an account, join a waitlist, or use Mentiohunt, we may collect information such as your name, email address, billing details, workspace inputs, competitors, keywords, and other data you provide to run backlink prospecting workflows.",
      "We also collect routine product and device information like log data, browser type, usage events, and approximate location so we can secure the service, understand usage, and improve reliability.",
    ],
  },
  {
    title: "How we use information",
    body: [
      "We use your information to operate Mentiohunt, generate opportunity queues, personalize discovery results, process payments, communicate product updates, and provide support.",
      "We may also use aggregated or de-identified usage data to improve ranking quality, fix bugs, prevent abuse, and guide product decisions.",
    ],
  },
  {
    title: "How data is shared",
    body: [
      "We do not sell your personal information. We may share data with service providers that help us host the product, process payments, analyze usage, send transactional messages, or support core operations, but only for those purposes.",
      "We may disclose information if required by law, to enforce our terms, or to protect the rights, safety, and security of Mentiohunt, our users, or the public.",
    ],
  },
  {
    title: "Data retention and security",
    body: [
      "We keep information for as long as needed to provide the service, comply with legal obligations, resolve disputes, and enforce agreements. Retention periods may vary based on the type of data and your account status.",
      "We use reasonable administrative, technical, and organizational safeguards to protect your information, but no method of transmission or storage is completely secure.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You can request access, correction, or deletion of your personal information, subject to legal and operational limits. You can also opt out of non-essential marketing emails by using the unsubscribe link in those messages.",
      "If you have privacy questions or requests, contact us before sharing sensitive information you do not want stored in the product.",
    ],
  },
] as const

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="This policy explains what information Mentiohunt collects, how we use it, and the choices you have when using the product."
      updatedAt="May 6, 2026"
      sections={sections.map((section) => ({
        title: section.title,
        body: [...section.body],
      }))}
    />
  )
}
