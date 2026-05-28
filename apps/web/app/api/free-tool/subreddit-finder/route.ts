import { type NextRequest, NextResponse } from "next/server"

const MOCK_SUBREDDITS = [
  {
    id: "1",
    name: "r/entrepreneur",
    title: "Entrepreneur",
    members: 1200000,
    activityLevel: "Very Active",
    score: 94,
    category: "Founder Community",
    reason:
      "High-volume community of founders and early-stage operators discussing growth, distribution, and tooling. Regular threads on outreach, link building, and marketing automation align directly with your product.",
    url: "https://reddit.com/r/entrepreneur",
  },
  {
    id: "2",
    name: "r/SEO",
    title: "Search Engine Optimization",
    members: 320000,
    activityLevel: "Very Active",
    score: 91,
    category: "Industry Specific",
    reason:
      "Practitioners actively discuss backlink prospecting, outreach tools, and link building workflows. Your product maps directly to recurring questions about automating outreach and finding link opportunities.",
    url: "https://reddit.com/r/SEO",
  },
  {
    id: "3",
    name: "r/SaaS",
    title: "SaaS",
    members: 178000,
    activityLevel: "Active",
    score: 87,
    category: "Founder Community",
    reason:
      "SaaS founders share growth tactics, tool recommendations, and distribution wins. Threads on community-led growth and backlink building are common and your product would resonate strongly.",
    url: "https://reddit.com/r/SaaS",
  },
  {
    id: "4",
    name: "r/digital_marketing",
    title: "Digital Marketing",
    members: 495000,
    activityLevel: "Very Active",
    score: 83,
    category: "Industry Specific",
    reason:
      "Broad but engaged marketing audience that frequently discusses link building strategy, content distribution, and outreach tools. A good fit for reaching marketers evaluating prospecting solutions.",
    url: "https://reddit.com/r/digital_marketing",
  },
  {
    id: "5",
    name: "r/indiehackers",
    title: "Indie Hackers",
    members: 92000,
    activityLevel: "Active",
    score: 79,
    category: "Founder Community",
    reason:
      "Bootstrapped founder community where product launches, growth experiments, and outreach playbooks are regularly shared. Your target ICP is well-represented here.",
    url: "https://reddit.com/r/indiehackers",
  },
  {
    id: "6",
    name: "r/juststart",
    title: "JustStart",
    members: 74000,
    activityLevel: "Active",
    score: 75,
    category: "Audience Community",
    reason:
      "Content site builders and niche SEOs who run active link building campaigns. Threads on outreach workflows and finding backlink targets are a recurring topic.",
    url: "https://reddit.com/r/juststart",
  },
  {
    id: "7",
    name: "r/startups",
    title: "Startups",
    members: 1100000,
    activityLevel: "Very Active",
    score: 71,
    category: "Founder Community",
    reason:
      "Large founder-adjacent community with lower signal-to-noise ratio but significant reach. Worth monitoring for threads specifically about distribution and backlink strategy.",
    url: "https://reddit.com/r/startups",
  },
]

export async function POST(_req: NextRequest) {
  return NextResponse.json({
    subreddits: MOCK_SUBREDDITS,
    summary: { found: 23, scored: 23, highFit: 5 },
  })
}
