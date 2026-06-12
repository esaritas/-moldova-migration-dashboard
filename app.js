/* ============================================================================
   MOLDOVA MIGRATION DASHBOARD — APP LOGIC
   Depends on: d3 v7, world-data.js (window.WORLD_GEO), data.js (window.MIGRATION_DATA)
   ========================================================================== */

(function () {
  "use strict";

  const DATA  = window.MIGRATION_DATA;
  const WORLD = window.WORLD_GEO;

  let mode = "emigration";
  let year = null;
  let timer = null;
  let currentWScale = null;     // arc width scale for the active mode
  let currentBubble = null;     // bubble radius scale for the active mode
  let currentK = 1;             // current zoom scale
  let hoverCountry = null;      // for the tooltip

  const ACCENTS = { emigration: "#C7402F", immigration: "#1E8C72", remittances: "#2B6F9E" };

  // Hand-built inline icons (24x24, stroke = currentColor). No dependency.
  const ICONS = {
    depart:   '<circle cx="5" cy="19" r="2.2"/><path d="M8 16 L18 6"/><path d="M18 6 H12 M18 6 V12"/>',
    arrive:   '<circle cx="5" cy="19" r="2.2"/><path d="M18 6 L8 16"/><path d="M8 16 H14 M8 16 V10"/>',
    banknote: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12 h.01 M18 12 h.01"/>',
    users:    '<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20 a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2 a3.4 3.4 0 0 1 0 6.4"/><path d="M18.8 20 a6.6 6.6 0 0 0 -3.2 -5.6"/>',
    globe:    '<circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><ellipse cx="12" cy="12" rx="4" ry="9"/>',
    tent:     '<path d="M3 20 L12 5 L21 20"/><path d="M12 5 V20"/><path d="M8.5 20 L12 13 L15.5 20"/><path d="M2.5 20 H21.5"/>',
    percent:  '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.3"/><circle cx="17.5" cy="17.5" r="2.3"/>',
    landmark: '<line x1="3" y1="21" x2="21" y2="21"/><line x1="4" y1="10" x2="20" y2="10"/><path d="M12 3 L20 9 H4 Z"/><line x1="7" y1="21" x2="7" y2="10"/><line x1="12" y1="21" x2="12" y2="10"/><line x1="17" y1="21" x2="17" y2="10"/>',
    expand:   '<path d="M8 3 H3 V8"/><path d="M16 3 H21 V8"/><path d="M8 21 H3 V16"/><path d="M16 21 H21 V16"/>',
    route:    '<circle cx="5" cy="19" r="2"/><circle cx="19" cy="5" r="2"/><path d="M6.6 17.4 Q 12 12 17.4 6.6"/>'
  };
  function icon(name, size) {
    return `<svg class="icon" viewBox="0 0 24 24" width="${size || 18}" height="${size || 18}" `
      + `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" `
      + `stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ""}</svg>`;
  }
  const MODE_ICON = { emigration: "depart", immigration: "arrive", remittances: "banknote" };

  const svg        = d3.select("#map");
  const tableBody  = d3.select("#tableBody");
  const totalValue = document.getElementById("totalValue");
  const totalLabel = document.getElementById("totalLabel");
  const valueHead  = document.getElementById("valueHead");
  const sourceLine = document.getElementById("sourceLine");
  const mapCaption = document.getElementById("mapCaption");
  const stopsEl    = document.getElementById("stops");
  const trackFill  = document.getElementById("trackFill");
  const playBtn    = document.getElementById("playBtn");

  // ---- Projection (larger canvas) ------------------------------------------
  const W = 820, H = 540;
  svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet");

  const projection = d3.geoNaturalEarth1().fitExtent([[6, 12], [W - 6, H - 12]], WORLD);
  const path = d3.geoPath(projection);

  // Single zoom layer holds everything that should pan/zoom together.
  const defs       = svg.append("defs");
  const gZoom      = svg.append("g").attr("class", "zoomLayer");
  const gCountries = gZoom.append("g").attr("class", "countries");
  const gArcs      = gZoom.append("g").attr("class", "arcs");
  const gNodes     = gZoom.append("g").attr("class", "nodes");
  const gLegend    = svg.append("g").attr("class", "size-legend");  // fixed, not zoomed

  // Tooltip lives over the map card (created once).
  const tip = document.createElement("div");
  tip.className = "map-tip"; tip.hidden = true;
  document.querySelector(".map-card").appendChild(tip);

  gCountries.selectAll("path")
    .data(WORLD.features)
    .join("path")
      .attr("d", path)
      .attr("class", d => d.properties.name === "Moldova" ? "country moldova" : "country");

  const hub = projection([DATA.origin.lng, DATA.origin.lat]);

  // ---- Zoom + pan ----------------------------------------------------------
  const zoom = d3.zoom()
    .extent([[0, 0], [W, H]])
    .scaleExtent([1, 14])
    .translateExtent([[0, 0], [W, H]])
    .on("zoom", (e) => {
      currentK = e.transform.k;
      gZoom.attr("transform", e.transform);
      rescaleForZoom();
    });
  svg.call(zoom).on("dblclick.zoom", null);

  // Default to a Europe-centred view (that's where most flows are); user can
  // zoom out to see the US / India spokes, or reset.
  function europeView() {
    const k = 2.6;
    const p = projection([20, 50]);            // central Europe
    const t = d3.zoomIdentity
      .translate(W / 2 - k * p[0], H / 2 - k * p[1])
      .scale(k);
    svg.transition().duration(600).call(zoom.transform, t);
  }
  function fullView() { svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity); }

  document.getElementById("zoomIn").addEventListener("click",
    () => svg.transition().duration(250).call(zoom.scaleBy, 1.5));
  document.getElementById("zoomOut").addEventListener("click",
    () => svg.transition().duration(250).call(zoom.scaleBy, 1 / 1.5));
  document.getElementById("zoomReset").addEventListener("click", fullView);

  // Keep node + label sizes readable regardless of zoom level.
  function rescaleForZoom() {
    const k = currentK;
    gNodes.selectAll("circle.node")
      .attr("r", d => (currentBubble ? currentBubble(d.value) : 4) / k);
    gNodes.selectAll("text.bubble-label")
      .style("font-size", (9.5 / k) + "px");
    gNodes.selectAll("circle.hub").attr("r", Math.max(3, 5 / k));
    gNodes.selectAll("circle.hub-ring").attr("r", Math.max(5, 9 / k));
    gNodes.selectAll("text.hub-label")
      .style("font-size", Math.max(8, 11 / k) + "px")
      .attr("x", hub[0] + Math.max(6, 9 / k));
  }

  // ---- Helpers -------------------------------------------------------------
  function fmt(value, unit) {
    if (unit === "usd_million")
      return value >= 1000 ? "$" + (value / 1000).toFixed(2) + "bn" : "$" + d3.format(",")(value) + "m";
    return d3.format(",")(value);
  }

  // Compact label that sits on the bubble.
  function fmtShort(value, unit) {
    if (unit === "usd_million")
      return value >= 1000 ? "$" + (value / 1000).toFixed(1) + "bn" : "$" + Math.round(value) + "m";
    if (value >= 1e6) return (value / 1e6).toFixed(value >= 1e7 ? 0 : 1) + "M";
    if (value >= 1e3) return Math.round(value / 1e3) + "k";
    return String(value);
  }

  // ---- Sources: single source of truth lives in DATA.sources ---------------
  // Every consumer (mode, context series, indicator) carries source_id or
  // source_ids; we resolve citations from here so nothing is hand-typed twice.
  const SOURCES = DATA.sources || {};
  function sourceIdsFor(obj) {
    if (!obj) return [];
    if (obj.source_ids) return obj.source_ids.slice();
    if (obj.source_id) return [obj.source_id];
    return [];
  }
  function sourceById(id) { return SOURCES[id] || null; }
  // Compact caption for a single source: "Publisher · indicator_code · as of date".
  function sourceCaption(s) {
    if (!s) return "";
    const bits = [s.publisher];
    if (s.indicator_code) bits.push(s.indicator_code);
    if (s.accessed) bits.push("as of " + s.accessed);
    return bits.join(" · ");
  }
  // Fuller one-line citation for the footer: "Publisher, label (code) — as of date".
  function citation(s) {
    if (!s) return "";
    const code = s.indicator_code ? ` (${s.indicator_code})` : "";
    return `${s.publisher}, ${s.label}${code} — as of ${s.accessed}`;
  }
  function captionsFor(obj) {
    return sourceIdsFor(obj).map(id => sourceCaption(sourceById(id))).filter(Boolean).join("  ·  ");
  }
  function citationsFor(obj) {
    return sourceIdsFor(obj).map(id => citation(sourceById(id))).filter(Boolean).join("  ·  ");
  }

  // Glossary (single source of truth for term definitions), keyed by id.
  const GLOSSARY = {};
  (DATA.glossary || []).forEach(g => { if (g.id) GLOSSARY[g.id] = g; });
  function defById(id) { return GLOSSARY[id] || null; }

  // "Data current as of" date: pipeline timestamp > manual meta.updated > newest
  // source accessed date. Returns an ISO-ish date string or "".
  function dataCurrentDate() {
    const m = DATA.meta || {};
    if (m.generated) return String(m.generated).slice(0, 10);
    if (m.updated) return String(m.updated).slice(0, 10);
    const accessed = Object.values(SOURCES).map(s => s.accessed).filter(Boolean).sort();
    return accessed.length ? accessed[accessed.length - 1] : "";
  }
  function fmtDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    if (!m) return iso || "";
    const mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m[2] - 1];
    return `${+m[3]} ${mon} ${m[1]}`;
  }

  function arcPath(a, b) {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const dist = Math.hypot(dx, dy) || 1;
    const lift = dist * 0.22;
    let nx = -dy / dist, ny = dx / dist;
    if (ny > 0) { nx = -nx; ny = -ny; }
    return `M${a[0]},${a[1]} Q${mx + nx * lift},${my + ny * lift} ${b[0]},${b[1]}`;
  }

  // ONE definition of direction: people leaving -> source is Moldova, target is
  // the country; people/money arriving -> source is the country, target is
  // Moldova. The gradient fade and the particle stream both read from this, so
  // they can never point different ways.
  function endpointsFor(d) {
    const p = projection(coordOf(d.country));
    return DATA.modes[mode].direction === "out"
      ? { src: hub, tgt: p } : { src: p, tgt: hub };
  }
  function pathFor(d) { const e = endpointsFor(d); return arcPath(e.src, e.tgt); }
  function slug(s) { return s.replace(/[^a-z0-9]/gi, ""); }

  function coordOf(country) { const c = DATA.coords[country]; return [c[1], c[0]]; }

  function currentRows() {
    const arr = DATA.modes[mode].years[year];
    return arr ? arr.slice().sort((p, q) => q.value - p.value) : [];
  }

  function widthScaleFor(mode) {
    let max = 0;
    const years = DATA.modes[mode].years;
    for (const y in years) for (const r of years[y]) max = Math.max(max, r.value);
    return d3.scaleSqrt().domain([0, max]).range([1.2, 12]);
  }

  // Bubble area ∝ value. Domain max is taken across all the mode's years so
  // bubble sizes stay comparable as you move along the timeline.
  function bubbleScaleFor(mode) {
    let max = 0;
    const years = DATA.modes[mode].years;
    for (const y in years) for (const r of years[y]) max = Math.max(max, r.value);
    return d3.scaleSqrt().domain([0, max]).range([4, 30]);
  }

  function setAccent() { document.documentElement.style.setProperty("--accent", ACCENTS[mode]); }

  // ---- Renderers -----------------------------------------------------------
  function renderMap() {
    const m = DATA.modes[mode];
    const rows = currentRows();
    currentWScale = widthScaleFor(mode);
    currentBubble = bubbleScaleFor(mode);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Per-flow gradients: faint at the source, solid at the target.
    defs.selectAll("linearGradient.fg").data(rows, d => d.country).join(
      enter => {
        const lg = enter.append("linearGradient").attr("class", "fg")
          .attr("id", d => "fg-" + slug(d.country)).attr("gradientUnits", "userSpaceOnUse");
        lg.append("stop").attr("class", "s0").attr("offset", "0%");
        lg.append("stop").attr("class", "s1").attr("offset", "100%");
        return lg;
      },
      update => update, exit => exit.remove()
    )
      .attr("x1", d => endpointsFor(d).src[0]).attr("y1", d => endpointsFor(d).src[1])
      .attr("x2", d => endpointsFor(d).tgt[0]).attr("y2", d => endpointsFor(d).tgt[1])
      .each(function () {
        const a = ACCENTS[mode];
        d3.select(this).select(".s0").attr("stop-color", a).attr("stop-opacity", 0.04);
        d3.select(this).select(".s1").attr("stop-color", a).attr("stop-opacity", 0.85);
      });

    // Each flow = a group: a gradient "rail" (width = value) + a particle stream.
    const flows = gArcs.selectAll("g.flow").data(rows, d => d.country).join(
      enter => {
        const g = enter.append("g").attr("class", "flow").each(function (d) { attachHover(this, d.country); });
        g.append("path").attr("class", "flow-rail");
        g.append("path").attr("class", "flow-stream");
        return g;
      },
      update => update, exit => exit.remove()
    );
    flows.select(".flow-rail")
      .attr("d", pathFor)
      .attr("stroke", d => "url(#fg-" + slug(d.country) + ")")
      .attr("stroke-width", d => currentWScale(d.value));
    flows.select(".flow-stream")
      .attr("d", pathFor)
      .call(animateStream, reduceMotion);

    gNodes.selectAll("circle.node").data(rows, d => d.country).join(
      enter => enter.append("circle").attr("class", "node")
        .attr("cx", d => projection(coordOf(d.country))[0])
        .attr("cy", d => projection(coordOf(d.country))[1])
        .each(function (d) { attachHover(this, d.country); }),
      update => update
        .attr("cx", d => projection(coordOf(d.country))[0])
        .attr("cy", d => projection(coordOf(d.country))[1]),
      exit => exit.remove()
    );

    // Figures sitting on each bubble.
    gNodes.selectAll("text.bubble-label").data(rows, d => d.country).join(
      enter => enter.append("text").attr("class", "bubble-label")
        .attr("x", d => projection(coordOf(d.country))[0])
        .attr("y", d => projection(coordOf(d.country))[1])
        .each(function (d) { attachHover(this, d.country); })
        .text(d => fmtShort(d.value, m.unit)),
      update => update
        .attr("x", d => projection(coordOf(d.country))[0])
        .attr("y", d => projection(coordOf(d.country))[1])
        .text(d => fmtShort(d.value, m.unit)),
      exit => exit.remove()
    );

    gNodes.selectAll("circle.hub").data([0]).join("circle")
      .attr("class", "hub").attr("cx", hub[0]).attr("cy", hub[1]);
    gNodes.selectAll("circle.hub-ring").data([0]).join("circle")
      .attr("class", "hub-ring").attr("cx", hub[0]).attr("cy", hub[1]);
    gNodes.selectAll("text.hub-label").data([0]).join("text")
      .attr("class", "node-label hub-label").attr("y", hub[1] + 3).text("Moldova");

    renderLegend(m);
    rescaleForZoom();   // size new elements to the current zoom level
  }

  // Graduated-circle size legend (fixed corner, like the Migration Data Portal).
  function renderLegend(m) {
    const maxV = currentBubble.domain()[1] || 1;
    let refs = [maxV, maxV * 0.4, maxV * 0.12].map(niceRound);
    refs = [...new Set(refs)].filter(v => v > 0);
    const rMax = currentBubble(maxV), baseY = H - 18;
    gLegend.attr("transform", "translate(18, 0)");
    gLegend.selectAll("*").remove();
    gLegend.append("text").attr("class", "legend-title")
      .attr("x", 0).attr("y", baseY - rMax * 2 - 12)
      .text(m.unit === "usd_million" ? "Bubble size = money" : "Bubble size = people");
    refs.forEach(v => {
      const r = currentBubble(v);
      gLegend.append("circle").attr("class", "legend-circle")
        .attr("cx", rMax).attr("cy", baseY - r).attr("r", r);
      gLegend.append("text").attr("class", "legend-label")
        .attr("x", rMax * 2 + 8).attr("y", baseY - r * 2 + 4)
        .text(fmtShort(v, m.unit));
    });
  }
  function niceRound(v) {
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    return Math.round(v / p) * p;
  }

  // Particles always flow toward the path END, and the path is drawn so its end
  // is the target (country when leaving, Moldova when arriving). So motion is
  // always correct without a direction flag.
  function animateStream(sel, reduceMotion) {
    sel.each(function () {
      const el = this;
      if (el._anim) { el._anim.cancel(); el._anim = null; }
      if (reduceMotion) { el.style.opacity = 0; return; }
      el.style.opacity = 1;
      const dot = 0.4, gap = 8, period = dot + gap;
      el.style.strokeDasharray = `${dot} ${gap}`;
      el.style.strokeLinecap = "round";
      el._anim = el.animate(
        [{ strokeDashoffset: period }, { strokeDashoffset: 0 }],   // period->0 = toward target
        { duration: 620, iterations: Infinity, easing: "linear" }
      );
    });
  }

  function renderTable() {
    const m = DATA.modes[mode];
    const rows = currentRows();
    valueHead.textContent = m.unit === "usd_million" ? "USD" : "People";
    mapCaption.textContent = (m.unit === "usd_million" ? "Flow width = money" : "Flow width = people")
      + " · scroll to zoom, drag to pan";
    const mapSrc = document.getElementById("mapSource");
    if (mapSrc) { mapSrc.textContent = captionsFor(m); mapSrc.title = citationsFor(m); }
    sourceLine.textContent = citationsFor(m);

    if (rows.length === 0) {                       // year with no data for this mode
      totalValue.textContent = "—";
      totalLabel.textContent = "No data for " + year;
      const avail = modeYears().join(", ");
      tableBody.selectAll("tr").remove();
      tableBody.append("tr").attr("class", "empty-note")
        .append("td").attr("colspan", 3)
        .html(`No <strong>${m.label.toLowerCase()}</strong> figures for ${year}.<br>Available years: ${avail}`);
      return;
    }

    const max = d3.max(rows, d => d.value) || 1;
    const total = d3.sum(rows, d => d.value);
    totalValue.textContent = fmt(total, m.unit);
    totalLabel.textContent = m.sublabel + " · " + year;

    tableBody.selectAll("tr").data(rows, d => d.country).join(
      enter => {
        const tr = enter.append("tr").attr("data-country", d => d.country)
          .on("mouseenter", (e, d) => highlight(d.country)).on("mouseleave", clearHighlight);
        tr.append("td").attr("class", "c-name").html(d => `<span class="c-swatch"></span>${d.country}`);
        tr.append("td").attr("class", "c-bar-cell").append("div").attr("class", "c-bar-track")
          .append("div").attr("class", "c-bar").style("width", d => (d.value / max * 100) + "%");
        tr.append("td").attr("class", "c-value").text(d => fmt(d.value, m.unit));
        return tr;
      },
      update => {
        update.select(".c-name").html(d => `<span class="c-swatch"></span>${d.country}`);
        update.select(".c-bar").style("width", d => (d.value / max * 100) + "%");
        update.select(".c-value").text(d => fmt(d.value, m.unit));
        return update;
      },
      exit => exit.remove()
    );
    sourceLine.textContent = citationsFor(m);
  }

  // ---- Linked highlighting + tooltip ---------------------------------------
  function attachHover(el, country) {
    el.addEventListener("mouseenter", () => { highlight(country); showTip(country); });
    el.addEventListener("mousemove", (e) => moveTip(e));
    el.addEventListener("mouseleave", () => { clearHighlight(); hideTip(); });
  }
  function highlight(country) {
    gArcs.selectAll("g.flow").classed("hot", d => d.country === country).classed("dim", d => d.country !== country);
    gNodes.selectAll("circle.node").classed("dim", d => d.country !== country);
    gNodes.selectAll("text.bubble-label").classed("dim", d => d.country !== country);
    tableBody.selectAll("tr").classed("hot", function () { return this.dataset.country === country; });
  }
  function clearHighlight() {
    gArcs.selectAll("g.flow").classed("hot", false).classed("dim", false);
    gNodes.selectAll("circle.node").classed("dim", false);
    gNodes.selectAll("text.bubble-label").classed("dim", false);
    tableBody.selectAll("tr").classed("hot", false);
  }
  function showTip(country) {
    const m = DATA.modes[mode];
    const row = (DATA.modes[mode].years[year] || []).find(r => r.country === country);
    if (!row) return;
    const unitWord = m.unit === "usd_million" ? "" : " people";
    // Neutral, mode-aware country footnote (mobility/scope fact, not framing).
    const cn = (DATA.country_notes || {})[country];
    const note = cn && (!cn.modes || cn.modes.includes(mode)) ? cn.text : "";
    tip.innerHTML = `<strong>${esc(country)}</strong>${fmt(row.value, m.unit)}${unitWord}`
      + (note ? `<span class="tip-note">${esc(note)}</span>` : "");
    tip.hidden = false;
  }
  function moveTip(e) {
    const card = document.querySelector(".map-card").getBoundingClientRect();
    // Clamp inside the map card so the tip never runs off-screen (esp. on mobile).
    const tw = tip.offsetWidth || 140, th = tip.offsetHeight || 40;
    let x = e.clientX - card.left + 14, y = e.clientY - card.top + 14;
    x = Math.max(4, Math.min(x, card.width - tw - 4));
    y = Math.max(4, Math.min(y, card.height - th - 4));
    tip.style.left = x + "px";
    tip.style.top  = y + "px";
  }
  function hideTip() { tip.hidden = true; }

  // ---- Timeline ------------------------------------------------------------
  // Unified timeline: the UNION of years across all modes (2010–2026). Years a
  // given mode lacks are shown but muted; landing on one shows an empty state.
  function years() {
    const s = new Set();
    for (const mk in DATA.modes) for (const y in DATA.modes[mk].years) s.add(+y);
    return [...s].sort((a, b) => a - b);
  }
  function modeYears() {
    return Object.keys(DATA.modes[mode].years).map(Number).sort((a, b) => a - b);
  }

  // Annotation for a year in the current mode (or null). `modes` omitted = all.
  function annotationFor(y) {
    return (DATA.annotations || []).find(a =>
      a.year === y && (!a.modes || a.modes.includes(mode))) || null;
  }

  function buildTimeline() {
    const ys = years();
    if (year == null) year = 2024;          // default landing year
    stopsEl.innerHTML = "";
    ys.forEach(y => {
      const has = !!DATA.modes[mode].years[y];
      const note = annotationFor(y);
      const b = document.createElement("button");
      b.className = "stop" + (has ? "" : " empty") + (note ? " annotated" : "");
      b.disabled = !has;                       // can't select a year with no data
      b.setAttribute("aria-current", String(y === year));
      if (note) b.title = `${y} — ${note.text}`;
      b.innerHTML = `<span class="pin"></span><span class="yr">${y}</span>`;
      if (has) b.addEventListener("click", () => { stopPlay(); setYear(y); });
      stopsEl.appendChild(b);
    });
    updateTrackFill();
    updateTimelineNote();
  }
  // Narration line: shows the current year's annotation (mode-aware) during play.
  function updateTimelineNote() {
    const el = document.getElementById("timelineNote");
    if (!el) return;
    const note = annotationFor(year);
    if (note) { el.textContent = `${year} — ${note.text}`; el.hidden = false; }
    else { el.textContent = ""; el.hidden = true; }
  }
  function updateTrackFill() {
    const ys = years(), i = ys.indexOf(year);
    trackFill.style.width = (ys.length > 1 ? (i / (ys.length - 1)) * 100 : 0) + "%";
  }
  function setYear(y) {
    year = y;
    const ys = years();
    stopsEl.querySelectorAll(".stop").forEach((b, i) => {
      b.setAttribute("aria-current", String(ys[i] === year));
      b.classList.toggle("empty", !DATA.modes[mode].years[ys[i]]);
    });
    updateTrackFill(); renderMap(); renderTable(); updateContextHighlight();
    updateTimelineNote(); updateHash();
  }

  function togglePlay() { timer ? stopPlay() : startPlay(); }
  function startPlay() {
    playBtn.querySelector("#playIcon").innerHTML =
      '<rect x="3" y="2.5" width="2.6" height="9" fill="currentColor"/><rect x="8.4" y="2.5" width="2.6" height="9" fill="currentColor"/>';
    timer = setInterval(() => {
      const ys = modeYears(); if (!ys.length) return;
      const i = ys.indexOf(year);
      setYear(ys[i < 0 ? 0 : (i + 1) % ys.length]);
    }, 1600);
  }
  function stopPlay() {
    if (timer) { clearInterval(timer); timer = null; }
    playBtn.querySelector("#playIcon").innerHTML = '<path d="M3 2 L12 7 L3 12 Z" fill="currentColor"/>';
  }
  playBtn.addEventListener("click", togglePlay);

  // ---- Mode switching ------------------------------------------------------
  function nearestDataYear(y) {
    const ys = modeYears();
    if (!ys.length) return y;
    if (ys.includes(y)) return y;
    return ys.reduce((best, cur) => Math.abs(cur - y) < Math.abs(best - y) ? cur : best, ys[0]);
  }

  // ---- URL hash deep-linking (#mode=…&year=…) ------------------------------
  // Reflect the view in the hash so a link opens the exact mode+year, and a
  // reload restores it. We use replaceState (no history spam); manual hash edits
  // / back-forward fire hashchange and re-render.
  function parseHash() {
    const p = new URLSearchParams(location.hash.replace(/^#/, ""));
    return { mode: p.get("mode"), year: p.get("year") };
  }
  function applyHashToState() {
    const h = parseHash();
    if (h.mode && DATA.modes[h.mode]) mode = h.mode;
    const y = (h.year && /^\d+$/.test(h.year)) ? +h.year : 2024;
    year = nearestDataYear(y);                 // guarantees a year with data
    document.querySelectorAll(".mode-btn").forEach(b =>
      b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
  }
  function updateHash() {
    if (mode == null || year == null) return;
    const h = `#mode=${mode}&year=${year}`;
    if (location.hash !== h) history.replaceState(null, "", h);
  }

  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      stopPlay();
      mode = btn.dataset.mode;
      document.querySelectorAll(".mode-btn").forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
      // If the current year is a gap for this mode, jump to its nearest real year
      // so switching a filter never blanks the table.
      year = nearestDataYear(year);
      setAccent(); buildTimeline(); renderMap(); renderTable(); renderContext();
      updateHash();
    });
  });

  // Jump straight to a (mode, year) — used by the trend charts.
  function gotoModeYear(name, y) {
    stopPlay();
    if (mode !== name) {
      mode = name;
      document.querySelectorAll(".mode-btn").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === name)));
      setAccent(); buildTimeline();
    }
    setYear(y);
  }

  // ---- Economics panel: one big mode-relevant chart + indicator cards ------
  function modeTotals(name) {
    return Object.keys(DATA.modes[name].years).map(Number).sort((a, b) => a - b)
      .map(y => ({ year: y, total: d3.sum(DATA.modes[name].years[y], r => r.value) }));
  }

  function renderContext() {
    const ctx = DATA.context[mode];
    const accent = ACCENTS[mode];
    document.getElementById("contextHeadline").textContent = ctx.headline;

    // Pick the chart that fits the story:
    //  - remittances -> remittances-to-GDP over time, with the world-average line
    //  - emigration / immigration -> total stock over time (people)
    let data, unit, refLine, title;
    if (mode === "remittances") {
      data = ctx.gdp_series.map(d => ({ year: d.year, total: d.pct }));
      unit = "pct";
      refLine = { value: DATA.context.world.remittances_gdp_pct, label: "World average 5.1%" };
      title = "Remittances as % of GDP";
    } else {
      data = modeTotals(mode);
      unit = mode === "remittances" ? "usd_million" : "people";
      refLine = null;
      title = mode === "emigration" ? "Moldovans abroad — main destinations (stock)" : "Migrants & refugees in Moldova (stock)";
    }
    document.getElementById("ctxChartTitle").textContent = title;
    drawLineChart(d3.select("#ctxChart"), data, { unit, accent, refLine });

    // Caption under the economics chart: the source(s) behind THIS chart.
    // (remittances chart = the %GDP series source; stock charts = the mode source.)
    const chartSrcObj = mode === "remittances"
      ? { source_id: ctx.gdp_series_source_id } : DATA.modes[mode];
    const ctxSrc = document.getElementById("ctxSource");
    if (ctxSrc) { ctxSrc.textContent = captionsFor(chartSrcObj); ctxSrc.title = citationsFor(chartSrcObj); }

    // Indicator cards (professional terms + world benchmark chips + source).
    const stats = d3.select("#ctxStats");
    stats.selectAll("*").remove();
    ctx.indicators.forEach(it => {
      const src = sourceById(it.source_id);
      const def = defById(it.def_id);
      const c = stats.append("div").attr("class", "stat");
      // Hover/focus shows the term definition + the source (card is focusable).
      const tip = [];
      if (def) tip.push(`${def.term}: ${def.definition}`);
      if (src) tip.push(`Source: ${citation(src)}`);
      if (tip.length) c.attr("tabindex", 0).attr("title", tip.join("\n\n"));
      if (def) c.classed("has-def", true);   // dotted underline hints "definition"
      c.append("div").attr("class", "stat-ico")
        .style("color", accent)
        .style("background", `color-mix(in srgb, ${accent} 11%, transparent)`)
        .html(icon(it.icon || "globe", 18));
      const body = c.append("div").attr("class", "stat-body");
      body.append("div").attr("class", "stat-term").text(it.term);
      body.append("div").attr("class", "stat-value").style("color", accent).text(it.value);
      body.append("div").attr("class", "stat-sub").text(it.sub);
      if (it.world)
        body.append("div").attr("class", "stat-world").html(`<span></span>${it.world}`);
      // Small visible caption: publisher · code · as of date.
      if (src) body.append("div").attr("class", "stat-src").text(sourceCaption(src));
    });
    updateContextHighlight();
  }

  function drawLineChart(svg, data, opts) {
    const W = 560, H = 232, ml = 16, mr = 18, mt = 26, mb = 24;
    svg.attr("viewBox", `0 0 ${W} ${H}`).attr("class", "ctx-svg");
    svg.selectAll("*").remove();
    const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([ml, W - mr]);
    const yMax = Math.max(d3.max(data, d => d.total), opts.refLine ? opts.refLine.value : 0) * 1.18;
    const y = d3.scaleLinear().domain([0, yMax]).range([H - mb, mt]);
    const fmtPoint = v => opts.unit === "pct" ? v.toFixed(1) + "%" : fmtShort(v, opts.unit);

    // world-average reference line
    if (opts.refLine) {
      svg.append("line").attr("class", "ctx-ref")
        .attr("x1", ml).attr("x2", W - mr).attr("y1", y(opts.refLine.value)).attr("y2", y(opts.refLine.value));
      svg.append("text").attr("class", "ctx-ref-label")
        .attr("x", W - mr).attr("y", y(opts.refLine.value) - 5).attr("text-anchor", "end")
        .text(opts.refLine.label);
    }

    // area + line
    svg.append("path").datum(data).attr("class", "ctx-area").attr("fill", opts.accent)
      .attr("d", d3.area().x(d => x(d.year)).y0(H - mb).y1(d => y(d.total)).curve(d3.curveMonotoneX));
    svg.append("path").datum(data).attr("class", "ctx-line").attr("stroke", opts.accent)
      .attr("d", d3.line().x(d => x(d.year)).y(d => y(d.total)).curve(d3.curveMonotoneX));

    const pts = svg.selectAll("g.cpt").data(data).join("g").attr("class", "cpt")
      .attr("transform", d => `translate(${x(d.year)},${y(d.total)})`)
      .style("cursor", opts.unit === "pct" ? "default" : "pointer");
    if (opts.unit !== "pct") pts.on("click", (e, d) => gotoModeYear(mode, d.year));
    pts.append("circle").attr("class", "ctx-dot").attr("r", 3.2).attr("fill", opts.accent);
    pts.append("text").attr("class", "ctx-val").attr("y", -9).attr("text-anchor", "middle").text(d => fmtPoint(d.total));
    pts.append("title").text(d => `${d.year}: ${fmtPoint(d.total)}`);

    svg.selectAll("text.ctx-yr").data(data).join("text").attr("class", "ctx-yr")
      .attr("x", d => x(d.year)).attr("y", H - 7).attr("text-anchor", "middle").text(d => d.year);
  }

  function updateContextHighlight() {
    d3.select("#ctxChart").selectAll("g.cpt")
      .classed("current", d => d.year === year)
      .select("circle.ctx-dot").attr("r", d => d.year === year ? 5.5 : 3.2);
  }

  // ---- Methodology & sources modal -----------------------------------------
  // Native <dialog>: Esc-to-close and focus-trap are built in; we add the
  // click-outside and close-button handlers. Content is generated from DATA so
  // sources/definitions/caveats are never hand-maintained in two places.
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  function buildMethodology() {
    const body = document.getElementById("methodBody");
    if (!body) return;
    const defs = (DATA.glossary || []).map(g =>
      `<dl class="method-def"><dt>${esc(g.term)}</dt><dd>${esc(g.definition)}</dd></dl>`).join("");
    const srcs = Object.keys(SOURCES).map(id => {
      const s = SOURCES[id];
      const link = s.url
        ? `<a href="${encodeURI(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a>`
        : esc(s.label);
      const meta = [s.indicator_code, s.accessed ? "as of " + s.accessed : ""].filter(Boolean).map(esc).join(" · ");
      const desc = [s.definition, s.scope, s.note].filter(Boolean).map(esc).join(" ");
      return `<div class="method-src"><div><span class="pub">${esc(s.publisher)}</span> — ${link}</div>`
        + (meta ? `<div class="meta">${meta}</div>` : "")
        + (desc ? `<div class="desc">${desc}</div>` : "") + `</div>`;
    }).join("");
    const cav = (DATA.caveats || []).map(c => `<li>${esc(c)}</li>`).join("");
    body.innerHTML =
      `<section class="method-section"><h3>Definitions</h3>${defs}</section>`
      + `<section class="method-section"><h3>Sources</h3>${srcs}</section>`
      + `<section class="method-section"><h3>Scope &amp; caveats</h3><ul class="method-caveats">${cav}</ul></section>`;
  }
  function wireMethodology() {
    const dlg = document.getElementById("methodDialog");
    const open = document.getElementById("openMethod");
    const close = document.getElementById("methodClose");
    if (!dlg || !open) return;
    open.addEventListener("click", () => { if (typeof dlg.showModal === "function") dlg.showModal(); });
    if (close) close.addEventListener("click", () => dlg.close());
    // click-outside: the backdrop is the <dialog> element itself outside its content box
    dlg.addEventListener("click", (e) => {
      const r = dlg.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) dlg.close();
    });
  }

  // ---- Inject UI icons -----------------------------------------------------
  function injectIcons() {
    document.querySelectorAll(".mode-btn").forEach(b => {
      const slot = b.querySelector(".ico");
      if (slot) slot.innerHTML = icon(MODE_ICON[b.dataset.mode], 16);
    });
    const reset = document.getElementById("zoomReset");
    if (reset) reset.innerHTML = icon("expand", 15);
    const eb = document.querySelector(".eyebrow-ico");
    if (eb) eb.innerHTML = icon("route", 14);
  }

  // ---- Boot ----------------------------------------------------------------
  injectIcons();
  const scopeEl = document.getElementById("scopeNote");
  if (scopeEl) scopeEl.textContent = DATA.scope_note || "";
  const stampEl = document.getElementById("dataStamp");
  if (stampEl) {
    const d = dataCurrentDate();
    stampEl.textContent = d ? "Data current as of " + fmtDate(d) : "";
  }
  buildMethodology(); wireMethodology();
  applyHashToState();   // open the mode+year from the URL hash, if present
  setAccent(); buildTimeline(); renderMap(); renderTable(); renderContext();
  updateHash();         // normalise the hash to the resolved view
  europeView();   // open zoomed into Europe
  document.addEventListener("mouseleave", clearHighlight);

  // Touch: a tap on a bubble/arc shows its tip (via synthesized mouse events);
  // a tap anywhere else dismisses it and clears any highlight.
  document.addEventListener("touchstart", (e) => {
    if (!e.target.closest || !e.target.closest("g.flow, circle.node, text.bubble-label")) {
      hideTip(); clearHighlight();
    }
  }, { passive: true });

  // External hash changes (paste a link, edit the bar, back/forward) re-render.
  window.addEventListener("hashchange", () => {
    applyHashToState();
    setAccent(); buildTimeline(); renderMap(); renderTable(); renderContext();
  });
})();
