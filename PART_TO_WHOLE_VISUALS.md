# PART_TO_WHOLE_VISUALS.md — Moldova in Motion

**Priority 7 — Part-to-whole comparison visuals** (extension of `VISUAL_REVISIONS.md`).

Goal: stop reporting magnitude as a bare percentage. Every "big number vs the whole"
claim in the dashboard should be *shown* — render the whole, highlight the part, and let
the reader see the proportion before they read the figure. A pictogram of people where the
diaspora lights up against the resident population says more than "≈36%."

---

## Design principle

For every ratio the dashboard states, draw **both terms**:

1. **The whole** is always visible (the full population, the whole GDP bar, all 100 squares).
2. **The part** is highlighted in the mode's accent color.
3. **The denominator is labelled on the visual** — never a floating percentage. Carry the
   interpretation-safety rule from the main spec right onto the graphic:
   *"of 2.41M resident population · 2024 Census."*
4. **One measure per visual.** Never mix a stock and a flow, or two definitions, inside the
   same pictogram (e.g. diaspora stock and registered emigration must never share a grid).
5. **A plain-language readout** sits under each visual: a "1 in N" or "for every X" sentence.

---

## Reference figures & derived ratios

These are illustrative — **read live values from the `context` / `SOURCES` block and compute
the ratios at render time** so they never drift from the data. Show the "1 icon = N" key on
every pictogram.

| Comparison | Part | Whole | Ratio | Plain readout |
|---|---|---|---|---|
| Diaspora vs all Moldovan-born | 864,257 abroad | 3.27M born Moldovan (2.41M resident + 0.86M abroad) | ~26% | "About **1 in 4** Moldovan-born people lives abroad." |
| Diaspora vs resident pop | 864,257 abroad | 2,409,207 resident | ~36% | "The diaspora equals **more than a third** of everyone still living in Moldova." |
| Depopulation since 2014 | ~380,000 fewer | 2,789,000 (2014 census) | −13.6% | "Since 2014 Moldova has lost roughly **1 in 7** residents." |
| Refugees hosted (per-capita) | ~140,000 (Jan-2026) | 2,409,207 resident | ~5.8% | "Moldova hosts about **1 Ukrainian refugee for every 17 residents** — among Europe's highest rates." |
| Foreign-born residents | 106,700 | 2,409,207 resident | 4.4% | "About **1 in 23 residents** was born outside Moldova." |
| Remittances vs GDP | ~10.5% | GDP (100%) | 10.5% | "Roughly **1 in every 10 lei** of GDP comes home as remittances — nearly double the global average." |
| Remittances vs state budget | annual remittances | 66.98bn MDL revenue (2024) | >50% | "Money sent home is worth **more than half** of everything the state collects in a year." |

**Denominator choice is an editorial decision — make it explicit.** "1 in 4 of all
Moldovan-born" (whole = every Moldovan-born person) is the cleanest true part-to-whole and is
my recommended default; "more than a third of the resident population" is also valid but the
whole is different, so the label must say which. Keep the hero subhead consistent with
whichever you pick.

---

## The visuals to build

### A. "Where Moldova's people are" — emigration mode
- **Idiom:** a single horizontal population bar drawn to scale, split into **In Moldova**
  (2.41M) and **Abroad** (0.86M), with a person-icon pictogram tiled across it. Highlight the
  Abroad segment in the emigration accent.
- **Alt idiom (smaller footprint):** a 100-figure isotype grid where 1 icon = ~1% of all
  Moldovan-born people; ~26 icons highlighted.
- **Readout:** "About 1 in 4 Moldovan-born people lives abroad."
- **Label:** "Whole = all Moldovan-born (resident + diaspora), 2024."

### B. "What was lost" — emigration mode (depopulation)
- **Idiom:** a pictogram of ~100 figures where ~14 are faded/outlined to show the −13.6%
  loss since 2014. Or two silhouettes (2014 vs 2024) drawn to scale.
- **Readout:** "Since the 2014 census, Moldova has roughly 380,000 fewer residents — about 1
  in 7 people."
- **Label:** "vs 2014 census · NBS final results."

### C. "Moldova as host" — immigration mode
- **Idiom:** a "1 in N" unit cluster — 17 resident icons in a neutral tone + 1 refugee icon
  in accent — captioned with the per-capita framing. Keep this **visually separate from the
  foreign-born-residents figure** (ties into the immigration-split fix in the main spec): two
  small stacked unit blocks, one for *Refugees from Ukraine* (UNHCR), one for *Foreign-born
  residents* (Census), never merged.
- **Readout:** "Moldova hosts about 1 Ukrainian refugee for every 17 residents — among
  Europe's highest per-capita rates."
- **Optional:** a tiny benchmark bar comparing Moldova's per-capita hosting rate to 1–2
  comparator countries — only if you have a sourced figure; otherwise omit (don't invent).

### D. "Money sent home" — remittances mode
- **Idiom 1 (vs GDP):** a 10×10 waffle (or a single 100% bar) with ~10–11 squares filled in
  the remittance accent. Add a faint reference tick for the global average (~5–6%) so the
  "nearly double" claim is visible, not just stated.
- **Idiom 2 (vs state budget):** two bars at the same scale — **state budget revenue**
  (66.98bn MDL) vs **annual remittances** — with the remittance bar visibly more than half
  the budget bar.
- **CRITICAL — unit/currency consistency:** remittances are usually quoted in USD and the
  budget in MDL. Convert one to the other, and print the **FX rate + year** used on the
  visual. Comparing $-remittances to MDL-budget without conversion is a real error trap;
  don't ship the budget comparison until the units match and the conversion is labelled.
- **Readouts:** "Roughly 1 in every 10 lei of GDP comes home as remittances." /
  "Money sent home is worth more than half the state budget."

---

## Placement & behaviour

- Each comparison lives in the **context/analysis panel for its own mode** (or directly under
  the mode's key-takeaway card), so it swaps when the mode changes — same pattern as the
  takeaway card.
- Default to **one comparison visual per mode** (the strongest one); the rest can be a compact
  secondary row. Don't stack four pictograms — magnitude visuals lose force when crowded.
- Keep the palette discipline: whole = neutral grey, part = the mode accent only.

## Implementation notes

- Single-file build; plain SVG or D3. Pictograms: define one person `<symbol>` and tile it
  with `<use>` (or a CSS grid of glyphs) — cheaper than 100 separate paths.
- **Read values from the centralized data block and compute ratios in JS.** Never hardcode a
  percentage or an icon count that the data could later contradict.
- Pick an icon scale that keeps the count legible (≈50–150 icons max). Always render the
  "1 icon = N people" key.
- **Accessibility:** wrap each visual in `role="img"` with an `aria-label` equal to the full
  readout *including the denominator*; also print the readout as visible text so it works
  without color and for screen readers. The pictogram is decoration over a sentence, not a
  replacement for it.
- **Motion:** a count-up or icon-fill animation is fine but gate it on
  `prefers-reduced-motion` (render the final state instantly when reduced motion is set).
- **Rounding:** "1 in N" and "more than half" are approximations — keep the words "about" /
  "roughly" in the readout so the visual doesn't imply false precision.

## Definition of done

A reader who never reads a number still leaves knowing: a large share of Moldovans live
abroad, the country lost a visible chunk of its population since 2014, it hosts an unusually
high per-capita refugee load, and remittances are a major slice of the whole economy — each
shown as a part against a clearly-labelled whole, in the right mode, with a text equivalent.
