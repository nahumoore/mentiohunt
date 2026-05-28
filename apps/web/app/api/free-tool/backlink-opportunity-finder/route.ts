import { type NextRequest, NextResponse } from "next/server"

const MOCK_OPPORTUNITIES = [
  {
    id: "1",
    domain: "indiehackers.com",
    name: "Indie Hackers",
    type: "Community",
    score: 91,
    da: 78,
    url: "https://indiehackers.com",
    reason:
      "Active community of bootstrapped founders discussing growth and distribution. Your product fits several recurring threads on backlink building and SEO for early-stage SaaS.",
  },
  {
    id: "2",
    domain: "ahrefs.com",
    name: "Ahrefs Blog",
    type: "Resource Page",
    score: 87,
    da: 90,
    url: "https://ahrefs.com/blog",
    reason:
      "Maintains curated resource lists for link building tools. A guest contribution or tool mention in a roundup post would align well with their audience of SEO practitioners.",
  },
  {
    id: "3",
    domain: "backlinko.com",
    name: "Backlinko",
    type: "Link Roundup",
    score: 84,
    da: 86,
    url: "https://backlinko.com",
    reason:
      "Publishes link building roundups and tool reviews targeting SEOs and content marketers. High topical overlap with your product's core use case.",
  },
  {
    id: "4",
    domain: "growthhackers.com",
    name: "GrowthHackers",
    type: "Community",
    score: 79,
    da: 72,
    url: "https://growthhackers.com",
    reason:
      "Distribution-focused community where founders share outreach tactics. Your product could be featured in discussions on scalable backlink acquisition strategies.",
  },
  {
    id: "5",
    domain: "niche-site-project.com",
    name: "Niche Site Project",
    type: "Niche Blog",
    score: 76,
    da: 58,
    url: "https://nichesiteproject.com",
    reason:
      "Covers link building workflows in depth for content site builders. Audience actively seeks tools that reduce manual outreach effort.",
  },
  {
    id: "6",
    domain: "thegoodcontent.co",
    name: "The Good Content",
    type: "Guest Post",
    score: 71,
    da: 44,
    url: "https://thegoodcontent.co",
    reason:
      "Accepts guest posts from SaaS founders on growth and distribution topics. Good fit for a tactical piece on using backlink prospecting as a repeatable channel.",
  },
]

export async function POST(_req: NextRequest) {
  return NextResponse.json({
    opportunities: MOCK_OPPORTUNITIES,
    summary: { found: 12, scored: 12, highFit: 5 },
  })
}
