/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@workspace/openrouter",
    "@workspace/supabase",
    "@workspace/ui",
  ],
  turbopack: {},
  outputFileTracingIncludes: {
    "/alternatives/[slug]": ["./resources/alternatives/**"],
    "/blog/[slug]": ["./resources/articles/**"],
    "/backlinks-from/[slug]": ["./resources/backlinks-from/**"],
    "/compare/[slug]": ["./resources/compare/**"],
    "/free-tools/[slug]": ["./resources/free-tools/**"],
  },
  async redirects() {
    return [
      {
        source: "/resources/:slug",
        destination: "/blog/:slug",
        permanent: true,
      },
      {
        source: "/blog/reddit-marketing",
        destination: "/backlinks-from/reddit",
        permanent: true,
      },
      {
        source: "/reddit-monitoring",
        destination: "/backlinks-from/reddit",
        permanent: true,
      },
      {
        source: "/twitter-monitoring",
        destination: "/",
        permanent: true,
      },
      {
        source: "/quora-monitoring",
        destination: "/backlinks-from/quora",
        permanent: true,
      },
      {
        source: "/free-tools/reddit-user-analyzer",
        destination: "/backlinks-from/reddit",
        permanent: true,
      },
      {
        source: "/blog/unlinked-brand-mentions",
        destination: "/blog/how-to-find-backlink-opportunities",
        permanent: true,
      },
      {
        source: "/free-tools/directory-backlink-opportunity-finder",
        destination: "/free-tools/free-directory-submission-sites",
        permanent: true,
      },
      {
        source: "/blog/best-link-building-tools-for-founders",
        destination: "/blog/best-automated-link-building-tools-for-founders",
        permanent: true,
      },
      {
        source: "/link-building-statistics",
        destination: "/link-building-outreach-statistics-2026",
        permanent: true,
      },
      {
        source: "/dashboard/pages",
        destination: "/dashboard/targets",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
