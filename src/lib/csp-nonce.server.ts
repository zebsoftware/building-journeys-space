import { AsyncLocalStorage } from "node:async_hooks";

// Each SSR request has its own nonce, including overlapping renders.
export const cspNonce = new AsyncLocalStorage<string>();
