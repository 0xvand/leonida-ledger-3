# Leonida Ledger — Week One Edition

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/0xvand/leonida-ledger-3/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/0xvand/leonida-ledger-3/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI, built for the make.fun bounty [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01).

## What it does

- **Every trophy, guided.** All 55 trophies with their official PlayStation name, description and grade, plus an earn guide in our own words — concrete steps, not a restated description — with the sources for each trophy named beside its guide.
- **Live week-one rarity.** Each trophy shows its current earn rate from Exophase (read 21 November 2026, two days after launch) and a rarity band from Common to Ultra Rare, so you can see at a glance what the field has and has not done yet.
- **Missable warnings with receipts.** Seven trophies carry missable flags, each tied to a named source: the five stranger-strand finales whose chains sit in windows tied to story progress (TechWiser), Positive Mental Attitude, the one possibly-missable trophy on the list (GTABase / PowerPyx), and the choice-driven Actions Speak Louder.
- **A platinum roadmap.** Nine stages in the efficient order, with hour estimates per stage, the missables called out inside their stages, and a point-of-no-return warning before the finale.
- **A real tracker.** Check off trophies as you earn them; progress (and the spoiler-shield preference) persists in localStorage across reloads, and Export/Import moves it between machines as a JSON file. Filters by kind (story, missable, collectibles, activities) and by secret trophies, tier filter, full-text search, and sorting by guide order, tier, name or live rarity. The spoiler shield hides secret trophies' names and descriptions until they are earned.
- **Fully offline.** Static files only; the app fetches nothing but its own `app/data/trophies.json`. No Rockstar logos, artwork or game screenshots — the look is its own.

## Layout

- `app/` — the guide itself: `index.html`, `style.css`, `js/` (store, filters, render, roadmap, app entry) and `data/trophies.json` with all 55 trophies.
- `screenshots/` — four captures of the running app, described in `shots.json`.
- `main.ts` — the hand-in program: copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored `buildDossier`.
- `tools/capture.mjs` — how the screenshots were taken (Chromium over the DevTools protocol, app served from disk by request interception).

## Run it locally

```sh
node serve.ts          # serves app/ at http://localhost:8080
```

## License

MIT — see `LICENSE`.
