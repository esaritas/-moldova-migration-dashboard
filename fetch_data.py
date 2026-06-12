#!/usr/bin/env python3
"""
fetch_data.py — build the dashboard's data file from official sources.

Run on your own machine (needs open internet). Sources are tried in an
OFFICIAL-FIRST hierarchy and every written series records its provenance:

  OFFICIAL APIs (no key)
    - World Bank Indicators .......... remittances total, % of GDP, migrant stock
    - UNHCR Population API ........... refugees/asylum-seekers residing in Moldova
    - Eurostat (migr_pop1ctz) ....... Moldovan citizens in the EU (CROSS-CHECK only)
  OFFICIAL FILE (download, then parsed)
    - UN DESA Int'l Migrant Stock ... emigrants by destination / immigrants by origin
  SCRAPE (last resort)
    - National Bank of Moldova ...... remittances by SOURCE country (annual release,
                                      else summed from quarterly releases)

Provenance: each source is catalogued in sources_registry() (mirrors DATA.sources
in data.js) and stamped with the run date; modes reference it by source_id, so the
output carries a `sources` block and the dashboard's captions are generated, never
hand-typed. EDITORIAL blocks in data.js (context, glossary, caveats, annotations,
scope_note, country_notes) are NOT regenerated — merge `modes` + `sources` + `meta`.

Output: data.json + data.generated.js (window.MIGRATION_DATA = ...). Raw downloads
are cached under raw_cache/<run-timestamp>/ for reproducibility (--no-cache to skip).
A sanity_check() flags out-of-range totals / outliers before writing (never blocks).

Usage:
    pip install -r requirements.txt
    python fetch_data.py --years 2017 2018 2019 2020 \
        --undesa undesa_pd_2024_ims_stock_by_sex_destination_and_origin.xlsx

Each source fails soft: if one is unreachable the others still populate and the gap
is reported. COVERAGE CEILING: NBM publishes a by-country breakdown only through
2020 (annual 2016-2020 + quarterly to 2020Q3); there is none on the web after 2020.
Always review the output before publishing — sources define "migrant" differently.
"""

import argparse, hashlib, json, os, re, sys, time
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup

UA = {"User-Agent": "moldova-migration-dashboard/1.0 (research)"}
TIMEOUT = 30

# Raw-download cache (reproducibility): every fetched response is saved under
# raw_cache/<run-timestamp>/ so a run can be audited/replayed. Toggle with --no-cache.
CACHE = True
RUN_STAMP = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

def _cache_write(url, content):
    if not CACHE:
        return
    try:
        d = os.path.join("raw_cache", RUN_STAMP)
        os.makedirs(d, exist_ok=True)
        # Keep the name short — deep CWDs + long query strings can blow past
        # Windows' 260-char path limit. The md5 suffix guarantees uniqueness.
        stem = re.sub(r"[^A-Za-z0-9._-]", "_", url.split("//", 1)[-1])[:48]
        path = os.path.join(d, f"{stem}__{hashlib.md5(url.encode()).hexdigest()[:8]}")
        with open(path, "wb") as f:
            f.write(content if isinstance(content, bytes) else content.encode("utf-8"))
    except Exception as e:
        print(f"  [cache] could not save {url}: {e}")


def http_get(url, **kwargs):
    """GET that verifies TLS, but falls back to an UNVERIFIED retry if the host
    serves a broken/incomplete certificate chain (api.unhcr.org does this — it
    omits the intermediate cert, so verification fails even with an up-to-date
    CA bundle, while api.worldbank.org verifies fine). The fallback prints a
    one-line warning so the lapse is visible, and uses no extra dependency."""
    kwargs.setdefault("headers", UA)
    kwargs.setdefault("timeout", TIMEOUT)
    try:
        r = requests.get(url, **kwargs)
    except requests.exceptions.SSLError:
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        host = url.split("/")[2] if "//" in url else url
        print(f"  [tls] verification failed for {host} - retrying WITHOUT "
              f"verification (that host's cert chain is incomplete).")
        r = requests.get(url, verify=False, **kwargs)
    if r.status_code == 200:
        _cache_write(url, r.content)
    return r


def http_post(url, json_body, **kwargs):
    """POST with the same verified→unverified TLS fallback (statbank.statistica.md
    also serves an incomplete cert chain)."""
    kwargs.setdefault("headers", UA)
    kwargs.setdefault("timeout", TIMEOUT)
    try:
        r = requests.post(url, json=json_body, **kwargs)
    except requests.exceptions.SSLError:
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        host = url.split("/")[2] if "//" in url else url
        print(f"  [tls] verification failed for {host} - retrying WITHOUT verification.")
        r = requests.post(url, json=json_body, verify=False, **kwargs)
    if r.status_code == 200:
        _cache_write(url + " |POST", r.content)
    return r

# Arc endpoints — keep in sync with data.js. [lat, lng].
COORDS = {
    "Russia": [55.75, 37.62], "Italy": [41.90, 12.50], "Romania": [44.43, 26.10],
    "Ukraine": [50.45, 30.52], "Germany": [52.52, 13.40], "France": [48.85, 2.35],
    "Israel": [32.08, 34.78], "United States": [38.90, -77.04],
    "United Kingdom": [51.51, -0.13], "Portugal": [38.72, -9.14],
    "Spain": [40.42, -3.70], "Turkey": [39.93, 32.86], "India": [28.61, 77.21],
}

# Map the many name variants in source text to our canonical country names.
NAME_MAP = {
    "russian federation": "Russia", "russia": "Russia",
    "italy": "Italy", "romania": "Romania", "ukraine": "Ukraine",
    "germany": "Germany", "france": "France", "israel": "Israel",
    "usa": "United States", "united states": "United States",
    "the us": "United States", "us": "United States",  # NBM 2018 wording: "the US - 8.3 percent"
    "united kingdom and nord ireland": "United Kingdom",
    "united kingdom": "United Kingdom", "uk": "United Kingdom",
    "portugal": "Portugal", "spain": "Spain", "turkey": "Turkey",
}

