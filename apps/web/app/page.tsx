import {
  Benefits,
  Footer,
  Hero,
  HowItWorks,
  Navbar,
  Pricing,
  TargetPersonas,
} from "@/components/landing"

export default function Page() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar />
      <Hero />
      <HowItWorks />
      <TargetPersonas />
      <Benefits />
      <Pricing />
      <Footer />
    </main>
  )
}
