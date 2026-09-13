# Match the 2026 fall daily planner

## Goal
Make every app schedule from September 14 through November 20 match the uploaded Brunswick Upper School planner.

## Changes
- Reset the seven-day block rotation so September 14 is Day 1 (A–E), then skip Yom Kippur and Columbus Day without advancing the rotation.
- Match the normal weekday templates shown in the planner: Monday Morning Meeting and Flex, Tuesday Flex, Wednesday delayed start, Thursday Assembly, and Friday timing.
- Add exact date-specific schedules for September 17; October 1, 13, 15, 29, and 30; November 2, 5, 9, and 12.
- Preserve grade-specific and per-block lunch timing wherever the planner splits grades 9–10 from grades 11–12.
- Add comprehensive tests for every photographed school date, all no-school dates, block order, special event labels, and exact start/end times.

## Verification
Run the schedule tests and check the app’s current build status after the changes.

## Technical details
Use explicit date overrides only for genuinely adjusted days. Keep reusable normal-day timing in the weekday schedule builder so later dates remain maintainable.
