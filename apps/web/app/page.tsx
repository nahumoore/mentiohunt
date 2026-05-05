import { Footer, Hero, HowItWorks, Navbar, Pricing, TargetPersonas } from "@/components/landing"

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <HowItWorks />
      <TargetPersonas />
      <Pricing />
      <Footer />
    </main>
  )
}