# UN DESA / M49 numeric location codes -> our canonical country names. Codes are
# stable across releases, so we match on these rather than on names (which shift,
# e.g. "Turkey" -> "Türkiye", "Russian Federation", "United States of America").
MOLDOVA_M49 = 498
UNDESA_CODE = {
    643: "Russia", 380: "Italy", 642: "Romania", 804: "Ukraine",
    276: "Germany", 250: "France", 376: "Israel", 840: "United States",
    826: "United Kingdom", 620: "Portugal", 724: "Spain", 792: "Turkey",
    356: "India",
}

# Run date — stamped onto every source's `accessed` so freshness is recorded
# automatically, never hand-typed.
ACCESSED = datetime.now(timezone.utc).date().isoformat()


def sources_registry():
    """The provenance catalogue, mirroring DATA.sources in data.js. Each series
    the pipeline writes references one of these ids; we emit the subset actually
    used into the output `sources` block, so the dashboard's captions/modal are
    generated from provenance rather than hand-maintained. `accessed` is the run
    date. Hierarchy of preference: official APIs > official files > scraping."""
    return {
        "undesa_2024": {
            "label": "International Migrant Stock 2024 (by destination and origin)",
            "publisher": "UN DESA Population Division",
            "url": "https://www.un.org/development/desa/pd/content/international-migrant-stock",
            "indicator_code": "POP/DB/MIG/Stock/Rev.2024", "accessed": ACCESSED,
            "tier": "official-file",
            "definition": "Migrant stock = people living in a country other than the one they "
                          "were born in (country-of-birth basis), at mid-year.",
            "scope": "Bilateral, by country of birth. Germany, the US and the UK report by "
                     "citizenship, so they carry no Moldova-born cell (omitted, not zero). The "
                     "'Republic of Moldova' row carries a UN note on Transnistria coverage.",
            "note": "Birth-basis counts undercount Moldovans who naturalised abroad.",
        },
        "unhcr": {
            "label": "Refugee Population Statistics (people residing in Moldova)",
            "publisher": "UNHCR",
            "url": "https://www.unhcr.org/refugee-statistics/",
            "indicator_code": "population/v1 · coa=MDA · refugees + asylum-seekers",
            "accessed": ACCESSED, "tier": "official-api",
            "definition": "Refugees and asylum-seekers whose country of asylum is the Republic "
                          "of Moldova, at year-end.",
            "scope": "From 2022 predominantly people fleeing the war in Ukraine.",
            "note": "Reported in UNHCR's terms; not merged into general 'immigrants'.",
        },
        "nbm_transfers": {
            "label": "Money transfers from abroad in favour of individuals via banks (net settlements)",
            "publisher": "National Bank of Moldova",
            "url": "https://www.bnm.md/en/content/money-transfers-abroad-individuals-banks-republic-moldova-2020-net-settlements",
            "indicator_code": "DBP4 / press releases (net settlements)",
            "accessed": ACCESSED, "tier": "scrape",
            "definition": "Cross-border transfers to resident individuals settled via Moldovan "
                          "banks, by source country, net basis. A proxy for remittances.",
            "scope": "Excludes Transnistria; not solely labour remittances. Full by-country "
                     "breakdown published annually only through 2020; 2021+ via quarterly releases.",
            "note": "Exact official figures for 2018 and 2020.",
        },
        "wb_remit_gdp": {
            "label": "Personal remittances received (% of GDP)",
            "publisher": "World Bank — World Development Indicators",
            "url": "https://data.worldbank.org/indicator/BX.TRF.PWKR.DT.GD.ZS?locations=MD",
            "indicator_code": "BX.TRF.PWKR.DT.GD.ZS", "accessed": ACCESSED, "tier": "official-api",
            "definition": "Remittance dependency — personal remittances received as a share of GDP (BPM6).",
            "scope": "National accounts basis; excludes Transnistria.", "note": "",
        },
        "wb_remit_total": {
            "label": "Personal remittances received (current US$)",
            "publisher": "World Bank — World Development Indicators",
            "url": "https://data.worldbank.org/indicator/BX.TRF.PWKR.CD.DT?locations=MD",
            "indicator_code": "BX.TRF.PWKR.CD.DT", "accessed": ACCESSED, "tier": "official-api",
            "definition": "Total personal remittances received, current US dollars (BPM6).",
            "scope": "Broader than the NBM net-settlement series (different methodology).", "note": "",
        },
        "wb_migrant_stock": {
            "label": "International migrant stock in Moldova (total)",
            "publisher": "World Bank — World Development Indicators",
            "url": "https://data.worldbank.org/indicator/SM.POP.TOTL?locations=MD",
            "indicator_code": "SM.POP.TOTL", "accessed": ACCESSED, "tier": "official-api",
            "definition": "Number of people living in Moldova who were born elsewhere (UN DESA via WB).",
            "scope": "Excludes Transnistria.", "note": "",
        },
        "nbs_migration": {
            "label": "International migration — emigrants by destination / immigrants by origin",
            "publisher": "National Bureau of Statistics of the Republic of Moldova",
            "url": "https://statbank.statistica.md/pxweb/en/20%20Populatia%20si%20procesele%20demografice/POP070/",
            "indicator_code": "PxWeb POP07300 / POP07100", "accessed": ACCESSED, "tier": "official-api",
            "definition": "Annual registered international migration FLOWS by country — people who "
                          "formally emigrated (deregistered) or immigrated (registered) in the year.",
            "scope": "Flows, not stocks, and only legally registered moves — a few thousand a year, "
                     "NOT comparable to UN DESA migrant stock or UNHCR refugee counts. Excl. Transnistria.",
            "note": "The authoritative Moldovan national source for registered migration.",
        },
        "eurostat_migr": {
            "label": "Population by citizenship / country of birth (Moldovans in the EU)",
            "publisher": "Eurostat",
            "url": "https://ec.europa.eu/eurostat/databrowser/product/view/migr_pop1ctz",
            "indicator_code": "migr_pop1ctz · migr_pop3ctb", "accessed": ACCESSED, "tier": "official-api",
            "definition": "EU resident population who are Moldovan citizens or Moldova-born, 1 January.",
            "scope": "Cross-check only — a DIFFERENT measure from UN DESA country-of-birth stock; "
                     "not mixed into the map.",
            "note": "Corroborates EU destinations, does not replace UN DESA.",
        },
    }


