# Moldova — Temporary Protection Choropleth (all districts)

**Build spec for Claude Code.** Goal: replace the empty 
**geographically accurate choropleth of all Moldovan districts (raioane + municipalities + Gagauzia +
Transnistria)**, shaded by the number of Ukrainian refugees holding **Temporary Protection (TP)**.

---

## 0. TL;DR

1. Load real geometry from **geoBoundaries MDA ADM1** (all 35 first-level units = 32 raions + Chișinău,
   Bălți, Gagauzia, Transnistria). Do **not** hand-draw polygons.
2. Join the geometry to the district data on a **normalized** name key (strip diacritics + lowercase).
3. Shade with a sequential color scale by `tpHolders`.
4. The district values below are **INDICATIVE placeholders** so the map renders immediately — **replace
   them with the figures from the Power BI report** (§4). The national control total is **86,500**.

---

## 1. ⚠ Two metrics — keep them on separate pages

| Metric | Figure | What it is | Where it goes |
|---|---|---|---|
| **Temporary Protection holders** | **~86,500** (UNHCR, Feb 2026) | Ukrainians granted legal temporary status | **This page — the map subject** |
| Ukrainian refugees in Moldova | ~140,000 (UNHCR, Jan 2026) | All refugees residing in country | This page — header context |
| UN DESA 2024 migrant stock | 864,257 total; 752,138 shown (87%) | **Total foreign-born population** (inflated by Soviet-era populations) — **not refugees** | **NOT this page** — migrant-stock page only |

**This (Ukrainian-refugees) page must NOT show the UN DESA figure.** Driving a "temporary status holders"
map off the 752,138 number overstates the refugee count by ~8.7×. The choropleth uses the **TP** series
(~86,500) only.

### On the separate migrant-stock page: show the FULL breakdown (100%, not 87%)
The 752,138 is only the **attributed** portion of the 864,257 total. Add the residual so it reconciles to
100%:

```
864,257 total  −  752,138 attributed  =  112,119 "Other / unspecified origin" (13%)
```

So the origin breakdown there should be: your named-origin rows (summing to 752,138, 87%) **plus a final
`Other / unspecified origin — 112,119 (13%)` row** = 864,257 (100%). Don't truncate the chart at 87%.

---

## 2. Map geometry — geoBoundaries MDA ADM1

Moldova's **raions are the ADM1 level** in geoBoundaries. This layer contains all 35 districts.

**Recommended (API → download URL, most robust):**
```js
const meta = await fetch("https://www.geoboundaries.org/api/current/gbOpen/MDA/ADM1/").then(r => r.json());
const geo  = await fetch(meta.gjDownloadURL).then(r => r.json());          // full-resolution GeoJSON
// or meta.simplifiedGeometryGeoJSON for a lighter web file
```

**Direct raw URLs (pin a commit in production):**
```
https://raw.githubusercontent.com/wmgeolab/geoBoundaries/main/releaseData/gbOpen/MDA/ADM1/geoBoundaries-MDA-ADM1.geojson
https://raw.githubusercontent.com/wmgeolab/geoBoundaries/main/releaseData/gbOpen/MDA/ADM1/geoBoundaries-MDA-ADM1_simplified.geojson
```

- **Join key:** the district name lives in `feature.properties.shapeName`.
- **CRS:** EPSG:4326 (WGS84) — works directly with `d3-geo` / `react-simple-maps`.
- **License:** CC-BY 4.0 — attribute *geoBoundaries (Runfola et al., 2020)*.
- Download once and commit it to the repo (`/public/moldova-adm1.geojson`) so the build is offline-stable.

> After fetching, `console.log` the list of `shapeName` values once and reconcile them against §3 — spellings
> may be ASCII or Romanian-with-diacritics depending on the release. The `normalize()` in §6 handles both.

---

## 3. District data (all 35 units)

`tpHolders` below is an **INDICATIVE distribution** (modeled from the national total and UNHCR's "**60%+ in
Chișinău**, refugees concentrated in urban centres" — UNHCR notes the geographic breakdown is *not
systematically collected*). **Replace every value with the Power BI report's figures (§4).** The map code
must treat `null` as "no data" (grey), so you can blank these and fill them in safely.

