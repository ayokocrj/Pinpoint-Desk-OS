/* Pinpoint Desk OS, concept demo: the engine.
   A line-for-line port of gen_demo_data.py (seed 20261115) to JavaScript, so that every figure on
   screen is computed from the synthetic dataset in the browser and can be checked against the
   generator. Nothing here calls a network. All data is synthetic. */
(function (root) {
'use strict';
var D0 = Date.UTC(2019, 0, 1);

function build(DS) {
  var TODAY = DS.today, maxDay = DS.today + 800;
  var Y = new Int16Array(maxDay + 1), MO = new Int8Array(maxDay + 1), DD = new Int8Array(maxDay + 1);
  for (var d = 0; d <= maxDay; d++) { var t = new Date(D0 + d * 864e5); Y[d] = t.getUTCFullYear(); MO[d] = t.getUTCMonth() + 1; DD[d] = t.getUTCDate(); }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function monthsBetween(a, b) { return (Y[b] - Y[a]) * 12 + (MO[b] - MO[a]) - (DD[b] < DD[a] ? 1 : 0); }
  function iso(d) { return Y[d] + '-' + String(MO[d]).padStart(2, '0') + '-' + String(DD[d]).padStart(2, '0'); }
  function nice(d) { return DD[d] + ' ' + MONTHS[MO[d] - 1] + ' ' + Y[d]; }
  function dayOf(y, m, dd) { return Math.round((Date.UTC(y, m - 1, dd) - D0) / 864e5); }

  var FIRMS = DS.firms, PRACT = DS.practices, OWNERS = DS.owners, CATS = DS.cats;
  var firmCat = FIRMS.map(function (f) { return CATS.indexOf(f.replace(/ \d+$/, '')); });
  var N_LEGAL_PRACT = 8;
  var ADJ_NAMES = {
    'Corporate M&A': ['Private equity'], 'Private equity': ['Corporate M&A', 'Funds'],
    'Banking and finance': ['Restructuring', 'Capital markets'], 'Capital markets': ['Banking and finance'],
    'Funds': ['Private equity', 'Regulatory'], 'Litigation': ['Regulatory'], 'Regulatory': ['Litigation', 'Funds'],
    'Restructuring': ['Banking and finance'],
    'M&A advisory': ['Leveraged finance', 'Private equity investing'],
    'Equity capital markets': ['Debt capital markets'], 'Debt capital markets': ['Equity capital markets', 'Leveraged finance'],
    'Leveraged finance': ['Debt capital markets', 'M&A advisory'], 'Sales': ['Trading'], 'Trading': ['Sales', 'Quant research'],
    'Quant research': ['Trading'], 'Private equity investing': ['M&A advisory']
  };
  var ADJ = PRACT.map(function (p) { return ADJ_NAMES[p].map(function (q) { return PRACT.indexOf(q); }); });
  var DESKS = ['Legal London', 'Legal New York', 'FS London', 'FS New York'];
  function deskOf(track, city) { return track * 2 + city; }

  /* people: [track, city, practice, baseYear, firm, prevFirm, moveDay, relocate, group, regFound, enteredDay] */
  var P = DS.P;
  /* records: [pid, owner, createdDay, [checks], practiceRec, private, consent, openNoteDay, source] */
  var R = DS.R;
  var byPid = new Array(P.length);
  for (var i = 0; i < P.length; i++) byPid[i] = [];
  for (var r = 0; r < R.length; r++) byPid[R[r][0]].push(r);
  var mandates = DS.M.map(function (a) {
    return { mid: a[0], client: a[1], track: a[2], city: a[3], practice: a[4], lo: a[5], hi: a[6], opened: a[7], closed: !!a[8], owner: a[9], placed: a[10], fresh: !!a[11], prefers: a[12], desk: deskOf(a[2], a[3]) };
  });
  var handsOff = new Set(DS.handsOff);
  function cid(rid) { return 'C-' + String(rid + 101).padStart(4, '0'); }
  function ridOf(c) { var m = /^C-?(\d{3,4})$/i.exec(String(c).trim()); if (!m) return -1; var n = +m[1] - 101; return n >= 0 && n < R.length ? n : -1; }

  function trueFirm(p, on) { return (p[6] >= 0 && on < p[6]) ? p[5] : p[4]; }
  function trueYears(p, on) { return Math.max(0, Y[on] - p[3]); }

  /* The record as it read on a given day: what was typed at the last check before that day. */
  function view(rid, on) {
    var rec = R[rid], checks = rec[3], last = -1;
    for (var k = 0; k < checks.length; k++) { if (checks[k] <= on) last = checks[k]; else break; }
    if (last < 0) return null;
    var p = P[rec[0]];
    return { rid: rid, pid: rec[0], last: last, firm: trueFirm(p, last), years: trueYears(p, last), practice: rec[4], city: p[1],
             open: rec[7] >= 0 && rec[7] <= on, months: monthsBetween(last, on) };
  }

  function practiceScore(pr, m) { return pr === m.practice ? 1.0 : (ADJ[m.practice].indexOf(pr) >= 0 ? 0.6 : 0.0); }
  function levelScore(years, m) { return (m.lo <= years && years <= m.hi) ? 1.0 : ((m.lo - 1 <= years && years <= m.hi + 1) ? 0.5 : 0.0); }
  /* Weights: practice 3.0, level 2.5, location 1.5, noted openness 1.2, recency 0.8 x exp(-months/18), firm preference 0.5. */
  function layerScore(practice, years, city, relocate, open, months, firm, m) {
    var ps = practiceScore(practice, m), ls = levelScore(years, m);
    if (ps === 0 || ls === 0) return 0.0;
    var cs = city === m.city ? 1.0 : (relocate ? 0.3 : 0.0);
    if (cs === 0) return 0.0;
    var recency = Math.exp(-months / 18.0);
    var pref = m.prefers.indexOf(firmCat[firm]) >= 0 ? 1.0 : 0.0;
    return 3.0 * ps + 2.5 * ls + 1.5 * cs + 1.2 * (open ? 1.0 : 0.0) + 0.8 * recency + 0.5 * pref;
  }
  function round2(x) { return Number(x.toFixed(2)); }

  /* Method 1. What a keyword search does today: exact practice, city, typed level in range, newest first. */
  function rankCurrentSearch(m, on) {
    var out = [];
    for (var rid = 0; rid < R.length; rid++) {
      var v = view(rid, on);
      if (v && v.practice === m.practice && v.city === m.city && m.lo <= v.years && v.years <= m.hi) out.push(v);
    }
    out.sort(function (a, b) { return b.last - a.last; });
    return out;
  }
  /* Method 2. The ranking applied to the record as it is: duplicates kept, level as typed at the last check. */
  function rankRaw(m, on) {
    var out = [];
    for (var rid = 0; rid < R.length; rid++) {
      var v = view(rid, on);
      if (!v) continue;
      var p = P[v.pid];
      var s = layerScore(v.practice, v.years, v.city, !!p[7], v.open, v.months, v.firm, m);
      if (s > 0) { v.s = s; out.push(v); }
    }
    out.sort(function (a, b) { return (b.s - a.s) || (b.last - a.last); });
    return out;
  }
  /* Method 3. The ranking applied to the clean, dated record: one line per person, level computed from the
     admission or start year, current firm checked on a register when the person is listed, desk rules applied.
     opts.viewerDesk: when set, a record private to another desk is counted and never returned. */
  function rankClean(m, on, ho, opts) {
    opts = opts || {};
    var out = [], blocked = [], hidden = 0, family = 0;
    for (var pid = 0; pid < P.length; pid++) {
      var recs = byPid[pid], views = [], fresh = null, open = false, noteDay = -1;
      for (var k = 0; k < recs.length; k++) { var v = view(recs[k], on); if (v) { views.push(v); if (!fresh || v.last > fresh.last) fresh = v; if (v.open) { open = true; if (R[recs[k]][7] > noteDay) noteDay = R[recs[k]][7]; } } }
      if (!views.length) continue;
      var p = P[pid];
      var years = trueYears(p, on);
      var firm = p[9] ? trueFirm(p, on) : fresh.firm;
      var practice = fresh.practice;
      var s = layerScore(practice, years, fresh.city, !!p[7], open, fresh.months, firm, m);
      if (s <= 0) continue;
      var item = { pid: pid, rid: fresh.rid, cid: cid(fresh.rid), score: round2(s), years: years, firm: firm, practice: practice, city: fresh.city,
                   months: fresh.months, open: open, noteDay: noteDay, noteAge: noteDay >= 0 ? monthsBetween(noteDay, on) : null, firmChanged: firm !== fresh.firm, n: views.length, reg: !!p[9], baseYear: p[3], relocating: fresh.city !== m.city, consent: R[fresh.rid][6] === 1 };
      /* access rule: a record private to another desk is counted, never returned */
      var priv = opts.viewerDesk != null && R[fresh.rid][5] === 1 && deskOf(p[0], p[1]) !== opts.viewerDesk;
      if (firm === m.client) { item.reason = 'works at the client'; item.priv = priv; blocked.push(item); }
      else if (ho && ho.has(firm)) { item.reason = 'works at a firm under a hands-off agreement'; item.priv = priv; blocked.push(item); }
      else if (priv) hidden++;
      else out.push(item);
    }
    var cmp = function (a, b) { return (b.score - a.score) || (a.months - b.months); };
    out.sort(cmp); blocked.sort(cmp);
    return opts.full ? { ranked: out, blocked: blocked, hidden: hidden } : out;
  }
  function position(list, pid) { for (var k = 0; k < list.length; k++) if (list[k].pid === pid) return k + 1; return null; }

  /* ---------------------------------------------------------------- back-test on closed mandates */
  function backtestRow(m) {
    var row = { mid: m.mid, fresh: m.fresh, m: m };
    if (!m.fresh) {
      row.current = position(rankCurrentSearch(m, m.opened), m.placed);
      row.raw = position(rankRaw(m, m.opened), m.placed);
      var clean = rankClean(m, m.opened, handsOff);
      row.clean = position(clean, m.placed);
      var a = 0, b = 0, sa = 0, sb = 0;
      for (var k = 0; k < clean.length; k++) { var g = P[clean[k].pid][8]; if (g === 0) { a++; if (k < 25) sa++; } else { b++; if (k < 25) sb++; } }
      row.sel = [sa, a, sb, b];
    }
    return row;
  }
  function closedMandates() { return mandates.filter(function (m) { return m.closed && m.placed >= 0; }); }
  function summarise(rows) {
    var testable = rows.filter(function (r) { return !r.fresh; });
    function hits(key, k) { return testable.filter(function (r) { return r[key] != null && r[key] <= k; }).length; }
    function nf(key) { return testable.filter(function (r) { return r[key] == null; }).length; }
    var sel = [0, 0, 0, 0];
    testable.forEach(function (r) { for (var k = 0; k < 4; k++) sel[k] += r.sel[k]; });
    var ra = sel[0] / sel[1], rb = sel[2] / sel[3];
    return { closed: rows.length, outside: rows.length - testable.length, testable: testable.length,
      current: { top10: hits('current', 10), top25: hits('current', 25), notFound: nf('current') },
      raw: { top10: hits('raw', 10), top25: hits('raw', 25), notFound: nf('raw') },
      clean: { top10: hits('clean', 10), top25: hits('clean', 25), notFound: nf('clean') },
      rateA: ra, rateB: rb, ratio: Math.min(ra, rb) / Math.max(ra, rb) };
  }
  function backtest() { var rows = closedMandates().map(backtestRow); return { rows: rows, summary: summarise(rows) }; }

  /* Why a method found or missed the person placed: read from the record as it stood on the opening date. */
  function explainRow(row) {
    var m = row.m, p = P[m.placed], on = m.opened, out = [];
    if (row.fresh) { out.push('The person placed entered the database on ' + nice(p[10]) + ', after the mandate opened on ' + nice(on) + ': no search of the record could have found them. Counted apart.'); return out; }
    var recs = byPid[m.placed], vs = [];
    recs.forEach(function (rid) { var v = view(rid, on); if (v) vs.push(v); });
    var years = trueYears(p, on);
    vs.forEach(function (v) {
      var bits = [];
      if (v.practice !== m.practice) bits.push('filed under ' + PRACT[v.practice] + ', a neighbouring practice');
      if (!(m.lo <= v.years && v.years <= m.hi)) bits.push('level typed as ' + v.years + ' at the last contact, ' + v.months + ' months before; ' + years + ' on the day, counted from ' + p[3]);
      if (v.city !== m.city) bits.push('based in ' + (v.city ? 'New York' : 'London') + ', noted as open to relocating');
      if (v.firm !== trueFirm(p, on)) bits.push('firm on record out of date (' + FIRMS[v.firm] + ', since moved)');
      out.push(cid(v.rid) + ': last checked ' + v.months + ' months before the mandate' + (bits.length ? '; ' + bits.join('; ') : '; practice, level and city as typed all matched') + '.');
    });
    if (vs.length > 1) out.push('Two records for one person: the clean record reads them as one.');
    out.push("Today's search: " + (row.current ? 'position ' + row.current : 'not returned') + '. Same ranking on the record as it is: ' + (row.raw ? 'position ' + row.raw : 'not returned') + '. On the clean, dated record: ' + (row.clean ? 'position ' + row.clean : 'not returned') + '.');
    return out;
  }

  /* ---------------------------------------------------------------- record hygiene */
  function hygiene() {
    var stale = 0, firmWrong = 0, noConsent = 0, priv = 0, buckets = [0, 0, 0, 0, 0];
    for (var rid = 0; rid < R.length; rid++) {
      var rec = R[rid], p = P[rec[0]], last = rec[3][rec[3].length - 1], ms = monthsBetween(last, TODAY);
      if (ms >= 24) stale++;
      if (trueFirm(p, last) !== p[4]) firmWrong++;
      if (!rec[6]) noConsent++;
      if (rec[5]) priv++;
      buckets[ms < 6 ? 0 : ms < 12 ? 1 : ms < 24 ? 2 : ms < 36 ? 3 : 4]++;
    }
    var dupPids = [];
    for (var pid = 0; pid < P.length; pid++) if (byPid[pid].length > 1) dupPids.push(pid);
    return { records: R.length, people: P.length, duplicatePairs: dupPids.length, stale: stale, stalePct: Math.round(100 * stale / R.length),
      firmWrong: firmWrong, firmWrongPct: Math.round(100 * firmWrong / R.length), noConsent: noConsent, deskPrivate: priv, buckets: buckets, dupPids: dupPids };
  }
  function dupPair(pid) {
    var recs = byPid[pid].slice().sort(function (a, b) { return R[a][2] - R[b][2]; });
    var a = recs[0], b = recs[1], p = P[pid];
    return { pid: pid, keep: cid(b), merge: cid(a), ridKeep: b, ridMerge: a,
      deskA: DESKS[deskOf(p[0], p[1])], ownerA: OWNERS[R[a][1]], ownerB: OWNERS[R[b][1]],
      olderFirm: FIRMS[trueFirm(p, R[a][3][R[a][3].length - 1])], newerFirm: FIRMS[trueFirm(p, R[b][3][R[b][3].length - 1])],
      olderLast: R[a][3][R[a][3].length - 1], newerCreated: R[b][2], moved: p[6], baseYear: p[3], practice: PRACT[p[2]], track: p[0] };
  }
  /* One record that shows why the year is stored and never the level. */
  function yearNotLevel(ownerIdx) {
    var best = null;
    for (var rid = 0; rid < R.length; rid++) {
      var rec = R[rid]; if (rec[1] !== ownerIdx) continue;
      var p = P[rec[0]]; if (p[0] !== 0 || byPid[rec[0]].length > 1) continue;
      var last = rec[3][rec[3].length - 1], typed = trueYears(p, last), now = trueYears(p, TODAY);
      if (typed === 3 && now === 6 && p[2] === 0 && rec[4] === 0) { best = { cid: cid(rid), typed: typed, now: now, baseYear: p[3], last: last, months: monthsBetween(last, TODAY), practice: PRACT[rec[4]] }; break; }
    }
    return best;
  }

  /* ---------------------------------------------------------------- one mandate, as the recruiter sees it */
  function longlist(m, on, opts) {
    opts = opts || {};
    var res = rankClean(m, on, handsOff, { full: true, viewerDesk: opts.viewerDesk });
    var family = 0;
    for (var pid = 0; pid < P.length; pid++) { var p = P[pid]; if (p[2] === m.practice || ADJ[m.practice].indexOf(p[2]) >= 0) family++; }
    var top = res.ranked.slice(0, opts.n || 10);
    var cut = top.length ? top[top.length - 1].score : 0;
    var strong = res.blocked.filter(function (b) { return b.score >= cut && !b.priv; });
    return { m: m, records: R.length, people: P.length, family: family, pass: res.ranked.length + res.blocked.length + res.hidden, blockedTotal: res.blocked.length,
      allowed: res.ranked.length, hidden: res.hidden, top: top, next: res.ranked.slice(top.length, 25), strong: strong, blocked: res.blocked.filter(function (b) { return !b.priv; }), ranked: res.ranked,
      regConfirmed: top.filter(function (x) { return x.reg; }).length, over12: top.filter(function (x) { return x.months >= 12; }).length,
      oldest: top.reduce(function (a, x) { return Math.max(a, x.months); }, 0), merged: top.filter(function (x) { return x.n > 1; }).length,
      stale: top.filter(function (x) { return x.months >= 24; }).length, firmChanged: top.filter(function (x) { return x.firmChanged; }).length };
  }
  function why(x, m) {
    var legal = P[x.pid][0] === 0;
    return [PRACT[x.practice] + (x.practice === m.practice ? '' : ' (neighbouring practice)'),
      x.years + (legal ? ' years since admission (' : ' years in the industry (start ') + x.baseYear + ')',
      FIRMS[x.firm] + ', ' + (x.city ? 'New York' : 'London') + (x.relocating ? ' (noted as open to relocating)' : ''),
      x.open ? 'note: open to a move' : 'no note on motivation',
      'last checked ' + x.months + ' month' + (x.months === 1 ? '' : 's') + ' ago'];
  }

  /* ---------------------------------------------------------------- the morning brief of one recruiter */
  function brief(ownerIdx, heroMid) {
    var myOpen = mandates.filter(function (m) { return !m.closed && m.owner === ownerIdx; });
    var lists = myOpen.map(function (m) { return rankClean(m, TODAY, handsOff).slice(0, 25); });
    var onLists = new Set(), pidsOnLists = new Set(), toFix = new Set();
    lists.forEach(function (l) { l.forEach(function (x) { onLists.add(x.cid); pidsOnLists.add(x.pid); if (x.months >= 24) toFix.add(x.pid); }); });
    var f = [];
    for (var rid = 0; rid < R.length; rid++) {
      var rec = R[rid]; if (rec[1] !== ownerIdx) continue;
      var p = P[rec[0]], last = rec[3][rec[3].length - 1], ms = monthsBetween(last, TODAY);
      if (rec[7] >= 0 && ms >= 3 && ms <= 9) f.push({ cid: cid(rid), rid: rid, kind: 'open', months: ms, noteDay: rec[7], noteAge: monthsBetween(rec[7], TODAY) });
      else if (p[6] >= 0 && trueFirm(p, last) !== p[4] && (TODAY - p[6]) <= 120) f.push({ cid: cid(rid), rid: rid, kind: 'moved', moveDay: p[6], from: FIRMS[p[5]], to: FIRMS[p[4]], toIdx: p[4], months: ms });
    }
    var due = f.length;
    f.forEach(function (x) { x.onList = onLists.has(x.cid); });
    f.sort(function (a, b) { return ((a.onList ? 0 : 1) - (b.onList ? 0 : 1)) || ((a.kind === 'moved' ? 0 : 1) - (b.kind === 'moved' ? 0 : 1)) || (a.cid < b.cid ? -1 : a.cid > b.cid ? 1 : 0); });
    var without = myOpen.filter(function (m) { return (TODAY - m.opened) >= 5; }).slice(0, 4).map(function (m) { return m.mid; });
    if (without.indexOf(heroMid) < 0) without.push(heroMid);
    without.sort();
    var dupRev = [];
    for (var pid = 0; pid < P.length; pid++) {
      if (byPid[pid].length < 2 || !pidsOnLists.has(pid)) continue;
      if (byPid[pid].some(function (r2) { return R[r2][1] === ownerIdx; })) dupRev.push(pid);
    }
    return { today: f.slice(0, 9), later: f.slice(9), due: due, myOpen: myOpen, without: without, toFix: toFix.size, dupReview: dupRev, sent: 0 };
  }

  /* ---------------------------------------------------------------- questions across desks, under the access rule */
  function countAcross(track, city, practiceIdxs, viewerDesk) {
    var desk = deskOf(track, city), exist = 0, visible = 0;
    for (var rid = 0; rid < R.length; rid++) {
      var rec = R[rid], p = P[rec[0]];
      if (deskOf(p[0], p[1]) !== desk || practiceIdxs.indexOf(rec[4]) < 0) continue;
      exist++;
      if (!rec[5] || desk === viewerDesk) visible++;
    }
    return { exist: exist, visible: visible, hidden: exist - visible };
  }
  /* Forty probe queries: every practice on every desk that is not the viewer's. A leak is a private record returned. */
  function probes(viewerDesk) {
    var n = 0, leaks = 0, hiddenTotal = 0, list = [];
    for (var desk = 0; desk < 4 && n < 40; desk++) {
      if (desk === viewerDesk) continue;
      var track = desk >> 1, city = desk & 1;
      for (var k = 0; k < 16 && n < 40; k++) {
        var pr = (track === 0 ? k % 8 : 8 + (k % 8)), pair = k >= 8 ? [pr, ADJ[pr][0]] : [pr];
        var returned = searchVisible(track, city, pair, viewerDesk);
        var leak = returned.filter(function (rid) { return R[rid][5] && deskOf(P[R[rid][0]][0], P[R[rid][0]][1]) !== viewerDesk; }).length;
        var c = countAcross(track, city, pair, viewerDesk);
        leaks += leak; hiddenTotal += c.hidden; n++;
        list.push({ desk: DESKS[desk], practices: pair.map(function (x) { return PRACT[x]; }).join(' or '), exist: c.exist, returned: returned.length, hidden: c.hidden, leak: leak });
      }
    }
    return { n: n, leaks: leaks, hidden: hiddenTotal, list: list };
  }
  function searchVisible(track, city, practiceIdxs, viewerDesk) {
    var desk = deskOf(track, city), out = [];
    for (var rid = 0; rid < R.length; rid++) {
      var rec = R[rid], p = P[rec[0]];
      if (deskOf(p[0], p[1]) !== desk || practiceIdxs.indexOf(rec[4]) < 0) continue;
      if (rec[5] && desk !== viewerDesk) continue;
      out.push(rid);
    }
    return out;
  }

  /* Where one person stands for one mandate, and why. Used to answer "why is C-xxxx not on the list?". */
  function explainPerson(rid, m, on, viewerDesk, n) {
    var pid = R[rid][0], p = P[pid], res = rankClean(m, on, handsOff, { full: true, viewerDesk: viewerDesk });
    var recs = byPid[pid], fresh = null, open = false;
    recs.forEach(function (x) { var v = view(x, on); if (v) { if (!fresh || v.last > fresh.last) fresh = v; if (v.open) open = true; } });
    if (!fresh) return { status: 'norecord' };
    if (viewerDesk != null && R[fresh.rid][5] === 1 && deskOf(p[0], p[1]) !== viewerDesk) return { status: 'hidden', desk: DESKS[deskOf(p[0], p[1])] };
    var pos = position(res.ranked, pid);
    if (pos) return { status: pos <= (n || 10) ? 'proposed' : 'ranked', pos: pos, of: res.ranked.length, item: res.ranked[pos - 1], cut: res.ranked[Math.min(n || 10, res.ranked.length) - 1].score };
    var b = res.blocked.filter(function (x) { return x.pid === pid; })[0];
    if (b) { var above = res.ranked.filter(function (x) { return x.score > b.score; }).length; return { status: 'blocked', item: b, wouldRank: above + 1 }; }
    var years = trueYears(p, on), fails = [];
    if (practiceScore(fresh.practice, m) === 0) fails.push('practice: filed under ' + PRACT[fresh.practice] + ', outside ' + PRACT[m.practice] + ' and its neighbours');
    if (levelScore(years, m) === 0) fails.push('level: ' + years + ' years counted from ' + p[3] + ', outside ' + m.lo + ' to ' + m.hi + ' by more than a year');
    if (fresh.city !== m.city && !p[7]) fails.push('location: based in ' + (fresh.city ? 'New York' : 'London') + ', with no note on relocating');
    return { status: 'nofit', fails: fails, years: years, practice: PRACT[fresh.practice] };
  }

  /* One record, as dated facts. Returns null when the viewer may not see it. */
  function recordFacts(rid, viewerDesk) {
    var rec = R[rid], p = P[rec[0]], desk = deskOf(p[0], p[1]);
    if (rec[5] && desk !== viewerDesk) return { hiddenDesk: DESKS[desk] };
    var last = rec[3][rec[3].length - 1];
    return { cid: cid(rid), pid: rec[0], desk: DESKS[desk], owner: OWNERS[rec[1]], created: rec[2], checks: rec[3], last: last, months: monthsBetween(last, TODAY),
      practice: PRACT[rec[4]], truePractice: PRACT[p[2]], city: p[1] ? 'New York' : 'London', priv: !!rec[5], consent: !!rec[6], noteDay: rec[7], source: DS.sources[rec[8]],
      firmOnRecord: FIRMS[trueFirm(p, last)], firmNow: FIRMS[p[4]], reg: !!p[9], baseYear: p[3], typedYears: trueYears(p, last), years: trueYears(p, TODAY), legal: p[0] === 0,
      moved: p[6], dup: byPid[rec[0]].length > 1 ? byPid[rec[0]].map(cid) : null, relocate: !!p[7],
      noteOther: (function () { var o = null; byPid[rec[0]].forEach(function (x) { if (x !== rid && R[x][7] >= 0) o = { cid: cid(x), day: R[x][7] }; }); return o; })() };
  }

  return { DS: DS, TODAY: TODAY, P: P, R: R, byPid: byPid, mandates: mandates, handsOff: handsOff, FIRMS: FIRMS, PRACT: PRACT, OWNERS: OWNERS, CATS: CATS, DESKS: DESKS, ADJ: ADJ, firmCat: firmCat,
    N_LEGAL_PRACT: N_LEGAL_PRACT, iso: iso, nice: nice, dayOf: dayOf, monthsBetween: monthsBetween, deskOf: deskOf, cid: cid, ridOf: ridOf, trueFirm: trueFirm, trueYears: trueYears, view: view,
    layerScore: layerScore, rankCurrentSearch: rankCurrentSearch, rankRaw: rankRaw, rankClean: rankClean, position: position,
    backtest: backtest, backtestRow: backtestRow, closedMandates: closedMandates, summarise: summarise, explainRow: explainRow,
    hygiene: hygiene, dupPair: dupPair, yearNotLevel: yearNotLevel, longlist: longlist, why: why, brief: brief,
    explainPerson: explainPerson, practiceScore: practiceScore, levelScore: levelScore, countAcross: countAcross, probes: probes, searchVisible: searchVisible, recordFacts: recordFacts, year: function (d) { return Y[d]; } };
}

var api = { build: build };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PPEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);