# ---------------------------------------------------------------------------
# 1. WORLD BANK — total remittances time series (REAL API)
# ---------------------------------------------------------------------------
def worldbank(indicator, start, end):
    """Return {year: value} for a World Bank indicator, Moldova (MDA)."""
    url = (f"https://api.worldbank.org/v2/country/MDA/indicator/{indicator}"
           f"?format=json&per_page=400&date={start}:{end}")
    r = http_get(url)
    r.raise_for_status()
    payload = r.json()
    if len(payload) < 2 or payload[1] is None:
        return {}
    out = {}
    for row in payload[1]:
        if row["value"] is not None:
            out[int(row["date"])] = row["value"]
    return out


# ---------------------------------------------------------------------------
# 2. UNHCR — Ukrainian refugees residing in Moldova (REAL API)
# ---------------------------------------------------------------------------
def unhcr_refugees_in_moldova(start, end):
    """
    {year: refugees} for refugees hosted in Moldova (country of asylum = MDA).
    Docs: https://api.unhcr.org/docs  (population/v1/population).

    Verified against the live API (2026-06): the response is {items: [...]} with
    one aggregated row per year (origin not broken out) carrying a 'refugees'
    field — e.g. 2022=105,374, 2023=120,947, 2024=135,941. We add asylum_seekers
    so the figure reflects the full residing displaced population. 'limit' is set
    high so a multi-year query never paginates.
    """
    url = ("https://api.unhcr.org/population/v1/population/"
           f"?yearFrom={start}&yearTo={end}&coa=MDA&cf_type=ISO&limit=1000")
    r = http_get(url)
    r.raise_for_status()
    items = r.json().get("items", [])
    by_year = {}
    for it in items:
        y = int(it["year"])
        people = int(it.get("refugees") or 0) + int(it.get("asylum_seekers") or 0)
        by_year[y] = by_year.get(y, 0) + people
    return by_year


# ---------------------------------------------------------------------------
# 3. NATIONAL BANK OF MOLDOVA — remittances by SOURCE country (WEB SCRAPING)
# ---------------------------------------------------------------------------
# NB ON COVERAGE: NBM publishes a full by-SOURCE-COUNTRY breakdown only through
# 2020 — annual releases (2017-2020) and quarterly releases (2017Q1-2020Q3). The
# interactive database (DBP4/DBP7/DBP14) is aggregate only (no country axis), and
# no by-country page is published after 2020. So this module auto-discovers and
# parses everything NBM publishes (and can SUM four quarters into a missing annual,
# e.g. 2017/2019), but it cannot fetch what doesn't exist publicly post-2020.

_NBM_KEYS = sorted(NAME_MAP, key=len, reverse=True)
_NBM_VAL = re.compile(r"\(\s*(?:USD\s*)?([\d.]+)\s*million(?:\s*USD)?\s*\)", re.I)
_NBM_MAXBACK = 48   # a value's country keyword must END within this many chars of it

def _nbm_text(slug):
    """Plain text of an NBM /en/content page, or None if it 404s."""
    r = http_get(f"https://www.bnm.md/en/content/{slug}")
    if r.status_code != 200:
        return None
    return BeautifulSoup(r.text, "html.parser").get_text(" ", strip=True)

def _parse_nbm_by_country(text):
    """
    {country: USD_million} from an NBM money-transfer release. Value-first: for
    each '(USD x million)', take the nearest country keyword that ENDS within
    _NBM_MAXBACK chars before it (word-bounded, longest-first, bounded to the
    segment since the previous value). The distance cap skips figures with no
    adjacent country — notably the prior-year comparison total ("increased by
    34.7 percent, compared to ... (USD 314.51 million)") that used to be mis-read
    as 'United States = 315'.
    """
    res = {}
    seg_start = 0
    for m in _NBM_VAL.finditer(text):
        seg = text[seg_start:m.start()].lower()
        seg_start = m.end()
        best, best_end = None, -1
        for k in _NBM_KEYS:
            for km in re.finditer(r"(?<![a-z])" + re.escape(k) + r"(?![a-z])", seg):
                if km.end() > best_end:   # nearest-to-value wins; longest as tiebreak
                    best_end, best = km.end(), k
        if best is not None and (len(seg) - best_end) <= _NBM_MAXBACK:
            cc = NAME_MAP[best]
            if cc in COORDS:
                res.setdefault(cc, round(float(m.group(1))))
    return res

_NBM_ANNUAL_OVERRIDES = {
    2015: "money-transfers-abroad-made-favour-individuals-through-banks-republic-moldova-2015-net",
    2016: "money-transfers-abroad-made-favour-individuals-through-banks-republic-moldova-2016-net",
}

def nbm_annual_by_country(year):
    """The annual by-country release for `year` (the year is in this slug), or
    None if NBM didn't publish one (e.g. 2021+)."""
    slug = _NBM_ANNUAL_OVERRIDES.get(
        year, f"money-transfers-abroad-individuals-banks-republic-moldova-{year}-net-settlements")
    text = _nbm_text(slug)
    return (_parse_nbm_by_country(text) or None) if text else None

_NBM_QUARTERS = ["first", "second", "third", "fourth"]

def nbm_quarterly_index(max_suffix=16):
    """
    Discover every quarterly by-country release. The quarterly slugs are YEAR-LESS
    (`…republic-moldova-{quarter}` then Drupal's duplicate counter `-1`, `-2`, …),
    so they can't be constructed — we walk each quarter's suffix sequence, reading
    the actual year from the page text, until it runs out. Returns
    {(year:int, quarter:str) -> {country: USD_million}}.
    """
    base = "money-transfers-abroad-made-favour-individuals-through-banks-republic-moldova-"
    index = {}
    for q in _NBM_QUARTERS:
        consec_miss = 0
        for n in range(0, max_suffix + 1):
            text = _nbm_text(base + q + ("" if n == 0 else f"-{n}"))
            if not text:
                consec_miss += 1
                if consec_miss >= 4:
                    break          # sequence exhausted for this quarter
                continue
            consec_miss = 0
            ym = re.search(r"(first|second|third|fourth)\s+quarter\s+of\s+(\d{4})", text, re.I)
            data = _parse_nbm_by_country(text)
            if ym and data:
                index[(int(ym.group(2)), ym.group(1).lower())] = data
            time.sleep(0.3)        # be polite
    return index

