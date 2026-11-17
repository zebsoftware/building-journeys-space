import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { SpeedInsights } from "@vercel/speed-insights/react";

const routePatterns = [
  [/^\/post\/[^/]+$/, "/post/:slug"],
  [/^\/u\/[^/]+$/, "/u/:username"],
] as const;
const publicRoutes = new Set(["/", "/stories", "/journeys", "/ideas", "/creativity", "/learning"]);

function publicRoute(pathname: string) {
  return publicRoutes.has(pathname)
    ? pathname
    : routePatterns.find(([pattern]) => pattern.test(pathname))?.[1];
}

export default function PerformanceVitals() {
  const { pathname } = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const enable = () => setReady(true);
    if (document.readyState === "complete") enable();
    else window.addEventListener("load", enable, { once: true });
    return () => window.removeEventListener("load", enable);
  }, []);

  const route = publicRoute(pathname);
  return ready && route ? (
    <SpeedInsights
      route={route}
      beforeSend={(data) => {
        // Keep account pages, query strings, and user-specific slugs out of telemetry.
        const url = new URL(data.url, window.location.origin);
        const trackedRoute = publicRoute(url.pathname);
        return trackedRoute && url.origin === window.location.origin
          ? { ...data, route: trackedRoute, url: `${url.origin}${trackedRoute}` }
          : null;
      }}
    />
  ) : null;
}
