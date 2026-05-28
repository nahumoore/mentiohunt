import { type NextRequest, NextResponse } from "next/server"

const MOCK_COMPETITORS = [
  {
    id: "1",
    domain: "buzzstream.com",
    name: "BuzzStream",
    da: 68,
    totalBacklinks: 4200,
    gapCount: 4,
    gaps: [
      {
        id: "1-1",
        domain: "backlinko.com",
        name: "Backlinko",
        da: 86,
        url: "https://backlinko.com/link-building-tools",
        type: "Resource Page",
        reason:
          "Links to BuzzStream in their link building tools roundup. A highly-cited resource with strong topical authority in your niche — getting listed here would directly signal relevance to SEO practitioners.",
      },
      {
        id: "1-2",
        domain: "neilpatel.com",
        name: "Neil Patel",
        da: 80,
        url: "https://neilpatel.com/blog/outreach-tools",
        type: "Blog Mention",
        reason:
          "Mentions BuzzStream as a recommended outreach tool in a post that ranks for high-intent queries your audience searches. A direct pitch with a comparison angle could earn you placement.",
      },
      {
        id: "1-3",
        domain: "ahrefs.com",
        name: "Ahrefs Blog",
        da: 90,
        url: "https://ahrefs.com/blog/link-building-tools",
        type: "Resource Page",
        reason:
          "Curated tool list for link building practitioners. Getting listed here provides significant referral authority and trust signal — one of the highest-value placements in the niche.",
      },
      {
        id: "1-4",
        domain: "siegemedia.com",
        name: "Siege Media",
        da: 62,
        url: "https://www.siegemedia.com/seo/link-building-tools",
        type: "Link Roundup",
        reason:
          "Publishes regular roundups of link building tools. Suitable for a direct outreach pitch with a case study or unique angle that differentiates your product.",
      },
    ],
  },
  {
    id: "2",
    domain: "postaga.com",
    name: "Postaga",
    da: 52,
    totalBacklinks: 1800,
    gapCount: 5,
    gaps: [
      {
        id: "2-1",
        domain: "bloggingwizard.com",
        name: "Blogging Wizard",
        da: 73,
        url: "https://bloggingwizard.com/link-building-tools",
        type: "Resource Page",
        reason:
          "Lists outreach tools for content marketers with high referral traffic and strong reader intent. Postaga is featured; a clear product positioning angle could get you included.",
      },
      {
        id: "2-2",
        domain: "growthhackers.com",
        name: "GrowthHackers",
        da: 72,
        url: "https://growthhackers.com",
        type: "Community",
        reason:
          "Postaga is regularly mentioned in GrowthHackers threads on outreach automation. Participating in the community and linking to relevant discussions can surface your product naturally.",
      },
      {
        id: "2-3",
        domain: "digitaldoughnut.com",
        name: "Digital Doughnut",
        da: 58,
        url: "https://www.digitaldoughnut.com/articles/2024/tools-for-link-building",
        type: "Niche Blog",
        reason:
          "Published a link building tools comparison referencing Postaga. Good outreach candidate for a guest contribution or a direct pitch to update their comparison.",
      },
      {
        id: "2-4",
        domain: "respona.com",
        name: "Respona Blog",
        da: 55,
        url: "https://respona.com/blog/link-building-software",
        type: "Competitor Blog",
        reason:
          "Comparison post linking to Postaga. Competitive positioning piece — a well-framed outreach or a contributed section could get you added to their next update.",
      },
      {
        id: "2-5",
        domain: "indiehackers.com",
        name: "Indie Hackers",
        da: 78,
        url: "https://indiehackers.com",
        type: "Community",
        reason:
          "Postaga is referenced in founder threads about outreach and distribution. A strong fit for product-led participation — share a case study or launch post to earn organic mentions.",
      },
    ],
  },
  {
    id: "3",
    domain: "pitchbox.com",
    name: "Pitchbox",
    da: 61,
    totalBacklinks: 2900,
    gapCount: 4,
    gaps: [
      {
        id: "3-1",
        domain: "searchenginejournal.com",
        name: "Search Engine Journal",
        da: 88,
        url: "https://www.searchenginejournal.com/link-building-tools",
        type: "Resource Page",
        reason:
          "SEJ's link building tools guide includes Pitchbox. High-authority editorial placement with strong SEO value — a direct outreach to their editorial team with unique data or a case study is the right angle.",
      },
      {
        id: "3-2",
        domain: "moz.com",
        name: "Moz Blog",
        da: 91,
        url: "https://moz.com/blog/link-building-software",
        type: "Resource Page",
        reason:
          "Moz references Pitchbox in outreach tooling recommendation posts. One of the highest-authority placements in the niche — a guest post or original research angle has the best chance of getting you listed.",
      },
      {
        id: "3-3",
        domain: "contentmarketinginstitute.com",
        name: "Content Marketing Institute",
        da: 84,
        url: "https://contentmarketinginstitute.com/articles/link-building-tools",
        type: "Blog Mention",
        reason:
          "CMI's content marketing tools roundup links to Pitchbox. Strong audience overlap with founders focused on content-led growth — a contributed article or tool spotlight is a natural entry point.",
      },
      {
        id: "3-4",
        domain: "smartblogger.com",
        name: "Smart Blogger",
        da: 76,
        url: "https://smartblogger.com/link-building-tools",
        type: "Link Roundup",
        reason:
          "Publishes link building tool comparisons with strong affiliate presence. An outreach pitch with a demo offer or exclusive discount angle gives you a clear value proposition for inclusion.",
      },
    ],
  },
]

export async function POST(_req: NextRequest) {
  return NextResponse.json({
    competitors: MOCK_COMPETITORS,
    summary: { competitorsFound: 3, totalGaps: 13, highPriority: 5 },
  })
}
