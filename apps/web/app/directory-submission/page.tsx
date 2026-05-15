import type { Metadata } from "next"

import { Footer, Navbar } from "@/components/landing"
import {
  IconLinkPlus,
  IconRosetteDiscountCheck,
  IconSend,
} from "@tabler/icons-react"

import { DirectorySubmissionForm } from "./submission-form"

const workflow = [
  {
    title: "You submit your directory",
    description:
      "Share the directory, the submission URL, and the details founders should know before listing.",
    icon: IconSend,
  },
  {
    title: "We review the fit",
    description:
      "We look for active submission pages, clear value for founders, and a listing flow we can confidently surface to users.",
    icon: IconRosetteDiscountCheck,
  },
  {
    title: "Approved directories get demand",
    description:
      "If approved, your directory joins Mentiohunt's opportunity list, can earn a Mentiohunt backlink, and can receive recurring founder submissions.",
    icon: IconLinkPlus,
  },
]

const faqs = [
  {
    question: "What kinds of directories are a strong fit?",
    answer:
      "Startup directories, SaaS directories, founder communities, launch lists, and niche submission sites with a clear listing workflow are the best fit.",
  },
  {
    question: "Do you guarantee inclusion?",
    answer:
      "No. We only add directories that appear active, useful for founders, and safe to recommend inside a recurring backlink workflow.",
  },
]

export const metadata: Metadata = {
  title: "Directory Submission",
  description:
    "Submit your directory to Mentiohunt for review. If approved, it can be added to our founder-facing opportunity list and earn recurring visibility.",
  alternates: {
    canonical: "/directory-submission",
  },
  openGraph: {
    title: "Directory Submission",
    description:
      "Submit your directory to Mentiohunt for review. If approved, it can be added to our founder-facing opportunity list and earn recurring visibility.",
    url: "https://mentiohunt.com/directory-submission",
    siteName: "Mentiohunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Directory Submission",
    description:
      "Submit your directory to Mentiohunt for review and potential inclusion in our founder-facing submission list.",
  },
}

export default function DirectorySubmissionPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar overlay />

      <section className="relative overflow-hidden bg-background pt-28 pb-20 sm:pt-32 sm:pb-24 lg:pt-36 lg:pb-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-[-9rem] top-24 h-[26rem] w-[26rem] rounded-full bg-blaze-orange/10 blur-[120px]" />
          <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-glow/8 blur-[110px]" />
        </div>

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[0.7rem] font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase">
              Directory Submission
            </span>
            <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
            <h1 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.065em] text-balance sm:text-6xl lg:text-[4.8rem] lg:leading-[0.92]">
              Turn your directory into a recurring founder intake channel.
            </h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
              Submit your own directory for review. If approved, we can add it
              to the Mentiohunt opportunity list, send founders your way, and
              feature a backlink from our directory resource layer.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-3">
            {workflow.map((item) => {
              const Icon = item.icon
              return (
                <article
                  key={item.title}
                  className="rounded-[1.5rem] border border-border/70 bg-card/80 p-6 backdrop-blur-sm"
                >
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                    <Icon size={20} stroke={2.2} />
                  </div>
                  <h2 className="mt-4 font-heading text-lg font-semibold tracking-tight">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-5rem] top-24 h-64 w-64 rounded-full bg-princeton-orange/7 blur-[100px]" />
          <div className="absolute right-[-4rem] bottom-0 h-72 w-72 rounded-full bg-amber-glow/10 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase">
            Submit Your Directory
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            Send the details once. Keep the founder demand flowing.
          </h2>
        </div>

        <div className="mx-auto mt-14 max-w-3xl px-4 sm:px-6 lg:px-8">
          <DirectorySubmissionForm />
        </div>
      </section>

      <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-8 h-64 w-64 -translate-x-1/2 rounded-full bg-blaze-orange/8 blur-[110px]" />
        </div>

        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase">
            Review Notes
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            Clear expectations before you submit.
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-3xl space-y-4 px-4 sm:px-6 lg:px-8">
          {faqs.map((item) => (
            <article
              key={item.question}
              className="rounded-[1.5rem] border border-border bg-card/80 p-6"
            >
              <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground">
                {item.question}
              </h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {item.answer}
              </p>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  )
}
