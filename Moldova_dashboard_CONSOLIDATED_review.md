# Moldova in Motion — consolidated expert review & data-layer fixes

*Merges two independent reviews into one assessment. All figures re-verified against primary
sources (accessed 14 Jun 2026). Supersedes the earlier `METHODOLOGY_diaspora_reconciliation.md`.*

---

## Verdict

A **strong communication prototype** with a serious source set and methodology that is well
above the field — approve for general/donor/press use **after tightening a small number of
labels and two data choices**. Both reviews converged independently on the same primary risk,
which is therefore the thing to fix first:

> **Users may read "total" values as complete national totals**, when several panels actually
> show *selected countries*, *mixed measures*, or *older country breakdowns*. The fix is almost
> entirely **methodological labelling**, not re-engineering.

Indicative rating: **~7.5/10 now → ~9/10 after the §3 fixes.**

---

## 1. Accuracy — verified

**Holds up (keep as is):**

- **Source ecosystem** — UN DESA, UNHCR, NBM, World Bank, Eurostat, NBS, MoF. Correct set for the topic.
- **Diaspora headline 864,257** — this *is* the published UN DESA 2024 International Migrant
  Stock total for Moldova (origin, mid-2024). Accurate. (See §2 for the one framing caveat.)
- **NBS registered-flow tabs** — correctly explained as a narrow administrative flow (only people
  who formally deregistered), not real total emigration. A genuinely useful addition.
- **Remittance proxy warning** — correct: NBM "money transfers in favour of individuals" also
  includes other unilateral transfers and excludes Transnistrian-region bank flows. Well handled.
- **UNHCR refugee headline** — 136k (end-2024) and 140k (Jan 2026) are both confirmed.

**Correct before publishing:**

| # | Issue | Current | Verified correct value |
|---|---|---|---|
| A | Resident population | "2.40M / 2.42M" | **2,409,207** (final census, 8 Apr 2024) |
| B | Population decline since 2014 | "−16%" | **−13.6%** (380.0k fewer; final census) |
| C | "Leaving Moldova" map total | reads as full diaspora | mapped rows = **~752k of 864k**; label "shown destinations" |
| D | "Coming to Moldova" tab | UN DESA + old foreign-born + UNHCR, combined | **split** foreign-born residents vs refugees (see §3.4) |
| E | Remittance country map (2020) | reads as current/total | shows **$1,261m of $1,486.74m** (~85%) and is **2020**, not current |
| F | Refugee figure freshness | 136k/140k | date-stamp each; UNHCR also reported **~148k (late 2025)**, **86,500+ on Temporary Protection** |

Context that makes the corrections land: the 2024 census also gives **106,700 foreign-born
residents (4.4%)**, of whom 77.4% hold Moldovan citizenship — and counts only **~15,000
usual-resident refugees**, versus UNHCR's 136k host figure. Same people, different concepts;
that contrast is exactly why item D matters.

---

## 2. The diaspora figure — the one framing caveat

864,257 is **accurate as the UN DESA 2024 total** and should stay as the headline. But it needs
context, because three things are simultaneously true and a reader sees only one:

| Concept | Basis | Figure |
|---|---|---|
| UN DESA 2024 (dashboard headline) | country of birth, all destinations | **864,257** |
| UN DESA prior editions | country of birth | 930k (2015) → **1,160k (2020)** |
| Mapped countries on the page | 9 shown destinations | **~752k** |
| NBS census population gap | de jure − usually-resident (2019) | **~858k** |
| IOM operational framing | citizenship / presence basis | **~1.0–1.2M** |

The story to tell (and the reason this is a *strength* once labelled): the **2024 figure is lower
than 2020's 1.16M** because UN DESA reassessed Moldova downward after the 2024 census, *and*
because birth-basis counts shed Moldovans who naturalised abroad and omit destinations reporting
by citizenship (Germany, US, UK). Independently, the **NBS census gap (~858k) lands right on the
UN DESA birth figure** — two methods agreeing near 0.86M, with the route to ~1.1M being the
citizenship basis. Present 864k as a **well-anchored conservative figure for a diaspora of
roughly 1.0–1.2M**, and the page stops looking like it contradicts either UN DESA 2020 or IOM.

---

## 3. Drop-in `data.js` edits

### 3.1 Resident population & decline (fixes A, B)

