# DASHBOARD_REVISION_SPEC.md — Moldova in Motion

Consolidated, verified revision spec for `moldova-migration-dashboard.html`.
Merges: (a) an external migration-data expert review, (b) the earlier visual/storytelling
review, and (c) independent verification against UN DESA, NBS, UNHCR, World Bank and NBM.

**Read this first — scope note.** The user believed the data figures were already fixed.
They are **not fixed in this build.** The −16% text, the 2,789,207 baseline, "nearly one in
three," and the "2020's 1.16M" sentence are all still present in the uploaded file
(line numbers below). The *visual* fixes from the previous round (constant-width rails,
corrected lede, mode badges, takeaway card) **did** land. So this spec is mostly **data +
labelling**, plus a few visual items that are still open.

Each item is tagged: **[DATA-BUG]** factual error · **[DATA-LABEL]** correct number, unsafe
framing · **[VISUAL]** encoding/story · **[VERIFY]** check a source before publishing.
"Status" records what I confirmed against primary sources.

---

## A. Verdict on the expert review

The migration-data review is rigorous and, on the load-bearing points, **correct and
verified.** Its strongest catches all hold:

- **Remove the "1.16M" sentence — confirmed.** UN DESA's 2024 edition fully reassessed 60
  countries (Moldova among them) and extrapolated the rest from the 2020 edition. The drop
  from ~1.16M (2020 edition) to 864,257 (2024) is a **series revision, not a real-world
  decline.** Presenting it as a fall is misleading.
- **"One in three" → "one in four" — confirmed by arithmetic.** 864,257 ÷ (864,257 +
  2,409,207) = 26.4%. "One in three" is only defensible against the *resident* population
  (864,257 ÷ 2,409,207 = 35.9%, "more than a third of residents") or against broader
  1.0–1.2M diaspora estimates — never against the strict 864k birth-based figure framed as
  "of all Moldovans."
- **Split foreign-born residents from Ukrainian refugees — confirmed.** Different universes
  (NBS census concept vs UNHCR operational count). The build now *labels* the mix
  ("FOREIGN-BORN + REFUGEES" badge) but still plots them as one bubble field.
- **NBS "registered flows" need precise labelling — confirmed and important.** NBS publishes
  a *headline* international migration series built from Public Services Agency + Border
  Police data (tens of thousands/year), which is a different, much larger measure than the
  "authorized emigrants who deregistered" PxWeb table the dashboard uses (a few thousand/yr).
  Calling the dashboard's series "official NBS migration flows" invites a false comparison.

Where I'd temper the expert:

- The **2,789,205 vs 2,789,207** correction is a two-person difference — fix it for
  precision, but it's the lowest-priority item in the whole list and affects no visual.
- Adding NBS's **headline border-based flows** as a new series is *optional scope*, not a
  correction. The current narrow series isn't "wrong"; it needs a precise label. Don't let
  this balloon into a new data pipeline unless Erhan wants it.
- The review is **silent on the remaining visual issues** (combined immigration map, stale
  map-caption). Those are folded in below.

---

## B. Data fixes — do these before publishing

### B1. [DATA-BUG] Remove the lingering "−16%" — line ~1121
File still reads `"the −16% fall in resident population shows."` The verified census figure
is **−13.6%**, which the glossary already uses elsewhere. This is an internal contradiction
shipping a wrong number. **Status: −13.6% confirmed (NBS final census).**

### B2. [DATA-BUG] Remove/footnote the "2020's 1.16M" sentence — line ~1148
Current: `"...than 2020's 1.16M after the census reassessment, and that omits destinations..."`
Replace the emigration `takeaway` (line ~1145) and this caveat with language that does **not**
imply a real fall. Suggested:
> "UN DESA's 2024 series estimates 864,257 Moldovan-born people abroad. (Earlier 2020-edition
> releases cited ~1.16M; the 2024 edition revises the 2020 value down to ~813k, so this is a
> data-series revision, not a real decline.) This is a strict country-of-birth measure and
> may miss Moldovans counted by citizenship abroad."
The "(UN DESA 2020, 1.16M; IOM ~1.0–1.2M)" note at line ~1083 is fine to keep as *broader-
estimate context* — just don't frame 1.16M→864k as a drop anywhere. **Status: revision-not-
decline confirmed (UN DESA 2024 reassessed 60 countries, extrapolated the rest).**

### B3. [DATA-LABEL] Reframe "nearly one in three" — line ~1145
Change the emigration takeaway from `"a diaspora that equals nearly one in three Moldovans"`
to a denominator-explicit statement, e.g. **"about one in four of all Moldovan-born people
(≈26%); equivalent to more than a third of the resident population."** **Status: arithmetic
verified.**

### B4. [DATA-LABEL] Update Temporary Protection figure — line ~1166
Current: `"86,500+" · "TP holders, early 2026"`. Update to **88,383 · UNHCR, Jan 2026**
(and date-stamp the 140k residing figure as Jan 2026). Reserve 136k for end-2024; do not mix
the dates. **Status: ~140k Jan-2026 residing + 86,500–88,383 TP range confirmed; use the
exact UNHCR Jan-2026 value, and [VERIFY] against the UNHCR 20-May-2026 (April 2026) Moldova
update if publishing after that date.**

