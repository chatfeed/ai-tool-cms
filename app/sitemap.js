import { getPublishedTools } from "@/lib/store";
import { locales } from "@/lib/i18n";

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const tools = await getPublishedTools();

  return [
    {
      url: baseUrl,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: new Date()
    },
    ...locales.flatMap((locale) => [
      {
        url: `${baseUrl}/${locale}`,
        lastModified: new Date()
      },
      {
        url: `${baseUrl}/${locale}/tools`,
        lastModified: new Date()
      }
    ]),
    ...tools.map((tool) => ({
      url: `${baseUrl}/${tool.slug}`,
      lastModified: new Date()
    })),
    ...locales.flatMap((locale) => tools.map((tool) => ({
      url: `${baseUrl}/${locale}/${tool.slug}`,
      lastModified: new Date()
    })))
  ];
}
