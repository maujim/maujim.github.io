const palette = ["#68c2ad", "#f39a43", "#a77b65", "#5a83b3", "#61a553", "#3ba957", "#77b9b3", "#df595e", "#f17ba8", "#edc948", "#9c5de5", "#a87499", "#4665c5", "#e9a90c", "#999ca2", "#b2aaa4", "#8eb0e8", "#51779f", "#f59ba8"];
const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
const state = { countries: [], countryFilenames: {}, locations: {}, target: null, guesses: [], products: [], activeSection: null, ended: false };
let roundRequest = 0;
let autocompleteMatches = [], autocompleteIndex = -1;

const $ = (selector) => document.querySelector(selector);
const formatMoney = (value) => value >= 1e12 ? `$${(value/1e12).toFixed(2)}T` : value >= 1e9 ? `$${(value/1e9).toFixed(1)}B` : `$${(value/1e6).toFixed(1)}M`;
const countryName = (code) => displayNames.of(code.toUpperCase()) || code.toUpperCase();
const countryFilename = (code) => state.countryFilenames[code.toLowerCase()];
const flag = code => [...code.toUpperCase()].map(letter => String.fromCodePoint(127397 + letter.charCodeAt())).join("");

function distanceKm(from, to) {
  const radians = degrees => degrees * Math.PI / 180;
  const lat1 = radians(from.latitude), lat2 = radians(to.latitude);
  const deltaLon = radians(to.longitude - from.longitude);
  const cosine = Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
  return 6378.137 * Math.acos(Math.min(1, Math.max(-1, cosine)));
}

function directionTo(from, to) {
  const radians = degrees => degrees * Math.PI / 180;
  const lat1 = radians(from.latitude), lat2 = radians(to.latitude);
  let deltaLon = radians(to.longitude - from.longitude);
  const deltaPsi = Math.log(Math.tan(lat2/2 + Math.PI/4) / Math.tan(lat1/2 + Math.PI/4));
  if (Math.abs(deltaLon) > Math.PI) deltaLon = deltaLon > 0 ? -(2*Math.PI-deltaLon) : 2*Math.PI+deltaLon;
  const bearing = (Math.atan2(deltaLon, deltaPsi) * 180 / Math.PI + 360) % 360;
  const labels = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
  return labels[Math.round(bearing / 45) % 8];
}

function proximity(distance) {
  const score = Math.round(Math.max(20_000 - distance, 0) / 20_000 * 100);
  return distance > 0 && score >= 100 ? 99 : score;
}

function closeAutocomplete() {
  const list = $("#country-suggestions"), input = $("#country-input");
  list.hidden = true; list.innerHTML = ""; input.setAttribute("aria-expanded", "false");
  input.removeAttribute("aria-activedescendant");
  autocompleteMatches = []; autocompleteIndex = -1;
}

function chooseAutocomplete(code) {
  $("#country-input").value = countryName(code);
  $("#country-input").setCustomValidity("");
  closeAutocomplete(); $("#country-input").focus();
}

function renderAutocomplete(query) {
  const normalized = query.trim().toLowerCase(), list = $("#country-suggestions"), input = $("#country-input");
  if (!normalized) { closeAutocomplete(); return; }
  autocompleteMatches = state.countries
    .map(code => ({ code, name: countryName(code) }))
    .filter(country => country.name.toLowerCase().includes(normalized) || country.code === normalized)
    .sort((a,b) => Number(!a.name.toLowerCase().startsWith(normalized)) - Number(!b.name.toLowerCase().startsWith(normalized)) || a.name.localeCompare(b.name))
    .slice(0, 6);
  autocompleteIndex = -1;
  if (!autocompleteMatches.length) { closeAutocomplete(); return; }
  list.innerHTML = autocompleteMatches.map(({code,name}, index) => `<button id="country-option-${code}" class="country-suggestion" type="button" role="option" aria-selected="false" data-code="${code}" data-index="${index}">${flag(code)} <strong>${name}</strong></button>`).join("");
  list.hidden = false; input.setAttribute("aria-expanded", "true");
  list.querySelectorAll("button").forEach(button => button.addEventListener("click", () => chooseAutocomplete(button.dataset.code)));
}