def nbm_sum_quarters(year, qindex):
    """Annual by-country for `year` summed from its four quarterly releases, or
    {} unless all four quarters are present (don't emit a partial year)."""
    quarters = [qindex.get((year, q)) for q in _NBM_QUARTERS]
    if not all(quarters):
        return {}
    summed = {}
    for qd in quarters:
        for c, v in qd.items():
            summed[c] = summed.get(c, 0) + v
    return summed


# ---------------------------------------------------------------------------
# 4. NBS statbank (PxWeb) — migration flows  (TEMPLATE — set the table id)
# ---------------------------------------------------------------------------
NBS_API = ("https://statbank.statistica.md/PxWeb/api/v1/en/"
           "20 Populatia si procesele demografice/POP070/")

# Our canonical country names -> NBS spelling (they differ BY TABLE; e.g. the
# emigrants table uses "Italia"/"USA"/"Great Britain", the immigrants table uses
# "Italy"/"United Kingdom"/"Russian Federation"). Match on these.
NBS_EMI_NAMES = {"Russia": "Russia", "Italy": "Italia", "Romania": "Romania",
                 "Ukraine": "Ukraine", "Germany": "Germany", "France": "France",
                 "Israel": "Israel", "United States": "USA", "United Kingdom": "Great Britain",
                 "Portugal": "Portugal", "Spain": "Spain", "Turkey": "Turkey", "India": "India"}
NBS_IMM_NAMES = {"Russia": "Russian Federation", "Italy": "Italy", "Romania": "Romania",
                 "Ukraine": "Ukraine", "Germany": "Germany", "France": "France",
                 "Israel": "Israel", "United Kingdom": "United Kingdom", "Portugal": "Portugal",
                 "Spain": "Spain", "Turkey": "Turkey", "India": "India"}

def _nbs_vmap(meta, code):
    v = next(x for x in meta["variables"] if x["code"] == code)
    return dict(zip(v["valueTexts"], v["values"]))   # text -> code

def _nbs_num(x):
    try:    return int(x)
    except (TypeError, ValueError): return 0          # '-' / '..' = missing

def _nbs_collect(payload, code_to_canon, ymap, year_idx, country_idx):
    inv_y = {v: k for k, v in ymap.items()}
    out = {}
    for row in payload.get("data", []):
        key = row["key"]
        ccode, ycode = key[country_idx], key[year_idx]
        if ccode not in code_to_canon or ycode not in inv_y:
            continue
        y = int(inv_y[ycode]); c = code_to_canon[ccode]
        out.setdefault(y, {})
        out[y][c] = out[y].get(c, 0) + _nbs_num(row["values"][0])
    return out

def nbs_emigration_flows(years):
    """{year: {country: persons}} — authorised emigrants by destination (POP07300),
    summed over sex, age-total. NBS official national FLOWS (not stocks)."""
    m = http_get(NBS_API + "POP07300.px").json()
    cmap = _nbs_vmap(m, "Tara de destinatie"); ymap = _nbs_vmap(m, "Ani")
    amap = _nbs_vmap(m, "Grupe de virsta");    smap = _nbs_vmap(m, "Sexe")
    names = {cmap[nbs]: canon for canon, nbs in NBS_EMI_NAMES.items() if nbs in cmap}
    q = {"query": [
        {"code": "Ani", "selection": {"filter": "item",
            "values": [ymap[str(y)] for y in years if str(y) in ymap]}},
        {"code": "Tara de destinatie", "selection": {"filter": "item", "values": list(names)}},
        {"code": "Sexe", "selection": {"filter": "item", "values": list(smap.values())}},
        {"code": "Grupe de virsta", "selection": {"filter": "item",
            "values": [amap["Age groups- total"]]}}],
        "response": {"format": "json"}}
    return _nbs_collect(http_post(NBS_API + "POP07300.px", q).json(), names, ymap, 0, 1)

def nbs_immigration_flows(years):
    """{year: {country: persons}} — registered immigrants by country of origin
    (POP07100, purpose=Total). NBS official national FLOWS (not stocks)."""
    m = http_get(NBS_API + "POP07100.px").json()
    cmap = _nbs_vmap(m, "Tara de emigrare"); ymap = _nbs_vmap(m, "Ani")
    pmap = _nbs_vmap(m, "Scopul sosirii")
    names = {cmap[nbs]: canon for canon, nbs in NBS_IMM_NAMES.items() if nbs in cmap}
    q = {"query": [
        {"code": "Tara de emigrare", "selection": {"filter": "item", "values": list(names)}},
        {"code": "Ani", "selection": {"filter": "item",
            "values": [ymap[str(y)] for y in years if str(y) in ymap]}},
        {"code": "Scopul sosirii", "selection": {"filter": "item", "values": [pmap["Total"]]}}],
        "response": {"format": "json"}}
    return _nbs_collect(http_post(NBS_API + "POP07100.px", q).json(), names, ymap, 1, 0)

def nbs_immigration_by_purpose(years):
    """{year: {purpose: persons}} — registered immigrants by reason for arrival
    (POP07100, all origins). Adds the 'why' to the immigration-flow story."""
    m = http_get(NBS_API + "POP07100.px").json()
    cmap = _nbs_vmap(m, "Tara de emigrare"); ymap = _nbs_vmap(m, "Ani")
    pmap = _nbs_vmap(m, "Scopul sosirii")
    purposes = {v: k for k, v in pmap.items() if k != "Total"}
    q = {"query": [
        {"code": "Tara de emigrare", "selection": {"filter": "item", "values": [cmap["Total"]]}},
        {"code": "Ani", "selection": {"filter": "item",
            "values": [ymap[str(y)] for y in years if str(y) in ymap]}},
        {"code": "Scopul sosirii", "selection": {"filter": "item", "values": list(purposes)}}],
        "response": {"format": "json"}}
    payload = http_post(NBS_API + "POP07100.px", q).json()
    inv_y = {v: k for k, v in ymap.items()}
    out = {}
    for row in payload.get("data", []):
        c, ycode, pcode = row["key"]
        if ycode in inv_y and pcode in purposes:
            out.setdefault(int(inv_y[ycode]), {})[purposes[pcode]] = _nbs_num(row["values"][0])
    return out

