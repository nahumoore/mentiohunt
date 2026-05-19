/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@workspace/openrouter",
    "@workspace/supabase",
    "@workspace/ui",
  ],
  turbopack: {},
}

export default nextConfig
