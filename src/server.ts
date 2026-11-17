import "./lib/error-capture";

import { cspNonce } from "./lib/csp-nonce.server";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

const productionHosts = new Set([
  "thefounderblogs.com",
  "www.thefounderblogs.com",
  "thefounderblogs.vercel.app",
]);

function csp(nonce: string) {
  const endpoints = new Set<string>([
    "https://ygqonurswpnwwqxfbjpq.supabase.co",
    "wss://ygqonurswpnwwqxfbjpq.supabase.co",
  ]);
  const configured = process.env["SUPABASE_URL"] || import.meta.env["VITE_SUPABASE_URL"];
  if (configured) {
    try {
      const url = new URL(configured);
      endpoints.add(url.origin);
      if (url.protocol === "https:") endpoints.add(`wss://${url.host}`);
    } catch {
      // Invalid environment settings must not weaken the CSP.
    }
  }
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' https: data: blob:",
    `connect-src 'self' ${[...endpoints].join(" ")}`,
    "form-action 'self'",
  ].join("; ");
}

export default {
  async fetch(request: Request) {
    try {
      const handler = await getServerEntry();
      const hostname = new URL(request.url).hostname;
      const production = productionHosts.has(hostname);
      const protect = !import.meta.env.DEV && (production || process.env["VERCEL"] === "1");
      const nonce = protect ? crypto.randomUUID() : undefined;
      const response = await normalizeCatastrophicSsrResponse(
        nonce
          ? await cspNonce.run(nonce, () => handler.fetch(request))
          : await handler.fetch(request),
      );
      if (!nonce || !response.headers.get("content-type")?.includes("text/html")) return response;

      const secured = new Headers(response.headers);
      secured.set("Content-Security-Policy", csp(nonce));
      secured.set("Cache-Control", "private, no-store");
      if (production) secured.set("Cross-Origin-Opener-Policy", "same-origin");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: secured,
      });
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "content-security-policy":
            "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
        },
      });
    }
  },
};