function setAutocompleteIndex(index) {
  if (!autocompleteMatches.length) return;
  autocompleteIndex = (index + autocompleteMatches.length) % autocompleteMatches.length;
  const input = $("#country-input");
  $("#country-suggestions").querySelectorAll("button").forEach((button, i) => {
    const active = i === autocompleteIndex;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  input.setAttribute("aria-activedescendant", `country-option-${autocompleteMatches[autocompleteIndex].code}`);
}


function parseCSV(text) {
  const rows = []; let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (c === '"' && quoted && next === '"') { cell += '"'; i++; }
    else if (c === '"') quoted = !quoted;
    else if (c === ',' && !quoted) { row.push(cell); cell = ""; }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && next === '\n') i++;
      row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = rows.shift();
  return rows.map(values => Object.fromEntries(headers.map((h, i) => [h, values[i]])));
}

function squarify(items, x, y, width, height) {
  if (!items.length) return [];
  const out = [];
  function layout(list, box) {
    if (!list.length) return;
    if (list.length === 1) { out.push({ ...list[0], ...box }); return; }
    const listTotal = list.reduce((sum, item) => sum + item.value, 0);
    const half = listTotal / 2;
    let running = 0, split = 1, closest = Infinity;
    for (let i = 1; i < list.length; i++) {
      running += list[i - 1].value;
      const distance = Math.abs(half - running);
      if (distance <= closest) { closest = distance; split = i; } else break;
    }
    const first = list.slice(0, split), second = list.slice(split);
    const firstTotal = first.reduce((s, d) => s + d.value, 0), ratio = firstTotal / listTotal;
    if (box.width >= box.height) {
      layout(first, { x: box.x, y: box.y, width: box.width * ratio, height: box.height });
      layout(second, { x: box.x + box.width * ratio, y: box.y, width: box.width * (1-ratio), height: box.height });
    } else {
      layout(first, { x: box.x, y: box.y, width: box.width, height: box.height * ratio });
      layout(second, { x: box.x, y: box.y + box.height * ratio, width: box.width, height: box.height * (1-ratio) });
    }
  }
  layout(items, {x,y,width,height}); return out;
}

function renderTreemap() {
  const el = $("#treemap"), countryTotal = state.products.reduce((s, p) => s + p.value, 0);
  const sections = [...new Set(state.products.map(p => p.section))];
  const color = Object.fromEntries(sections.map((section, i) => [section, palette[i % palette.length]]));
  const filtered = state.activeSection ? state.products.filter(p => p.section === state.activeSection) : state.products;
  const sorted = [...filtered].sort((a,b) => b.value-a.value);
  const visible = sorted.slice(0, 180), otherValue = sorted.slice(180).reduce((sum, product) => sum + product.value, 0);
  const displayed = otherValue ? [...visible, { name: "Other exports", section: state.activeSection || "Other", value: otherValue }] : visible;
  const viewTotal = displayed.reduce((s, p) => s + p.value, 0);
  const summary = $("#chart-summary");
  summary.textContent = `Leading exports: ${displayed.slice(0, 5).map(product => `${product.name}, ${(product.value / viewTotal * 100).toFixed(2)}%`).join("; ")}.`;
  const rects = squarify(displayed, 0, 0, 100, 100);
  el.innerHTML = rects.map((p) => {
    const percent = p.value / viewTotal * 100;
    const area = p.width * p.height;
    const size = p.width < 3 || p.height < 3 || area < 18 ? " micro" : p.width < 10 || p.height < 8 || area < 120 ? " small" : p.width < 22 || p.height < 18 || area < 350 ? " compact" : "";
    const safeName = String(p.name).replace(/&/g, "&amp;").replace(/\"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<div class="tile${size}" data-name="${safeName}" data-percent="${percent.toFixed(2)}" style="left:${p.x}%;top:${p.y}%;width:${p.width}%;height:${p.height}%;background:${color[p.section] || "#aaa59c"}"><strong>${safeName}</strong><span>${percent.toFixed(2)}%</span></div>`;
  }).join("");
  const inspector = document.createElement("div");
  inspector.className = "tile-inspector";
  el.append(inspector);
  el.querySelectorAll(".tile").forEach(tile => {
    tile.addEventListener("pointerenter", () => {
      inspector.textContent = `${tile.dataset.name} · ${tile.dataset.percent}% ${state.activeSection ? `of ${state.activeSection}` : "of all exports"}`;
      inspector.classList.add("visible");
    });
    tile.addEventListener("pointerleave", () => inspector.classList.remove("visible"));
  });
  const legend = $("#legend");
  legend.classList.toggle("has-selection", Boolean(state.activeSection));
  legend.innerHTML = sections.map(s => `<button class="legend-item" type="button" data-section="${s}" aria-pressed="${state.activeSection === s}"><i style="background:${color[s]}"></i>${s}</button>`).join("");
  legend.querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
    state.activeSection = state.activeSection === button.dataset.section ? null : button.dataset.section;
    renderTreemap();
  }));
  const clearFilter = $("#clear-filter"), filterInactive = !state.activeSection;
  clearFilter.classList.toggle("is-hidden", filterInactive);
  clearFilter.disabled = filterInactive;
  clearFilter.setAttribute("aria-hidden", String(filterInactive));
  $("#total").textContent = formatMoney(countryTotal);
}

