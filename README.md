# token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/zhangtt08/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/zhangtt08/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A token launch radar for make.fun's "Build the best token launch radar" bounty. It reads a sealed DefiLlama snapshot (758 protocols, as of 2026-11-14) and prices every pre-token protocol by comparables: each category's multiple is the median market-cap-to-TVL ratio of that category's protocols whose token already trades, shrunk toward the global median when the category has few live names, and clamped to a sane range. The board ranks 178 pre-token protocols — the 40 on the watchlist plus 138 early names below the $50M floor — by implied value, with a seven-step farm plan for each. A sortable, filterable dashboard (dashboard/) shows the board, a per-protocol detail view with the model breakdown, the live-token comparables, and the model itself. No protocol name is ever special-cased; the same function scores every row.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input /input/snapshot.json
```

`main.ts` reads the sealed snapshot from `/input/snapshot.json` (or `--input <snapshot.json|directory>`), writes the ranked board to `/output/board.json`, the dashboard data to `/output/data.js`, copies `dashboard/` and `screenshots/` to `/output`, and writes `/output/dossier.json` last. It runs twice byte-identically. Node 22.18+ is required; the three screenshots in `screenshots/` were taken with a headless Chromium (Playwright) from the built dashboard.

---

<sub>Entered on [make.fun](https://make.fun/?ref=mzx1e8da&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
