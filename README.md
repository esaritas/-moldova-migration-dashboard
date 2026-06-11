# Moldova in Motion — migration & remittances dashboard

An interactive, light-themed dashboard showing three flows for the Republic of Moldova:

- **Leaving Moldova** — Moldovans living abroad (emigration)
- **Coming to Moldova** — migrants & refugees in Moldova (immigration)
- **Money sent home** — remittances by source country

Each country is a **proportional bubble** sized by its figure, with the value
printed on it (like the Migration Data Portal), connected to Moldova by a flow
ribbon; a size legend and hover tooltips help read it. A timeline lets you step
through years (a unified 2010–2026 track — years a mode
lacks are muted); the table beside the map lists the figures and is linked to the
map on hover. The map supports scroll/pinch zoom and drag-to-pan, opening on a
Europe-focused view with a reset-to-world button.

## Run it

No build step. You just need to serve the folder (opening `index.html` directly
via `file://` works for most of it, but a local server avoids any browser quirks).

**VS Code (recommended):** install the *Live Server* extension, right-click
`index.html` → **Open with Live Server**.

**Or from a terminal:**
```bash
cd moldova-migration-dashboard
python3 -m http.server 8000
# then open http://localhost:8000
```

## Files

| File | What it is |
|------|------------|
| `index.html`    | Page structure, loads everything |
| `styles.css`    | All styling. Mode accent colors live in `:root` (`--c-out`, `--c-in`, `--c-money`) |
| `data.js`       | **The figures.** Edit this to update numbers — nothing else needs touching |
| `app.js`        | D3 logic: map, flow arcs, table, timeline, mode switching |
| `world-data.js` | Natural Earth 1:110m country outlines (public domain), bundled so it works offline |

Only external dependency is **D3 v7** from a CDN (`index.html`), plus Google Fonts
(both degrade gracefully if offline).

## Editing the data

Open `data.js`. Each mode has a `years` block; each year is an array of
`{ country, value }`. To:

- **change a number** — edit `value`
- **add a year** — add a new key under `years`; the timeline picks it up automatically
- **add a country** — add it to `coords` (as `[lat, lng]`) and to the year arrays

> **Important:** the seeded figures are an *illustrative working baseline* compiled
> from public sources (NBM, UN DESA, UNHCR, World Bank, IOM, OSW). Moldova has no
> single authoritative bilateral series and official counts undercount the real
> diaspora. Replace these with the exact series you trust before any external use.

## Ideas to extend

- Swap `coords` capital points for population-weighted centroids.
- Add a tooltip on hover (country + value + year-on-year change).
- Pull live values from an API or CSV instead of the static `data.js`.
- Add a fourth mode (e.g., net flow) or a "per 1,000 population" toggle.
- Replace the 3 snapshot years with an annual series once you have it.
