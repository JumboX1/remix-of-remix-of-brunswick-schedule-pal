# Project Architecture

- Keep lunch-menu classification in `src/lib/lunchMenu.ts` as pure ordered rules so UI rendering and tests share one deterministic source of truth.
- Keep school-data requests inside the mounted Lunch view; schedule and alerts read the built-in calendar plus a validated device-local snapshot so launch never depends on the network.
- Register app-shell offline caching only through `src/lib/registerOffline.ts` with the PWA preview guards; generate the worker with vite-plugin-pwa, use NetworkFirst navigations excluding OAuth, and never cache live school API responses.
- Bundle fonts locally so offline rendering preserves the app's typography without third-party font requests.