### B5. [DATA-BUG] Correct the 2014 census baseline — line ~1134
`population_2014_census: 2789207` → **2789205** (NBS final). Low priority, precision only.
**Status: expert-sourced; [VERIFY] the last digit against the NBS 2014 final result.**

### B6. [VERIFY] Source or remove `gdp_mdl_bn: 342.1` — line ~1135
This MDL GDP figure is unsourced and looks forecast-style; other sources cite ~324bn MDL for
2024. It is used only in the remittances-vs-budget FX calc (line ~2219, `remitMdl = 1920 *
fxRate/1000`). Either cite a primary 2024 nominal-GDP source on the visual, or drop the MDL
GDP and express the budget comparison directly. **Status: flagged; needs a primary source.**

### B7. [DATA-LABEL] Keep but label the two remittance datasets
Map/ranking = **NBM 2020 bank transfers by source country** ($1,486.74M total, ~85% covered);
economic context = **World Bank 2024 personal remittances** ($1.92bn, 10.5% of GDP). Both are
fine; make the **2020 vintage** of the country map obvious at point of use, not just in the
footer. **Status: both figures consistent with sources.**

---

## C. The immigration split — the one big structural item

### C1. [VISUAL + DATA-LABEL] Deliver the split, don't just label it — lines ~1150–1180
The "Coming to Moldova" badge now says "FOREIGN-BORN + REFUGEES," but the map still renders
**one combined bubble field** mixing UNHCR Ukrainian refugees with NBS/UN DESA foreign-born
residents. Deliver an actual split — a sub-toggle or two stacked bubble sets:

- **A. Foreign-born residents — NBS Census 2024:** total 106.7k; Ukraine-born 52.4k;
  Russia-born ≈32.5k (30.5%); others (Romania, Turkey, India…).
- **B. Ukrainian refugees — UNHCR Jan 2026:** 140,140 residing; 88,383 Temporary Protection.

Do **not** present a single "immigration" line chart across 2020–2026 as if comparable — the
Ukraine series is UNHCR refugee stock while other origins are older UN DESA/NBS estimates.
Use two cards/series instead of one blended total. **Status: 106.7k / 52.4k / 30.5% and
140,140 / 88,383 all confirmed against NBS census + UNHCR.**

---

## D. Remaining visual cleanups (from the earlier visual review)

### D1. [VISUAL] Kill the stale map-caption default — line ~750
HTML still hardcodes `Flow width = people`, which **contradicts the now-constant rails**
(magnitude is carried by bubble size). It's overwritten at runtime, but remove the stale
default so the source isn't self-contradictory. The single size legend ("Bubble size =
people/money", line ~1818) is correct — keep only that.

### D2. [VISUAL] Confirm coverage labels render on every mode
The "Shown: X of Y (N%)" total label and per-mode vintage badge should appear on **all five**
modes, including the two registered-flow modes. Verify after the immigration split.

### D3. [VISUAL] (carried, optional) Dynamic map `aria-label`
Map still uses a static `aria-label`. A per-mode/year summary label is a cheap accessibility
win; the ranking table remains the screen-reader fallback, so this is optional.

---

## E. Validated core dataset (use these exact values)

| Indicator | Value | Source |
|---|---|---|
| Resident population (2024 census) | 2,409,207 | NBS 2024 Census |
| 2014 census baseline | 2,789,205 | NBS 2014 Census |
| Population decline 2014→2024 | −13.6% | NBS 2024 Census |
| Moldovan-born abroad | 864,257 (2024); ~813k revised-2020 | UN DESA 2024 |
| Share abroad | ≈26.4% of all Moldovan-born (≈36% of residents) | calc. UN DESA + NBS |
| Foreign-born residents | 106.7k (4.4%) | NBS 2024 Census |
| Ukraine-born usual residents | 52.4k | NBS 2024 Census |
| Russia-born share of foreign-born | 30.5% (≈32.5k) | NBS 2024 Census |
| Ukrainian refugees residing | 140,140 (Jan 2026) | UNHCR |
| Temporary Protection holders | 88,383 (Jan 2026) | UNHCR |
| Remittances-to-GDP | 10.5% (2024) | World Bank |
| Personal remittances (approx.) | $1.92bn (2024) | World Bank |
| NBM by-country transfers (map) | $1,486.74M total (2020 only) | NBM |
| State budget revenue (executed) | 66.98bn MDL (2024) | Gov/MoF |
| GDP | $18.2bn (2024); MDL figure needs sourcing | World Bank / [VERIFY] |
| NBS headline migration (optional series) | border/PSA-based, tens of thousands/yr | NBS |

---

## F. Priority order

1. **B1, B2, B3** — the three data items that are currently *wrong or misleading on screen*
   (−16%, the 1.16M "drop," "one in three").
2. **C1** — deliver the foreign-born vs refugees split (biggest structural fix).
3. **B4, B7, D1** — date-stamp TP/refugees, label the 2020 remittance map, remove stale caption.
4. **B6** — source or remove the MDL GDP number.
5. **B5, D2, D3** — precision baseline, label QA, optional accessibility.

## Definition of done

No on-screen figure is wrong or implies a false trend; foreign-born residents and Ukrainian
refugees are visually distinct; every total shows its denominator and vintage at point of use;
and nothing in the copy or captions describes an encoding the build no longer uses.
