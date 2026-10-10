import type { MetadataRoute } from "next";
import { allCategories } from "@/catalog/categories";
import { problems, problemsInCategory } from "@/catalog/problems";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...allCategories
      .filter((c) => problemsInCategory(c.id).length > 0)
      .map((c) => ({ url: `${SITE_URL}/categories/${c.id}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...problems.map((p) => ({ url: `${SITE_URL}/problems/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
