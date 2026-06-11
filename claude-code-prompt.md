# Prompt to paste into Claude Code

Copy everything in the box below as your first message to Claude Code after you
open this folder in VS Code. (It assumes all the project files, including
HANDOFF.md, are in the working directory.)

---

You're picking up a project I started in a claude.ai chat. The full context is in
`HANDOFF.md` — please read that first, then `README.md`, then skim `data.js` and
`app.js` so you understand the architecture before changing anything.

Short version: it's a minimalist D3 dashboard showing Moldova's emigration,
immigration/refugees, and remittances on an interactive flow map with a unified
2010–2026 timeline and a linked data table, plus a Python pipeline
(`fetch_data.py`) that refreshes the data from official sources (World Bank API,
UNHCR API, and a National Bank of Moldova scraper). It runs with no build step —
plain script tags — so I preview it with Live Server on `index.html`.

Important data caveat (details in HANDOFF.md): remittances are EXACT official NBM
figures for 2018 and 2020 only; immigration uses real UNHCR refugee counts;
emigration is diaspora estimates. Don't "tidy" these into looking uniformly
authoritative — the mixed confidence is intentional and labelled.

First, do these two things and report back before writing feature code:

1. Run the pipeline for real and tell me what actually works vs breaks:
   `pip install -r requirements.txt`
   `python fetch_data.py --years 2018 2020`
   The World Bank + UNHCR API response shapes were written to spec but never
   executed (the original environment was network-locked). I expect the UNHCR
   field names and maybe the World Bank pagination might need fixing. Fix any
   parsing bugs you hit, keep each source failing-soft, and show me the
   `data.json` it produces.

2. Confirm the front end still renders correctly after any data changes (open it
   with a local server and sanity-check that all three modes, the zoom controls,
   and the timeline empty-states behave).

Then let's tackle, in this order (check with me before each): (a) implement the
`undesa_bilateral()` stub so emigration becomes real data from a UN DESA workbook
I'll download, and (b) add NBM interactive-database (DBP4) fetching so remittances
can go past 2020 by country.

Keep the visual style as-is: light, calm, minimal; one accent colour per mode;
plain-language labels for a non-technical audience. Ask me before adding any new
dependency or changing the no-build-step setup.

---
