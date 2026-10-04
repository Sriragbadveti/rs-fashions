import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Maps are only used to give Sentry readable stack traces: they are uploaded and then deleted
    // by scripts/upload-sourcemaps.mjs, never served to visitors.
    sourcemap: "hidden",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("heic2any") || id.includes("heic-to") || id.includes("libheif")) {
              return "heic-converter";
            }
            if (id.includes("recharts") || id.includes("d3-")) {
              return "recharts-vendor";
            }
            if (id.includes("framer-motion") || id.includes("gsap")) {
              return "animation-vendor";
            }
            if (id.includes("@supabase")) {
              return "supabase-vendor";
            }
            if (id.includes("lucide-react") || id.includes("react-icons")) {
              return "icons-vendor";
            }
          }
        },
      },
    },
  },
});