import "server-only";
import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import type { ComponentProps } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { imageSize } from "image-size";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSlug);

const MAX_CONTENT_WIDTH = 720;

// Local images go through next/image so visitors get resized WebP/AVIF.
// A `width` on the <img> (set in the old WordPress editor) caps display size.
function ContentImage({ src, alt, width }: ComponentProps<"img">) {
  if (typeof src !== "string" || !src.startsWith("/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src as string} alt={alt ?? ""} loading="lazy" />;
  }
  const intrinsic = imageSize(fs.readFileSync(path.join(process.cwd(), "public", src)));
  const displayWidth = Math.min(Number(width) || intrinsic.width, intrinsic.width, MAX_CONTENT_WIDTH);
  const displayHeight = Math.round((intrinsic.height / intrinsic.width) * displayWidth);
  return (
    <Image
      src={src}
      alt={alt ?? ""}
      width={displayWidth}
      height={displayHeight}
      sizes={`(max-width: ${displayWidth + 32}px) calc(100vw - 32px), ${displayWidth}px`}
      className="mx-auto h-auto max-w-full rounded-lg"
    />
  );
}

export function Markdown({ source }: { source: string }) {
  const tree = processor.runSync(processor.parse(source));
  return toJsxRuntime(tree, {
    Fragment,
    jsx,
    jsxs,
    components: { img: ContentImage },
  });
}
