/* ============================================================================
   MOLDOVA MIGRATION DASHBOARD — DATA LAYER
   ============================================================================
   Edit this file to update figures; nothing else needs touching.

   PROVENANCE (which numbers are exact vs estimated, and how fresh):
   - remittances : EXACT official NBM figures (USD m, net settlements) for 2018
                   and 2020. These are the last two years NBM published the full
                   by-source-country breakdown as a press release; from 2021 the
                   breakdown lives only in NBM's interactive database (DBP4).
                   => Latest fully-published by-country year: 2020.
   - immigration : UN DESA migrant stock (2020) + UNHCR residing-refugee counts
                   (2023 ≈115k, 2024 ≈136k, Jan-2026 ≈140k). FRESHEST mode.
   - emigration  : OFFICIAL UN DESA Int'l Migrant Stock 2024 (bilateral, by
                   country of birth). Germany/US/UK report by citizenship, not
                   birthplace, so UN DESA has no Moldova-born cell for them and
                   they are omitted (not estimated). Birth-basis counts still
                   undercount (naturalised Moldovans drop out), so totals here
                   (~750k across covered countries) sit below diaspora estimates
                   of ~1.1M. Run fetch_data.py --undesa to refresh.

   Run fetch_data.py to refresh from source. Each mode can carry its own set of
   years — the timeline adapts when you switch modes.
   ========================================================================== */