NBS_POP_TBL = ("https://statbank.statistica.md/PxWeb/api/v1/en/"
               "20 Populatia si procesele demografice/POP010/POPro/POP010100rcl.px")

def nbs_usually_resident(years):
    """{year: persons} usually-resident population (area='Whole country', sex='Total').
    The decade-long fall in this series is Moldova's depopulation."""
    m = http_get(NBS_POP_TBL).json()
    ymap = _nbs_vmap(m, "Ani"); amap = _nbs_vmap(m, "Medii"); smap = _nbs_vmap(m, "Sexe")
    q = {"query": [
        {"code": "Ani", "selection": {"filter": "item",
            "values": [ymap[str(y)] for y in years if str(y) in ymap]}},
        {"code": "Medii", "selection": {"filter": "item", "values": [amap["Whole country"]]}},
        {"code": "Sexe", "selection": {"filter": "item", "values": [smap["Total"]]}}],
        "response": {"format": "json"}}
    payload = http_post(NBS_POP_TBL, q).json()
    inv_y = {v: k for k, v in ymap.items()}
    return {int(inv_y[r["key"][0]]): _nbs_num(r["values"][0]) for r in payload.get("data", [])}

def nbs_repatriates(years):
    """{year: persons} repatriates (returnees), summed across countries (POP07600)."""
    m = http_get(NBS_API + "POP07600.px").json()
    cmap = _nbs_vmap(m, "Tara de emigrare"); ymap = _nbs_vmap(m, "Ani")
    q = {"query": [
        {"code": "Tara de emigrare", "selection": {"filter": "item", "values": list(cmap.values())}},
        {"code": "Ani", "selection": {"filter": "item",
            "values": [ymap[str(y)] for y in years if str(y) in ymap]}}],
        "response": {"format": "json"}}
    payload = http_post(NBS_API + "POP07600.px", q).json()
    inv_y = {v: k for k, v in ymap.items()}; out = {}
    for r in payload.get("data", []):
        y = int(inv_y[r["key"][1]]); out[y] = out.get(y, 0) + _nbs_num(r["values"][0])
    return out

def nbs_emigrant_under35_pct(year):
    """Share (%) of registered emigrants aged under 35 in `year` (POP07300)."""
    m = http_get(NBS_API + "POP07300.px").json()
    cmap = _nbs_vmap(m, "Tara de destinatie"); ymap = _nbs_vmap(m, "Ani")
    amap = _nbs_vmap(m, "Grupe de virsta");    smap = _nbs_vmap(m, "Sexe")
    ages = {k: v for k, v in amap.items() if "total" not in k.lower()}
    q = {"query": [
        {"code": "Ani", "selection": {"filter": "item", "values": [ymap[str(year)]]}},
        {"code": "Tara de destinatie", "selection": {"filter": "item", "values": [cmap["Total"]]}},
        {"code": "Sexe", "selection": {"filter": "item", "values": list(smap.values())}},
        {"code": "Grupe de virsta", "selection": {"filter": "item", "values": list(ages.values())}}],
        "response": {"format": "json"}}
    payload = http_post(NBS_API + "POP07300.px", q).json()
    inv_a = {v: k for k, v in amap.items()}
    young = ("0-", "5-", "10-", "15-", "20-", "25-", "30-")
    tot = under = 0
    for r in payload.get("data", []):
        a = inv_a[r["key"][3]]; val = _nbs_num(r["values"][0]); tot += val
        if any(a.startswith(s) for s in young):
            under += val
    return round(100 * under / tot) if tot else 0


# ---------------------------------------------------------------------------
# 5. UN DESA Int'l Migrant Stock — bilateral  (download xlsx, then parse)
# ---------------------------------------------------------------------------
def undesa_bilateral(xlsx_path, years=(2010, 2015, 2020, 2024)):
    """
    Parse the UN DESA 'International Migrant Stock — by destination AND origin'
    workbook (the bilateral matrix; the much larger file named
    ..._by_sex_destination_and_origin.xlsx, NOT the single-dimension
    by_destination / by_origin files). Download the latest from
    https://www.un.org/development/desa/pd/content/international-migrant-stock

    Returns (emigration, immigration), each a dict {year:int -> {country: people}}
    for Moldova, filtered to the countries in UNDESA_CODE:
      - emigration[year][country]  = Moldovan-born living in <country>  (origin=MDA)
      - immigration[year][country] = <country>-born living in Moldova   (dest=MDA)

    'Table 1' is a long-format matrix: each row is a (destination, origin) pair
    with one column per snapshot year (1990..2024) repeated for both-sexes / male
    / female. We locate columns by the header labels and the M49 location codes
    (stable across releases) rather than by fixed offsets or country spelling.

    CAVEAT worth knowing before you trust it: UN DESA's bilateral cells exist
    only where the *destination* country tabulates migrants by country of birth.
    Several big diaspora hubs (Germany, the US, the UK) report by citizenship, so
    they carry NO Moldova-origin cell here — those emigration destinations come
    back empty, even though Moldovans clearly live there. Handle the gaps when
    you merge into data.js; don't assume "absent" means "zero".
    """
    import pandas as pd
    raw = pd.read_excel(xlsx_path, sheet_name="Table 1", header=None)

    # Find the header row (release-robust): the one carrying the origin code label.
    hdr = None
    for i in range(min(40, len(raw))):
        rowvals = [str(v).strip().lower() for v in raw.iloc[i].tolist()]
        if any("location code of origin" in v for v in rowvals):
            hdr = i
            break
    if hdr is None:
        raise RuntimeError("UN DESA: couldn't find the 'Location code of origin' "
                           "header row — is this the bilateral (destination AND "
                           "origin) workbook, sheet 'Table 1'?")

    head = [str(v).strip() for v in raw.iloc[hdr].tolist()]
    def col_with(label):
        for j, v in enumerate(head):
            if label.lower() in v.lower():
                return j
        raise RuntimeError(f"UN DESA: column '{label}' not found in header row.")
    dest_code_c = col_with("Location code of destination")
    ori_code_c  = col_with("Location code of origin")
    # Year columns: first block (both sexes) = first occurrence of each year, in
    # the order they appear to the right of the origin-code column.
    year_col = {}
    for j, v in enumerate(head):
        if j <= ori_code_c:
            continue
        m = re.fullmatch(r"(\d{4})(?:\.0)?", v)
        if m:
            y = int(m.group(1))
            year_col.setdefault(y, j)   # keep the first (both-sexes) occurrence

    body = raw.iloc[hdr + 1:]
    def to_code(v):
        try:    return int(float(v))
        except (TypeError, ValueError): return None

    emigration  = {y: {} for y in years}
    immigration = {y: {} for y in years}
    for _, row in body.iterrows():
        dcode, ocode = to_code(row[dest_code_c]), to_code(row[ori_code_c])
        if dcode is None or ocode is None:
            continue
        for y in years:
            jc = year_col.get(y)
            if jc is None:
                continue
            val = row[jc]
            if pd.isna(val):
                continue
            v = int(round(float(val)))
            # Moldovans abroad: origin = Moldova, key by destination country.
            if ocode == MOLDOVA_M49 and dcode in UNDESA_CODE:
                emigration[y][UNDESA_CODE[dcode]] = v
            # People in Moldova: destination = Moldova, key by origin country.
            if dcode == MOLDOVA_M49 and ocode in UNDESA_CODE:
                immigration[y][UNDESA_CODE[ocode]] = v
    return emigration, immigration


