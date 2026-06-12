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

## SHAREABILITY & UX (items 5–8)
- **Accessibility:** the "coming" green is teal `--c-in #1E8C72` (defined in BOTH
  `styles.css` and the `ACCENTS` map in `app.js` — keep them in sync); it improves
  red↔green deuteranopia separation. Provenance captions use `--ink-soft` (AA),
  `--ink-faint` only for decorative marks. Map never encodes by hue alone.
- **Deep-linking:** state lives in the hash `#mode=…&year=…` (`applyHashToState`
  on load + `hashchange`, `updateHash` via `replaceState` on every change). Years
  with no data snap to the nearest real year; unknown mode → emigration.
- **Timeline annotations:** `DATA.annotations` (`{year, modes?, text}`) → accent dot
  above the pin + hover title + an `aria-live` narration line (`#timelineNote`,
  `updateTimelineNote`) that updates as play advances.
- **Definitions + freshness:** `DATA.glossary` entries carry an `id`; each indicator
  has a `def_id` → the card's hover/focus title shows the definition + source, and a
  dotted underline (`.stat.has-def`) hints it. The footer "Data current as of …"
  stamp (`#dataStamp`) reads `meta.generated` › `meta.updated` › newest source
  `accessed` (`dataCurrentDate`/`fmtDate`).
- **Mobile (≤560px):** a media query tightens chrome, shrinks the now ~10-stop
  timeline to fit one row, caps the map caption so it clears the zoom buttons, and
  enlarges tap targets. Touch: a tap on a bubble/arc shows its tip (synthesized
  mouse events), a tap elsewhere dismisses it; `moveTip` clamps the tip inside the
  map card so it never runs off-screen.

## DATA PROVENANCE — read before changing numbers
This matters; the figures are mixed-confidence on purpose and labelled in `data.js`:
- **remittances**: EXACT official NBM figures (USD m, net settlements). `data.js`
  currently carries **2018 & 2020**; the pipeline can supply **2016–2020** from the
  annual by-country releases (2017–2020 full, 2016 partial). CORRECTION to earlier
  notes: the by-country breakdown did NOT move to the interactive DB — DBP4/DBP7/
  DBP14 are aggregate-only (no country axis), and **no by-country page exists on the
  web after 2020** (annual or quarterly). 2020 is genuinely the last year. The
  Russia decline is the headline story: **$403M (2017) → 343 → 256 → 206 (2020)**,
  while Israel rose to #1 ($205M → $276M).
- **immigration**: UN DESA migrant stock + UNHCR Moldova residing-refugee counts
  (2022 ≈105k, 2023 ≈121k, 2024 ≈136k via UNHCR; data.js rounds). Freshest mode.
  From 2022 the Ukraine figure is predominantly refugees / people fleeing the war.
- **emigration**: now OFFICIAL UN DESA 2024 bilateral migrant stock (by country of
  birth), NOT estimates. Germany/US/UK report by citizenship so UN DESA has no
  Moldova-born cell for them → omitted (not zero) and footnoted. Birth-basis still
  undercounts (Italy ~219k UN DESA vs ~300k often cited); ~752k across covered
  destinations vs ~864k all-destinations (UN DESA by-origin).

`MIGRATION_DATA.meta.latest_year` records the newest year per mode.

## The pipeline (fetch_data.py) — official-first + provenance (item 9)
Run on a real machine (open internet). All live APIs are tested end-to-end. Each
source records provenance via `sources_registry()` (mirrors `DATA.sources`, stamped
with the run date); modes reference it by `source_id`, so the output carries a
`sources` block and captions are generated, never hand-typed. Hierarchy:
- **World Bank Indicators** (API): `BX.TRF.PWKR.CD.DT`, `BX.TRF.PWKR.DT.GD.ZS`,
  `SM.POP.TOTL`. Fail-soft (wrapped per-indicator).
- **UNHCR Population API**: refugees + asylum-seekers, `coa=MDA`. Field `refugees`
  confirmed live. `http_get` falls back to unverified TLS for `api.unhcr.org` (its
  cert chain is incomplete) — World Bank verifies fine.
- **Eurostat** `migr_pop1ctz` (API): Moldovan CITIZENS in EU countries — a
  CROSS-CHECK only (citizenship basis ≠ UN DESA birth basis), stored in
  `meta.eurostat_moldovan_citizens_eu`, never merged into the emigration map.
- **UN DESA** bilateral workbook (`--undesa <xlsx>`): `undesa_bilateral()` reads the
  long-format Table 1 by M49 location code (release-robust). Fills emigration; UN
  DESA immigration-by-origin parked in `meta.undesa_immigration_by_origin`.
- **NBM scrape** (last resort): `_parse_nbm_by_country()` is value-first with a
  word-bounded, distance-capped lookback (`_NBM_MAXBACK`) that skips the prior-year
  comparison total (fixed the old `US=315` mis-parse). `nbm_annual_by_country(year)`
  uses the year-in-slug annual release (**2016–2020**); `nbm_quarterly_index()` +
  `nbm_sum_quarters()` walk the year-less quarterly slugs and sum four quarters when
  an annual is missing. **Coverage ceiling: nothing by-country after 2020 exists on
  the web** (DBP4 is aggregate; quarterly slugs stop at 2020Q3) — the pipeline finds
  this correctly and fails soft.
- **NBS statbank (PxWeb)**: still a template (`nbs_pxweb`) — NBS has no clean
  bilateral diaspora-by-country series, so it's not wired.

`sanity_check()` flags (never blocks) out-of-range totals, dangling source ids,
NBM-sum-over-WB-total, and >70% YoY swings before writing. Raw downloads are cached
under `raw_cache/<run-timestamp>/` (`--no-cache` to skip; gitignored). Writes
`data.json` + `data.generated.js`. **Merge `modes` + `sources` + `meta` into data.js;
the editorial blocks (context/glossary/caveats/annotations/scope/country_notes) are
hand-maintained and NOT regenerated.**

## Known limitations / honest gaps
1. **NBM by-country ends in 2020** — not a pipeline gap; the data isn't published
   anywhere public after 2020 (verified via the `bnm_search` autocomplete index).
2. Germany/US/UK have no UN DESA Moldova-born cell (citizenship reporting); Eurostat
   gives a citizenship-basis cross-check only — do not merge the two bases.
3. Quarterly summing only completes a year if all four quarterly slugs are
   discoverable; NBM's older/Q4 slugs use different titles, so in practice the
   annual releases (2016–2020) are the reliable path.

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


