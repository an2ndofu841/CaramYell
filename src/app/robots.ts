import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/api", "/auth", "/back"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