# ---------------------------------------------------------------------------
# 6. EUROSTAT — Moldovans living in EU countries  (REAL API, cross-check only)
# ---------------------------------------------------------------------------
# EU/EFTA destinations we cover -> Eurostat geo (ISO-2). Non-EU destinations
# (Russia, Ukraine, Israel, US, UK, Turkey, India) aren't in Eurostat.
EUROSTAT_GEO = {"Italy": "IT", "Romania": "RO", "Germany": "DE",
                "France": "FR", "Spain": "ES", "Portugal": "PT"}

def eurostat_moldovans_in_eu(dataset="migr_pop1ctz"):
    """
    {country: {year: people}} for Moldovan CITIZENS resident in each EU country
    (Eurostat migr_pop1ctz, 1 January). This is a CROSS-CHECK on a different basis
    (citizenship, not country of birth), so it is NOT merged into the emigration
    map — citizenship counts drop Moldovans who have naturalised. Returned for
    corroboration / the methodology panel only.
    """
    base = ("https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/"
            + dataset)
    out = {}
    for country, geo in EUROSTAT_GEO.items():
        url = f"{base}?format=JSON&geo={geo}&citizen=MD&sex=T&age=TOTAL&lang=EN"
        try:
            r = http_get(url)
            r.raise_for_status()
            j = r.json()
            val = j.get("value", {})
            idx = j.get("dimension", {}).get("time", {}).get("category", {}).get("index", {})
            inv = {v: k for k, v in idx.items()}
            series = {inv[int(k)]: int(round(v)) for k, v in val.items() if int(k) in inv}
            if series:
                out[country] = dict(sorted(series.items()))
        except Exception as e:
            print(f"  [skip {country}] {e}")
    return out


