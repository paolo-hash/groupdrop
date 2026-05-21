import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://groupdrop.com";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE_URL, changeFrequency: "daily", priority: 1 },
  { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE_URL}/faq`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${BASE_URL}/cookies`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${BASE_URL}/terms-of-sale`, changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let dropRoutes: MetadataRoute.Sitemap = [];

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/drops?select=slug,updated_at`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        next: { revalidate: 3600 },
      }
    );

    if (res.ok) {
      const drops: { slug: string; updated_at?: string }[] = await res.json();
      dropRoutes = drops.map((drop) => ({
        url: `${BASE_URL}/drops/${drop.slug}`,
        changeFrequency: "daily" as const,
        priority: 0.9,
        lastModified: drop.updated_at ? new Date(drop.updated_at) : undefined,
      }));
    }
  } catch {
    // silently omit drop routes if the fetch fails
  }

  return [...STATIC_ROUTES, ...dropRoutes];
}
