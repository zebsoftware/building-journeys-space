/**
 * Automatically generated Lovable preview authentication storage.
 * Synchronizes authentication across trusted preview surfaces.
 */

export function brokeredPreviewStorage() {
  if (typeof window === "undefined") return undefined;

  const host = window.location.hostname;

  const PREVIEW_ZONES = [
    "lovableproject.com",
    "lovableproject-dev.com",
    "lovable.app",
    "gpt-eng.com",
    "gptengineer.run",
  ];

  const onPreviewZone = PREVIEW_ZONES.some((zone) => host === zone || host.endsWith("." + zone));

  const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";

  const projectId = onPreviewZone
    ? (host.match(
        new RegExp("^(?:id-preview(?:-[a-z0-9]+)?|project)--(" + UUID + ")(?:-dev)?(?=\\.|$)", "i"),
      )?.[1] ?? host.match(new RegExp("^(" + UUID + ")(?=[.-])", "i"))?.[1])
    : undefined;

  const framed = window.parent !== window;

  if (!projectId || !framed) {
    return window.localStorage;
  }

  const dev = host.endsWith(".lovableproject-dev.com") || host.endsWith(".gpt-eng.com");

  const EDITOR = dev
    ? /^https:\/\/([a-z0-9-]+\.)*(lovable\.dev|gptengineer\.app)$|^http:\/\/localhost:3000$/
    : /^https:\/\/([a-z0-9-]+\.)*(lovable\.dev|gptengineer\.app)$/;

  let ancestor = "";

  try {
    ancestor =
      window.location.ancestorOrigins?.[0] ||
      (document.referrer ? new URL(document.referrer).origin : "");
  } catch {
    ancestor = "";
  }

  // Only communicate with a verified trusted editor origin.
  // If the embedding origin cannot be established, use local storage.
  if (!ancestor || !EDITOR.test(ancestor)) {
    return window.localStorage;
  }

  const editorOrigins = [ancestor];

  const RESULT = "lovable-preview-auth:result";
  const TIMEOUT = 2000;
  const RETRY_DELAY = 250;

  const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

  const request = (
    type: string,
    key: string,
    value?: string,
  ): Promise<{ ok: boolean; value?: string | null } | null> =>
    new Promise((resolve) => {
      const requestId = newId();

      let done = false;

      const onMessage = (event: MessageEvent) => {
        if (!editorOrigins.includes(event.origin)) return;

        if (event.source !== window.parent) return;

        const data = event.data;

        if (data && data.type === RESULT && data.requestId === requestId) {
          finish(data);
        }
      };

      const timer = setTimeout(() => {
        finish(null);
      }, TIMEOUT);

      const finish = (result: { ok: boolean; value?: string | null } | null) => {
        if (done) return;

        done = true;

        clearTimeout(timer);

        window.removeEventListener("message", onMessage);

        resolve(result);
      };

      window.addEventListener("message", onMessage);

      const message: Record<string, unknown> = {
        type,
        requestId,
        projectId,
        key,
      };

      if (value !== undefined) {
        message["value"] = value;
      }

      // Send messages only to the validated editor origin.
      for (const origin of editorOrigins) {
        window.parent.postMessage(message, origin);
      }
    });

  let firstGet = true;

  return {
    getItem: async (key: string) => {
      let result = await request("lovable-preview-auth:get", key);

      if (!result && firstGet) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, RETRY_DELAY);
        });

        result = await request("lovable-preview-auth:get", key);
      }

      firstGet = false;

      if (result && result.ok && typeof result.value === "string") {
        if (result.value === "") {
          window.localStorage.removeItem(key);
          return null;
        }

        return result.value;
      }

      return window.localStorage.getItem(key);
    },

    setItem: (key: string, value: string) => {
      window.localStorage.setItem(key, value);

      return request("lovable-preview-auth:set", key, value).then(() => undefined);
    },

    removeItem: (key: string) => {
      window.localStorage.removeItem(key);

      return request("lovable-preview-auth:remove", key).then(() => undefined);
    },
  };
}