```json
{
  "meta": {
    "subject": "Temporary Protection holders (Ukrainian refugees)",
    "nationalTotal": 86500,
    "asOf": "2026-02",
    "source": "UNHCR Moldova",
    "dataStatus": "INDICATIVE — replace district values with Power BI report figures"
  },
  "districts": [
    { "name": "Chișinău",       "type": "municipality", "tpHolders": 53600 },
    { "name": "Bălți",          "type": "municipality", "tpHolders": 4200 },
    { "name": "Găgăuzia",       "type": "autonomous",   "tpHolders": 1800 },
    { "name": "Stînga Nistrului","type": "transnistria", "tpHolders": 1200 },
    { "name": "Anenii Noi",     "type": "raion", "tpHolders": 1000 },
    { "name": "Basarabeasca",   "type": "raion", "tpHolders": 300 },
    { "name": "Briceni",        "type": "raion", "tpHolders": 600 },
    { "name": "Cahul",          "type": "raion", "tpHolders": 1500 },
    { "name": "Cantemir",       "type": "raion", "tpHolders": 500 },
    { "name": "Călărași",       "type": "raion", "tpHolders": 750 },
    { "name": "Căușeni",        "type": "raion", "tpHolders": 1000 },
    { "name": "Cimișlia",       "type": "raion", "tpHolders": 600 },
    { "name": "Criuleni",       "type": "raion", "tpHolders": 1100 },
    { "name": "Dondușeni",      "type": "raion", "tpHolders": 500 },
    { "name": "Drochia",        "type": "raion", "tpHolders": 800 },
    { "name": "Dubăsari",       "type": "raion", "tpHolders": 450 },
    { "name": "Edineț",         "type": "raion", "tpHolders": 850 },
    { "name": "Fălești",        "type": "raion", "tpHolders": 900 },
    { "name": "Florești",       "type": "raion", "tpHolders": 900 },
    { "name": "Glodeni",        "type": "raion", "tpHolders": 600 },
    { "name": "Hîncești",       "type": "raion", "tpHolders": 1200 },
    { "name": "Ialoveni",       "type": "raion", "tpHolders": 1100 },
    { "name": "Leova",          "type": "raion", "tpHolders": 600 },
    { "name": "Nisporeni",      "type": "raion", "tpHolders": 650 },
    { "name": "Ocnița",         "type": "raion", "tpHolders": 500 },
    { "name": "Orhei",          "type": "raion", "tpHolders": 1500 },
    { "name": "Rezina",         "type": "raion", "tpHolders": 550 },
    { "name": "Rîșcani",        "type": "raion", "tpHolders": 700 },
    { "name": "Sîngerei",       "type": "raion", "tpHolders": 800 },
    { "name": "Soroca",         "type": "raion", "tpHolders": 950 },
    { "name": "Strășeni",       "type": "raion", "tpHolders": 1000 },
    { "name": "Șoldănești",     "type": "raion", "tpHolders": 450 },
    { "name": "Ștefan Vodă",    "type": "raion", "tpHolders": 700 },
    { "name": "Taraclia",       "type": "raion", "tpHolders": 500 },
    { "name": "Telenești",      "type": "raion", "tpHolders": 700 },
    { "name": "Ungheni",        "type": "raion", "tpHolders": 1300 }
  ]
}
```
Save this as `src/data/moldova-tp.json`. (Indicative values sum to ≈ 86,500; treat as placeholder.)

---

## 4. Getting the REAL district numbers from the Power BI report

The report is the intended source, but its data can't be scraped from the embed URL (it loads via
authenticated client calls). Pull the per-district figures one of these ways, then overwrite `tpHolders`:

1. **"See / Export data":** hover a visual → **⋯ More options → Export data** (or "Show as a table"). This
   gives a CSV of district × value you can map straight into the JSON.
2. **Read the map/table visual:** if export is disabled, hover each district to read its tooltip value and
   transcribe it.
3. **Underlying dataset:** if you have edit access in Power BI Service, open the dataset / use *Performance
   Analyzer → Copy query* (DAX) or connect via the XMLA endpoint to pull the table programmatically.

Keep `meta.nationalTotal` as a checksum — your district values should sum to the report's national total.
Set `meta.dataStatus` to `"OFFICIAL — Power BI <date>"` once replaced.

---

## 5. Implementation

### Option A — React + `react-simple-maps` (recommended)

```bash
npm i react-simple-maps d3-scale d3-array
```

```jsx
// MoldovaTPChoropleth.jsx
import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleQuantize } from "d3-scale";
import { max } from "d3-array";
import data from "./data/moldova-tp.json";

// public/moldova-adm1.geojson = the geoBoundaries file from §2 (commit it)
const GEO = "/moldova-adm1.geojson";

const normalize = (s) =>
  (s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/^(municipiul|raionul|uta|ato)\s+/i, "")  // strip admin prefixes
    .toLowerCase().trim();

const SCALE = ["#E6EEF5", "#B9D2E6", "#7FB0D4", "#3E86BC", "#1F5A8C"];

export default function MoldovaTPChoropleth() {
  const [tip, setTip] = useState(null);

  const byName = useMemo(() => {
    const m = new Map();
    data.districts.forEach((d) => m.set(normalize(d.name), d));
    return m;
  }, []);

  const color = useMemo(() => {
    const vals = data.districts.map((d) => d.tpHolders ?? 0);
    return scaleQuantize().domain([0, max(vals) || 1]).range(SCALE);
  }, []);

  return (
    <div style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [28.5, 47.0], scale: 4200 }} // fits Moldova
        width={520} height={760} style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={GEO}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name = geo.properties.shapeName;
              const rec = byName.get(normalize(name));
              const v = rec?.tpHolders;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={v == null ? "#EFEDE7" : color(v)}      // grey = no data
                  stroke="#FFFFFF"
                  strokeWidth={0.6}
                  onMouseEnter={() =>
                    setTip({ name, v: v ?? null, missing: !rec })}
                  onMouseLeave={() => setTip(null)}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", opacity: 0.85, cursor: "pointer" },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {tip && (
        <div style={{ position: "absolute", top: 8, left: 8, background: "#23262B",
          color: "#fff", padding: "8px 10px", borderRadius: 8, fontSize: 12 }}>
          <b>{tip.name}</b><br />
          {tip.missing ? "no join match — check name" :
            tip.v == null ? "no data" :
            `${tip.v.toLocaleString()} TP holders`}
        </div>
      )}
    </div>
  );
}
```

