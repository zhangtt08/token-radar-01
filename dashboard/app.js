// Token Radar dashboard: no network, every byte it shows is in data.js (window.RADAR).
// Board: sortable, filterable, with a detail view per protocol. Live: the market's own values.
// Model: the formula and the category multiples, so the ranking can be checked.
(function () {
  'use strict';
  var R = window.RADAR;
  if (!R) { document.body.innerHTML = '<p style="padding:40px">No data. Run main.ts first.</p>'; return; }
  var $ = function (id) { return document.getElementById(id); };
  var rows = R.rows, live = R.live;
  var fmtUsd = function (n) {
    if (n === null || n === undefined) return '—';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
    return '$' + Math.round(n);
  };
  var fmtPct = function (n) {
    if (n === null || n === undefined) return '—';
    return (n > 0 ? '+' : '') + n.toFixed(1) + '%';
  };
  var fmtAge = function (d) { return d === null || d === undefined ? '—' : d + 'd'; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var params = new URLSearchParams(location.search);

  // ---- meta ----
  var meta = $('meta');
  var totalImplied = rows.reduce(function (a, r) { return a + r.implied_value_usd; }, 0);
  meta.innerHTML =
    '<div><dt>Snapshot</dt><dd>' + esc(R.as_of) + '</dd></div>' +
    '<div><dt>Board</dt><dd>' + rows.length + ' rows</dd></div>' +
    '<div><dt>Watchlist</dt><dd>' + R.watchlist_size + '</dd></div>' +
    '<div><dt>Live tokens</dt><dd>' + R.live_size + '</dd></div>' +
    '<div><dt>Model</dt><dd>' + esc(R.model_version) + '</dd></div>' +
    '<div><dt>Total implied</dt><dd>' + fmtUsd(totalImplied) + '</dd></div>';
  $('src').textContent = R.source + ' · as of ' + R.as_of;

  // ---- dropdowns ----
  var cats = {}, chains = {};
  rows.forEach(function (r) { if (r.category) cats[r.category] = 1; r.chains.forEach(function (c) { chains[c] = 1; }); });
  Object.keys(cats).sort().forEach(function (c) { $('cat').appendChild(new Option(c, c)); });
  Object.keys(chains).sort().forEach(function (c) { $('chain').appendChild(new Option(c, c)); });

  // ---- board state ----
  var state = { q: params.get('q') || '', cat: params.get('cat') || '', chain: params.get('chain') || '', watch: params.get('watch') === '1', sort: 'rank', dir: 1 };
  $('q').value = state.q; $('cat').value = state.cat; $('chain').value = state.chain; $('watch').checked = state.watch;
  var watchSet = new Set(R.watchlist || []);
  var bySlug = {};
  rows.forEach(function (r) { bySlug[r.slug] = r; });

  function isWatch(r) { return watchSet.has(r.slug); }
  function filtered2() {
    var q = state.q.trim().toLowerCase();
    return rows.filter(function (r) {
      if (state.watch && !isWatch(r)) return false;
      if (state.cat && r.category !== state.cat) return false;
      if (state.chain && r.chains.indexOf(state.chain) < 0) return false;
      if (q && (r.name.toLowerCase().indexOf(q) < 0 && r.slug.toLowerCase().indexOf(q) < 0)) return false;
      return true;
    });
  }
  function sortKey(r, k) {
    if (k === 'name') return r.name.toLowerCase();
    if (k === 'category') return (r.category || '').toLowerCase();
    if (k === 'chains') return (r.chains[0] || '').toLowerCase();
    if (k === 'change_7d') return r.change_7d === null ? -1e9 : r.change_7d;
    if (k === 'age_days') return r.age_days === null ? -1 : r.age_days;
    return r[k];
  }
  function render() {
    var list = filtered2().slice();
    var k = state.sort;
    list.sort(function (a, b) {
      var x = sortKey(a, k), y = sortKey(b, k);
      if (x < y) return -1 * state.dir;
      if (x > y) return 1 * state.dir;
      return a.rank - b.rank;
    });
    var tb = $('rows');
    tb.innerHTML = '';
    list.forEach(function (r) {
      var tr = document.createElement('tr');
      tr.dataset.slug = r.slug;
      var chg = r.change_7d, cls = chg === null ? 'flat' : (chg > 0 ? 'up' : (chg < 0 ? 'down' : 'flat'));
      tr.innerHTML =
        '<td class="num rank">' + r.rank + '</td>' +
        '<td><span class="name">' + esc(r.name) + '</span><span class="sub">' + esc(r.slug) + '</span></td>' +
        '<td><span class="pill' + (isWatch(r) ? ' watch' : '') + '">' + esc(r.category || '—') + '</span></td>' +
        '<td>' + esc(r.chains.join(', ') || '—') + '</td>' +
        '<td class="num">' + fmtUsd(r.tvl_usd) + '</td>' +
        '<td class="num ' + cls + '">' + fmtPct(chg) + '</td>' +
        '<td class="num">' + fmtAge(r.age_days) + '</td>' +
        '<td class="num"><b>' + fmtUsd(r.implied_value_usd) + '</b></td>';
      tr.addEventListener('click', function () { showDetail(r.slug); });
      tb.appendChild(tr);
    });
    $('count').textContent = list.length + ' of ' + rows.length + ' shown';
    document.querySelectorAll('#board thead th').forEach(function (th) {
      th.classList.toggle('on', th.dataset.sort === state.sort);
      th.textContent = th.textContent.replace(/ [▲▼]$/, '') + (th.dataset.sort === state.sort ? (state.dir > 0 ? ' ▲' : ' ▼') : '');
    });
  }
  document.querySelectorAll('#board thead th').forEach(function (th) {
    th.addEventListener('click', function () {
      var k = th.dataset.sort;
      if (state.sort === k) state.dir = -state.dir; else { state.sort = k; state.dir = (k === 'name' || k === 'category' || k === 'chains') ? 1 : -1; }
      render();
    });
  });
  $('q').addEventListener('input', function () { state.q = this.value; render(); });
  $('cat').addEventListener('change', function () { state.cat = this.value; render(); });
  $('chain').addEventListener('change', function () { state.chain = this.value; render(); });
  $('watch').addEventListener('change', function () { state.watch = this.checked; render(); });

  // ---- detail ----
  function showDetail(slug) {
    var r = bySlug[slug]; if (!r) return;
    document.querySelectorAll('#rows tr').forEach(function (tr) { tr.classList.toggle('sel', tr.dataset.slug === slug); });
    var base = r.tvl_usd * r.category_multiple;
    var d = $('detail');
    d.hidden = false;
    var steps = (r.farm_steps || []).map(function (s, i) { return '<li><b>Step ' + (i + 1) + '.</b> ' + esc(s) + '</li>'; }).join('');
    d.innerHTML =
      '<h2>' + esc(r.name) + ' <span class="slug">#' + r.rank + ' · ' + esc(r.slug) + '</span></h2>' +
      '<p class="lede">' + esc(r.category || 'Uncategorised') + ' · ' + esc(r.chains.join(', ') || 'no chain listed') + ' · tracked since ' + esc(r.listed_at || 'unknown') + '. ' +
      'Its DefiLlama record carries no token, so the radar treats it as pre-token — a record, not proof it has none.</p>' +
      '<div class="grid">' +
      '<div class="stat"><span>TVL</span><b>' + fmtUsd(r.tvl_usd) + '</b></div>' +
      '<div class="stat"><span>7-day change</span><b>' + fmtPct(r.change_7d) + '</b></div>' +
      '<div class="stat"><span>Age, no token</span><b>' + fmtAge(r.age_days) + '</b></div>' +
      '<div class="stat"><span>Category multiple</span><b>' + r.category_multiple.toFixed(3) + '×</b></div>' +
      '<div class="stat"><span>Implied value</span><b>' + fmtUsd(r.implied_value_usd) + '</b></div>' +
      '</div>' +
      '<div class="formula">implied = TVL × multiple × growth × maturity = ' + fmtUsd(r.tvl_usd) + ' × ' + r.category_multiple.toFixed(3) + ' × ' + r.growth_multiplier.toFixed(3) + ' × ' + r.maturity_multiplier.toFixed(3) + ' = ' + fmtUsd(r.implied_value_usd) + '</div>' +
      '<h3>Farm plan — ' + (r.farm_steps || []).length + ' steps</h3><ol>' + steps + '</ol>';
    d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    try { history.replaceState(null, '', location.pathname + location.search + '#detail=' + encodeURIComponent(slug)); } catch (e) {}
  }

  // ---- live ----
  var lt = $('liverows');
  live.forEach(function (p, i) {
    var tr = document.createElement('tr');
    var chg = p.change_7d, cls = chg === null ? 'flat' : (chg > 0 ? 'up' : (chg < 0 ? 'down' : 'flat'));
    tr.innerHTML = '<td class="num rank">' + (i + 1) + '</td><td><span class="name">' + esc(p.name) + '</span><span class="sub">' + esc(p.slug) + '</span></td>' +
      '<td><span class="pill">' + esc(p.category || '—') + '</span></td><td>' + esc(p.chains.join(', ') || '—') + '</td>' +
      '<td class="num">' + fmtUsd(p.tvl_usd) + '</td><td class="num"><b>' + fmtUsd(p.mcap_usd) + '</b></td>' +
      '<td class="num ' + cls + '">' + fmtPct(chg) + '</td>';
    lt.appendChild(tr);
  });

  // ---- model ----
  var mg = $('modelgrid');
  var multRows = (R.multiples || []).map(function (m) {
    return '<tr><td>' + esc(m.category) + '</td><td class="num">' + m.live_count + '</td><td class="num">' + (m.median_ratio === null ? '—' : m.median_ratio.toFixed(3) + '×') + '</td><td class="num"><b>' + m.multiple.toFixed(3) + '×</b></td></tr>';
  }).join('');
  mg.innerHTML =
    '<div class="card"><h2>How the value is priced</h2>' +
    '<p>Each protocol is priced the way a market prices a token: by comparables. The multiple for a category is the median market-cap-to-TVL ratio of that category\u2019s protocols whose token already trades, shrunk toward the global median (' + R.global_multiple.toFixed(3) + '×) when the category has few live names, and clamped to [0.05, 1.5]. A single live name\u2019s ratio is capped at 3× before the median, so one speculative token cannot set its category.</p>' +
    '<p><code>implied = TVL × multiple(category) × growth × maturity</code></p>' +
    '<p><code>growth = 1 + clamp(change_7d, −60, 120)% × 0.5</code></p>' +
    '<p><code>maturity = 0.5 + min(age_days, 1095) / 1095 × 0.5</code> (age unknown: 365 days)</p>' +
    '<p>No protocol name is ever special-cased. The same function scores every row, and the table beside this card shows every multiple it used.</p></div>' +
    '<div class="card"><h2>Category multiples</h2><div class="tablewrap"><table><thead><tr><th>Category</th><th class="num">Live names</th><th class="num">Median mcap/TVL</th><th class="num">Multiple used</th></tr></thead><tbody>' + multRows + '</tbody></table></div></div>';

  // ---- tabs ----
  function showView(v) {
    ['board', 'live', 'model'].forEach(function (x) { $('view-' + x).hidden = x !== v; });
    document.querySelectorAll('#tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.view === v); });
  }
  document.querySelectorAll('#tabs button').forEach(function (b) { b.addEventListener('click', function () { showView(b.dataset.view); }); });
  var view = params.get('view');
  if (view === 'live' || view === 'model') showView(view);

  render();
  var detailSlug = params.get('detail') || (location.hash.match(/detail=([^&]+)/) || [])[1];
  if (detailSlug) { try { showDetail(decodeURIComponent(detailSlug)); } catch (e) {} }
})();
