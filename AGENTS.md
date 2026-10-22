# Project Architecture

- Keep lunch-menu classification in `src/lib/lunchMenu.ts` as pure ordered rules so UI rendering and tests share one deterministic source of truth.
- Keep school-data requests in `src/lib/lunchData.ts`, called only by the mounted Lunch view with cancellable requests and a lazy online-client import; schedule and alerts read a validated device-local snapshot plus the built-in calendar so launch never depends on the network.
- Register app-shell offline caching only through `src/lib/registerOffline.ts` with the PWA preview guards; generate the worker with vite-plugin-pwa, use NetworkFirst navigations excluding OAuth, and never cache live school API responses.
- Bundle fonts locally so offline rendering preserves the app's typography without third-party font requests.
- Keep calendar synchronization logs service-only and require a dedicated configured scheduler secret before any sync writes; public calendar/menu reads remain anonymous, while unscheduled synchronization fails closed.