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
    "/features/[slug]": ["./resources/free-tools/**"],
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
        destination: "/blog/how-to-find-backlink-opportunities",
        permanent: true,
      },
      {
        source: "/reddit-monitoring",
        destination: "/blog/how-to-find-backlink-opportunities",
        permanent: true,
      },
      {
        source: "/twitter-monitoring",
        destination: "/blog/how-to-find-backlink-opportunities",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