**Header / context cards** (TP page — UN DESA figure is NOT shown here):
- `Temporary protection holders — 86,500 (UNHCR, Feb 2026)` ← map subject
- `Ukrainian refugees in country — ~140,000 (Jan 2026)`
- `In Chișinău — 60%+`

### Option B — vanilla D3 (no React)

```js
import * as d3 from "d3";
const data = await d3.json("/data/moldova-tp.json");
const geo  = await d3.json("/moldova-adm1.geojson");
const norm = s => (s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const byName = new Map(data.districts.map(d => [norm(d.name), d]));

const projection = d3.geoMercator().fitSize([520, 760], geo);
const path = d3.geoPath(projection);
const color = d3.scaleQuantize()
  .domain([0, d3.max(data.districts, d => d.tpHolders ?? 0)])
  .range(["#E6EEF5","#B9D2E6","#7FB0D4","#3E86BC","#1F5A8C"]);

d3.select("#map").append("svg").attr("viewBox","0 0 520 760")
  .selectAll("path").data(geo.features).join("path")
    .attr("d", path)
    .attr("stroke", "#fff").attr("stroke-width", 0.6)
    .attr("fill", f => {
      const r = byName.get(norm(f.properties.shapeName));
      return r?.tpHolders == null ? "#EFEDE7" : color(r.tpHolders);
    })
  .append("title")
    .text(f => {
      const r = byName.get(norm(f.properties.shapeName));
      return `${f.properties.shapeName}: ${r?.tpHolders?.toLocaleString() ?? "no data"}`;
    });
```

---

## 6. Name matching (important)

geoBoundaries `shapeName` may not match the JSON exactly (diacritics, `municipiul`/`raionul` prefixes,
`Stînga`/`Stanga`, `Găgăuzia`/`Gagauzia`). The `normalize()` above strips diacritics + admin prefixes and
lowercases. After first render, log any features where the join fails and add aliases, e.g.:

```js
const ALIASES = {
  "stinga nistrului": "Stînga Nistrului", // Transnistria
  "gagauzia": "Găgăuzia",
  "unitatea teritoriala autonoma gagauzia": "Găgăuzia",
  "hincesti": "Hîncești", "riscani": "Rîșcani", "singerei": "Sîngerei",
  "soldanesti": "Șoldănești", "stefan voda": "Ștefan Vodă",
};
```
Every one of the 35 features should resolve to a record (no grey except where you intentionally set `null`).

---

## 7. Styling

- **Projection:** `geoMercator`, center `[28.5, 47.0]`, or just `fitSize`/`fitExtent` to the GeoJSON so it
  always frames Moldova correctly (no manual scale tuning, no "weird shape").
- **Scale:** sequential blues (humanitarian-neutral; avoid alarm-red). 5-class quantize, or
  `scaleQuantile` if you prefer even-count bins. Consider a separate emphasis for Chișinău since it dwarfs
  the rest — e.g. a quantile scale, or annotate the capital.
- **Legend:** 5 swatches low→high + a grey "no data" swatch.
- **Tooltip:** district name + value + % of national total.
- **A11y:** `role="img"`, `aria-label`, and a fallback data table beneath the map.

---

## 8. Acceptance checklist

- [ ] Map renders **all 35 districts** with correct borders (geoBoundaries ADM1), framed via `fitSize`.
- [ ] Every feature joins to a data record (0 unintended grey; aliases added where needed).
- [ ] Choropleth shaded by **TP holders**, not the UN DESA 752k figure.
- [ ] District values replaced with **Power BI** figures; they sum to the report's national total (~86,500).
- [ ] UN DESA migrant-stock figure is **NOT** on this page (it belongs on the migrant-stock page).
- [ ] On the migrant-stock page, origin breakdown sums to **100% / 864,257** (named 752,138 + Other/unspecified 112,119), not just 87%.
- [ ] Legend, tooltips, and a fallback data table present.
- [ ] geoBoundaries attribution shown.

---

## 9. Sources & attribution

- **Geometry:** geoBoundaries ADM1 (Republic of Moldova), CC-BY 4.0 — *Runfola, D. et al. (2020), geoBoundaries.* Mirrored on HDX (Humanitarian Data Exchange).
- **TP / refugee figures:** UNHCR Moldova — ~86,500 TP holders (Feb 2026); ~140,000 Ukrainian refugees in country (Jan 2026); 60%+ concentrated in Chișinău; geographic distribution not systematically collected.
- **District-level values:** the referenced Power BI report (paste in per §4).
- **UN DESA International Migrant Stock 2024:** total migrant stock (context metric only — not refugees/TP).
```
