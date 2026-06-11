# HANDOFF — Moldova Migration Dashboard

Context for the next AI assistant (Claude Code) picking up this project in VS Code.
This was started in a claude.ai chat; that chat's history does not carry over, so
this file is the source of truth for *why* things are the way they are.

## What this is
A minimalist, light-themed interactive dashboard showing three flows for the
Republic of Moldova, for a **non-technical audience** (donors, partners, public):
- **Leaving Moldova** — Moldovans living abroad (emigration), arcs flow OUT
- **Coming to Moldova** — migrants & refugees (immigration), arcs flow IN
- **Money sent home** — remittances by source country, arcs flow IN

It is a static front-end (D3 v7) plus a Python pipeline that refreshes the data
from official sources. The owner (an M&E / Information Management officer at IOM
Moldova) intends to keep building it himself in VS Code.

## Architecture (deliberately simple, no build step)
```
index.html        # structure; loads d3 (CDN) + the three local scripts
styles.css        # all styling. Mode accents live in :root (--c-out/-in/-money)
data.js           # THE DATA. window.MIGRATION_DATA. Edit this to change figures.
world-data.js     # Natural Earth 1:110m country outlines (public domain), bundled
app.js            # D3 logic: map, flow arcs, linked table, zoom, timeline
fetch_data.py     # pipeline: World Bank + UNHCR APIs + NBM scrape -> data file
requirements.txt  # python deps
moldova-migration-dashboard.html  # single-file build of everything (preview/share only)
```
Plain `<script>` tags (not ES modules) are used on purpose so it runs from
`file://` without a server. To preview: VS Code Live Server on `index.html`, or
`python3 -m http.server`.

## Key behaviours already implemented
- **Map**: D3 `geoNaturalEarth1`, viewBox 820×540. Flow arcs are quadratic
  beziers bowing upward; ribbon width = `widthScaleFor` (sqrt). Direction is told
  by design (see below), and bubbles carry the headline quantity.
- **Directional flows (storytelling)**: every ribbon is defined by ONE source→
  target rule (`endpointsFor`): leaving = Moldova→country, arriving = country→
  Moldova. A per-flow linear gradient fades faint→solid from source→target (so
  ribbons visibly fan OUT of Moldova when leaving, converge INTO it when
  arriving), and a white particle stream (`animateStream`, dashed overlay) runs
  toward the target. Both read from the same rule so they can't disagree;
  reduced-motion hides the stream and relies on the gradient.
- **Proportional bubbles (Migration Data Portal style)**: each destination/origin
  node is a circle whose AREA ∝ value (`bubbleScaleFor`, sqrt, radius range 4–30).
  The figure is printed on the bubble (`text.bubble-label`, e.g. `300k`, `$276m`,
  via `fmtShort`). A graduated **size legend** sits bottom-left (`renderLegend`),
  fixed (not in the zoom layer). Hovering a bubble/arc shows a **tooltip** (country
  + full figure) and cross-highlights the table row. Bubble sizes are held constant
  on screen across zoom (counter-scaled by k in `rescaleForZoom`), so proportions
  stay true and zooming spreads crowded European bubbles apart.
- **Zoom/pan**: `d3.zoom` on a single `.zoomLayer`, scaleExtent [1,14], opens on
  a Europe-centred view (`europeView()`), reset button returns to world. Arc/
  border stroke widths stay constant via `vector-effect: non-scaling-stroke`;
  node radii + labels are counter-scaled in `rescaleForZoom()`.
- **Economics panel** (`renderContext` / `drawLineChart`): mode-aware analysis card
  below the timeline. Shows ONE big chart relevant to the page — emigration/
  immigration = total stock over time; remittances = remittances-to-GDP over time
  WITH a dashed world-average reference line (5.13%) — plus professional indicator
  cards (emigration rate, diaspora size, immigrant stock, refugees hosted,
  remittances-to-GDP, remittance inflows, vs. state budget) each with a world
  benchmark chip. Data lives in `DATA.context` (world benchmarks, Moldova macro,
  per-mode headline + indicators + gdp_series). `gotoModeYear()` still lets stock
  chart points jump the dashboard. `fetch_data.py` already pulls the %GDP series
  (BX.TRF.PWKR.DT.GD.ZS) to refresh `context.remittances.gdp_series`.
- **Linked highlight**: hovering a table row highlights its arc/node and vice versa.
- **Unified timeline (2010–2026)**: the timeline is the UNION of years across all
  modes. Years a mode lacks are shown but **muted** (`.stop.empty`); landing on
  one shows an empty-state note listing that mode's available years. `2020` is the
  only year present in all three modes (the shared anchor). Play steps only
  through years that have data for the current mode.

## SOURCING — single source of truth (`DATA.sources`)
Provenance is centralised in a `sources` block in `data.js`: a map of
`{ id: { label, publisher, url, indicator_code, accessed, definition, scope, note } }`.
Every consumer references it by `source_id` (or `source_ids: []` when a series
blends sources) — each `modes.*`, the `context.*.gdp_series` (`gdp_series_source_id`),
and every indicator card. **No source text is hand-typed inline anymore** — edit a
citation in ONE place (`DATA.sources`). `app.js` resolves it via `sourceById` /
`captionsFor` (compact: `publisher · code · as of date`) and `citationsFor` (fuller,
for the footer). Add a new series → add its `source_id`; add a new source → add one
entry to `DATA.sources`. Current ids: `undesa_2024`, `unhcr`, `nbm_transfers`,
`wb_remit_gdp`, `wb_remit_total`, `nbs_census_2024`, `eurostat_migr`, `mof_budget`.

