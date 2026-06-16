# VISUAL_REVISIONS.md — Moldova in Motion

Visual, storytelling, and encoding revisions for `moldova-migration-dashboard.html`.
Consolidated and deduplicated from three independent reviews (migration-data, visual
storytelling, and encoding-craft). **Data and figures are already corrected — this file
covers VISUAL / STORYTELLING / ENCODING only.**

---

## North star

The dashboard currently behaves like a **data explorer**. Make it open as a **story**:
the reader should grasp the conclusion — *Moldova is simultaneously a country of major
emigration, high remittance dependence, and post-2022 refugee hosting* — before being
asked to explore. **Tell first, explore second.**

## Definition of done

A first-time viewer:
- understands the three-system story (emigration / refugee hosting / remittances) within
  ~5 seconds of landing;
- cannot accidentally compare a *stock* against a *registered flow*;
- can read exact values from the table without decoding ribbon thickness.

## Preserve (do not regress)

- Single-file build; calm palette; one accent color per mode; mono provenance type.
- `prefers-reduced-motion` handling (particle streams off) and `:focus-visible` outlines.
- The centralized `SOURCES` + `glossary` block as single source of truth — any new
  badge/label must **read from it**, not hardcode.
- The existing "how to read this" strip and methodology modal.

---

## Priority 1 — Story-first framing

- [ ] Add a **key-takeaway card directly above the map** that **changes per mode**: one
      plain sentence stating the conclusion for that view (emigration, immigration,
      remittances, and each NBS flow). *Most important storytelling change.*
- [ ] Keep "Moldova in Motion" as the brand title but add a **story subhead** beneath it.
- [ ] Consider a **3-chapter spine** — "Moldova abroad" / "Moldova as host" / "Moldova
      connected by money" — and move the two NBS registered-flow modes into a clearly
      separated section, e.g. **"Administrative reality: what Moldova officially records,"**
      so they are never visually peer to the stock/money modes.

## Priority 2 — Mode legibility & interpretation safety

- [ ] Add a small **category badge inside each mode button**:
      `STOCK` · `REFUGEE-HOSTING` · `MONEY-PROXY` · `REGISTERED-FLOW`.
      Style the two registered-flow buttons distinctly (muted) so the magnitude-category
      shift is *felt*, not just read. The current divider + note is too quiet.
- [ ] **Split "Coming to Moldova"** into two visual units — "Foreign-born residents" vs
      "Refugees from Ukraine" — as two tabs or two stacked cards. Never merge two
      different measures into one bubble field.
- [ ] Add a per-mode **freshness badge** near the title/caption ("UN DESA 2024",
      "UNHCR Jan-2026", "NBM 2020 by-country", "NBS registered flow") so vintage appears
      at point of use, not only in the footer. (If coverage labels like "752k of ≈864k
      shown" aren't already on the totals, add them here too.)

## Priority 3 — Map encoding fixes

- [ ] **Stop double-encoding magnitude.** Rail width AND bubble area currently both encode
      the value, and there are two separate size legends ("Flow width = people" + "Bubble
      size = people"). Keep **bubble area as the only magnitude channel**; make the rails
      carry direction/connection only (uniform or lightly value-tinted), and remove the
      "Flow width = people" caption so there is **one** size legend.
- [ ] **Fix bubble-label collisions** at the default world view (the European cluster
      overlaps). Options, in order of preference:
      - default the map to the **Europe extent** where most data lives, with an affordance
        for off-extent countries (US / India / Israel); or
      - move labels **off the bubbles** with leader lines for the dense cluster; or
      - show numbers on **hover + top-N only**.
- [ ] **Fix arc geometry.** `arcPath()` forces the curve's normal to one screen direction,
      so spokes to opposite sides of Moldova bend toward each other and long arcs (US)
      over-read. Make **curvature depend on bearing** so spokes fan out cleanly without
      crossing the hub.

## Priority 4 — Make the table a co-hero + enable comparison

- [ ] **Rebalance the layout** so the ranking **table reads as equally important** to the
      map (it's where values become comparable; ribbon thickness is not). Consider:
      *left = story card + ranking table · right = map · bottom = timeline + context.*
- [ ] Add a **small-multiples strip** (one mini-panel per mode: top destinations / top
      origins / top remittance sources / NBS emigration / NBS immigration) so users can
      compare modes without tab-switching.

## Priority 5 — Timeline & context polish

- [ ] **Label the play control** ("Play the timeline ▶"); the bare button isn't
      discoverable.
- [ ] On year selection, render the annotation as a visible **caption line** (the
      mode-scoped annotations already exist — make them feel like captions, not just hover
      text).
- [ ] **Analytical-panel consistency:** only remittances gets a trend line today. Give
      emigration a small trend (resident-population decline / diaspora over time) so the
      depopulation spine is *visual*, not just a stat-card subtitle.

## Priority 6 — Accessibility & minor

- [ ] Make the map's `aria-label` **dynamic per mode/year** (summarize the top values)
      instead of the static "Map of migration flows."
- [ ] Ensure any definition/help affordance is **keyboard- and touch-reachable**; don't
      rely on `title=` / `cursor:help` alone.
- [ ] Quiet or remove purely decorative ink (e.g. the hub-ring) only if it competes.

---

## Drop-in copy (optional)

- **Story subhead:**
  > A third of Moldova's people live abroad — but their money, families and crises still
  > connect back home.

- **Mode note:**
  > The first three views show large stocks or money. The last two show narrow official
  > NBS registered annual moves — not directly comparable.

- **"Coming to Moldova"** → split into **"Foreign-born residents"** and
  **"Refugees from Ukraine."**

---

## Suggested order of work

1. Priority 1 + the category badges in Priority 2 (biggest story payoff, low risk).
2. Split "Coming to Moldova" (Priority 2) — accuracy-adjacent, high clarity gain.
3. Map encoding fixes (Priority 3) — the craft work; test at default zoom + mobile.
4. Layout rebalance + small multiples (Priority 4).
5. Timeline/context polish + accessibility (Priorities 5–6).
