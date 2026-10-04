import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { getAllPages, getPage } from "@/lib/content";

// Standalone pages (About, Bylaws) come from content/pages/*.md.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPages().map((page) => ({ page: page.slug }));
}

export async function generateMetadata(props: PageProps<"/[page]">): Promise<Metadata> {
  const page = getPage((await props.params).page);
  return page ? { title: page.title, alternates: { canonical: `/${page.slug}` } } : {};
}

export default async function ContentPage(props: PageProps<"/[page]">) {
  const page = getPage((await props.params).page);
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 pt-12">
      <h1 className="font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl">{page.title}</h1>
      <div className="post-body prose prose-lg mt-8 max-w-none">
        <Markdown source={page.body} />
      </div>
    </article>
  );
}