function renderGuesses() {
  $("#guess-count").textContent = `${state.guesses.length} of 5 guesses`;
  $("#guess-rows").innerHTML = Array.from({length: 5}, (_, i) => {
    const guess = state.guesses[i];
    if (!guess) return `<div class="guess-row"><span>Guess ${i+1}</span><span>—</span><span>—</span><span>—</span></div>`;
    const correct = guess === state.target;
    const distance = distanceKm(state.locations[guess], state.locations[state.target]);
    const direction = correct ? "✓" : directionTo(state.locations[guess], state.locations[state.target]);
    return `<div class="guess-row filled"><span title="${countryName(guess)}">${flag(guess)} ${countryName(guess)}</span><span>${Math.round(distance).toLocaleString()} km</span><span class="direction ${correct ? "correct" : ""}" title="Direction to the answer">${direction}</span><span class="proximity" title="Geographic closeness based on a 20,000 km maximum distance">${proximity(distance)}%</span></div>`;
  }).join("");
}

async function loadRound() {
  const requestId = ++roundRequest;
  state.guesses = []; state.ended = false; state.products = []; state.activeSection = null;
  $("#result").hidden = true; $("#guess-form").hidden = false;
  $("#treemap").innerHTML = '<div class="loading">Building the export map…</div>';
  const target = state.countries[Math.floor(Math.random() * state.countries.length)];
  state.target = target;
  try {
    const response = await fetch(`data/countries/${countryFilename(target)}`);
    if (!response.ok) throw new Error(`Missing export data for ${countryName(target)}`);
    const rows = parseCSV(await response.text());
    const products = new Map();
    for (const row of rows) {
      const tradeValue = Number(row["Trade Value"]);
      if (!row.HS4 || !row.Section || !Number.isFinite(tradeValue) || tradeValue <= 0) continue;
      const key = row.HS4;
      const current = products.get(key) || { name: key, section: row.Section, value: 0 };
      current.value += tradeValue; products.set(key, current);
    }
    if (!products.size) throw new Error(`No usable export rows for ${countryName(target)}`);
    if (requestId !== roundRequest) return;
    state.products = [...products.values()].sort((a,b) => b.value-a.value);
    renderTreemap(); renderGuesses(); $("#country-input").value = "";
  } catch (error) {
    if (requestId !== roundRequest) return;
    $("#treemap").innerHTML = `<div class="loading">Could not load the dataset: ${error.message}</div>`;
  }
}

function finish(won) {
  state.ended = true; $("#guess-form").hidden = true; $("#result").hidden = false;
  $("#answer").textContent = `${countryName(state.target)} ${won ? "— nice work." : "— tough one."}`;
  $("#result").focus();
}

async function init() {
  const [manifest, locations] = await Promise.all([
    fetch("data/manifest.json").then(r => r.json()),
    fetch("data/countries-meta.json").then(r => r.json())
  ]);
  state.countries = manifest.playable_codes;
  state.countryFilenames = Object.fromEntries(manifest.country_filenames.map(filename => [filename.slice(0, 2), filename]));
  state.locations = Object.fromEntries(locations.map(location => [location.code, location]));
  renderGuesses(); await loadRound();
  $("#guess-form").addEventListener("submit", event => {
    event.preventDefault(); if (state.ended) return;
    const value = $("#country-input").value.trim().toLowerCase();
    const code = state.countries.find(c => countryName(c).toLowerCase() === value || c === value);
    if (!code || state.guesses.includes(code)) { $("#country-input").setCustomValidity(code ? "You already guessed that country." : "Choose a country from the list."); $("#country-input").reportValidity(); return; }
    $("#country-input").setCustomValidity(""); state.guesses.push(code); renderGuesses(); $("#country-input").value = "";
    if (code === state.target) finish(true); else if (state.guesses.length === 5) finish(false);
  });
  $("#country-input").addEventListener("input", event => { event.currentTarget.setCustomValidity(""); renderAutocomplete(event.currentTarget.value); });
  $("#country-input").addEventListener("focus", event => { if (event.currentTarget.value.trim()) renderAutocomplete(event.currentTarget.value); });
  $("#country-input").addEventListener("blur", () => setTimeout(closeAutocomplete, 100));
  $("#country-input").addEventListener("keydown", event => {
    if (event.key === "ArrowDown" && autocompleteMatches.length) { event.preventDefault(); setAutocompleteIndex(autocompleteIndex + 1); }
    else if (event.key === "ArrowUp" && autocompleteMatches.length) { event.preventDefault(); setAutocompleteIndex(autocompleteIndex - 1); }
    else if (event.key === "Escape") closeAutocomplete();
    else if (event.key === "Enter" && autocompleteIndex >= 0) { event.preventDefault(); chooseAutocomplete(autocompleteMatches[autocompleteIndex].code); }
  });
  $("#new-game").addEventListener("click", loadRound); $("#new-game-top").addEventListener("click", loadRound);
  $("#clear-filter").addEventListener("click", () => { state.activeSection = null; renderTreemap(); });
}
init().catch(error => { $("#treemap").innerHTML = `<div class="loading">Could not load the dataset: ${error.message}</div>`; });
