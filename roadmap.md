# Offline-first app

- [x] Remove startup school-data requests; retain saved calendar exceptions.
- [x] Fetch live school data only from Lunch and provide clear offline/cache states.
- [x] Add guarded published-app offline caching without caching live data.
- [x] Test request boundaries, calendar persistence, and offline navigation.

Published cold-launch caching is configured and its generated worker validated; the editor intentionally does not register it.

# Final security review

- [x] Restrict operational logs and privileged calendar synchronization.
- [x] Update vulnerable production dependencies and review security settings.
- [x] Verify public lunch, offline schedule, tests, and final security scan.

Verified 272 tests, public log/sync denial, real lunch caching, and offline calendar navigation. No production dependency advisories or critical/warning backend findings remain. Calendar synchronization was not scheduled on this remixed backend and now fails closed unless a trusted scheduler secret is configured; built-in calendar and Lunch updates continue working. Development-tool audit advisories remain in the platform's Vite 5/Tailwind 3 toolchain; a major toolchain migration is outside this release.