/** URL pública do site (usada em metadados, sitemap e robots). */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}
