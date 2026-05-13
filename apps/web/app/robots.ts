import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/onboarding",
        "/signin",
        "/signup",
        "/confirm",
        "/expired-trial",
      ],
    },
    sitemap: "https://mentiohunt.com/sitemap.xml",
  }
}
