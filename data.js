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
                   (2023 ≈115k, 2024 ≈136k, May-2026 ≈141k). Map = per-district TP
                   holders (UNHCR Power BI, 27 Apr 2026). FRESHEST mode.
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
    "India":          [28.61, 77.21],
    "Kazakhstan":     [48.02, 66.92], "Belarus":        [53.71, 27.95],
    "Azerbaijan":     [40.38, 47.60]
  },

  meta: {
    // "Data current as of" stamp. The pipeline overwrites `generated` on each run;
    // `updated` is a manual fallback for hand-edits. Per-series freshness lives in
    // each source's `accessed`.
    updated: "2026-07-07",
    latest_year: { emigration: 2024, immigration: 2026, remittances: 2020 },
    note: "Remittances by-country is official/exact (NBM 2018 & 2020). " +
          "Immigration uses UNHCR refugee counts (to 2026). " +
          "Emigration is official UN DESA 2024 by country of birth " +
          "(Germany/US/UK omitted — they report by citizenship, not birthplace)."
  },

  // One-line scope note shown near the title and wherever a population ratio
  // appears. Resident vs de-jure population are never combined in one ratio.
  scope_note: "A note on scope: the resident population here leaves out the " +
              "Transnistria region (NBS 2024 Census), and international sources may " +
              "count things a little differently. Any ratio against population uses " +
              "the resident figure.",

  // ---- Temporary Protection choropleth (Ukrainian refugees, by district) ----
  // Subject = TP HOLDERS only (92,405 enrolled, UNHCR 27 Apr 2026). This is a
  // DIFFERENT, much smaller series than the UN DESA migrant stock — never drive
  // this map off the 752k / 864k figures (those belong to the diaspora tab).
  //
  // OFFICIAL figures: per-district TP beneficiaries pulled from UNHCR Moldova's
  // public Power BI report ("disaggregated_data" / Sum(Value) by Raion, current
  // snapshot 27 Apr 2026). National total (= weekly_snapshot "individuals
  // enrolled for TP") reconciles to the district sum: 92,405.
  // Report: https://app.powerbi.com/view?r=eyJrIjoiN2Y1MmRmOWItMjE5MS00YjNhLWEzYTYtM2E4NzRiZmVjNGMyIiwidCI6ImU1YzM3OTgxLTY2NjQtNDEzNC04YTBjLTY1NDNkMmFmODBiZSIsImMiOjh9
  //
  // `match` = normalized geoBoundaries ADM1 shapeName (lowercase, diacritics
  // stripped) so every one of the 37 map features joins to a record. geoBoundaries
  // splits the Transnistria region into "Transnistria" (UAT din Stînga Nistrului)
  // + "Bender" (Tighina) — both carry their own TP figure from the report.
  tp_choropleth: {
    meta: {
      subject: "Temporary Protection holders (Ukrainian refugees)",
      nationalTotal: 92405,
      asOf: "2026-04-27",
      source_ids: ["unhcr_tp", "geoboundaries"],
      geometry: "geoBoundaries MDA ADM1 (CC-BY 4.0)",
      dataStatus: "OFFICIAL — UNHCR Power BI, 27 Apr 2026"
    },
    districts: [
      { match: "chisinau",      name: "Chișinău",          type: "municipality",  tpHolders: 56428 },
      { match: "balti",         name: "Bălți",             type: "municipality",  tpHolders: 3659 },
      { match: "gagauzia",      name: "Găgăuzia",          type: "autonomous",    tpHolders: 5122 },
      { match: "transnistria",  name: "Transnistria",      type: "transnistria",  tpHolders: 6472 },
      { match: "bender",        name: "Bender (Tighina)",  type: "transnistria",  tpHolders: 1349 },
      { match: "anenii noi",    name: "Anenii Noi",        type: "raion",         tpHolders: 801 },
      { match: "basarabeasca",  name: "Basarabeasca",      type: "raion",         tpHolders: 585 },
      { match: "briceni",       name: "Briceni",           type: "raion",         tpHolders: 369 },
      { match: "cahul",         name: "Cahul",             type: "raion",         tpHolders: 2295 },
      { match: "cantemir",      name: "Cantemir",          type: "raion",         tpHolders: 205 },
      { match: "calarasi",      name: "Călărași",          type: "raion",         tpHolders: 333 },
      { match: "causeni",       name: "Căușeni",           type: "raion",         tpHolders: 1088 },
      { match: "cimislia",      name: "Cimișlia",          type: "raion",         tpHolders: 296 },
      { match: "criuleni",      name: "Criuleni",          type: "raion",         tpHolders: 622 },
      { match: "donduseni",     name: "Dondușeni",         type: "raion",         tpHolders: 1351 },
      { match: "drochia",       name: "Drochia",           type: "raion",         tpHolders: 390 },
      { match: "dubasari",      name: "Dubăsari",          type: "raion",         tpHolders: 396 },
      { match: "edinet",        name: "Edineț",            type: "raion",         tpHolders: 420 },
      { match: "falesti",       name: "Fălești",           type: "raion",         tpHolders: 256 },
      { match: "floresti",      name: "Florești",          type: "raion",         tpHolders: 216 },
      { match: "glodeni",       name: "Glodeni",           type: "raion",         tpHolders: 386 },
      { match: "hincesti",      name: "Hîncești",          type: "raion",         tpHolders: 507 },
      { match: "ialoveni",      name: "Ialoveni",          type: "raion",         tpHolders: 432 },
      { match: "leova",         name: "Leova",             type: "raion",         tpHolders: 98 },
      { match: "nisporeni",     name: "Nisporeni",         type: "raion",         tpHolders: 201 },
      { match: "ocnita",        name: "Ocnița",            type: "raion",         tpHolders: 3072 },
      { match: "orhei",         name: "Orhei",             type: "raion",         tpHolders: 691 },
      { match: "rezina",        name: "Rezina",            type: "raion",         tpHolders: 233 },
      { match: "riscani",       name: "Rîșcani",           type: "raion",         tpHolders: 242 },
      { match: "singerei",      name: "Sîngerei",          type: "raion",         tpHolders: 275 },
      { match: "soroca",        name: "Soroca",            type: "raion",         tpHolders: 420 },
      { match: "straseni",      name: "Strășeni",          type: "raion",         tpHolders: 362 },
      { match: "soldanesti",    name: "Șoldănești",        type: "raion",         tpHolders: 83 },
      { match: "stefan voda",   name: "Ștefan Vodă",       type: "raion",         tpHolders: 1194 },
      { match: "taraclia",      name: "Taraclia",          type: "raion",         tpHolders: 874 },
      { match: "telenesti",     name: "Telenești",         type: "raion",         tpHolders: 268 },
      { match: "ungheni",       name: "Ungheni",           type: "raion",         tpHolders: 414 }
    ]
  },

  // ---- Resident population choropleth (NBS 2024 Census, by district) ---------
  // Subject = usually-resident population by ADM1 unit, from the 2024 Population
  // and Housing Census (final data, Table 5; reference date 8 Apr 2024). Reuses
  // the same `match` keys as tp_choropleth so every geoBoundaries feature joins.
  // The Transnistria region + Bender are on the left bank of the Dniester and
  // were NOT enumerated by the census → population: null (painted "no data").
  // District values sum to the national resident total, 2,409,207.
  // Source: https://statistica.gov.md/ (PHC 2024 final, Geographical characteristics).
  population_choropleth: {
    meta: {
      subject: "Usually-resident population (2024 Census)",
      nationalTotal: 2409207,
      asOf: "2024-04-08",
      source_ids: ["nbs_census_2024", "geoboundaries"],
      geometry: "geoBoundaries MDA ADM1 (CC-BY 4.0)",
      dataStatus: "OFFICIAL — NBS Census 2024 final data (Table 5)"
    },
    districts: [
      { match: "chisinau",      name: "Chișinău",          type: "municipality",  population: 720128 },
      { match: "balti",         name: "Bălți",             type: "municipality",  population: 94546 },
      { match: "gagauzia",      name: "Găgăuzia",          type: "autonomous",    population: 103668 },
      { match: "transnistria",  name: "Transnistria",      type: "transnistria",  population: null },
      { match: "bender",        name: "Bender (Tighina)",  type: "transnistria",  population: null },
      { match: "anenii noi",    name: "Anenii Noi",        type: "raion",         population: 57687 },
      { match: "basarabeasca",  name: "Basarabeasca",      type: "raion",         population: 14914 },
      { match: "briceni",       name: "Briceni",           type: "raion",         population: 46894 },
      { match: "cahul",         name: "Cahul",             type: "raion",         population: 72775 },
      { match: "cantemir",      name: "Cantemir",          type: "raion",         population: 33181 },
      { match: "calarasi",      name: "Călărași",          type: "raion",         population: 43864 },
      { match: "causeni",       name: "Căușeni",           type: "raion",         population: 57261 },
      { match: "cimislia",      name: "Cimișlia",          type: "raion",         population: 30986 },
      { match: "criuleni",      name: "Criuleni",          type: "raion",         population: 52926 },
      { match: "donduseni",     name: "Dondușeni",         type: "raion",         population: 28108 },
      { match: "drochia",       name: "Drochia",           type: "raion",         population: 53738 },
      { match: "dubasari",      name: "Dubăsari",          type: "raion",         population: 21781 },
      { match: "edinet",        name: "Edineț",            type: "raion",         population: 50429 },
      { match: "falesti",       name: "Fălești",           type: "raion",         population: 56039 },
      { match: "floresti",      name: "Florești",          type: "raion",         population: 53264 },
      { match: "glodeni",       name: "Glodeni",           type: "raion",         population: 35829 },
      { match: "hincesti",      name: "Hîncești",          type: "raion",         population: 69462 },
      { match: "ialoveni",      name: "Ialoveni",          type: "raion",         population: 74458 },
      { match: "leova",         name: "Leova",             type: "raion",         population: 28835 },
      { match: "nisporeni",     name: "Nisporeni",         type: "raion",         population: 36413 },
      { match: "ocnita",        name: "Ocnița",            type: "raion",         population: 31610 },
      { match: "orhei",         name: "Orhei",             type: "raion",         population: 79242 },
      { match: "rezina",        name: "Rezina",            type: "raion",         population: 30243 },
      { match: "riscani",       name: "Rîșcani",           type: "raion",         population: 43652 },
      { match: "singerei",      name: "Sîngerei",          type: "raion",         population: 55933 },
      { match: "soroca",        name: "Soroca",            type: "raion",         population: 58609 },
      { match: "straseni",      name: "Strășeni",          type: "raion",         population: 61362 },
      { match: "soldanesti",    name: "Șoldănești",        type: "raion",         population: 25394 },
      { match: "stefan voda",   name: "Ștefan Vodă",       type: "raion",         population: 42285 },
      { match: "taraclia",      name: "Taraclia",          type: "raion",         population: 26435 },
      { match: "telenesti",     name: "Telenești",         type: "raion",         population: 41452 },
      { match: "ungheni",       name: "Ungheni",           type: "raion",         population: 75804 }
    ]
  },

  // Neutral, factual per-country footnotes surfaced in the hover tooltip. These
  // are mobility/scope facts, NOT identity or geopolitical framing. `modes`
  // limits a note to where it's relevant (omit = all modes).
  country_notes: {
    Romania: { text: "Many Moldovans also carry Romanian citizenship, which lets them " +
                     "move on freely through the EU. It is a fact about passports and " +
                     "mobility, nothing more." },
    Ukraine: { text: "From 2022 onward, the people arriving from Ukraine are " +
                     "overwhelmingly refugees fleeing the war (UNHCR).", modes: ["immigration"] }
  },

  // Timeline call-outs — factual, mode-scoped notes tied to a year. Rendered as
  // subtle markers + a narration line so pressing play tells the story. Keep them
  // neutral (data, not framing); `modes` limits where each shows.
  annotations: [
    { year: 2022, modes: ["immigration"],
      text: "War breaks out in Ukraine, and the number of people fleeing across the border surges (UNHCR)." },
    { year: 2024, modes: ["immigration"],
      text: "Around 136,000 refugees from Ukraine are now living in the Republic of Moldova (UNHCR)." },
    { year: 2020, modes: ["remittances"],
      text: "Russia's share slips to third place as Israel takes the top spot; EU countries together already account for more than a third of flows (NBM, 2020)." },
    { year: 2022, modes: ["remittances"],
      text: "Western financial sanctions on Russia effectively shut down formal banking transfers from Russia. Sources in the European Union, led by Italy, Germany and France, together with the United Kingdom, now account for most formal flows." },
    { year: 2024, modes: ["emigration"],
      text: "The recorded diaspora tilts toward the EU, with Italy now in the lead as the Russia-born count falls (UN DESA)." }
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
      note: "Reported in UNHCR's terms, as refugees and people fleeing the war in Ukraine, " +
            "and not merged into general 'immigrants'."
    },
    unhcr_tp: {
      label: "Temporary Protection beneficiaries by district",
      publisher: "UNHCR data portal · Government of the Republic of Moldova",
      url: "https://data.unhcr.org/en/country/mda",
      indicator_code: "TP holders by raion (as of 27 Apr 2026)",
      accessed: "2026-06-16",
      definition: "People enrolled for Temporary Protection in Moldova, broken down by district, " +
                  "from UNHCR Moldova's operational data portal with figures sourced from the " +
                  "Government of the Republic of Moldova.",
      scope: "92,405 TP holders nationally (27 Apr 2026); the district figures reconcile to that total.",
      note: ""
    },
    geoboundaries: {
      label: "geoBoundaries: Moldova administrative boundaries (ADM1)",
      publisher: "geoBoundaries (Runfola et al., 2020)",
      url: "https://www.geoboundaries.org/",
      indicator_code: "gbOpen MDA ADM1 · simplified · commit 9469f09",
      accessed: "2026-06-16",
      definition: "Open district (raion) boundary geometry for Moldova, used to draw the " +
                  "Temporary Protection choropleth.",
      scope: "37 ADM1 units (raions + municipalities + Găgăuzia + Transnistria/Bender). " +
             "Geometry only, carrying no population or refugee values.",
      note: "CC-BY 4.0. Mirrored on the Humanitarian Data Exchange (HDX)."
    },
    nbm_transfers: {
      label: "Money transfers from abroad in favour of individuals via banks (net settlements)",
      publisher: "National Bank of Moldova",
      url: "https://www.bnm.md/en/content/money-transfers-abroad-individuals-banks-republic-moldova-2020-net-settlements",
      indicator_code: "DBP4 / annual press release (net settlements)",
      accessed: "2026-07-07",
      definition: "Cross-border money transfers to resident individuals settled via Moldovan " +
                  "banks, by source country, net basis. A proxy for remittances.",
      scope: "Excludes the Transnistria region (not under the authorities' control), so " +
             "figures are not comparable with counterpart-country statistics. They are not solely " +
             "labour remittances, and also include some salaries, pensions and other transfers. " +
             "A full by-country breakdown was published annually only through 2020; from 2021 the " +
             "breakdown lives only in NBM's interactive DBP4 database. The aggregate (all countries) " +
             "continues to be published: ≈$1.66bn in 2025 (NBM net settlements).",
      note: "Exact official figures for 2018 and 2020. 2025 aggregate ≈$1.66bn (NBM DBP4)."
    },
    wb_remit_gdp: {
      label: "Personal remittances received (% of GDP)",
      publisher: "World Bank, World Development Indicators",
      url: "https://data.worldbank.org/indicator/BX.TRF.PWKR.DT.GD.ZS?locations=MD",
      indicator_code: "BX.TRF.PWKR.DT.GD.ZS",
      accessed: "2026-06-11",
      definition: "Remittance dependency, measured as personal remittances received as a share of " +
                  "GDP (BPM6).",
      scope: "National accounts basis; excludes Transnistria.",
      note: "Earlier years approximate; refresh via fetch_data.py. The ~5% benchmark is the " +
            "unweighted average remittances-to-GDP across about 174 countries (WDI), not the " +
            "GDP-weighted world aggregate (which is far lower)."
    },
    wb_remit_total: {
      label: "Personal remittances received (current US$)",
      publisher: "World Bank, World Development Indicators",
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
      definition: "Usually-resident population: the people who actually live in the country.",
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
      scope: "For cross-checking only. It is a different measure from UN DESA's country-of-birth " +
             "stock (citizenship counts drop naturalised Moldovans), and is not mixed into the map.",
      note: "Used to corroborate EU destinations, not to replace UN DESA."
    },
    mof_budget: {
      label: "State budget revenue",
      publisher: "Ministry of Finance of the Republic of Moldova",
      url: "https://mf.gov.md/en",
      indicator_code: "State budget revenue",
      accessed: "2026-06-11",
      definition: "Annual revenue of the state budget, used as a scale reference for remittances.",
      scope: "National scope; excludes Transnistria.",
      note: ""
    },
    nbs_census_migration: {
      label: "2024 Census, Migration Characteristics (country of birth, citizenship, reasons for staying)",
      publisher: "National Bureau of Statistics of the Republic of Moldova",
      url: "https://statistica.gov.md/files/files/serii_de_timp/recensamant_2024/date_finale/Migration_Characteristics_2024_PHC_EN.xlsx",
      indicator_code: "2024 PHC Migration Characteristics (tables 3.2, 3.5, 3.6)",
      accessed: "2026-06-23",
      definition: "Usual residents born outside the Republic of Moldova, with their citizenship and, for foreign citizens, their reason for staying, counted at the 2024 census.",
      scope: "106,718 people were born abroad, which is 4.4 percent of residents. Of them 82,575, or 77 percent, hold Moldovan citizenship. Excludes the Transnistria region.",
      note: "A residence and stock measure, distinct from the UNHCR refugee-hosting count."
    },
    // ---- Host-country proxy sources for citizenship-reporting destinations ----
    // Germany, the US and the UK report residents by citizenship, so UN DESA's
    // birthplace matrix omits Moldova-born there. These sources estimate that
    // omitted population on a place-of-birth (or migration-background) basis.
    us_acs: {
      label: "American Community Survey, population by place of birth (Moldova)",
      publisher: "U.S. Census Bureau",
      url: "https://www.census.gov/programs-surveys/acs/",
      indicator_code: "ACS · place of birth = Moldova",
      accessed: "2026-06-21",
      definition: "People living in the United States who were born in the Republic of Moldova. " +
                  "This is a place of birth basis, the same concept the United Nations uses elsewhere.",
      scope: "ACS estimate ≈52,000 (2021), up from ≈43,600 (2015). Captures naturalised " +
             "US citizens born in the Republic of Moldova, whom UN DESA's bilateral matrix omits because " +
             "the US reports by citizenship.",
      note: "A survey estimate with a margin of error; treated here as a proxy, not an exact count."
    },
    destatis_micro: {
      label: "Moldovan-origin population in Germany (country of birth / migration background)",
      publisher: "Eurostat · German Federal Statistical Office (Destatis)",
      url: "https://www.destatis.de/EN/Themes/Society-Environment/Population/Migration-Integration/_node.html",
      indicator_code: "Eurostat migr_pop3ctb · Destatis Mikrozensus (Migrationshintergrund)",
      accessed: "2026-06-21",
      definition: "Residents of Germany who were born in the Republic of Moldova, on the Eurostat " +
                  "country of birth basis, together with the broader Moldovan migration background " +
                  "population from the Destatis Mikrozensus.",
      scope: "About 35,000 on the country of birth basis from Eurostat. The wider migration background " +
             "concept, which adds dual nationals and descendants, runs far higher, at about 120,000 in " +
             "2022. Germany reports to the United Nations by citizenship, so none of this appears in the 864,257.",
      note: "These are two different concepts, so the figure is shown as a range rather than a single value."
    },
    ons_cob: {
      label: "Census 2021, usual residents by country of birth (Moldova)",
      publisher: "Office for National Statistics (United Kingdom)",
      url: "https://www.ons.gov.uk/datasets/TS012/editions/2021",
      indicator_code: "Census 2021 · TS012 country of birth",
      accessed: "2026-06-21",
      definition: "Usual residents of England and Wales who were born in the Republic of Moldova.",
      scope: "This badly undercounts the community, because most Moldovans in the United Kingdom " +
             "entered and are recorded as holders of Romanian passports from the European Union, so " +
             "the country of birth tables capture only a fraction. Earlier estimates put the number " +
             "born in the Republic of Moldova near 3,400 in 2015.",
      note: "It is listed to flag the gap. No reliable count by country of birth exists, so only a floor is shown."
    },
    nbs_ltmig: {
      label: "Long-term international migration (12-month rule, border-crossing)",
      publisher: "National Bureau of Statistics of the Republic of Moldova",
      url: "https://statbank.statistica.md/PxWeb/pxweb/en/20%20Populatia%20si%20procesele%20demografice/20%20Populatia%20si%20procesele%20demografice__POP070/POP07060.px/",
      indicator_code: "PxWeb POP07060 (General Inspectorate of Border Police)",
      coverage: "data 2014–2024",
      accessed: "2026-06-22",
      definition: "Immigrants and emigrants defined by the international 12-month rule (a change of " +
                  "usual residence lasting at least 12 months), estimated from Border Police records.",
      scope: "In 2024, 105,804 immigrants and 123,406 emigrants. Immigration is dominated by returning " +
             "Moldovan citizens (40,173) and Romanian-passport holders (19,052), plus Ukrainians " +
             "(23,265); net migration stays negative every year.",
      note: "The internationally comparable long stay series, shown in the labour chapter."
    }
  },
  // Single source of truth for definitions (cards link here in item 8).
  glossary: [
    { id: "emigrant_stock", term: "Emigrant (diaspora) stock",
      definition: "People born in the Republic of Moldova who live in another country, counted at a single point in " +
                  "time. It is a stock, not the number who left in any given year." },
    { id: "immigrant_stock", term: "Immigrant stock",
      definition: "People living in the Republic of Moldova who were born in another country, counted at a " +
                  "point in time." },
    { id: "emigration_rate", term: "Emigration rate",
      definition: "The share of all Moldovan-born people who live abroad: diaspora ÷ " +
                  "(diaspora + resident Moldovan-born)." },
    { id: "refugee_population", term: "Refugee population",
      definition: "Refugees and asylum-seekers residing in a country at a given time (UNHCR " +
                  "basis), here with the Republic of Moldova as country of asylum." },
    { id: "remittances_gdp", term: "Remittances-to-GDP",
      definition: "Personal remittances received as a percentage of GDP, a way of seeing how large " +
                  "the money sent home is next to the whole economy." },
    { id: "remittance_dependency", term: "Remittance dependency",
      definition: "How much an economy relies on money sent home from abroad; proxied here by " +
                  "remittances-to-GDP." },
    { id: "remittance_inflows", term: "Remittance inflows",
      definition: "Total personal remittances received from abroad in a year (World Bank BPM6 " +
                  "series); broader than the NBM net-settlement measure." },
    { id: "budget_ratio", term: "Remittances vs. state budget",
      definition: "Remittance inflows set against the state budget's revenue, to give a sense of " +
                  "their scale in the economy." },
    { id: "net_settlements", term: "Net settlements",
      definition: "The National Bank of Moldova's measure of cross-border transfers to " +
                  "individuals via banks, netted out. It stands in as a proxy for remittances by " +
                  "source country." },
    { id: "depopulation", term: "Depopulation",
      definition: "Moldova's usually-resident population fell to 2.41M at the 2024 census, a drop of " +
                  "380,000 (13.6%) from 2014, driven by emigration together with more deaths than births (NBS)." },
    { id: "diaspora_basis", term: "Why diaspora figures differ",
      definition: "Counts by country of birth (UN DESA 2024, about 864,000) leave out Moldovans who " +
                  "naturalised abroad and the destinations that report by citizenship; counts on a " +
                  "nationality basis (UN DESA 2020, 1.16M; IOM around 1.0 to 1.2M) include them. The " +
                  "NBS gap between de jure and resident population, about 0.86 million, tracks the " +
                  "birth basis." }
  ],

  // Caveats / scope notes — the political-safety + methodology landmines, in one
  // place. The modal lists these; the scope notes in the UI (item 4) read here too.
  caveats: [
    "Resident population excludes the Transnistria region (NBS 2024 Census). International " +
      "figures may differ in scope, and resident-only and de-jure population are never combined " +
      "in the same ratio.",
    "Emigration is UN DESA migrant stock by country of birth. Germany, the United States and " +
      "the United Kingdom report by citizenship rather than birthplace, so they carry no " +
      "Moldova-born cell and are omitted (not zero); birth-basis counts also undercount " +
      "Moldovans who have naturalised abroad.",
    "Many Moldovans also hold Romanian citizenship and may move onward through the EU; flows " +
      "to Romania reflect this passport and mobility fact, not any identity claim.",
    "Arrivals from Ukraine are reported in UNHCR's terms, as refugees and people fleeing the war " +
      "in Ukraine, and are kept separate from general 'immigrant' figures.",
    "Remittances are NBM money transfers via banks (net settlements): a proxy that also " +
      "includes some salaries and pensions, excludes Transnistria, and was published with a " +
      "full by-country breakdown only through 2020. The Russia-to-EU shift is shown as data only.",
    "Figures shown as estimates are estimates; official series are cited individually in Sources. " +
      "Terminology follows official usage (“irregular” not “illegal”; “Republic of Moldova”).",
    "Each source defines a 'migrant' differently, so the headline figures are not interchangeable: " +
      "UN DESA counts by country of birth, Eurostat by citizenship, the National Bank of Moldova by " +
      "bank transfers, UNHCR by refugee status, and the census by usual residence. The diaspora also " +
      "shows up inside NBS's population accounts, where the 'de jure resident' count exceeds the " +
      "'usually resident' count by about 0.86 million, roughly the number of Moldovans living abroad."
  ],

  // Long-term international migration (NBS POP07060, Border Police, 12-month rule).
  // The internationally-comparable flow series shown in the labour chapter.
  // Verified from the PxWeb API.
  ltmigration: {
    source_id: "nbs_ltmig",
    years: [
      { year: 2014, imm: 98731,  emi: 122955 },
      { year: 2015, imm: 105834, emi: 127277 },
      { year: 2016, imm: 107303, emi: 153405 },
      { year: 2017, imm: 107580, emi: 158259 },
      { year: 2018, imm: 116739, emi: 158788 },
      { year: 2019, imm: 116196, emi: 153289 },
      { year: 2020, imm: 65167,  emi: 72372 },
      { year: 2021, imm: 68356,  emi: 113769 },
      { year: 2022, imm: 177875, emi: 241448 },
      { year: 2023, imm: 97517,  emi: 130084 },
      { year: 2024, imm: 105804, emi: 123406 }
    ],
    // 2024 immigrants by citizenship (POP07060). Returning Moldovan citizens and
    // Romanian-passport holders dominate — most "immigrants" are Moldovans coming home.
    imm_2024_by_citizenship: [
      { name: "Moldova (returning)", value: 40173 },
      { name: "Ukraine", value: 23265 },
      { name: "Romania", value: 19052 },
      { name: "Russia", value: 6668 },
      { name: "Bulgaria", value: 2153 },
      { name: "Italy", value: 1838 },
      { name: "Germany", value: 1668 },
      { name: "Israel", value: 1473 },
      { name: "Turkey", value: 1020 },
      { name: "USA", value: 947 },
      { name: "Other", value: 7547 }
    ],
    total_2024: { imm: 105804, emi: 123406 }
  },

  // Scannable methodology matrix — one row per phenomenon, rendered as a table at
  // the top of the methodology dialog so readers can compare what each number
  // measures, when, and where it falls short, without reading the full prose.
  method_summary: [
    { topic: "Diaspora abroad", source: "UN DESA", year: "2024",
      measure: "Country-of-birth migrant stock",
      limit: "Omits citizenship-reporting countries (DE/US/UK); misses naturalised Moldovans." },
    { topic: "Refugees hosted", source: "UNHCR", year: "2026",
      measure: "Operational refugee count (residing + TP)",
      limit: "Humanitarian count; district map is TP holders only, not all refugees." },
    { topic: "Foreign-born residents", source: "NBS Census", year: "2024",
      measure: "Usual-resident count by country of birth",
      limit: "Different concept from the UNHCR refugee count; smaller origins estimated." },
    { topic: "Remittances", source: "NBM / World Bank", year: "2020 / 2024",
      measure: "Bank transfers (by country) / BPM6 total & %GDP",
      limit: "Different definitions and years; by-country geography is historical (2020)." },
    { topic: "Long-term flows", source: "NBS (Border Police)", year: "2024",
      measure: "12-month-rule migration (POP07060): 105,804 in / 123,406 out",
      limit: "Internationally comparable; immigration is mostly returning Moldovan/Romanian-passport citizens." },
    { topic: "Resident population", source: "NBS Census", year: "2024",
      measure: "Usually-resident population by district",
      limit: "Excludes Transnistria & Bender; not comparable to de-jure register." }
  ],

  // Economic context shown in the analysis panel below the map. Professional
  // migration-economics framing with world-average benchmarks.
  context: {
    world: {
      migrant_share_pct: 3.7,          // UN DESA 2024: share of people who are intl migrants (304M of ~8.2bn)
      refugees_total_m: 36.8,          // UNHCR Global Trends 2024 (refugees under UNHCR's mandate, end-2024)
      remittances_gdp_pct: 5.13        // World Bank WDI: unweighted average remittances-to-GDP across ~174 countries
    },
    moldova: {
      population_resident: 2409207,    // NBS 2024 Census, FINAL usually-resident, 8 Apr 2024
      population_2014_census: 2789205, // NBS 2014 Census, usually-resident (NBS final; for depopulation visual)
      population_urban: 1118967,       // NBS 2024 Census (Table 4), usually-resident urban
      population_rural: 1290240,       // NBS 2024 Census (Table 4), usually-resident rural
      urban_pct: 46.4,                 // 1,118,967 / 2,409,207
      rural_pct: 53.6,                 // 1,290,240 / 2,409,207
      gdp_usd_bn: 18.2,               // World Bank 2024
      gdp_mdl_bn: 342.1,              // [VERIFY] forecast-style; needs primary MDL GDP source
      nbm_avg_rate_2024: 17.7,        // NBM average USD/MDL exchange rate 2024 (~17.72; last full USD-anchored year before NBM switched to EUR ref on 2 Jan 2025)
      state_budget_revenue_mdl_bn: 66.98,  // executed 2024, per MoF
      diaspora_estimate: 864257,  // UN DESA 2024, Moldovan-born abroad (all destinations)
      // NBS's own population concepts: "de jure resident" (registered, incl. those
      // abroad) minus "usually resident" (actually living here) ≈ the diaspora.
      dejure_2019: 3542708,            // NBS de jure resident population, 1 Jan 2019
      usually_resident_2019: 2684772,  // NBS usually-resident population, 1 Jan 2019
      implied_diaspora_nbs: 857936     // the gap — NBS's own measure of who's abroad
    },
    emigration: {
      takeaway: "About 864,000 people born in the Republic of Moldova now live abroad. That is roughly one in four of everyone born here, and more than a third of all the people still living in the country today.",
      headline: "Few countries have been shaped by emigration the way the Republic of Moldova has. " +
                "The 2024 edition from the United Nations counts 864,257 people born in the country who " +
                "now live abroad. It is a strict count by country of birth, so it leaves out places that " +
                "report by citizenship instead, namely Germany, the United States and the United Kingdom, " +
                "and it quietly loses anyone who has since naturalised. On that birthplace basis the number " +
                "has been climbing, from 812,653 in 2020 to 864,257 in 2024.\n\n" +
                "Independent sources point the same way. Eurostat's figures by country of birth for " +
                "European Union member states alone confirm more than 400,000 people born in the Republic " +
                "of Moldova living across Italy, Romania, France, Spain and Portugal. That is consistent " +
                "with the five European Union rows in this dashboard, and Germany adds roughly 35,000 more " +
                "that the United Nations matrix omits because Germany reports by citizenship.\n\n" +
                "Counted by nationality rather than by birthplace, the diaspora is larger still. " +
                "The Prague Process puts Moldovan nationals abroad at about 1.16 million in 2020, and the " +
                "country's own population gap of about 0.86 million points to a real diaspora of roughly " +
                "1.0 to 1.2 million.",
      indicators: [
        { term: "Diaspora (UN DESA 2024)", value: "864k", sub: "country-of-birth total · about 1.0 to 1.2M on a citizenship basis", world: null, icon: "users", source_id: "undesa_2024", def_id: "emigrant_stock" },
        { term: "EU alone (Eurostat)", value: "400k+", sub: "Moldova-born in EU27 (Eurostat migr_pop3ctb 2022) · Germany adds ~35k not in UN DESA", world: null, icon: "globe", source_id: "eurostat_migr", def_id: "diaspora_basis" },
        { term: "Share abroad", value: "≈26–32%", sub: "of all Moldovan-born people (basis-dependent)", world: null, icon: "globe", source_id: "undesa_2024", def_id: "diaspora_basis" },
        { term: "Resident population", value: "2.41M", sub: "−13.6% since 2014 (NBS 2024 Census)", world: null, icon: "landmark", source_id: "nbs_census_2024", def_id: "depopulation" }
      ],
      // Host-country proxy estimates for destinations UN DESA can't count by
      // birthplace (they report by citizenship). These are ADDITIONAL to the
      // 864,257 total, not part of it — rendered as a clearly-flagged estimate
      // card so the "zero-data" gap is filled without corrupting the reconciliation.
      diaspora_proxy: {
        title: "Where UN DESA can't count: estimated Moldova-born in citizenship-reporting countries",
        note: "Germany, the United States and the United Kingdom record residents by citizenship, " +
              "not by place of birth, so UN DESA carries no Moldova-born figure for them and they " +
              "are absent from the 864,257 total above. The host-country estimates below are " +
              "additional to that total. Read them as confidence ranges, not exact counts.",
        countries: [
          { country: "United States", value: "≈ 52,000", basis: "Born in Moldova · US Census ACS 2021", confidence: "Medium", source_id: "us_acs" },
          { country: "Germany", value: "≈ 35,000 – 122,000", basis: "Country of birth → migration background · 2022", confidence: "Low", source_id: "destatis_micro" },
          { country: "United Kingdom", value: "≥ 3,400", basis: "Country of birth · ONS 2021 (severe undercount)", confidence: "Very low", source_id: "ons_cob",
            note: "Most Moldovans in the United Kingdom hold Romanian passports from the European Union and are recorded as Romanian, so the tables by country of birth miss them. The true figure is many times higher." }
        ]
      }
    },
    immigration: {
      takeaway: "Since the early days of 2022, the Republic of Moldova has taken in more than 141,000 Ukrainians fleeing the war. That is one of the highest shares anywhere in Europe, at about one refugee for every 17 residents, and roughly two in five of them are children. The map shows where the people granted Temporary Protection have settled.",
      headline: "When Russia launched its full invasion of Ukraine in February 2022, the Republic of " +
                "Moldova found itself receiving one of the largest refugee inflows per person anywhere in " +
                "Europe. As of 31 May 2026, UNHCR counts 141,058 Ukrainian refugees still in the " +
                "country, with 92,405 of them enrolled in Temporary Protection, recorded on 27 April " +
                "2026 and valid through March 2027. The population skews young and female. About " +
                "38 percent of those in the country are children under 18, roughly 39 percent are adult women, " +
                "and about 23 percent are adult men. This is a demographic pattern that is typical of conflict " +
                "displacement, where men of military age often remain in or return to Ukraine. These are the " +
                "operational figures from UNHCR, and they are a different thing from the 52,400 residents born " +
                "in Ukraine that the 2024 census recorded, which you can explore on the Foreign born residents tab.",
      indicators: [
        { term: "Residing (May 2026)", value: "141,058", sub: "Ukrainian refugees remaining · UNHCR 31 May 2026", world: null, icon: "tent", source_id: "unhcr", def_id: "refugee_population" },
        { term: "Temporary Protection", value: "92,405", sub: "TP enrolled 27 Apr 2026 (UNHCR); valid to Mar 2027", world: null, icon: "tent", source_id: "unhcr", def_id: "refugee_population" },
        { term: "Per capita", value: "1 in 17", sub: "residents per refugee · 2024 Census vs UNHCR May 2026", world: null, icon: "users", source_id: "unhcr", def_id: "refugee_population" },
        { term: "Children (under 18)", value: "~38%", sub: "of Ukrainian refugees in Moldova · adult women ~39% · adult men ~23% (UNHCR 2024)", world: null, icon: "users", source_id: "unhcr", def_id: "refugee_population" }
      ]
    },
    immigration_census: {
      takeaway: "At the 2024 census, 106,718 of the people who actually live in the Republic of Moldova had been born somewhere else, about 4.4 percent of the population. Those born in Ukraine (52,360) and Russia (32,554) make up nearly 80 percent of them. The striking part is that most foreign born residents, 77 percent, hold Moldovan citizenship. This is a census headcount, and it is not the same thing as the UNHCR refugee tally.",
      headline: "The 2024 census counted 106,718 of the usual residents of the Republic of Moldova as " +
                "having been born outside the country, about 4.4 percent of everyone living there and a " +
                "little above the world average of 3.7 percent. People born in Ukraine are the largest " +
                "group at 52,360, followed by those born in Russia at 32,554. Together they are nearly " +
                "80 percent of the foreign born population. The next largest groups are people born in " +
                "Kazakhstan, Belarus, Italy and Romania, which mostly reflect families returning after " +
                "the Soviet period and a smaller number of children born to Moldovan parents abroad. " +
                "That is why most of this population, 82,575 people or 77 percent, in fact hold Moldovan " +
                "citizenship. This census headcount is its own measure, separate from the UNHCR count of " +
                "Ukrainian refugees, because not everyone born in Ukraine is a refugee and not every " +
                "refugee shows up as a usual resident.",
      indicators: [
        { term: "Foreign born residents", value: "106,718", sub: "4.4% of usually-resident population · NBS 2024 Census", world: "3.7% global", icon: "users", source_id: "nbs_census_migration", def_id: "immigrant_stock" },
        { term: "Hold Moldovan citizenship", value: "77%", sub: "82,575 of the foreign born · NBS 2024 Census", world: null, icon: "users", source_id: "nbs_census_migration", def_id: "immigrant_stock" },
        { term: "Born in Ukraine or Russia", value: "84,914", sub: "Ukraine 52,360 · Russia 32,554 · NBS 2024 Census", world: null, icon: "globe", source_id: "nbs_census_migration", def_id: "immigrant_stock" }
      ]
    },
    population: {
      takeaway: "The 2024 census counted 2,409,207 people usually living in the Republic of Moldova, roughly 380,000 fewer than in 2014. Emigration is the main driver, because the same diaspora you see in the Leaving Moldova view is one reason the map below keeps getting lighter. Nearly one in three residents live in the capital, Chișinău, and the rest of the country is mostly rural.",
      headline: "Moldova's 2024 Population and Housing Census counted 2,409,207 usual residents on " +
                "8 April 2024, 379,998 fewer than in 2014, a fall of 13.6% in a decade. The decline " +
                "is uneven across the country: the capital, Chișinău, actually grew (to 720,128, " +
                "nearly 30% of the whole population), while the northern and southern raions lost " +
                "more than a fifth of their people. Just under half the population, 46.4%, lives in " +
                "towns and cities; the remaining 53.6% is rural. These are usually-resident figures " +
                "for the territory the census could enumerate, so they exclude the Transnistria " +
                "region and the city of Bender on the left bank of the Dniester.",
      // Census-year resident totals for the trend chart (NBS 2024, Table 5).
      pop_series_source_id: "nbs_census_2024",
      pop_series: [
        { year: 2004, pop: 3383332 }, { year: 2014, pop: 2789205 }, { year: 2024, pop: 2409207 }
      ],
      indicators: [
        { term: "Resident population", value: "2.41M", sub: "Usually-resident · 8 Apr 2024 (NBS Census)", world: null, icon: "landmark", source_id: "nbs_census_2024", def_id: "depopulation" },
        { term: "Change since 2014", value: "−13.6%", sub: "−379,998 residents vs 2014 census", world: null, icon: "users", source_id: "nbs_census_2024", def_id: "depopulation" },
        { term: "Urban", value: "46.4%", sub: "1,118,967 residents · NBS 2024 Census", world: null, icon: "landmark", source_id: "nbs_census_2024", def_id: "depopulation" },
        { term: "Rural", value: "53.6%", sub: "1,290,240 residents · NBS 2024 Census", world: null, icon: "globe", source_id: "nbs_census_2024", def_id: "depopulation" }
      ]
    },
    remittances: {
      takeaway: "The money that Moldovans abroad send home is worth about 10.5 percent of GDP. That is nearly double the global average and more than half the size of the state budget. The map shows where it came from in 2020. Since 2022 the share from Russia has effectively collapsed.",
      panel_note: "The breakdown by country is from the National Bank of Moldova for 2020, the last year with a published breakdown by country. The aggregate net settlements from the National Bank came to about 1.66 billion dollars in 2025. The broader World Bank measure puts total remittances at 1.92 billion dollars in 2024, and the economic indicators on this view use the World Bank figures for 2024.",
      headline: "Money sent home is one of the pillars of the economy. Even after sliding from its " +
                "peak of 34.5 percent in 2006, it still amounts to about 10.5 percent of GDP, roughly " +
                "double the world average.\n\n" +
                "The geography of those flows has shifted dramatically. " +
                "Russia was the single largest source from at least 2015 through 2019, contributing more " +
                "than a quarter of all formal transfers. By 2020 Israel had overtaken it. Then, after the " +
                "Western financial sanctions on Russia in 2022, transfers from Russia through Moldovan " +
                "banks essentially stopped, and their share fell from around 14 percent in 2020 to near " +
                "zero. Member states of the European Union, led by Italy, Germany and France, together " +
                "with the United Kingdom, now account for the large majority of formal inflows.\n\n" +
                "The total net settlements " +
                "reported by the National Bank of Moldova, which is a narrower measure covering banks only, " +
                "came to about 1.66 billion dollars in 2025. The broader World Bank series puts total " +
                "remittances at 1.92 billion dollars in 2024.",
      // Remittances-to-GDP over time. Recent years exact; earlier approximate.
      gdp_series_source_id: "wb_remit_gdp",
      gdp_series: [
        { year: 2006, pct: 34.5 }, { year: 2010, pct: 22.0 }, { year: 2014, pct: 20.0 },
        { year: 2018, pct: 16.0 }, { year: 2020, pct: 15.8 }, { year: 2022, pct: 14.0 },
        { year: 2023, pct: 12.3 }, { year: 2024, pct: 10.5 }
      ],
      indicators: [
        { term: "Remittances-to-GDP", value: "10.5%", sub: "2024", world: "≈5% country average", icon: "percent", source_id: "wb_remit_gdp", def_id: "remittances_gdp" },
        { term: "Remittance inflows", value: "$1.92bn", sub: "2024 (World Bank BPM6); NBM net settlements 2025: ≈$1.66bn", world: null, icon: "banknote", source_id: "wb_remit_total", def_id: "remittance_inflows" },
        { term: "Russia's share", value: "14% → near zero", sub: "2020 to post-2022; EU + Israel now dominate formal flows (NBM)", world: null, icon: "route", source_id: "nbm_transfers", def_id: "net_settlements" },
        { term: "vs. state budget", value: "≈51%", sub: "$1.92bn × ~17.7 = ~34.0bn MDL, against 66.98bn MDL state budget revenue (2024)", world: null, icon: "landmark", source_id: "mof_budget", def_id: "budget_ratio" }
      ]
    },
  },

  modes: {

    // ---- PEOPLE LEAVING MOLDOVA (diaspora stock estimates) ------------------
    emigration: {
      label: "Leaving Moldova",
      sublabel: "Moldovans living abroad",
      unit: "people",
      direction: "out",
      source_id: "undesa_2024",
      vintage: "UN DESA 2024",
      // Visible confidence badge (see updateModeBadges in app.js). Tone keys map
      // to colours in styles.css: official | operational | census | estimated |
      // proxy | partial | historical.
      confidence: { label: "Official stock", tone: "official" },
      known_totals: { 2024: { value: 864257, label: "UN DESA 2024 emigrants, by origin" } },
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
          { country: "Israel", value: 10053 },
          // Residual so the breakdown reconciles to UN DESA's 864,257 total (100%),
          // not just the 752,138 (87%) carried by the nine named destinations above.
          // No map coordinate — renders in the table only, never as a bubble.
          { country: "Other destinations", value: 112119, residual: true }
        ]
      }
    },

    // ---- UKRAINIAN REFUGEES IN MOLDOVA (UNHCR operational count) -----------
    // DISTINCT from NBS census foreign-born residents — never combine these two series.
    immigration: {
      label: "Refugees from Ukraine",
      sublabel: "UNHCR humanitarian count",
      unit: "people",
      direction: "in",
      vintage: "UNHCR May-2026",
      confidence: { label: "Operational count", tone: "operational" },
      source_ids: ["unhcr"],
      years: {
        // Ukrainian refugees only — UNHCR Moldova situation reports.
        2022: [{ country: "Ukraine", value: 100000 }],
        2023: [{ country: "Ukraine", value: 115000 }],
        2024: [{ country: "Ukraine", value: 136000 }],  // UNHCR end-2024
        2026: [{ country: "Ukraine", value: 141058 }]   // UNHCR 31 May 2026 (remaining/residing)
      }
    },

    // ---- FOREIGN-BORN RESIDENTS (NBS 2024 Census, official by country of birth) -
    // A DISTINCT measure from the UNHCR refugee count above. This is the census
    // usual-residence concept. All 2024 values are official, from the 2024 PHC
    // Migration Characteristics file (table 3.5).
    immigration_census: {
      label: "Foreign-born residents",
      sublabel: "NBS 2024 Census, by country of birth",
      unit: "people",
      direction: "in",
      vintage: "NBS Census 2024",
      confidence: { label: "Census (official)", tone: "census" },
      source_ids: ["nbs_census_migration", "undesa_2024"],
      known_totals: { 2024: { value: 106718, label: "NBS 2024 Census total people born abroad" } },
      years: {
        // 2020: UN DESA 2020 bilateral stock (different methodology, country of
        // birth, internationally comparable). Shown for trajectory only; do not
        // compare directly with the 2024 census values.
        2020: [
          { country: "Ukraine", value: 42000 }, { country: "Russia", value: 40000 },
          { country: "Romania", value: 8000 },  { country: "Turkey", value: 2500 },
          { country: "India", value: 1500 }
        ],
        // 2024: NBS 2024 Census, official figures (PHC Migration Characteristics 3.5).
        2024: [
          { country: "Ukraine", value: 52360 },
          { country: "Russia", value: 32554 },
          { country: "Kazakhstan", value: 4300 },
          { country: "Belarus", value: 1778 },
          { country: "Italy", value: 1743 },
          { country: "Romania", value: 1581 },
          { country: "Germany", value: 1369 },
          { country: "Azerbaijan", value: 804 },
          { country: "United Kingdom", value: 762 },
          { country: "France", value: 761 },
          // Reconciles the named countries to the census total of 106,718.
          { country: "Other countries", value: 8706, residual: true }
        ]
      },
      // Census attributes of the foreign-born population, for the detail panel
      // (see renderCensusDetail in app.js). All from the 2024 PHC Migration file.
      census_detail: {
        citizenship: {
          total: 106718,
          moldovan: 82575,   // hold Republic of Moldova citizenship (table 3.2)
          dual: 11983,       // of the Moldovan total, also hold another citizenship
          foreign: 24143     // hold another country's citizenship
        },
        // Reasons foreign citizens give for being in the country (table 3.6).
        // This subset is the 26,135 foreign citizens, not all 106,718 born abroad.
        reasons_total: 26135,
        reasons: [
          { label: "Forced displacement", value: 15015 },
          { label: "Family situation", value: 6581 },
          { label: "Studies", value: 1788 },
          { label: "Work or business", value: 1496 },
          { label: "Other reasons", value: 628 },
          { label: "Not declared", value: 627 }
        ],
        // Age and sex of the foreign-born population (table 3.3). Female-skewed
        // and old: average age 52.1 (men 47.2, women 55.2).
        pyramid: {
          avg: { total: 52.1, male: 47.2, female: 55.2 },
          male_total: 41644, female_total: 65074,
          bands: [
            { age: "0-4", m: 2186, f: 2006 }, { age: "5-9", m: 2223, f: 2160 },
            { age: "10-14", m: 1966, f: 1840 }, { age: "15-19", m: 1830, f: 1535 },
            { age: "20-24", m: 1500, f: 1649 }, { age: "25-29", m: 1304, f: 1583 },
            { age: "30-34", m: 1854, f: 2595 }, { age: "35-39", m: 2760, f: 3463 },
            { age: "40-44", m: 2441, f: 3033 }, { age: "45-49", m: 2197, f: 2551 },
            { age: "50-54", m: 2039, f: 2931 }, { age: "55-59", m: 2486, f: 4030 },
            { age: "60-64", m: 3767, f: 6665 }, { age: "65-69", m: 4790, f: 8534 },
            { age: "70-74", m: 4214, f: 8582 }, { age: "75-79", m: 2112, f: 5174 },
            { age: "80+", m: 1975, f: 6743 }
          ]
        },
        // Reason for staying by nationality (table 3.8), foreign citizens.
        // vals order: forced, family, studies, work, other. Totals are the
        // published per-nationality totals; a small "not declared" gap is excluded.
        reasons_by_nat: {
          order: ["Forced displacement", "Family", "Studies", "Work", "Other"],
          nats: [
            { name: "Ukraine", total: 18877, vals: [14494, 2980, 191, 500, 351] },
            { name: "Russia", total: 2040, vals: [288, 1430, 46, 121, 61] },
            { name: "India", total: 1055, vals: [1, 14, 1020, 9, 5] },
            { name: "Romania", total: 945, vals: [13, 664, 45, 114, 59] },
            { name: "Turkey", total: 402, vals: [12, 170, 28, 171, 7] },
            { name: "Israel", total: 314, vals: [6, 47, 244, 9, 4] },
            { name: "Other", total: 2502, vals: [201, 1276, 214, 572, 141] }
          ]
        }
      }
    },

    // ---- MONEY SENT HOME (remittances by source) — EXACT NBM ---------------
    remittances: {
      label: "Money sent home",
      sublabel: "Remittances by source country",
      unit: "usd_million",
      direction: "in",
      source_id: "nbm_transfers",
      vintage: "NBM 2020 by-country",
      // Per-country split is a bank-transfer proxy and the geography is historical
      // (2020); the headline %GDP / total figures are current (World Bank 2024).
      confidence: { label: "Bank-transfer proxy · 2020 geography", tone: "proxy" },
      known_totals: { 2020: { value: 1486.74, label: "NBM 2020 total" } },
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

    // ---- RESIDENT POPULATION BY DISTRICT (NBS 2024 Census choropleth) --------
    // A district choropleth, not a country flow-map: the map + table read from
    // population_choropleth. The single 2024 census year gives the timeline a
    // stop; per-district rows let renderTable fall back gracefully if needed.
    population: {
      label: "Population by district",
      sublabel: "Usually-resident population, 2024 Census",
      unit: "people",
      direction: "in",
      vintage: "NBS 2024 Census",
      confidence: { label: "Census", tone: "census" },
      source_id: "nbs_census_2024",
      known_totals: { 2024: { value: 2409207, label: "NBS 2024 Census resident total" } },
      years: {
        2024: []   // choropleth-driven; rows live in population_choropleth.districts
      },
      // Internal migration between development regions (table 3.12). 233,299 people
      // had moved district at the time of the census. Chișinău is the only net
      // gainer; every other region loses people to the capital.
      internal_migration: {
        total: 233299,
        regions: [
          { name: "Mun. Chișinău", in: 78215, out: 33372 },
          { name: "North", in: 59453, out: 72424 },
          { name: "Centre", in: 70246, out: 80813 },
          { name: "South", in: 21813, out: 32476 },
          { name: "ATU Găgăuzia", in: 3572, out: 4693 }
        ],
        // Net internal migration by district (table 3.12, arrivals minus
        // departures). Names corrected from the English file's literal
        // mistranslations (Sîngerei, Călărași, Strășeni). Only Chișinău, its
        // suburban ring and Bălți gain; every rural district loses.
        districts: [
          { name: "Mun. Bălți", net: 5794 }, { name: "Anenii Noi", net: 3940 },
          { name: "Ialoveni", net: 3286 }, { name: "Criuleni", net: 558 },
          { name: "Strășeni", net: 293 }, { name: "Edineț", net: 250 },
          { name: "Dubăsari", net: 169 }, { name: "Taraclia", net: 134 },
          { name: "Orhei", net: -280 }, { name: "Cahul", net: -392 },
          { name: "Basarabeasca", net: -468 }, { name: "Ocnița", net: -573 },
          { name: "Rîșcani", net: -578 }, { name: "Căușeni", net: -624 },
          { name: "Briceni", net: -838 }, { name: "Dondușeni", net: -1277 },
          { name: "Soroca", net: -1386 }, { name: "Leova", net: -1408 },
          { name: "Șoldănești", net: -1469 }, { name: "Rezina", net: -1848 },
          { name: "Drochia", net: -2024 }, { name: "Cimișlia", net: -2300 },
          { name: "Ștefan Vodă", net: -2527 }, { name: "Ungheni", net: -2566 },
          { name: "Florești", net: -2593 }, { name: "Nisporeni", net: -2675 },
          { name: "Sîngerei", net: -2803 }, { name: "Glodeni", net: -2826 },
          { name: "Călărași", net: -2873 }, { name: "Cantemir", net: -3078 },
          { name: "Telenești", net: -3461 }, { name: "Hîncești", net: -3641 },
          { name: "Fălești", net: -4117 }
        ]
      }
    }
  }
};
