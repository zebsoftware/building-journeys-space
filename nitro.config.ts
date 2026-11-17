import { defineConfig } from "nitro";
import { imageOptimization } from "./src/lib/image-delivery";

export default defineConfig({
  vercel: { config: { version: 3, images: imageOptimization } },
});
