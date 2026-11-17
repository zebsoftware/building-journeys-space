import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { cspNonce } from "./lib/csp-nonce.server";
import { routeTree } from "./routeTree.gen";

const readNonce = createIsomorphicFn()
  .server(() => cspNonce.getStore())
  .client(() => undefined);

export const getRouter = () => {
  const queryClient = new QueryClient();

  const nonce = readNonce();
  const router = createRouter({
    ...(nonce ? { ssr: { nonce } } : {}),
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
