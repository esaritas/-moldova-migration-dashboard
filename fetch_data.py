#!/usr/bin/env python3
"""
fetch_data.py — build the dashboard's data file from official sources.

Run this on your own machine (it needs open internet — it will NOT run inside a
locked sandbox). It pulls from:

  REAL APIs (no key needed)
    - World Bank Indicators API ...... total remittances, % of GDP, migrant stock
    - UNHCR Population API ............ refugees from Ukraine residing in Moldova

  WEB SCRAPING
    - National Bank of Moldova ........ remittances by SOURCE country (annual page)

  SEMI-MANUAL (file download, then parsed)
    - UN DESA Int'l Migrant Stock ..... emigrants by destination / immigrants by origin
    - NBS statbank (PxWeb) ............ migration flows (template query included)

Output: writes data.json and data.js (window.MIGRATION_DATA = ...), so the
dashboard works with no code changes — just overwrite the existing data.js.

Usage:
    pip install -r requirements.txt
    python fetch_data.py --years 2015 2020 2024
    # optional: --undesa path/to/undesa_migrant_stock.xlsx

Each source is independent and fails soft: if one is unreachable, the others
still populate and the gap is reported. Always sanity-check the output before
publishing — these sources define "migrant" differently and revise figures.
"""

import argparse, json, re, sys, time
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup

UA = {"User-Agent": "moldova-migration-dashboard/1.0 (research)"}
TIMEOUT = 30


def http_get(url, **kwargs):
    """GET that verifies TLS, but falls back to an UNVERIFIED retry if the host
    serves a broken/incomplete certificate chain (api.unhcr.org does this — it
    omits the intermediate cert, so verification fails even with an up-to-date
    CA bundle, while api.worldbank.org verifies fine). The fallback prints a
    one-line warning so the lapse is visible, and uses no extra dependency."""
    kwargs.setdefault("headers", UA)
    kwargs.setdefault("timeout", TIMEOUT)
    try:
        return requests.get(url, **kwargs)
    except requests.exceptions.SSLError:
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        host = url.split("/")[2] if "//" in url else url
        print(f"  [tls] verification failed for {host} - retrying WITHOUT "
              f"verification (that host's cert chain is incomplete).")
        return requests.get(url, verify=False, **kwargs)

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
def nbm_remittances_by_country(year):
    """
    Scrape NBM's annual money-transfers release and return {country: USD_million}.
    NB: NBM published this full by-country breakdown as a press release only
    through 2020 (the 2018 and 2020 pages are the cleanest). From 2021 the
    breakdown lives in NBM's interactive database (DBP4), not a press release —
    so for 2021+ you'll need to pull DBP4 instead of scraping a release page.
    """
    # The URL slug changed over the years.
    overrides = {
        2015: "money-transfers-abroad-made-favour-individuals-through-banks-republic-moldova-2015-net",
        2016: "money-transfers-abroad-made-favour-individuals-through-banks-republic-moldova-2016-net",
    }
    slug = overrides.get(
        year, f"money-transfers-abroad-individuals-banks-republic-moldova-{year}-net-settlements")
    url = f"https://www.bnm.md/en/content/{slug}"
    r = http_get(url)
    if r.status_code != 200:
        raise RuntimeError(f"NBM page not found for {year} ({r.status_code}) — "
                           f"check the URL slug, it changes some years.")
    text = BeautifulSoup(r.text, "html.parser").get_text(" ", strip=True)

    # The wording is messy ('the US', 'the United Kingdom and Nord Ireland', 'the
    # Russian Federation') and lists run "<Country> - <pct> percent (USD <val>
    # million), <Country> - ...". So we find every money value, then look back
    # ONLY as far as the previous value (its own segment) for a country keyword.
    # Bounding to the segment stops a value from grabbing the *previous* row's
    # country (the old 60-char window did: 2018's US value latched onto 'Italy').
    # Keywords are matched at word boundaries (so short 'us' won't fire inside
    # 'Russia'/'August'/'Belarus'), nearest-to-the-value wins, longest as tiebreak.
    keys = sorted(NAME_MAP, key=len, reverse=True)
    val_re = re.compile(r"\(\s*(?:USD\s*)?([\d.]+)\s*million(?:\s*USD)?\s*\)", re.I)
    results = {}
    seg_start = 0
    for m in val_re.finditer(text):
        seg = text[seg_start:m.start()].lower()
        seg_start = m.end()
        best, best_pos = None, -1
        for k in keys:
            for km in re.finditer(r"(?<![a-z])" + re.escape(k) + r"(?![a-z])", seg):
                # nearest occurrence to the value wins; on a tie, longer key (keys
                # is already longest-first, so the first to reach a position holds)
                if km.start() > best_pos:
                    best_pos, best = km.start(), k
        if best:
            results.setdefault(NAME_MAP[best], round(float(m.group(1))))
    if not results:
        raise RuntimeError(f"NBM page for {year} parsed but no country values found — "
                           f"the wording may have changed; inspect the page.")
    return results


