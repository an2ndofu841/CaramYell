import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/config/site";
import { getAllMockProjects } from "@/lib/data/mockProjects";

const staticPaths = [
  { path: "/", priority: 1 },
  { path: "/projects", priority: 0.9 },
  { path: "/about", priority: 0.8 },
  { path: "/pricing", priority: 0.7 },
  { path: "/guide", priority: 0.6 },
  { path: "/faq", priority: 0.6 },
  { path: "/contact", priority: 0.5 },
  { path: "/terms", priority: 0.3 },
  { path: "/privacy", priority: 0.3 },
  { path: "/commercial", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    ...staticPaths.map(({ path, priority }) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority,
    })),
    ...getAllMockProjects().map((project) => ({
      url: absoluteUrl(`/projects/${project.slug}`),
      lastModified: new Date(project.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
