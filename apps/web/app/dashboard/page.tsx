import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@workspace/ui/components/breadcrumb"
import { Separator } from "@workspace/ui/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"

const opportunities = [
  {
    name: "SaaS Roundup",
    type: "Listicle",
    fit: "Covers bootstrapped growth tools and already mentions two competitors.",
    nextStep: "Pitch Mentions as the backlink prospecting option for founders.",
  },
  {
    name: "Indie Launch Directory",
    type: "Directory",
    fit: "Accepts self-serve submissions from small SaaS products with clear positioning.",
    nextStep: "Submit the product with a short value prop focused on weekly opportunity discovery.",
  },
  {
    name: "SEO Ops Resources",
    type: "Resource page",
    fit: "Curates tools for lean SEO workflows and links to outreach prep resources.",
    nextStep: "Ask to be added with an angle around explainable backlink opportunities.",
  },
]

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Opportunities</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          <section className="rounded-2xl border bg-card p-6">
            <div className="max-w-3xl space-y-2">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                Opportunities
              </h1>
              <p className="text-sm text-muted-foreground">
                Focus this week on the backlink opportunities that are easiest to explain,
                prioritize, and act on.
              </p>
            </div>
          </section>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">Ready this week</p>
              <p className="mt-2 text-3xl font-semibold">12</p>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">High-fit prospects</p>
              <p className="mt-2 text-3xl font-semibold">5</p>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">Needs contacts</p>
              <p className="mt-2 text-3xl font-semibold">3</p>
            </div>
          </section>
          <section className="rounded-2xl border bg-card">
            <div className="border-b px-6 py-4">
              <h2 className="font-medium">This week&apos;s queue</h2>
            </div>
            <div className="divide-y">
              {opportunities.map((opportunity) => (
                <article key={opportunity.name} className="space-y-3 px-6 py-5">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-medium">{opportunity.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {opportunity.type}
                      </p>
                    </div>
                    <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      Strong fit
                    </span>
                  </div>
                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <div>
                      <p className="font-medium">Why it fits</p>
                      <p className="mt-1 text-muted-foreground">{opportunity.fit}</p>
                    </div>
                    <div>
                      <p className="font-medium">Next step</p>
                      <p className="mt-1 text-muted-foreground">
                        {opportunity.nextStep}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