Surfaces that read from it: (1) **captions** — `#mapSource` under the map and
`#ctxSource` under the economics chart, plus a per-card `.stat-src` line and a
`title=` full citation on each focusable indicator card (so a screenshot keeps its
source). (2) **Methodology & sources modal** — a native `<dialog>` (`#methodDialog`,
Esc + focus-trap built in; we add click-outside + close button) opened from the
footer `#openMethod` link, built by `buildMethodology()` from `DATA.sources` +
`DATA.glossary` (term definitions, also the SSOT for item-8 card tooltips) +
`DATA.caveats` (scope/political-safety notes, also feeding item-4 UI notes).

**Political-safety (item 4) — keep this discipline.** `DATA.scope_note` (resident
pop excludes Transnistria, NBS 2024 Census; ratios use resident population) renders
under the title; `DATA.country_notes` are neutral, mode-scoped tooltip footnotes
(Romania = citizenship/onward-EU mobility fact, never identity framing; Ukraine =
UNHCR refugee language, immigration mode only). Rules: keep UNHCR's "refugees /
people fleeing the war in Ukraine" wording and never fold it into "immigrants";
present the Russia→EU remittance shift as data only; "irregular" not "illegal";
"Republic of Moldova" formally; estimates labelled as estimates; Natural Earth
borders stay neutral — no internal-region overlays.

## DATA PROVENANCE — read before changing numbers
This matters; the figures are mixed-confidence on purpose and labelled in `data.js`:
- **remittances**: EXACT official NBM figures (USD m, net settlements) for **2018
  and 2020 only**. These are the last two years NBM published a full by-source-
  country breakdown as a press release. From 2021 the breakdown lives only in
  NBM's interactive database (DBP4), NOT a press release. So 2020 is genuinely the
  latest by-country year via scraping. The 2018→2020 shift is real and the
  headline story: Russia $343M→$206M while Israel rose to #1 ($225M→$276M).
- **immigration**: UN DESA migrant stock (2020) + UNHCR Moldova residing-refugee
  counts (2022 ≈100k, 2023 ≈115k, 2024 ≈136k, 2026 ≈140k). Freshest mode. From
  2022 the Ukraine figure is predominantly refugees, not long-term migrants.
- **emigration**: diaspora STOCK ESTIMATES (UN DESA, OSW 2025, censuses). No clean
  official bilateral series exists and official counts undercount badly (e.g.
  Italy's register ~103k vs ~300k actual). Treat as indicative.

`MIGRATION_DATA.meta.latest_year` records the newest year per mode.

## The pipeline (fetch_data.py)
Run on a real machine (it needs open internet). Sources:
- **World Bank Indicators API** (real, no key): total remittances
  `BX.TRF.PWKR.CD.DT`, % of GDP `BX.TRF.PWKR.DT.GD.ZS`, migrant stock `SM.POP.TOTL`.
- **UNHCR Population API** (real): refugees residing in Moldova (`coa=MDA`).
- **NBM scrape** (real, tested): parses the annual money-transfers release into
  `{country: USD_million}`. The parser is value-first (finds each `(USD x million)`
  then looks back ~60 chars for a known country) because NBM's wording is messy
  ("the USA", "the Russian Federation", "United Kingdom and Nord Ireland").
  Slug overrides exist for 2015/2016 (different URL pattern).
- **NBS statbank (PxWeb)** and **UN DESA bilateral matrix**: left as clearly-marked
  hooks/stubs — they are NOT clean public APIs (need a table id / a file download).
It writes `data.json` + `data.generated.js` (rename to `data.js` to use).

## Known limitations / honest gaps
1. The original chat's sandbox was network-locked, so the pipeline's live API calls
   were NEVER executed end-to-end — they're written to spec and the NBM parser was
   unit-tested against real page text, but **the World Bank + UNHCR functions need a
   real first run to confirm response shapes** (especially the UNHCR field names).
2. `undesa_bilateral()` is a deliberate `NotImplementedError` stub — emigration
   stays as estimates until someone points it at a downloaded UN DESA workbook and
   maps the "Republic of Moldova" row/column (layout shifts per release).
3. Remittances by-country beyond 2020 requires NBM DBP4 (interactive DB), not the
   press-release scrape.

## Sensible next steps (owner's likely priorities)
- First real run of `fetch_data.py`; verify/repair the UNHCR + World Bank parsing.
- Implement `undesa_bilateral()` to make emigration real.
- Add NBM DBP4 fetching for 2021–2025 remittances by country.
- Optional polish: country tooltips with year-on-year delta; a "per 1,000
  population" toggle; export current view as PNG.
- Known bubble tradeoff: in the default Europe view the large neighbours (Italy,
  Romania, France, Germany) overlap somewhat — bubbles are semi-transparent and
  zoom separates them. If asked to reduce overlap further: cap max radius, or add
  leader lines nudging labels off crowded bubbles (force layout / d3-labeler).

## Icons
Hand-built inline-SVG icon set in `app.js` (`ICONS` map + `icon(name,size)`), stroked with `currentColor` so they inherit the mode accent. Used on: mode toggle (depart/arrive/banknote), each economics indicator card (via the `icon` field in `DATA.context.*.indicators`), the zoom-reset button (expand), and the header eyebrow (route). `injectIcons()` fills the static ones at boot; stat-card icons render in `renderContext`. No icon library/dependency.

## Style / taste notes
Light, calm, minimal. Display = Space Grotesk, body = Inter, numbers = IBM Plex
Mono. One accent colour per mode: red = leaving, green = coming, blue = money. Avoid heavy chrome. Keep it
legible for non-technical viewers; plain-language mode labels over jargon.


