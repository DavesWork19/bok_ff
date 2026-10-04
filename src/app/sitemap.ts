import type { MetadataRoute } from "next";
import { getAllPages, getAllPosts } from "@/lib/content";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  return [
    { url: siteUrl, lastModified: posts[0]?.date },
    { url: `${siteUrl}/rankings`, lastModified: posts[0]?.date },
    ...getAllPages().map((page) => ({ url: `${siteUrl}/${page.slug}` })),
    ...posts.map((post) => ({ url: `${siteUrl}/rankings/${post.slug}`, lastModified: post.date })),
  ];
}
