import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { TOOLS } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const pages = ["", "/como-funciona", "/privacidade", "/termos", "/status", "/apoiar"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "monthly" as const, priority: p === "" ? 1 : 0.5 })),
    ...TOOLS.map((t) => ({ url: `${base}/${t.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