# ---------------------------------------------------------------------------
# Assemble + write
# ---------------------------------------------------------------------------
def build(years, undesa_path=None):
    # NBS first — the authoritative national source (registered migration FLOWS).
    print("NBS (national statistics): registered migration flows by country ...")
    NBS_YEARS = [2015, 2018, 2020, 2022, 2024]
    def nbs_call(fn, label, default):
        # statbank throttles rapid requests — pace them and fail soft.
        try:
            out = fn(); time.sleep(1); return out
        except Exception as e:
            time.sleep(1); print(f"  [skip {label}] {e}"); return default
    nbs_emi = nbs_call(lambda: nbs_emigration_flows(NBS_YEARS), "emigration", {})
    print(f"  emigrants/yr by destination: { {y: sum(d.values()) for y, d in sorted(nbs_emi.items())} }")
    nbs_imm = nbs_call(lambda: nbs_immigration_flows(NBS_YEARS), "immigration", {})
    print(f"  immigrants/yr by origin:     { {y: sum(d.values()) for y, d in sorted(nbs_imm.items())} }")
    nbs_purpose = nbs_call(lambda: nbs_immigration_by_purpose(NBS_YEARS), "purpose", {})
    print(f"  immigration purposes (2024): {nbs_purpose.get(2024, {})}")
    nbs_pop = nbs_call(lambda: nbs_usually_resident([2014, 2018, 2020, 2022, 2024, 2026]), "population", {})
    nbs_rep = nbs_call(lambda: nbs_repatriates(NBS_YEARS), "repatriates", {})
    nbs_youth = nbs_call(lambda: nbs_emigrant_under35_pct(2024), "youth-age", None)
    print(f"  resident pop 2014->2024: {nbs_pop.get(2014)} -> {nbs_pop.get(2024)} | "
          f"under-35 emigrants {nbs_youth}% | returnees 2024 {nbs_rep.get(2024)}")

    print("World Bank: total remittances + %GDP + migrant stock ...")
    def wb(indicator):
        try:
            return worldbank(indicator, min(years), max(years))
        except Exception as e:
            print(f"  [skip {indicator}] {e}")
            return {}
    rem_total = wb("BX.TRF.PWKR.CD.DT")     # current US$
    rem_gdp   = wb("BX.TRF.PWKR.DT.GD.ZS")  # % of GDP
    stock     = wb("SM.POP.TOTL")           # migrants IN Moldova
    print(f"  remittances total: { {y: round(rem_total.get(y,0)/1e6) for y in years if y in rem_total} } (USD m)")
    print(f"  % of GDP:          { {y: round(rem_gdp.get(y,0),1) for y in years if y in rem_gdp} }")

    print("UNHCR: Ukrainian refugees residing in Moldova ...")
    try:
        refugees = unhcr_refugees_in_moldova(min(years), max(years))
        print(f"  {refugees}")
    except Exception as e:
        refugees = {}; print(f"  [skip] {e}")

    print("NBM: remittances by source country (annual release, else sum of quarters) ...")
    remit_by_country = {}
    need_sum = []
    for y in years:
        try:
            d = nbm_annual_by_country(y)
        except Exception as e:
            d = None; print(f"  [warn {y}] {e}")
        if d:
            remit_by_country[y] = d
            print(f"  {y}: annual release — total {sum(d.values())} (USD m, {len(d)} countries)")
        else:
            need_sum.append(y)
        time.sleep(0.5)
    if need_sum:
        print(f"  no annual page for {need_sum}; discovering quarterly releases to sum ...")
        try:
            qidx = nbm_quarterly_index()
            qyears = sorted({y for (y, _q) in qidx})
            print(f"  quarterly releases found for years: {qyears} (NBM stops after 2020)")
            for y in need_sum:
                d = nbm_sum_quarters(y, qidx)
                if d:
                    remit_by_country[y] = d
                    print(f"  {y}: summed 4 quarters — total {sum(d.values())} (USD m)")
                else:
                    print(f"  [skip {y}] no full by-country set (NBM didn't publish it)")
        except Exception as e:
            print(f"  [skip quarterly] {e}")

    # --- shape into the dashboard structure --------------------------------
    # Every mode references provenance by id (resolved from the sources block);
    # `used` collects the ids actually populated so we emit only those.
    used = set()
    modes = {
        "emigration":  {"label": "Leaving Moldova",  "sublabel": "Moldovans living abroad",
                        "unit": "people", "direction": "out",
                        "source_id": "undesa_2024", "years": {}},
        "immigration": {"label": "Coming to Moldova", "sublabel": "Migrants & refugees in Moldova",
                        "unit": "people", "direction": "in",
                        "source_ids": ["unhcr"], "years": {}},
        "remittances": {"label": "Money sent home",  "sublabel": "Remittances by source country",
                        "unit": "usd_million", "direction": "in",
                        "source_id": "nbm_transfers", "years": {}},
        "emigration_flow":  {"label": "Emigrants / year", "sublabel": "Registered with NBS, by destination",
                             "unit": "people", "direction": "out",
                             "source_id": "nbs_migration", "years": {}},
        "immigration_flow": {"label": "Immigrants / year", "sublabel": "Registered with NBS, by origin",
                             "unit": "people", "direction": "in",
                             "source_id": "nbs_migration", "years": {}},
    }

    # NBS registered-flow modes (official national source).
    for y, d in nbs_emi.items():
        if d:
            modes["emigration_flow"]["years"][str(y)] = [
                {"country": c, "value": v} for c, v in sorted(d.items(), key=lambda kv: -kv[1])]
            used.add("nbs_migration")
    for y, d in nbs_imm.items():
        if d:
            modes["immigration_flow"]["years"][str(y)] = [
                {"country": c, "value": v} for c, v in sorted(d.items(), key=lambda kv: -kv[1])]
            used.add("nbs_migration")

    # remittances: straight from the NBM scrape
    for y, d in remit_by_country.items():
        rows = [{"country": c, "value": v} for c, v in
                sorted(d.items(), key=lambda kv: -kv[1]) if c in COORDS]
        if rows:
            modes["remittances"]["years"][str(y)] = rows
            used.add("nbm_transfers")

    # immigration: seed with UNHCR Ukraine; you can add UN DESA origins here
    for y in years:
        rows = []
        if y in refugees and refugees[y] > 0:
            rows.append({"country": "Ukraine", "value": refugees[y]})
        if rows:
            modes["immigration"]["years"][str(y)] = rows
            used.add("unhcr")

    # emigration (+ optional UN DESA immigration by origin): the bilateral matrix.
    undesa_imm = None
    if undesa_path:
        print("UN DESA: bilateral migrant stock (Moldovans abroad by destination, "
              "people in Moldova by origin) ...")
        try:
            emi, undesa_imm = undesa_bilateral(undesa_path)
            for y, d in emi.items():
                if d:
                    modes["emigration"]["years"][str(y)] = [
                        {"country": c, "value": v}
                        for c, v in sorted(d.items(), key=lambda kv: -kv[1])
                    ]
                    used.add("undesa_2024")
            yrs = [y for y in emi if emi[y]]
            print(f"  emigration years filled: {yrs}")
            print(f"  immigration-by-origin captured for review: "
                  f"{[y for y in undesa_imm if undesa_imm[y]]}")
        except Exception as e:
            print(f"  [skip] {e}")

    # Eurostat cross-check: Moldovan citizens in EU countries (different basis).
    print("Eurostat: Moldovan citizens resident in EU countries (cross-check) ...")
    try:
        eurostat_eu = eurostat_moldovans_in_eu()
        if eurostat_eu:
            used.add("eurostat_migr")
            print(f"  {[f'{c}:{max(s.values())}' for c, s in eurostat_eu.items()]}")
    except Exception as e:
        eurostat_eu = {}; print(f"  [skip] {e}")

    # World Bank macro series feed data.js context (% GDP, totals, stock).
    if rem_gdp:   used.add("wb_remit_gdp")
    if rem_total: used.add("wb_remit_total")
    if stock:     used.add("wb_migrant_stock")

    # Emit every source actually populated PLUS every source a mode references, so
    # there are never dangling source_ids (captions always resolve).
    for m in modes.values():
        if m.get("source_id"):
            used.add(m["source_id"])
        used.update(m.get("source_ids", []))
    registry = sources_registry()
    sources = {sid: registry[sid] for sid in sorted(used) if sid in registry}

    data = {
        "origin": {"name": "Moldova", "lat": 47.01, "lng": 28.86},
        "coords": COORDS,
        # Provenance catalogue (same shape as DATA.sources). Modes reference it by
        # source_id/source_ids; the dashboard generates its captions from this.
        "sources": sources,
        "meta": {
            "generated": datetime.now(timezone.utc).isoformat(),
            # per-series provenance: which source id backs each macro series.
            "provenance": {
                "remittances_total_usd_million": "wb_remit_total",
                "remittances_pct_gdp": "wb_remit_gdp",
                "migrant_stock_in_moldova": "wb_migrant_stock",
            },
            "remittances_total_usd_million": {str(y): round(rem_total[y]/1e6)
                                              for y in years if y in rem_total},
            "remittances_pct_gdp": {str(y): round(rem_gdp[y], 1)
                                    for y in years if y in rem_gdp},
            "migrant_stock_in_moldova": {str(y): int(stock[y])
                                         for y in years if y in stock},
            # UN DESA people-in-Moldova by origin, for review only. Kept out of
            # the immigration mode to avoid double-counting the UNHCR refugees
            # (UN DESA 2024 stock already absorbs the Ukrainian arrivals).
            "undesa_immigration_by_origin": (
                {str(y): d for y, d in undesa_imm.items() if d} if undesa_imm else {}),
            # Eurostat cross-check (Moldovan CITIZENS in EU; citizenship basis, a
            # different measure from the birth-basis emigration map — not merged).
            "eurostat_moldovan_citizens_eu": eurostat_eu,
            # NBS registered-immigration by reason for arrival (work/study/family/…).
            "nbs_immigration_by_purpose": {str(y): d for y, d in nbs_purpose.items() if d},
            # NBS depopulation + return migration + youth-emigration share.
            "nbs_usually_resident_population": {str(y): v for y, v in sorted(nbs_pop.items())},
            "nbs_repatriates": {str(y): v for y, v in sorted(nbs_rep.items())},
            "nbs_emigrant_under35_pct": nbs_youth,
            "_note": "Editorial blocks (context, glossary, caveats, annotations, "
                     "scope_note, country_notes) are hand-maintained in data.js — "
                     "merge `modes` + `sources` + `meta` from here; leave those intact.",
        },
        "modes": modes,
    }
    return data


