# Project Architecture

- Keep lunch-menu classification in `src/lib/lunchMenu.ts` as pure ordered rules so UI rendering and tests share one deterministic source of truth.