```js
// context.moldova
population_resident: 2409207,        // NBS 2024 Census, FINAL usually-resident, 8 Apr 2024
```
```js
// context.emigration indicator — replace the resident-population card
{ term: "Resident population", value: "2.41M", sub: "−13.6% since 2014 (NBS 2024 Census, final)", world: null, icon: "landmark", source_id: "nbs_census_2024", def_id: "depopulation" }
```
```js
// glossary "depopulation" — correct the magnitude
{ id: "depopulation", term: "Depopulation",
  definition: "Moldova's usually-resident population fell to 2.41M at the 2024 census — down " +
              "380,000 (−13.6%) from 2014 — driven by emigration plus more deaths than births (NBS)." }
```

### 3.2 Emigration headline + indicators (fix C, §2)

```js
emigration: {
  headline: "Few countries are as shaped by emigration. UN DESA's 2024 count puts about " +
            "864,000 Moldovan-born people abroad — a country-of-birth total that is lower than " +
            "2020's 1.16M after the census reassessment, and that omits destinations reporting " +
            "by citizenship (Germany, US, UK). NBS's own population gap (~0.86M) matches it " +
            "closely, so 864k is a firm floor for a diaspora of roughly 1.0–1.2 million.",
  indicators: [
    { term: "Diaspora (UN DESA 2024)", value: "864k", sub: "country-of-birth total · ~1.0–1.2M on a citizenship basis", world: null, icon: "users", source_id: "undesa_2024", def_id: "emigrant_stock" },
    { term: "Share abroad", value: "≈26–32%", sub: "of all Moldovan-born people (basis-dependent)", world: null, icon: "globe", source_id: "undesa_2024", def_id: "diaspora_basis" },
    { term: "Resident population", value: "2.41M", sub: "−13.6% since 2014 (NBS 2024 Census)", world: null, icon: "landmark", source_id: "nbs_census_2024", def_id: "depopulation" }
  ]
}
```
And on the map/table, relabel the emigration total **"Shown destinations: 752k of 864k (UN
DESA)"** rather than "Moldovans living abroad." (The "≈26–32%" card replaces the old "≈26%" and
**drops the "3.7% global" benchmark**, which was an immigrant-share statistic, not an emigration
rate — a false comparator.)

New glossary entry:
```js
{ id: "diaspora_basis", term: "Why diaspora figures differ",
  definition: "Country-of-birth counts (UN DESA 2024, ~864k) omit Moldovans who naturalised " +
              "abroad and destinations that report by citizenship; nationality-basis counts " +
              "(UN DESA 2020, 1.16M; IOM ~1.0–1.2M) include them. The NBS de-jure-minus-resident " +
              "gap (~0.86M) tracks the birth basis." }
```

### 3.3 Coverage labels on selected-country panels (fixes C, E)

Add a small "coverage" caption wherever a `total` is a sum of shown rows:
- Emigration 2024: **"Shown destinations: 752k of 864k UN DESA total."**
- Remittances 2020: **"Shown source countries: $1.26bn of $1.49bn NBM total (~85%); 2020 breakdown."**

If your renderer supports it, compute this automatically: `shownSum / DATA.context...total`.

### 3.4 Split "Coming to Moldova" into two measures (fix D — highest structural value)

The current tab blends UN DESA stock + old foreign-born estimates + UNHCR refugees. Split it:

**(a) Foreign-born residents** — use the census, not held estimates:
```js
// new source
nbs_census_migration: {
  label: "2024 Census — population by country of birth (foreign-born residents)",
  publisher: "National Bureau of Statistics of the Republic of Moldova",
  url: "https://statistica.gov.md/en/final-results-of-the-2024-population-and-housing-census-migration-10121_61958.html",
  indicator_code: "Census 2024 · foreign-born usual residents",
  accessed: "2026-06-14",
  definition: "Usually-resident people born outside Moldova, counted at the 2024 census.",
  scope: "106,700 persons (4.4%); 77.4% hold Moldovan citizenship. Excludes Transnistria.",
  note: "A residence/stock measure — distinct from UNHCR's refugee-hosting count."
}
```
```js
// immigration context card (a)
{ term: "Foreign-born residents", value: "106.7k", sub: "4.4% of residents, 2024 Census (NBS)", world: "3.7% global", icon: "globe", source_id: "nbs_census_migration", def_id: "immigrant_stock" }
```

**(b) Refugees from Ukraine** — keep UNHCR, date-stamped, with status:
```js
// immigration context cards (b)
{ term: "Refugees hosted", value: "136k", sub: "end-2024 (UNHCR); ~148k late-2025, ~140k Jan-2026", world: null, icon: "tent", source_id: "unhcr", def_id: "refugee_population" },
{ term: "Temporary Protection", value: "86,500+", sub: "TP holders, early 2026 (valid to Mar 2027)", world: null, icon: "tent", source_id: "unhcr", def_id: "refugee_population" }
```
Each number carries its own date; never show a refugee figure without one.

