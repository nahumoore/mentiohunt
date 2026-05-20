import AZMedia from "@/components/custom-icons/trusted/azmedia"
import Creately from "@/components/custom-icons/trusted/creately"
import G2G from "@/components/custom-icons/trusted/g2g"
import Metrobi from "@/components/custom-icons/trusted/metrobi"
import UserTestimonial from "@/public/landing/user-testimonial.webp"
import { IconStarFilled } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import { IconBrandMentiohunt } from "../custom-icons/brand-mentiohunt"
import { IconBrandReddinbox } from "../custom-icons/trusted/brand-reddinbox"

export function AuthSocialProof() {
  return (
    <aside
      className="relative hidden flex-col justify-between overflow-hidden px-12 py-10 text-primary-foreground lg:flex"
      style={{
        background:
          "linear-gradient(150deg, oklch(0.09 0.05 28) 0%, oklch(0.20 0.13 28) 28%, var(--crimson-carrot) 66%, var(--pumpkin-spice) 100%)",
      }}
    >
      {/* White radial highlights */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top right, oklch(1 0 0 / 0.13), transparent 42%), radial-gradient(ellipse at bottom left, oklch(1 0 0 / 0.07), transparent 46%)",
        }}
      />
      {/* Diagonal texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(135deg, oklch(1 0 0 / 0.10) 12.5%, transparent 12.5%, transparent 50%, oklch(1 0 0 / 0.10) 50%, oklch(1 0 0 / 0.10) 62.5%, transparent 62.5%, transparent 100%)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Logo */}
      <Link
        href="/"
        className="relative flex w-fit items-center gap-2.5 font-semibold transition-opacity hover:opacity-80"
      >
        <div className="flex size-8 items-center justify-center rounded-md bg-primary-foreground/14 ring-1 ring-primary-foreground/18 backdrop-blur-sm">
          <IconBrandMentiohunt className="size-5 rotate-12 text-primary-foreground" />
        </div>
        <span className="text-sm text-primary-foreground">Mentiohunt</span>
      </Link>

      {/* Testimonial */}
      <figure className="relative flex flex-col gap-6">
        {/* Stars */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <IconStarFilled
              key={i}
              size={14}
              className="text-primary-foreground/90"
            />
          ))}
        </div>

        <blockquote className="max-w-lg text-lg leading-relaxed font-semibold text-primary-foreground drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
          I love how easy Mentiohunt makes it to find relevant and high-quality
          websites for link building. We&apos;ve saved so much time using it and
          the results blew my mind!!
        </blockquote>

        <figcaption className="flex items-center gap-3">
          <Image
            src={UserTestimonial}
            alt="Logan Stuart"
            width={40}
            height={40}
            className="rounded-full object-cover ring-2 ring-primary-foreground/20"
          />
          <div>
            <p className="text-sm font-medium text-primary-foreground">
              Logan Stuart
            </p>
            <p className="text-xs text-primary-foreground/72">
              Founder of Elevationvibe
            </p>
          </div>
        </figcaption>
      </figure>

      {/* Trusted by */}
      <div className="relative flex flex-col gap-4">
        <p className="text-xs tracking-widest text-primary-foreground/60 uppercase">
          Trusted by teams at
        </p>
        <div className="flex flex-wrap items-center gap-7">
          <Creately className="h-5 w-auto opacity-60 brightness-0 invert" />
          <Metrobi className="h-5 w-auto opacity-60 brightness-0 invert" />
          <AZMedia className="h-4 w-auto opacity-60 brightness-0 invert" />
          <G2G className="h-5 w-auto opacity-60 brightness-0 invert" />
          <div className="flex items-center gap-2 opacity-60 brightness-0 invert">
            <IconBrandReddinbox className="h-5 w-auto" />
            <span className="text-md">Reddinbox</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
