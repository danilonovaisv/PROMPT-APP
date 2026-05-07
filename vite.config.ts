import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Audit Fix #13: Bundle analysis
// Ativa com: ANALYZE=true pnpm build
// Requer: pnpm add -D rollup-plugin-visualizer
const shouldAnalyze = process.env.ANALYZE === 'true';
const shouldEnableSentryBuild = process.env.CI === 'true' || process.env.SENTRY_BUILD_PLUGIN === 'true';

// Lazy-load do visualizer para não quebrar builds sem o pacote instalado
async function getPlugins() {
  const base = [
    react(),
    sentryVitePlugin({
      org: "dannovaisv",
      project: "javascript-react",
      disable: !shouldEnableSentryBuild,
      telemetry: false,
    }),
  ];

  if (shouldAnalyze) {
    try {
      const { visualizer } = await import('rollup-plugin-visualizer' as never);
      base.push((visualizer as CallableFunction)({
        open: true,
        filename: 'stats.html',
        gzipSize: true,
        brotliSize: true,
      }));
    } catch {
      console.warn('[vite] rollup-plugin-visualizer não instalado. Execute: pnpm add -D rollup-plugin-visualizer');
    }
  }

  return base;
}

export default defineConfig(async () => ({
  plugins: await getPlugins(),
  resolve: {
    alias: { "@": "/src" },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) return "vendor-react";
          if (id.includes("dexie")) return "vendor-db";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("lucide-react")) return "vendor-icons";
          return "vendor";
        },
      },
    },
    chunkSizeWarningLimit: 500,
    sourcemap: shouldEnableSentryBuild ? 'hidden' : false,
  },
  server: {
    port: 5174,
    strictPort: false,
    host: true,
  },
}));
