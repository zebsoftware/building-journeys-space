import { useEffect, useState } from "react";

/**
 * Render untrusted rich text without injecting HTML into the page.
 * Only a small collection of editorial tags and explicitly validated URLs
 * are reconstructed as React elements. Unknown elements are unwrapped.
 */
const ALLOWED = new Set(["p", "br", "strong", "b", "em", "i", "u", "s", "h1", "h2", "h3", "h4", "blockquote", "ul", "ol", "li", "pre", "code", "a", "img", "hr"]);
const DROP_CONTENTS = new Set(["script", "style", "iframe", "object", "embed", "svg", "math", "form", "input", "button", "textarea", "select", "template", "noscript", "video", "audio", "canvas"]);
const MAX_NODES = 5000;
function safeUrl(raw: string, image = false): string | undefined {
  const candidate = raw.trim();
  if (!candidate || /[\u0000-\u001f\u007f]/.test(candidate)) return;
  try {
    const url = new URL(candidate, "https://the-founder.invalid");
    if (image) {
      if (url.protocol !== "https:" && url.protocol !== "http:") return;
    } else if (!["https:", "http:", "mailto:"].includes(url.protocol)) return;
    // Do not permit protocol-relative URLs or untrusted relative hosts.
    if (candidate.startsWith("//")) return;
    if (url.hostname === "the-founder.invalid") {
      if (image) return candidate.startsWith("/") && !candidate.startsWith("//") ? candidate : undefined;
      return candidate.startsWith("/") && !candidate.startsWith("//") ? candidate : undefined;
    }
    return candidate;
  } catch {
    return;
  }
}

function parseSafeHtml(html: string): React.ReactNode {
  const doc = new DOMParser().parseFromString(html, "text/html");
  let remaining = MAX_NODES;
  const render = (node: Node, key: number): React.ReactNode => {
    if (remaining-- <= 0) return null;
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const element = node as Element;
    const tag = element.tagName.toLowerCase();
    if (DROP_CONTENTS.has(tag)) return null;
    const children = Array.from(element.childNodes).map(render);
    if (!ALLOWED.has(tag)) return <span key={key}>{children}</span>;
    if (tag === "a") {
      const href = safeUrl(element.getAttribute("href") ?? "");
      return href ? <a key={key} href={href} rel="nofollow noopener noreferrer" target="_blank">{children}</a> : <span key={key}>{children}</span>;
    }
    if (tag === "img") {
      const src = safeUrl(element.getAttribute("src") ?? "", true);
      return src ? <img key={key} src={src} alt={(element.getAttribute("alt") ?? "").slice(0, 200)} loading="lazy" /> : null;
    }
    const Tag = tag as keyof React.JSX.IntrinsicElements;
    return <Tag key={key}>{children}</Tag>;
  };
  return Array.from(doc.body.childNodes).map(render);
}

export function SafeArticle({ html }: { html: string }) {
  const [content, setContent] = useState<React.ReactNode>(null);
  useEffect(() => {
    setContent(parseSafeHtml(html));
  }, [html]);
  return <div className="article-body mt-8">{content}</div>;
}
