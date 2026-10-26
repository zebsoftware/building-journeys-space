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

  // Block protocol-relative URLs.
  if (candidate.startsWith("//")) {
    return undefined;
  }

  try {
    const url = new URL(candidate, "https://the-founder.invalid");

    if (image) {
      if (!["https:", "http:"].includes(url.protocol)) {
        return undefined;
      }
    } else if (!["https:", "http:", "mailto:"].includes(url.protocol)) {
      return undefined;
    }

    // Allow valid root-relative paths, but not unknown relative URLs.
    if (url.hostname === "the-founder.invalid") {
      return candidate.startsWith("/") && !candidate.startsWith("//") ? candidate : undefined;
    }

    return candidate;
  } catch {
    return undefined;
  }
}

function parseSafeHtml(html: string): ReactNode {
  const doc = new DOMParser().parseFromString(html, "text/html");

  let remaining = MAX_NODES;

  const render = (node: Node, key: number): ReactNode => {
    if (remaining-- <= 0) {
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

    const children = Array.from(element.childNodes).map(render);

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
        <img
          key={key}
          src={src}
          alt={(element.getAttribute("alt") ?? "").slice(0, 200)}
          loading="lazy"
        />
      ) : null;
    }

    // Render approved formatting elements without their original attributes.
    const Tag = tag as keyof React.JSX.IntrinsicElements;

    return <Tag key={key}>{children}</Tag>;
  };

  return Array.from(doc.body.childNodes).map(render);
}

export function SafeArticle({ html }: { html: string }) {
  const [content, setContent] = useState<ReactNode>(null);

  useEffect(() => {
    setContent(parseSafeHtml(html));
  }, [html]);

  return <div className="article-body mt-8">{content}</div>;
}
