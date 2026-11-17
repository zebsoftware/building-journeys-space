import { PostImage } from "@/components/site/PostImage";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Safely render untrusted blog HTML.
 * Only approved HTML elements and validated URLs are allowed.
 */

const ALLOWED = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "h1",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "ul",
  "ol",
  "li",
  "pre",
  "code",
  "a",
  "img",
  "hr",
]);

const DROP_CONTENTS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "template",
  "noscript",
  "video",
  "audio",
  "canvas",
]);

const MAX_NODES = 5000;
const MAX_DEPTH = 64;
const MAX_HTML_LENGTH = 1_000_000;

function hasControlCharacters(value: string): boolean {
  return Array.from(value).some((char) => {
    const code = char.charCodeAt(0);
    return code <= 31 || code === 127;
  });
}

function safeUrl(raw: string, image = false): string | undefined {
  const candidate = raw.trim();

  if (!candidate || hasControlCharacters(candidate)) {
    return undefined;
  }

  if (candidate.includes("\\") || candidate.startsWith("//")) {
    return undefined;
  }

  if (candidate.startsWith("/")) return candidate;

  try {
    const url = new URL(candidate);
    if (url.username || url.password) return undefined;
    if (url.protocol === "https:" || (!image && ["http:", "mailto:"].includes(url.protocol))) {
      return url.href;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function parseSafeHtml(html: string): ReactNode {
  if (html.length > MAX_HTML_LENGTH) return "This article exceeds the display limit.";

  // Template contents stay inert, including resources in nodes we discard.
  const template = document.createElement("template");
  template.innerHTML = html;

  let remaining = MAX_NODES;

  const render = (node: Node, key: number, depth: number): ReactNode => {
    if (remaining-- <= 0 || depth > MAX_DEPTH) {
      return null;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const element = node as Element;
    const tag = element.tagName.toLowerCase();

    // Completely remove dangerous elements and their children.
    if (DROP_CONTENTS.has(tag)) {
      return null;
    }

    // Void HTML elements cannot receive children in React, even an empty array.
    if (tag === "br") return <br key={key} />;
    if (tag === "hr") return <hr key={key} />;

    const children = renderChildren(element.childNodes, depth + 1);

    // Unknown elements cannot retain attributes.
    if (!ALLOWED.has(tag)) {
      return <span key={key}>{children}</span>;
    }

    // Render only safe hyperlinks.
    if (tag === "a") {
      const href = safeUrl(element.getAttribute("href") ?? "");

      return href ? (
        <a key={key} href={href} rel="nofollow noopener noreferrer" target="_blank">
          {children}
        </a>
      ) : (
        <span key={key}>{children}</span>
      );
    }

    // Render only images with validated URLs.
    if (tag === "img") {
      const src = safeUrl(element.getAttribute("src") ?? "", true);

      return src ? (
        <PostImage
          key={key}
          variant="article"
          sizes="(min-width: 800px) 760px, 94vw"
          src={src}
          alt={(element.getAttribute("alt") ?? "").slice(0, 200)}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : null;
    }

    // Render approved formatting elements without their original attributes.
    const Tag = tag as keyof React.JSX.IntrinsicElements;

    return <Tag key={key}>{children}</Tag>;
  };

  const renderChildren = (nodes: NodeListOf<ChildNode>, depth: number) => {
    const children: ReactNode[] = [];
    for (let index = 0; index < nodes.length && remaining > 0; index++) {
      children.push(render(nodes.item(index), index, depth));
    }
    return children;
  };

  return renderChildren(template.content.childNodes, 0);
}

export function SafeArticle({ html }: { html: string }) {
  const [content, setContent] = useState<ReactNode>(null);

  useEffect(() => {
    setContent(parseSafeHtml(html));
  }, [html]);

  return <div className="article-body mt-8">{content}</div>;
}
