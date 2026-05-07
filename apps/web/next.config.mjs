/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@workspace/openrouter",
    "@workspace/supabase",
    "@workspace/ui",
  ],
}

export default nextConfig
