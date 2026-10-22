# Offline-first app

- [x] Remove startup school-data requests; retain saved calendar exceptions.
- [x] Fetch live school data only from Lunch and provide clear offline/cache states.
- [x] Add guarded published-app offline caching without caching live data.
- [x] Test request boundaries, calendar persistence, and offline navigation.

Published cold-launch caching is configured and its generated worker validated; the editor intentionally does not register it.

# Final security review

- [ ] Restrict operational logs and privileged calendar synchronization.
- [ ] Update vulnerable dependencies and review security settings.
- [ ] Verify public lunch, offline schedule, tests, and final security scan.