# Plausible totals per mode-year — wide enough to pass normal variation, tight
# enough to catch parsing blunders (wrong column, doubled values, dropped digit).
SANITY_RANGES = {
    "remittances": (100, 4000),        # USD million, annual by-country sum
    "emigration":  (50_000, 2_500_000),
    "immigration": (100, 1_000_000),
    "emigration_flow":  (100, 50_000), # NBS registered flows, persons/year
    "immigration_flow": (100, 50_000),
}

def sanity_check(data):
    """Flag (not block) anything that looks wrong before writing: out-of-range
    totals, dangling source ids, by-country sums above the World Bank total, and
    big year-on-year swings. Returns the list of warnings."""
    warn = []
    sources = data.get("sources", {})

    # 1) every source_id referenced actually exists in the sources block
    def ids(o): return (o.get("source_ids") or ([o["source_id"]] if o.get("source_id") else []))
    for mk, m in data["modes"].items():
        for sid in ids(m):
            if sid not in sources:
                warn.append(f"{mk}: source_id '{sid}' missing from sources block")

    # 2) per mode-year totals in range; 3) no single country exceeds its year total
    for mk, m in data["modes"].items():
        lo, hi = SANITY_RANGES.get(mk, (0, float("inf")))
        years = sorted(m["years"], key=int)
        totals = {}
        for y in years:
            rows = m["years"][y]
            tot = sum(r["value"] for r in rows)
            totals[y] = tot
            if not (lo <= tot <= hi):
                warn.append(f"{mk} {y}: total {tot:,} outside expected [{lo:,}..{hi:,}]")
            for r in rows:
                if r["value"] > tot:
                    warn.append(f"{mk} {y}: {r['country']} {r['value']:,} exceeds year total")
                if r["value"] < 0:
                    warn.append(f"{mk} {y}: {r['country']} negative value")
        # 4) year-on-year swing > 70% (informational)
        for a, b in zip(years, years[1:]):
            if totals[a] and abs(totals[b] - totals[a]) / totals[a] > 0.70:
                warn.append(f"{mk}: {a}->{b} total swings {totals[a]:,}->{totals[b]:,} (>70%)")

    # 5) NBM by-country sum should not exceed the (broader) World Bank total
    wb_total = data["meta"].get("remittances_total_usd_million", {})
    for y, rows in data["modes"]["remittances"]["years"].items():
        nbm = sum(r["value"] for r in rows)
        if y in wb_total and nbm > wb_total[y] * 1.10:
            warn.append(f"remittances {y}: NBM by-country sum {nbm:,} > World Bank total "
                        f"{wb_total[y]:,} (+10% tolerance) — check the parse")

    print("\nSanity check:")
    if warn:
        for w in warn:
            print(f"  [!] {w}")
        print(f"  {len(warn)} warning(s) — review before publishing.")
    else:
        print("  all checks passed.")
    return warn


def write(data):
    with open("data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    header = ("// AUTO-GENERATED by fetch_data.py on "
              + data["meta"]["generated"] + "\n// Review before publishing.\n")
    with open("data.generated.js", "w", encoding="utf-8") as f:
        f.write(header + "window.MIGRATION_DATA = "
                + json.dumps(data, ensure_ascii=False) + ";\n")
    print("\nWrote data.json and data.generated.js")
    print("To use it in the dashboard: rename data.generated.js -> data.js "
          "(or point index.html's <script src> at it).")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--years", nargs="+", type=int, default=[2017, 2018, 2019, 2020])
    ap.add_argument("--undesa", help="path to the UN DESA bilateral migrant-stock .xlsx")
    ap.add_argument("--no-cache", action="store_true",
                    help="don't save raw downloads under raw_cache/")
    args = ap.parse_args()

    if args.no_cache:
        CACHE = False

    data = build(sorted(args.years), undesa_path=args.undesa)
    sanity_check(data)
    write(data)
    if CACHE:
        print(f"Raw downloads cached under raw_cache/{RUN_STAMP}/")
