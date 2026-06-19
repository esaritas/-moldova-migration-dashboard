# Task — "Population by district" tab

> **Status: DONE.** Implemented on this branch. NBS 2024 census usually-resident
> population by district was fetched from statistica.gov.md (PHC 2024 final data,
> Geographical characteristics, Table 5) and wired into a green choropleth that
> reuses the refugees-tab map machinery (now parametrised via the `CHORO[mode]`
> config in app.js). District values sum exactly to 2,409,207; Transnistria +
> Bender render as "no data" (left bank, not enumerated). The analysis panel
> shows an urban/rural split (46.4% / 53.6%) and the 2014→2024 decline (−13.6%).
>
> Part 1 of the original request (removing the Simple/Advanced toggle) is **done**
> and already on this branch (commit "Remove Simple/Advanced toggle…").

## Goal
Add a new tab showing the **resident population by district** of Moldova as a
choropleth map (reusing the refugees-tab map machinery), with a **national urban
vs rural** split in its analysis panel.

## Data to fetch (needs Full network — NBS hosts)
Allowlisted hosts: `statistica.gov.md`, `statbank.statistica.md`.

- Per-raion **2024 census usually-resident population** for the 35 ADM1 units NBS
  covers — the `match` keys already used in `DATA.tp_choropleth` in `data.js`
  (chisinau, balti, gagauzia + 32 raions). **Transnistria + Bender are NOT in the
  NBS census** → leave them no-data (the choropleth already paints `NO_DATA_FILL`
  for null) and annotate that.
- **National urban vs rural** usually-resident counts/percentages.
- Sanity-check: raion populations sum to ≈ 2,409,207 (the resident total already
  in `DATA.context.moldova.population_resident`).

## Implementation outline
Files: `data.js`, `app.js`, `index.html`, `styles.css`; rebuild via
`python build_single.py`.

### data.js
- Add `population_choropleth: { meta{…}, districts:[{match,name,type,population}] }`
  mirroring `tp_choropleth`.
- Add to `context.moldova`: `urban_pct/rural_pct` (+ counts).
- Add `modes.population` (`unit:"people"`, `vintage:"NBS 2024 Census"`,
  `source_id`, `years:{2024:[…district rows…]}` so the timeline has a stop).
- Add `context.population` (takeaway, headline, indicators: Total residents /
  Urban % / Rural % / largest district) and a `nbs_census_pop` source
  (or reuse `nbs_census_2024`).

### app.js (reuse the choropleth code, parametrised)
- Generalise `choroModel`, `renderChoropleth`, `renderDistrictTable` with a small
  `CHORO[mode]` config `{ dataKey, valueKey, scale, unit, asOf, sourceIds,
  legendTitle }` so refugees and population share them. Refugees keeps `TP_SCALE`
  (orange); population gets a new green `POP_SCALE`.
- `renderMap()`: `if (mode === "population" && MOLDOVA) { renderChoropleth(POP_CFG); return; }`;
  `renderTable()` likewise → `renderDistrictTable(POP_CFG)`.
- `applyMapFraming()`: treat `population` like `immigration` (identity zoom, not Europe).
- `ACCENTS.population` = green; `MODE_ICON.population` = "landmark";
  `CHART_TITLES.population` = "Resident population by census year".
- `renderContext()`: special-case `population` so the trend chart is the 2-point
  decline line 2014 (`population_2014_census`) → 2024 (`population_resident`),
  like remittances special-cases its %GDP series.
- `renderPartWhole()`: add a `population` branch reusing `pwSplitBar` (Urban vs
  Rural) and the existing `pwDepopBars` (2014 vs 2024 loss).

### index.html
- Add a grouped-control group **"Population · census"** with one button
  `data-mode="population"` ("By district"), next to "Who's here".

### styles.css
- Reuse existing `.district` / choro-legend / bar styles; add a green legend
  treatment only if needed.

## Verification
- Confirm NBS fetch returned real per-raion numbers; raion sum ≈ 2.41M.
- `node --check app.js && node --check data.js`; `python build_single.py`.
- Visual: green population choropleth (Transnistria/Bender greyed "no data"),
  a districts-by-population table, and an urban/rural split + 2014→2024 decline in
  the panel; refugees tab still renders (shared code intact).
- Commit + push to `claude/eager-feynman-92z2ef`.