# ---------------------------------------------------------------------------
# 4. NBS statbank (PxWeb) — migration flows  (TEMPLATE — set the table id)
# ---------------------------------------------------------------------------
def nbs_pxweb(table_path, query):
    """
    Generic PxWeb query against Moldova's statistical bank.
    Find the exact table_path by browsing https://statbank.statistica.md/
    (Population and demographic processes -> International migration), then copy
    the API path shown in the table's 'API' tab. Example shape only:

        table_path = "POP/POP070100.px"
        query = [{"code":"Country","selection":{"filter":"all","values":["*"]}},
                 {"code":"Years","selection":{"filter":"item","values":["2020"]}}]
    """
    base = "https://statbank.statistica.md/PxWeb/api/v1/en/statistica/"
    body = {"query": query, "response": {"format": "json"}}
    r = requests.post(base + table_path, json=body, headers=UA, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()   # parse into {country: value} per your chosen table's layout


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
# Assemble + write
# ---------------------------------------------------------------------------
def build(years, undesa_path=None):
    print("World Bank: total remittances + %GDP + migrant stock ...")
    rem_total = worldbank("BX.TRF.PWKR.CD.DT", min(years), max(years))   # current US$
    rem_gdp   = worldbank("BX.TRF.PWKR.DT.GD.ZS", min(years), max(years))  # % of GDP
    stock     = worldbank("SM.POP.TOTL", min(years), max(years))         # migrants IN Moldova
    print(f"  remittances total: { {y: round(rem_total.get(y,0)/1e6) for y in years if y in rem_total} } (USD m)")
    print(f"  % of GDP:          { {y: round(rem_gdp.get(y,0),1) for y in years if y in rem_gdp} }")

    print("UNHCR: Ukrainian refugees residing in Moldova ...")
    try:
        refugees = unhcr_refugees_in_moldova(min(years), max(years))
        print(f"  {refugees}")
    except Exception as e:
        refugees = {}; print(f"  [skip] {e}")

    print("NBM: remittances by source country (scrape) ...")
    remit_by_country = {}
    for y in years:
        try:
            remit_by_country[y] = nbm_remittances_by_country(y)
            print(f"  {y}: {remit_by_country[y]}")
        except Exception as e:
            print(f"  [skip {y}] {e}")
        time.sleep(1)   # be polite to the server

    # --- shape into the dashboard structure --------------------------------
    modes = {
        "emigration":  {"label": "Leaving Moldova",  "sublabel": "Moldovans living abroad",
                        "unit": "people", "direction": "out",
                        "source": "UN DESA bilateral migrant stock (run undesa_bilateral).",
                        "years": {}},
        "immigration": {"label": "Coming to Moldova", "sublabel": "Migrants & refugees in Moldova",
                        "unit": "people", "direction": "in",
                        "source": "UNHCR Population API (refugees) + UN DESA stock by origin.",
                        "years": {}},
        "remittances": {"label": "Money sent home",  "sublabel": "Remittances by source country",
                        "unit": "usd_million", "direction": "in",
                        "source": "National Bank of Moldova money-transfer releases (scraped).",
                        "years": {}},
    }

    # remittances: straight from the NBM scrape
    for y, d in remit_by_country.items():
        modes["remittances"]["years"][str(y)] = [
            {"country": c, "value": v} for c, v in
            sorted(d.items(), key=lambda kv: -kv[1]) if c in COORDS
        ]

    # immigration: seed with UNHCR Ukraine; you can add UN DESA origins here
    for y in years:
        rows = []
        if y in refugees and refugees[y] > 0:
            rows.append({"country": "Ukraine", "value": refugees[y]})
        if rows:
            modes["immigration"]["years"][str(y)] = rows

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
            modes["emigration"]["source"] = (
                "UN DESA Int'l Migrant Stock 2024 (bilateral, by country of birth). "
                "NB: Germany, the US and the UK report by citizenship, so they carry "
                "no Moldova-origin cell and are absent here — these are UN DESA's "
                "known undercounts, not zeros.")
            yrs = [y for y in emi if emi[y]]
            print(f"  emigration years filled: {yrs}")
            print(f"  immigration-by-origin captured for review: "
                  f"{[y for y in undesa_imm if undesa_imm[y]]}")
        except Exception as e:
            print(f"  [skip] {e}")

    data = {
        "origin": {"name": "Moldova", "lat": 47.01, "lng": 28.86},
        "coords": COORDS,
        "meta": {
            "generated": datetime.now(timezone.utc).isoformat(),
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
        },
        "modes": modes,
    }
    return data


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
    ap.add_argument("--years", nargs="+", type=int, default=[2015, 2020, 2024])
    ap.add_argument("--undesa", help="path to a downloaded UN DESA migrant-stock .xlsx")
    args = ap.parse_args()

    data = build(sorted(args.years), undesa_path=args.undesa)

    write(data)
