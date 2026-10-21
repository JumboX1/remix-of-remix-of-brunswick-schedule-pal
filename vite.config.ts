import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// Workbox serializes these callbacks into the worker, where self is defined.
declare const self: { location: { origin: string } };

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), VitePWA({
    strategies: "generateSW",
    filename: "sw.js",
    registerType: "autoUpdate",
    injectRegister: null,
    manifest: false,
    devOptions: { enabled: false },
    includeAssets: ["favicon.ico", "pwa-192.png", "pwa-512.png", "manifest.webmanifest"],
    workbox: {
      globPatterns: ["**/*.{js,css,html,woff,woff2,webp,png,ico}"],
      navigateFallback: undefined,
      // Keep the precached shell off navigation URLs so HTML is NetworkFirst.
      directoryIndex: null,
      ignoreURLParametersMatching: [],
      manifestTransforms: [async (entries) => ({
        manifest: entries.map((entry) => entry.url === "index.html"
          ? { ...entry, url: "index.html?__offline_shell=1" } : entry),
        warnings: [],
      })],
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          urlPattern: ({ request, url }) => request.mode === "navigate" &&
            url.origin === self.location.origin && !url.pathname.startsWith("/~oauth"),
          handler: "NetworkFirst",
          options: {
            cacheName: "wickcentral-pages",
            networkTimeoutSeconds: 3,
            cacheableResponse: { statuses: [200] },
            expiration: { maxEntries: 10 },
            precacheFallback: { fallbackURL: "/index.html?__offline_shell=1" },
          },
        },
        {
          urlPattern: ({ url }) => url.origin === self.location.origin &&
            /^\/assets\/.+-[\w-]+\.(?:js|css|woff2?|webp|png)$/.test(url.pathname),
          handler: "CacheFirst",
          options: { cacheName: "wickcentral-assets", expiration: { maxEntries: 100 } },
        },
      ],
    },
  })].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