### 3.5 Frozen non-Ukraine immigration cells

Russia/Romania/Turkey/India are held flat 2020→2026; only the 2020 cells are real (UN DESA 2020).
Minimum fix — caption: *"Non-Ukraine origins held at the UN DESA 2020 stock; only the Ukraine
line is updated (UNHCR)."* Better — tag cells `basis: "undesa_2020_held"` and render them muted.

### 3.6 Remittances benchmark relabel

"World average 5.1%" is really the **LMIC average** (global remittances are <1% of world GDP).
Relabel the reference line **"LMIC average ≈5%"** and the indicator chip **"≈5% LMIC avg"**;
confirm the exact figure against the latest **KNOMAD Migration & Development Brief** before publishing.

### 3.7 State-budget figure

`state_budget_revenue_mdl_bn` is set to the **planned** 66.6bn. The second review reports
**actual 2024 execution ≈66.98bn lei** — update to executed revenue once confirmed against the
MoF budget-execution report (treat 66.98 as to-verify, not final).

---

## 4. Usefulness — and the one box both reviews ask for

Already strong for donors, journalists and policy colleagues precisely because it separates
stocks, flows, refugees and money — where migration communication usually fails. The single
highest-value addition both reviews independently recommend is a **"How to read this" strip above
the map**:

> **Stock ≠ flow · Refugee count ≠ immigrant stock · Bank transfers ≠ total remittances ·
> Shown countries ≠ national total.**

That one line prevents most misinterpretation and is cheaper than any data change.

---

## 5. Recommended additions (both reviews, deduplicated & prioritised)

1. **"How to read this" / definitions strip** above the map (diaspora stock · registered
   emigrants · foreign-born residents · refugees · remittance proxy). *Highest value, lowest cost.*
2. **Coverage percentages** next to every selected-country total (§3.3).
3. **Split immigration** into foreign-born residents vs refugees/TP (§3.4).
4. **Labour-migration series** — the one substantive data gap. Temporary/seasonal labour is *the*
   characteristic Moldovan movement and is currently absent. Pull the NBS Labour Force Survey
   "population abroad for work" panel via `fetch_data.py`. Verified anchors to use now (cite
   individually; they are different concepts): **241,448** departures in 2022 (Border Police);
   **~93,000** abroad for work in 2022. Source block:
   ```js
   nbs_lfs: {
     label: "Labour Force Survey — persons abroad / abroad for work",
     publisher: "National Bureau of Statistics of the Republic of Moldova",
     url: "https://statistica.gov.md/en", indicator_code: "LFS — population abroad for work",
     accessed: "2026-06-14",
     definition: "Survey estimate of household members reported as abroad, incl. seasonal/short-term labour migrants.",
     scope: "A flow/presence concept distinct from UN DESA stock and NBS registered emigration. Excludes Transnistria.",
     note: "Temporary labour migration is the most widespread form of emigration from Moldova (IOM)."
   }
   ```
5. **EU mobility layer (Eurostat)** — Moldova-born vs Moldovan-citizen residents in EU states, to
   explain why Romania/Italy/Germany/France/Portugal differ by citizenship vs birthplace.
6. **Policy-context cards** — labour shortages, ageing, depopulation (−13.6%), remittance
   dependency, refugee inclusion, return migration. Connects the data to the "so what."

---

## 6. Apply order (lowest risk → highest value)

1. §3.1–3.2 census + diaspora reconciliation (removes the figures most likely to be challenged).
2. §4 "How to read this" strip + §3.3 coverage labels (cheapest misinterpretation-killers).
3. §3.4 split immigration into foreign-born vs refugees (biggest structural fix).
4. §3.5 / §3.6 / §3.7 one-line caveats and relabels.
5. §5.4 labour-migration series — needs an NBS LFS pull, highest analytical payoff.

Every edit reuses the existing `sources` / `glossary` / `indicators` pattern; architecture is unchanged.

---

### Source notes
NBS 2024 Census final results (usually-resident 2,409,207; −13.6%; foreign-born 106,700; ~15,000
resident refugees); UN DESA International Migrant Stock 2024 (864,257) and 2020 (1.16M, via Prague
Process); UNHCR Moldova (136k end-2024; ~148k late-2025; ~140k & 86,500+ TP early-2026); NBM 2020
transfers ($1,486.74m total); World Bank/KNOMAD; IOM Moldova Migration Profile. State-budget
execution (~66.98bn MDL) per the second review — confirm against MoF.