window.MIGRATION_DATA = {

  origin: { name: "Moldova", lat: 47.01, lng: 28.86 },

  coords: {
    "Russia":         [55.75, 37.62], "Italy":          [41.90, 12.50],
    "Romania":        [44.43, 26.10], "Ukraine":        [50.45, 30.52],
    "Germany":        [52.52, 13.40], "France":         [48.85,  2.35],
    "Israel":         [32.08, 34.78], "United States":  [38.90, -77.04],
    "United Kingdom": [51.51, -0.13], "Portugal":       [38.72, -9.14],
    "Spain":          [40.42, -3.70], "Turkey":         [39.93, 32.86],
    "India":          [28.61, 77.21]
  },

  meta: {
    // "Data current as of" stamp. The pipeline overwrites `generated` on each run;
    // `updated` is a manual fallback for hand-edits. Per-series freshness lives in
    // each source's `accessed`.
    updated: "2026-06-12",
    latest_year: { emigration: 2024, immigration: 2026, remittances: 2020 },
    note: "Remittances by-country is official/exact (NBM 2018 & 2020). " +
          "Immigration uses UNHCR refugee counts (to 2026). " +
          "Emigration is official UN DESA 2024 by country of birth " +
          "(Germany/US/UK omitted — they report by citizenship, not birthplace)."
  },

  // One-line scope note shown near the title and wherever a population ratio
  // appears. Resident vs de-jure population are never combined in one ratio.
  scope_note: "Scope: resident population excludes the Transnistria region " +
              "(NBS 2024 Census); international sources may differ in scope. " +
              "Population-based ratios use resident population.",

  // Neutral, factual per-country footnotes surfaced in the hover tooltip. These
  // are mobility/scope facts, NOT identity or geopolitical framing. `modes`
  // limits a note to where it's relevant (omit = all modes).
  country_notes: {
    Romania: { text: "Many Moldovans also hold Romanian citizenship and may move " +
                     "onward through the EU — a passport and mobility fact." },
    Ukraine: { text: "From 2022, arrivals from Ukraine are predominantly refugees / " +
                     "people fleeing the war in Ukraine (UNHCR).", modes: ["immigration"] }
  },

  // Timeline call-outs — factual, mode-scoped notes tied to a year. Rendered as
  // subtle markers + a narration line so pressing play tells the story. Keep them
  // neutral (data, not framing); `modes` limits where each shows.
  annotations: [
    { year: 2022, modes: ["immigration"],
      text: "War in Ukraine — arrivals of refugees / people fleeing the war surge (UNHCR)." },
    { year: 2024, modes: ["immigration"],
      text: "≈136,000 refugees from Ukraine residing in Moldova (UNHCR)." },
    { year: 2020, modes: ["remittances"],
      text: "Russia's share falls to third; Israel becomes the top source (NBM, 2020)." },
    { year: 2024, modes: ["emigration"],
      text: "Recorded diaspora tilts toward the EU; Italy leads and recorded Russia-born stock falls (UN DESA)." }
  ],

  // ==========================================================================
  // SOURCES — single source of truth for provenance. Every series, context
  // series and indicator points here via `source_id` / `source_ids`; nothing
  // cites a source inline anymore. Edit a citation in ONE place: here.
  // Captions, the methodology modal and the footer all read from this block.
  // ==========================================================================
  sources: {
    undesa_2024: {
      label: "International Migrant Stock 2024 (by destination and origin)",
      publisher: "UN DESA Population Division",
      url: "https://www.un.org/development/desa/pd/content/international-migrant-stock",
      indicator_code: "POP/DB/MIG/Stock/Rev.2024",
      accessed: "2026-06-11",
      definition: "Migrant stock = people living in a country other than the one they were " +
                  "born in (country-of-birth basis), counted at mid-year.",
      scope: "Bilateral, by country of birth. Germany, the United States and the United " +
             "Kingdom report by citizenship rather than birthplace, so UN DESA carries no " +
             "Moldova-born cell for them (omitted, not zero). The 'Republic of Moldova' row " +
             "carries a UN data note on Transnistria coverage.",
      note: "Birth-basis counts undercount where Moldovans have naturalised abroad."
    },
    unhcr: {
      label: "Refugee Population Statistics (people residing in Moldova)",
      publisher: "UNHCR",
      url: "https://www.unhcr.org/refugee-statistics/",
      indicator_code: "population/v1 · coa=MDA · refugees + asylum-seekers",
      accessed: "2026-06-11",
      definition: "Refugees and asylum-seekers whose country of asylum is the Republic of " +
                  "Moldova, at year-end.",
      scope: "From 2022 this population is predominantly people fleeing the war in Ukraine.",
      note: "Reported in UNHCR's terms — refugees / people fleeing the war in Ukraine — " +
            "not merged into general 'immigrants'."
    },
    nbm_transfers: {
      label: "Money transfers from abroad in favour of individuals via banks (net settlements)",
      publisher: "National Bank of Moldova",
      url: "https://www.bnm.md/en/content/money-transfers-abroad-individuals-banks-republic-moldova-2020-net-settlements",
      indicator_code: "DBP4 / annual press release (net settlements)",
      accessed: "2026-06-11",
      definition: "Cross-border money transfers to resident individuals settled via Moldovan " +
                  "banks, by source country, net basis. A proxy for remittances.",
      scope: "Excludes the Transnistria region (not under the authorities' control), so " +
             "figures are not comparable with counterpart-country statistics. Not solely " +
             "labour remittances — also includes some salaries, pensions and other transfers. " +
             "A full by-country breakdown was published annually only through 2020.",
      note: "Exact official figures for 2018 and 2020."
    },
    wb_remit_gdp: {
      label: "Personal remittances received (% of GDP)",
      publisher: "World Bank — World Development Indicators",
      url: "https://data.worldbank.org/indicator/BX.TRF.PWKR.DT.GD.ZS?locations=MD",
      indicator_code: "BX.TRF.PWKR.DT.GD.ZS",
      accessed: "2026-06-11",
      definition: "Remittance dependency — personal remittances received as a share of GDP " +
                  "(BPM6).",
      scope: "National accounts basis; excludes Transnistria.",
      note: "Earlier years approximate; refresh via fetch_data.py."
    },
    wb_remit_total: {
      label: "Personal remittances received (current US$)",
      publisher: "World Bank — World Development Indicators",
      url: "https://data.worldbank.org/indicator/BX.TRF.PWKR.CD.DT?locations=MD",
      indicator_code: "BX.TRF.PWKR.CD.DT",
      accessed: "2026-06-11",
      definition: "Total personal remittances received, current US dollars (BPM6).",
      scope: "Broader than the NBM net-settlement series (different methodology), so totals differ.",
      note: ""
    },
    nbs_census_2024: {
      label: "Population and Housing Census 2024 (usually-resident population)",
      publisher: "National Bureau of Statistics of the Republic of Moldova",
      url: "https://statistica.gov.md/",
      indicator_code: "Census 2024 · usually-resident",
      accessed: "2026-06-11",
      definition: "Usually-resident population — people who actually live in the country.",
      scope: "Excludes the Transnistria region. Do not mix with de-jure population in a ratio.",
      note: ""
    },
    eurostat_migr: {
      label: "Population by citizenship / country of birth (Moldovans in the EU)",
      publisher: "Eurostat",
      url: "https://ec.europa.eu/eurostat/databrowser/product/view/migr_pop1ctz",
      indicator_code: "migr_pop1ctz · migr_pop3ctb",
      accessed: "2026-06-11",
      definition: "EU resident population who are Moldovan citizens (migr_pop1ctz) or " +
                  "Moldova-born (migr_pop3ctb), 1 January.",
      scope: "Cross-check only — a DIFFERENT measure from UN DESA's country-of-birth stock " +
             "(citizenship counts drop naturalised Moldovans). Not mixed into the map.",
      note: "Used to corroborate EU destinations, not to replace UN DESA."
    },
    mof_budget: {
      label: "State budget revenue",
      publisher: "Ministry of Finance of the Republic of Moldova",
      url: "https://mf.gov.md/en",
      indicator_code: "State budget — revenue",
      accessed: "2026-06-11",
      definition: "Annual revenue of the state budget, used as a scale reference for remittances.",
      scope: "National scope; excludes Transnistria.",
      note: ""
    },
    nbs_migration: {
      label: "International migration — emigrants by destination / immigrants by origin",
      publisher: "National Bureau of Statistics of the Republic of Moldova",
      url: "https://statbank.statistica.md/pxweb/en/20%20Populatia%20si%20procesele%20demografice/POP070/",
      indicator_code: "PxWeb POP07300 / POP07100",
      accessed: "2026-06-12",
      definition: "Annual registered international migration FLOWS by country — people who " +
                  "formally emigrated (deregistered) or immigrated (registered) in the year.",
      scope: "Flows, not stocks, and only legally registered moves. 'Authorized emigrants' " +
             "(who deregistered) are a small fraction of the real diaspora — counts are a few " +
             "thousand a year, NOT comparable to UN DESA migrant stock or UNHCR refugee counts. " +
             "Excludes Transnistria.",
      note: "The authoritative Moldovan national source for registered migration."
    }
  },

  // Plain-language definitions for the terms used on cards and in the modal.
  // Single source of truth for definitions (cards link here in item 8).
  glossary: [
    { id: "emigrant_stock", term: "Emigrant (diaspora) stock",
      definition: "People born in Moldova who live in another country, counted at a point in " +
                  "time — a stock, not the number who left in a given year." },
    { id: "immigrant_stock", term: "Immigrant stock",
      definition: "People living in Moldova who were born in another country, counted at a " +
                  "point in time." },
    { id: "emigration_rate", term: "Emigration rate",
      definition: "The share of all Moldovan-born people who live abroad: diaspora ÷ " +
                  "(diaspora + resident Moldovan-born)." },
    { id: "refugee_population", term: "Refugee population",
      definition: "Refugees and asylum-seekers residing in a country at a given time (UNHCR " +
                  "basis), here with the Republic of Moldova as country of asylum." },
    { id: "remittances_gdp", term: "Remittances-to-GDP",
      definition: "Personal remittances received as a percentage of GDP — how large money " +
                  "sent home is relative to the whole economy." },
    { id: "remittance_dependency", term: "Remittance dependency",
      definition: "How much an economy relies on money sent home from abroad; proxied here by " +
                  "remittances-to-GDP." },
    { id: "remittance_inflows", term: "Remittance inflows",
      definition: "Total personal remittances received from abroad in a year (World Bank BPM6 " +
                  "series); broader than the NBM net-settlement measure." },
    { id: "budget_ratio", term: "Remittances vs. state budget",
      definition: "Remittance inflows expressed as a share of the state budget's revenue — a " +
                  "sense of their scale in the economy." },
    { id: "net_settlements", term: "Net settlements",
      definition: "The National Bank of Moldova's measure of cross-border transfers to " +
                  "individuals via banks, netted — a proxy for remittances by source country." },
    { id: "registered_emigrant", term: "Registered (authorized) emigrant",
      definition: "A person who formally deregistered their residence on emigrating, in a given " +
                  "year (NBS). A FLOW, and only a small fraction of actual emigrants — most never " +
                  "deregister — so it is far below the diaspora stock." },
    { id: "registered_immigrant", term: "Registered immigrant",
      definition: "A person who officially registered as immigrating to Moldova in a given year " +
                  "(NBS), by country of origin. A FLOW; kept separate from UNHCR refugee figures." }
  ],

  // Caveats / scope notes — the political-safety + methodology landmines, in one
  // place. The modal lists these; the scope notes in the UI (item 4) read here too.
  caveats: [
    "Resident population excludes the Transnistria region (NBS 2024 Census). International " +
      "figures may differ in scope — resident-only and de-jure population are never combined " +
      "in the same ratio.",
    "Emigration is UN DESA migrant stock by country of birth. Germany, the United States and " +
      "the United Kingdom report by citizenship rather than birthplace, so they carry no " +
      "Moldova-born cell and are omitted (not zero); birth-basis counts also undercount " +
      "Moldovans who have naturalised abroad.",
    "Many Moldovans also hold Romanian citizenship and may move onward through the EU; flows " +
      "to Romania reflect this passport and mobility fact, not any identity claim.",
    "Arrivals from Ukraine are reported in UNHCR's terms — refugees / people fleeing the war " +
      "in Ukraine — and are kept separate from general 'immigrant' figures.",
    "Remittances are NBM money transfers via banks (net settlements): a proxy that also " +
      "includes some salaries and pensions, excludes Transnistria, and was published with a " +
      "full by-country breakdown only through 2020. The Russia-to-EU shift is shown as data only.",
    "Figures shown as estimates are estimates; official series are cited individually in Sources. " +
      "Terminology follows official usage (“irregular” not “illegal”; “Republic of Moldova”)."
  ],

  // Economic context shown in the analysis panel below the map. Professional
  // migration-economics framing with world-average benchmarks.
  context: {
    world: {
      migrant_share_pct: 3.7,          // UN DESA 2024: share of people who are intl migrants
      refugees_total_m: 36.9,          // UNHCR end-2024 (million)
      remittances_gdp_pct: 5.13        // World Bank: world avg remittances-to-GDP
    },
    moldova: {
      population_resident: 2401200,    // 2024 Census (usually-resident)
      gdp_usd_bn: 18.2, gdp_mdl_bn: 342.1,
      state_budget_revenue_mdl_bn: 66.6,
      diaspora_estimate: 864257   // UN DESA 2024, Moldovan-born abroad (all destinations)
    },
    emigration: {
      headline: "Few countries are as shaped by emigration. UN DESA counts about 864,000 " +
                "Moldovan-born people living abroad in 2024 — over a third of the 2.4M who " +
                "remain — and even that official figure undercounts, as Germany, the US and " +
                "the UK report by citizenship rather than birthplace.",
      indicators: [
        { term: "Emigration rate", value: "≈26%", sub: "of Moldovan-born live abroad (UN DESA 2024)", world: "3.7% global", icon: "globe", source_id: "undesa_2024", def_id: "emigration_rate" },
        { term: "Diaspora (official)", value: "≈864k", sub: "UN DESA 2024 · vs 2.4M at home", world: null, icon: "users", source_id: "undesa_2024", def_id: "emigrant_stock" }
      ]
    },
    immigration: {
      headline: "Long a country of emigration, Moldova became a major host after 2022, sheltering " +
                "people fleeing the war in Ukraine at one of Europe's highest per-capita rates.",
      indicators: [
        { term: "Immigrant stock", value: "≈4%", sub: "foreign-born share of population", world: "3.7% global", icon: "globe", source_id: "undesa_2024", def_id: "immigrant_stock" },
        { term: "Refugees hosted", value: "136k", sub: "≈57 per 1,000 residents", world: null, icon: "tent", source_id: "unhcr", def_id: "refugee_population" }
      ]
    },
    remittances: {
      headline: "Money sent home is a pillar of the economy. Even after falling from a 2006 peak " +
                "of 34.5%, remittances are ~10.5% of GDP — about double the world average.",
      // Remittances-to-GDP over time. Recent years exact; earlier approximate.
      gdp_series_source_id: "wb_remit_gdp",
      gdp_series: [
        { year: 2006, pct: 34.5 }, { year: 2010, pct: 22.0 }, { year: 2014, pct: 20.0 },
        { year: 2018, pct: 16.0 }, { year: 2020, pct: 15.7 }, { year: 2022, pct: 14.0 },
        { year: 2023, pct: 12.3 }, { year: 2024, pct: 10.5 }
      ],
      indicators: [
        { term: "Remittances-to-GDP", value: "10.5%", sub: "2024", world: "5.1% world avg", icon: "percent", source_id: "wb_remit_gdp", def_id: "remittances_gdp" },
        { term: "Remittance inflows", value: "$1.92bn", sub: "2024", world: null, icon: "banknote", source_id: "wb_remit_total", def_id: "remittance_inflows" },
        { term: "vs. state budget", value: "≈54%", sub: "of state budget revenue", world: null, icon: "landmark", source_id: "mof_budget", def_id: "budget_ratio" }
      ]
    },
    emigration_flow: {
      headline: "Moldova's own statistics office records only people who formally deregister on " +
                "leaving — a few thousand a year, far below the ~864,000-strong diaspora. It is a " +
                "narrow but official measure of where registered departures go.",
      indicators: [
        { term: "Registered emigrants", value: "≈4,000/yr", sub: "2024, all destinations (NBS)", world: null, icon: "depart", source_id: "nbs_migration", def_id: "registered_emigrant" },
        { term: "Top destination", value: "Russia", sub: "of registered emigrants, 2024", world: null, icon: "route", source_id: "nbs_migration", def_id: "registered_emigrant" }
      ]
    },
    immigration_flow: {
      headline: "Officially registered arrivals — people who formally settle in Moldova each year, " +
                "by country of origin. A few thousand a year, and (unlike the refugee figures) not " +
                "the Ukrainian displacement, which is recorded separately by UNHCR.",
      indicators: [
        { term: "Registered immigrants", value: "≈6,600/yr", sub: "2024, all origins (NBS)", world: null, icon: "arrive", source_id: "nbs_migration", def_id: "registered_immigrant" },
        { term: "Top origin", value: "Russia", sub: "of registered immigrants, 2024", world: null, icon: "route", source_id: "nbs_migration", def_id: "registered_immigrant" }
      ]
    }
  },

  modes: {

    // ---- PEOPLE LEAVING MOLDOVA (diaspora stock estimates) ------------------
    emigration: {
      label: "Leaving Moldova",
      sublabel: "Moldovans living abroad",
      unit: "people",
      direction: "out",
      source_id: "undesa_2024",
      years: {
        // OFFICIAL — UN DESA 2024, Moldovan-born by country of destination.
        2010: [
          { country: "Russia", value: 284108 }, { country: "Ukraine", value: 149246 },
          { country: "Italy", value: 123348 }, { country: "Romania", value: 37617 },
          { country: "Portugal", value: 17400 }, { country: "Spain", value: 17137 },
          { country: "Turkey", value: 8701 }, { country: "Israel", value: 8204 },
          { country: "France", value: 8004 }
        ],
        2015: [
          { country: "Russia", value: 239444 }, { country: "Italy", value: 158746 },
          { country: "Ukraine", value: 149745 }, { country: "Romania", value: 47430 },
          { country: "Portugal", value: 19726 }, { country: "France", value: 17693 },
          { country: "Spain", value: 17014 }, { country: "Turkey", value: 12568 },
          { country: "Israel", value: 8619 }
        ],
        2020: [
          { country: "Italy", value: 200676 }, { country: "Russia", value: 198728 },
          { country: "Ukraine", value: 152249 }, { country: "Romania", value: 65456 },
          { country: "France", value: 33951 }, { country: "Portugal", value: 22630 },
          { country: "Spain", value: 21630 }, { country: "Turkey", value: 14639 },
          { country: "Israel", value: 9870 }
        ],
        2024: [
          { country: "Italy", value: 218594 }, { country: "Russia", value: 166187 },
          { country: "Ukraine", value: 154284 }, { country: "Romania", value: 80610 },
          { country: "France", value: 54287 }, { country: "Spain", value: 25841 },
          { country: "Portugal", value: 25458 }, { country: "Turkey", value: 16824 },
          { country: "Israel", value: 10053 }
        ]
      }
    },

    // ---- PEOPLE COMING TO MOLDOVA (migrants + refugees) ---------------------
    immigration: {
      label: "Coming to Moldova",
      sublabel: "Migrants & refugees in Moldova",
      unit: "people",
      direction: "in",
      source_ids: ["undesa_2024", "unhcr"],
      years: {
        2020: [
          { country: "Ukraine", value: 42000 }, { country: "Russia", value: 40000 },
          { country: "Romania", value: 8000 }, { country: "Turkey", value: 2500 },
          { country: "India", value: 1500 }
        ],
        2022: [
          { country: "Ukraine", value: 100000 }, { country: "Russia", value: 40000 },
          { country: "Romania", value: 8000 }, { country: "Turkey", value: 2500 },
          { country: "India", value: 1500 }
        ],
        2023: [
          { country: "Ukraine", value: 115000 }, { country: "Russia", value: 40000 },
          { country: "Romania", value: 8000 }, { country: "Turkey", value: 3000 },
          { country: "India", value: 2000 }
        ],
        2024: [
          { country: "Ukraine", value: 136000 }, { country: "Russia", value: 40000 },
          { country: "Romania", value: 8000 }, { country: "Turkey", value: 3000 },
          { country: "India", value: 2000 }
        ],
        2026: [
          { country: "Ukraine", value: 140000 }, { country: "Russia", value: 40000 },
          { country: "Romania", value: 8000 }, { country: "Turkey", value: 3000 },
          { country: "India", value: 2000 }
        ]
      }
    },

    // ---- MONEY SENT HOME (remittances by source) — EXACT NBM ---------------
    remittances: {
      label: "Money sent home",
      sublabel: "Remittances by source country",
      unit: "usd_million",
      direction: "in",
      source_id: "nbm_transfers",
      years: {
        // OFFICIAL — NBM 2017 annual release (net settlements, USD m, rounded)
        2017: [
          { country: "Russia", value: 403 }, { country: "Israel", value: 205 },
          { country: "Italy", value: 144 }, { country: "United States", value: 95 },
          { country: "United Kingdom", value: 58 }, { country: "Germany", value: 58 },
          { country: "France", value: 34 }, { country: "Turkey", value: 15 },
          { country: "Spain", value: 14 }, { country: "Portugal", value: 10 },
          { country: "Romania", value: 10 }, { country: "Ukraine", value: 5 }
        ],
        // EXACT — NBM 2018 release (total USD 1,266.84m)
        2018: [
          { country: "Russia", value: 343 },          // 343.00 (27.1%)
          { country: "Israel", value: 225 },          // 224.57 (17.7%)
          { country: "Italy", value: 158 },           // 157.68 (12.4%)
          { country: "United States", value: 105 },   // 105.01 (8.3%)
          { country: "Germany", value: 83 },          //  82.76 (6.5%)
          { country: "United Kingdom", value: 72 },   //  71.65 (5.7%)
          { country: "France", value: 47 },           //  47.25 (3.7%)
          { country: "Spain", value: 17 },            //  16.95 (1.3%)
          { country: "Turkey", value: 15 },           //  15.42 (1.2%)
          { country: "Romania", value: 14 },          //  14.09 (1.1%)
          { country: "Portugal", value: 14 },         //  13.79 (1.1%)
          { country: "Ukraine", value: 5 }            //   5.46 (0.4%)
        ],
        // OFFICIAL — NBM 2019 annual release (net settlements, USD m, rounded)
        2019: [
          { country: "Russia", value: 256 }, { country: "Israel", value: 229 },
          { country: "Italy", value: 151 }, { country: "Germany", value: 97 },
          { country: "United States", value: 94 }, { country: "United Kingdom", value: 86 },
          { country: "France", value: 64 }, { country: "Spain", value: 19 },
          { country: "Romania", value: 18 }, { country: "Portugal", value: 16 },
          { country: "Turkey", value: 11 }, { country: "Ukraine", value: 6 }
        ],
        // EXACT — NBM 2020 release (total USD 1,486.74m)
        2020: [
          { country: "Israel", value: 276 },          // 276.45 (18.6%)
          { country: "Italy", value: 209 },           // 208.92 (14.1%)
          { country: "Russia", value: 206 },          // 205.50 (13.8%)
          { country: "Germany", value: 156 },         // 155.90 (10.5%)
          { country: "United Kingdom", value: 117 },  // 116.75 (7.9%)
          { country: "United States", value: 105 },   // 105.02 (7.1%)
          { country: "France", value: 100 },          // 100.03 (6.7%)
          { country: "Romania", value: 27 },          //  27.43 (1.8%)
          { country: "Spain", value: 22 },            //  22.31 (1.5%)
          { country: "Portugal", value: 19 },         //  19.21 (1.3%)
          { country: "Turkey", value: 14 },           //  14.25 (1.0%)
          { country: "Ukraine", value: 10 }           //  10.03 (0.7%)
        ]
      }
    },

    // ---- REGISTERED EMIGRANTS / YEAR (NBS official flows, by destination) ----
    // OFFICIAL national flows — far smaller than the diaspora stock above; these
    // count only people who formally deregistered on leaving (NBS POP07300).
    emigration_flow: {
      label: "Emigrants / year",
      sublabel: "Registered with NBS, by destination",
      unit: "people",
      direction: "out",
      source_id: "nbs_migration",
      years: {
        2015: [
          { country: "Russia", value: 961 }, { country: "Ukraine", value: 312 },
          { country: "United States", value: 287 }, { country: "Germany", value: 253 },
          { country: "Israel", value: 174 }, { country: "Turkey", value: 26 },
          { country: "Italy", value: 16 }, { country: "Romania", value: 8 },
          { country: "United Kingdom", value: 3 }, { country: "France", value: 2 },
          { country: "Spain", value: 1 }
        ],
        2018: [
          { country: "Russia", value: 1081 }, { country: "Germany", value: 350 },
          { country: "Ukraine", value: 233 }, { country: "United States", value: 207 },
          { country: "Israel", value: 156 }, { country: "Italy", value: 17 },
          { country: "Romania", value: 13 }, { country: "Turkey", value: 11 },
          { country: "United Kingdom", value: 3 }, { country: "Portugal", value: 1 }
        ],
        2020: [
          { country: "Russia", value: 847 }, { country: "Germany", value: 250 },
          { country: "United States", value: 119 }, { country: "Ukraine", value: 102 },
          { country: "Israel", value: 82 }, { country: "Turkey", value: 23 },
          { country: "Romania", value: 8 }, { country: "France", value: 4 },
          { country: "Italy", value: 4 }, { country: "United Kingdom", value: 4 },
          { country: "Spain", value: 3 }, { country: "Portugal", value: 1 }
        ],
        2022: [
          { country: "Russia", value: 1043 }, { country: "United States", value: 635 },
          { country: "Italy", value: 517 }, { country: "Germany", value: 358 },
          { country: "Ukraine", value: 210 }, { country: "Israel", value: 109 },
          { country: "Turkey", value: 28 }, { country: "France", value: 16 },
          { country: "Romania", value: 11 }, { country: "Spain", value: 9 },
          { country: "Portugal", value: 2 }, { country: "United Kingdom", value: 2 }
        ],
        2024: [
          { country: "Russia", value: 2256 }, { country: "Italy", value: 329 },
          { country: "Ukraine", value: 244 }, { country: "United States", value: 186 },
          { country: "Germany", value: 126 }, { country: "Turkey", value: 79 },
          { country: "Israel", value: 72 }, { country: "Spain", value: 52 },
          { country: "France", value: 40 }, { country: "Romania", value: 29 },
          { country: "Portugal", value: 27 }, { country: "United Kingdom", value: 22 },
          { country: "India", value: 2 }
        ]
      }
    },

    // ---- REGISTERED IMMIGRANTS / YEAR (NBS official flows, by origin) --------
    immigration_flow: {
      label: "Immigrants / year",
      sublabel: "Registered with NBS, by origin",
      unit: "people",
      direction: "in",
      source_id: "nbs_migration",
      years: {
        2015: [
          { country: "Ukraine", value: 754 }, { country: "Romania", value: 646 },
          { country: "Russia", value: 567 }, { country: "Israel", value: 548 },
          { country: "Turkey", value: 347 }, { country: "Italy", value: 180 },
          { country: "France", value: 43 }, { country: "Germany", value: 40 },
          { country: "India", value: 37 }, { country: "Spain", value: 37 },
          { country: "United Kingdom", value: 19 }, { country: "Portugal", value: 12 }
        ],
        2018: [
          { country: "Ukraine", value: 752 }, { country: "Russia", value: 683 },
          { country: "Israel", value: 489 }, { country: "Romania", value: 450 },
          { country: "Turkey", value: 430 }, { country: "Italy", value: 130 },
          { country: "India", value: 128 }, { country: "Germany", value: 41 },
          { country: "France", value: 33 }, { country: "United Kingdom", value: 23 },
          { country: "Spain", value: 18 }, { country: "Portugal", value: 10 }
        ],
        2020: [
          { country: "Ukraine", value: 642 }, { country: "Turkey", value: 432 },
          { country: "Russia", value: 426 }, { country: "Romania", value: 386 },
          { country: "Italy", value: 81 }, { country: "India", value: 79 },
          { country: "Israel", value: 42 }, { country: "Portugal", value: 42 },
          { country: "France", value: 22 }, { country: "United Kingdom", value: 19 },
          { country: "Germany", value: 18 }, { country: "Spain", value: 16 }
        ],
        2022: [
          { country: "Russia", value: 1201 }, { country: "Ukraine", value: 1076 },
          { country: "Turkey", value: 959 }, { country: "Romania", value: 362 },
          { country: "India", value: 279 }, { country: "Israel", value: 188 },
          { country: "Italy", value: 133 }, { country: "Germany", value: 41 },
          { country: "France", value: 37 }, { country: "United Kingdom", value: 32 },
          { country: "Spain", value: 9 }, { country: "Portugal", value: 8 }
        ],
        2024: [
          { country: "Russia", value: 1213 }, { country: "Ukraine", value: 890 },
          { country: "Turkey", value: 847 }, { country: "India", value: 522 },
          { country: "Romania", value: 405 }, { country: "Israel", value: 156 },
          { country: "Italy", value: 109 }, { country: "Germany", value: 65 },
          { country: "France", value: 44 }, { country: "United Kingdom", value: 40 },
          { country: "Spain", value: 9 }, { country: "Portugal", value: 5 }
        ]
      }
    }
  }
};
