import {
  Benefits,
  Footer,
  Hero,
  HowItWorks,
  Navbar,
  Pricing,
  TargetPersonas,
  Testimonials,
} from "@/components/landing"

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <HowItWorks />
      <TargetPersonas />
      <Benefits />
      <Testimonials />
      <Pricing />
      <Footer />
    </main>
  )
}
