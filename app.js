'use strict';
/* 苹果果园数学：出题逻辑（可在 node 里跑自检）＋ 界面 */

/* ================= 数位与出题逻辑 ================= */
const PN = ['个位', '十位', '百位', '千位'];
const PV = [1, 10, 100, 1000];
const UNIT = ['一', '十', '百', '千'];
const TYPE_NAMES = {
  1: '数位',
  2: '数值',
  3: '哪个数字',
  4: '按数位分析',
  5: '按数值分析',
  6: '看图数数'
};

const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function digitsOf(n) { // 下标 0 = 个位
  const len = String(n).length, d = [];
  for (let i = 0; i < len; i++) d.push(Math.floor(n / PV[i]) % 10);
  return d;
}
function joinCn(list) {
  return list.length === 1 ? list[0] : list.slice(0, -1).join('、') + '和 ' + list[list.length - 1];
}
function unitsText(dsHigh) { // 从高位到低位的数字
  return joinCn(dsHigh.map((d, i) => `${d} 个${UNIT[dsHigh.length - 1 - i]}`));
}
function valueTerms(n) { // 数值不为 0 的项，高位在前
  const ds = digitsOf(n), t = [];
  for (let i = ds.length - 1; i >= 0; i--) if (ds[i] !== 0) t.push(ds[i] * PV[i]);
  return t.length ? t : [0];
}
function analysisOf(n) {
  const ds = digitsOf(n);
  let l1;
  if (n === 1000) l1 = '1000 等于 1 个千。';
  else if (n === 0) l1 = '0 等于 0 个一。';
  else l1 = `${n} 等于 ${unitsText(ds.slice().reverse())}。`;
  const l2 = `${n} = ${valueTerms(n).join(' + ')}`;
  return { l1, l2, terms: valueTerms(n) };
}

function genNum(o) {
  o = o || {};
  const minLen = o.minLen || 2, allow1000 = !!o.allow1000;
  const r = Math.random();
  let len;
  if (r < 0.03 && minLen <= 1) len = 1;
  else if (r < 0.30) len = 2;
  else if (r < 0.98 || !allow1000) len = 3;
  else len = 4;
  if (len < minLen) len = minLen;
  if (len === 4) return 1000;
  const nz = () => 1 + rnd(9);
  if (len === 1) return nz();
  const withZero = Math.random() < 0.3;
  if (len === 2) return withZero ? nz() * 10 : nz() * 10 + nz();
  if (withZero) {
    const k = rnd(3);
    if (k === 0) return nz() * 100;
    if (k === 1) return nz() * 100 + nz() * 10;
    return nz() * 100 + nz();
  }
  return nz() * 100 + nz() * 10 + nz();
}

function nonzeroCount(n) { return digitsOf(n).filter(d => d !== 0).length; }
function genNum2(o) { // 至少两个非零数位（不含 300、40、1000）
  let v;
  do { v = genNum(o); } while (nonzeroCount(v) < 2);
  return v;
}

function numHtml(n, hi) {
  const s = String(n);
  const len = s.length;
  return '<span class="numw">' + s.split('').map((c, i) =>
    (len - 1 - i === hi) ? `<span class="hl">${c}</span>` : c).join('') + '</span>';
}

function permutations(a) {
  if (a.length <= 1) return [a.slice()];
  const out = [];
  a.forEach((x, i) => {
    const rest = a.slice(0, i).concat(a.slice(i + 1));
    permutations(rest).forEach(p => out.push([x].concat(p)));
  });
  return out;
}

// 1 数位
function qPlace() {
  const n = genNum({ minLen: 1, allow1000: true });
  const ds = digitsOf(n), p = rnd(ds.length), d = ds[p];
  const opts = PN.slice(0, ds.length === 4 ? 4 : 3);
  return {
    type: 1, n, keepOrder: true,
    stem: `数字 ${numHtml(n, p)} 中，<span class="redw">红色</span>的 <b class="hl">${d}</b> 在什么数位？`,
    options: opts, answer: PN[p],
    explain: d === 0
      ? `0 在${PN[p]}。0 不管在什么数位，数值都是 0。`
      : `${d} 在${PN[p]}，所以数值是 ${d * PV[p]}。`,
    meta: { n, place: p, digit: d }
  };
}
// 2 数值
function qValue() {
  const n = genNum({ minLen: 1, allow1000: true });
  const ds = digitsOf(n), p = rnd(ds.length), d = ds[p];
  const correct = d * PV[p];
  let opts;
  if (d === 0) opts = [0, 10, 100];
  else if (p === 3) opts = shuffle([1, 10, 100]).slice(0, 2).concat([1000]);
  else opts = [d, d * 10, d * 100];
  opts = shuffle(opts.map(String));
  return {
    type: 2, n,
    stem: `数字 ${n} 中，${PN[p]}上的 <b class="hl">${d}</b>，数值是多少？`,
    options: opts, answer: String(correct),
    explain: d === 0
      ? `0 不管在什么数位，数值都是 0。`
      : `${d} 在${PN[p]}，所以数值是 ${correct}。`,
    meta: { n, place: p, digit: d }
  };
}
// 3 哪个数字
function qDigit() {
  const n = genNum({ minLen: 2, allow1000: true });
  const ds = digitsOf(n), p = rnd(ds.length), d = ds[p];
  const set = [d];
  shuffle(ds).forEach(x => { if (set.length < 3 && !set.includes(x)) set.push(x); });
  while (set.length < 3) { const x = rnd(10); if (!set.includes(x)) set.push(x); }
  return {
    type: 3, n,
    stem: `数字 ${n} 的${PN[p]}上是哪个数字？`,
    options: shuffle(set.map(String)), answer: String(d),
    explain: d === 0
      ? `${n} 的${PN[p]}是 0。0 要写出来，占住${PN[p]}的位置。`
      : `${n} 的${PN[p]}是 ${d}。`,
    meta: { n, place: p, digit: d }
  };
}
// 4 按数位分析
function qUnits() {
  const n = genNum2({ minLen: 2 });
  const hi = digitsOf(n).slice().reverse();
  const key = hi.join(''), seen = new Set([key]), out = [];
  for (const p of shuffle(permutations(hi))) {
    const k = p.join('');
    if (p[0] !== 0 && !seen.has(k)) { seen.add(k); out.push(p); if (out.length >= 2) break; }
  }
  let g = 0;
  while (out.length < 2 && g++ < 300) {
    const p = hi.slice(); p[rnd(p.length)] = rnd(10);
    const k = p.join('');
    if (p[0] !== 0 && !seen.has(k)) { seen.add(k); out.push(p); }
  }
  const ans = unitsText(hi);
  const names = hi.map((d, i) => `${PN[hi.length - 1 - i]}是 ${d}`).join('，');
  return {
    type: 4, n,
    stem: `${n} 等于？`,
    options: shuffle([ans].concat(out.map(unitsText))), answer: ans,
    explain: `${names}，所以 ${n} 等于 ${ans}。`,
    meta: { n }
  };
}
// 5 按数值分析
function qTerms() {
  const n = genNum2({ minLen: 2 });
  const ds = digitsOf(n), hi = ds.slice().reverse();
  const terms = valueTerms(n), ans = terms.join(' + ');
  const sum = t => t.reduce((a, b) => a + b, 0);
  const pool = [], seen = new Set([ans]);
  const add = t => {
    const s = t.join(' + ');
    if (t.length && sum(t) !== n && !seen.has(s)) { seen.add(s); pool.push(t); }
  };
  const raw = hi.filter(d => d !== 0);
  const rawFirst = raw.length >= 1 ? [raw] : [];
  permutations(hi).forEach(p => {
    const t = [];
    p.forEach((d, i) => { if (d !== 0) t.push(d * PV[hi.length - 1 - i]); });
    add(t);
  });
  const chosen = [];
  rawFirst.forEach(t => { const s = t.join(' + '); if (sum(t) !== n && !seen.has(s)) { seen.add(s); chosen.push(t); } });
  shuffle(pool).forEach(t => { if (chosen.length < 2) chosen.push(t); });
  let g = 0;
  while (chosen.length < 2 && g++ < 300) {
    const p = hi.slice(); p[rnd(p.length)] = rnd(10);
    const t = []; p.forEach((d, i) => { if (d !== 0) t.push(d * PV[p.length - 1 - i]); });
    const s = t.join(' + ');
    if (t.length && sum(t) !== n && !seen.has(s)) { seen.add(s); chosen.push(t); }
  }
  const two = shuffle(chosen).slice(0, 2);
  const hasZero = ds.includes(0);
  return {
    type: 5, n,
    stem: `${n} = ？`,
    options: shuffle([ans].concat(two.map(t => t.join(' + ')))), answer: ans,
    explain: `${n} = ${ans}。` + (hasZero ? '数值是 0 的，不用写出来。' : ''),
    meta: { n }
  };
}
// 6 看图数数
function qPicture() {
  const n = genNum2({ minLen: 2 });
  const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10;
  const ds = [h, t, o];
  const cand = [], seen = new Set([n]);
  permutations(ds).forEach(p => {
    const v = p[0] * 100 + p[1] * 10 + p[2];
    const okLen = String(v).length === String(n).length;
    if (okLen && !seen.has(v)) { seen.add(v); cand.push(v); }
  });
  const picks = shuffle(cand).slice(0, 2);
  [10, -10, 100, -100, 1, -1].forEach(dv => {
    const v = n + dv;
    if (picks.length < 2 && v >= 1 && v <= 999 && !seen.has(v)) { seen.add(v); picks.push(v); }
  });
  const parts = [];
  if (h) parts.push(`${h} 箱是 ${h * 100}`);
  if (t) parts.push(`${t} 篮是 ${t * 10}`);
  if (o) parts.push(`${o} 个是 ${o}`);
  return {
    type: 6, n, visual: { h, t, o },
    stem: '一共有多少个苹果？',
    options: shuffle([n].concat(picks).map(String)), answer: String(n),
    explain: `${parts.join('，')}。一共 ${n} 个苹果。`,
    meta: { n, h, t, o }
  };
}

const MAKE = { 1: qPlace, 2: qValue, 3: qDigit, 4: qUnits, 5: qTerms, 6: qPicture };

function soloSet() {
  const ts = shuffle([1, 2, 3, 4, 5, 6].concat([0, 1, 2, 3].map(() => 1 + rnd(6))));
  return ts.map(t => MAKE[t]());
}
function compSet() {
  return shuffle([1, 2, 3, 4, 5]).map(t => MAKE[t]());
}

/* 出题自检（开发用）：node -e "console.log(require('./app.js').selfCheck(3000))" */
function selfCheck(N) {
  N = N || 3000;
  const report = {};
  const fails = [];
  const unitVal = { '一': 1, '十': 10, '百': 100, '千': 1000 };
  const truth = {
    1: (q, o) => o === PN[q.meta.place],
    2: (q, o) => Number(o) === (Math.floor(q.meta.n / 10 ** q.meta.place) % 10) * PV[q.meta.place],
    3: (q, o) => Number(o) === Math.floor(q.meta.n / 10 ** q.meta.place) % 10,
    4: (q, o) => { let s = 0, m, re = /(\d) 个(一|十|百|千)/g; while ((m = re.exec(o))) s += Number(m[1]) * unitVal[m[2]]; return s === q.meta.n; },
    5: (q, o) => o.split(' + ').reduce((a, b) => a + Number(b), 0) === q.meta.n,
    6: (q, o) => Number(o) === q.meta.h * 100 + q.meta.t * 10 + q.meta.o && q.meta.n === Number(o)
  };
  for (let t = 1; t <= 6; t++) {
    const st = { n: N, oneCorrect: 0, noDup: 0, placeOk: 0, valueOk: 0, zero: 0, two: 0, one000: 0, three: 0, one: 0, badPlaceQ: 0 };
    for (let i = 0; i < N; i++) {
      const q = MAKE[t]();
      const matches = q.options.filter(o => truth[t](q, o)).length;
      if (matches === 1 && q.options.includes(q.answer) && truth[t](q, q.answer)) st.oneCorrect++; else fails.push([t, 'oneCorrect', q.stem, q.options]);
      if (new Set(q.options).size === q.options.length) st.noDup++; else fails.push([t, 'dup', q.stem, q.options]);
      const len = String(q.meta.n).length;
      if (t <= 3) {
        if (q.meta.place >= 0 && q.meta.place < len) st.placeOk++; else { st.badPlaceQ++; fails.push([t, 'place', q.meta]); }
        const dig = Math.floor(q.meta.n / 10 ** q.meta.place) % 10;
        if (t === 2) {
          if (Number(q.answer) === dig * PV[q.meta.place] && dig === q.meta.digit) st.valueOk++; else fails.push([t, 'value', q.meta, q.answer]);
        }
        if (t === 1 && q.options.length < 3) fails.push([t, 'optlen']);
      } else st.placeOk++;
      if (q.options.length !== (t === 1 && len === 4 ? 4 : 3)) fails.push([t, 'optcount', q.options]);
      if (String(q.meta.n).includes('0')) st.zero++;
      if (len === 2) st.two++;
      if (len === 3) st.three++;
      if (len === 1) st.one++;
      if (q.meta.n === 1000) st.one000++;
      if ((t === 4 || t === 5 || t === 6) && len < 2) fails.push([t, 'tooShort', q.meta.n]);
      if ((t === 4 || t === 5 || t === 6) && String(q.meta.n).split('').filter(c => c !== '0').length < 2) fails.push([t, 'oneNonzero', q.meta.n]);
      if (t === 5 && q.answer.split(' + ').length < 2) fails.push([t, 'answerTerms<2', q.answer]);
    }
    report[`${t} ${TYPE_NAMES[t]}`] = st;
  }
  // 竞赛、单人整套：题型覆盖
  let cover = 0;
  for (let i = 0; i < 500; i++) { const s = new Set(soloSet().map(q => q.type)); if (s.size === 6) cover++; }
  report.soloRoundsCoverAll6 = `${cover}/500`;
  let compOk = 0;
  for (let i = 0; i < 500; i++) { const s = compSet(); if (s.length === 5 && new Set(s.map(q => q.type)).size === 5 && s.every(q => q.type <= 5)) compOk++; }
  report.compSetOk = `${compOk}/500`;
  report.failCount = fails.length;
  report.failSamples = fails.slice(0, 5);
  return report;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { selfCheck, MAKE, soloSet, compSet, analysisOf, digitsOf, genNum };
}

/* ================= 界面 ================= */
if (typeof document !== 'undefined') (function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => RM.matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const PREVIEW = /[?&]preview\b/.test(location.search);
  const KIND = ['apple', 'basket', 'crate', 'cart'];
  const COLS = ['ones', 'tens', 'hundreds', 'thousands'];
  const HEAD = [
    ['个位', '1 个苹果'],
    ['十位', '1 篮 = 10 个苹果'],
    ['百位', '1 箱 = 100 个苹果'],
    ['千位', '1 车 = 1000 个苹果']
  ];
  const ZOOM_CAP = [
    '',
    '1 篮 = 10 个苹果',
    '1 箱 = 10 篮 = 100 个苹果',
    '1 车 = 10 箱 = 1000 个苹果'
  ];
  const LS = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 忽略 */ } }
  };

  /* ---------- 声音（合成） ---------- */
  let audioCtx = null, noiseBuffer = null;
  function initAudio() {
    if (!audioCtx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) audioCtx = new AC(); }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function playClap(t) {
    if (!audioCtx.__nb) {
      const size = audioCtx.sampleRate * 2, buf = audioCtx.createBuffer(1, size, audioCtx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
      audioCtx.__nb = buf;
    }
    const s = audioCtx.createBufferSource(); s.buffer = audioCtx.__nb;
    const f = audioCtx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1000; f.Q.value = 1.5;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.6, t + 0.005); g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    s.connect(f); f.connect(g); g.connect(audioCtx.destination); s.start(t); s.stop(t + 0.15);
  }
  function playApplause() {
    try {
      if (!initAudio()) return;
      const now = audioCtx.currentTime;
      for (let i = 0; i < 20; i++) { const off = Math.random() * 1.5; playClap(now + (i < 5 ? off * 0.2 : off)); }
    } catch (e) { /* 忽略 */ }
  }
  function playTone(freq, t, dur, type) {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t); o.stop(t + dur + 0.1);
  }
  function playFail() {
    try {
      if (!initAudio()) return;
      const now = audioCtx.currentTime;
      playTone(300, now, 0.2, 'triangle'); playTone(200, now + 0.2, 0.35, 'triangle');
    } catch (e) { /* 忽略 */ }
  }
  function fireworks() {
    if (typeof confetti !== 'function' || reduced()) return;
    const d = { origin: { y: 0.7 } }, c = 200;
    const f = (r, o) => confetti(Object.assign({}, d, o, { particleCount: Math.floor(c * r) }));
    f(0.25, { spread: 26, startVelocity: 55 }); f(0.2, { spread: 60 }); f(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    f(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 }); f(0.1, { spread: 120, startVelocity: 45 });
  }
  function fireworksAt(el) {
    if (typeof confetti !== 'function' || reduced()) return;
    const r = el.getBoundingClientRect();
    confetti({ particleCount: 70, spread: 70, origin: { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight } });
  }

  /* ---------- 容器（苹果／篮／箱／车）---------- */
  function mkContainer(kind) {
    const el = document.createElement('div');
    el.className = 'ctr ' + kind;
    const img = new Image();
    img.src = `assets/${kind}.webp`; img.alt = ''; img.draggable = false;
    el.appendChild(img);
    if (kind === 'apple') return el;
    const child = { basket: 'apple', crate: 'basket', cart: 'crate' }[kind];
    const inner = document.createElement('div');
    inner.className = 'inner';
    for (let i = 1; i <= 10; i++) {
      const w = document.createElement('div'); w.className = 'mw';
      const m = new Image(); m.src = `assets/${child}.webp`; m.alt = ''; m.draggable = false;
      const num = document.createElement('i'); num.textContent = i;
      w.appendChild(m); w.appendChild(num); inner.appendChild(w);
    }
    el.appendChild(inner);
    return el;
  }

  /* ---------- 学习模式状态 ---------- */
  let n = 219;
  let busy = false;
  const cols = [];
  const split = v => { const d = digitsOf(v); return [d[0] || 0, d[1] || 0, d[2] || 0, d[3] || 0]; };
  const total = c => c[0] + c[1] * 10 + c[2] * 100 + c[3] * 1000;

  function buildOrchard() {
    const box = $('#orchard');
    for (let p = 3; p >= 0; p--) {
      const s = document.createElement('section');
      s.className = 'col c-' + COLS[p]; s.dataset.p = p;
      s.innerHTML = `<div class="chead"><div class="ct"><h2>${HEAD[p][0]}</h2><p>${HEAD[p][1]}</p></div>
        <div class="cctl"><button class="step minus" type="button" aria-label="减少${HEAD[p][0]}">－</button><output class="cnt">0</output><button class="step plus" type="button" aria-label="增加${HEAD[p][0]}">＋</button></div></div>
        <div class="cbody"></div>`;
      box.appendChild(s);
      cols[p] = { el: s, body: $('.cbody', s), cnt: $('.cnt', s), plus: $('.plus', s), minus: $('.minus', s) };
      cols[p].plus.addEventListener('click', () => onStep(p, 1));
      cols[p].minus.addEventListener('click', () => onStep(p, -1));
    }
  }

  function render(c, opts) {
    for (let p = 0; p < 4; p++) {
      const col = cols[p], body = col.body;
      while (body.children.length > c[p]) body.lastElementChild.remove();
      while (body.children.length < c[p]) {
        const it = mkContainer(KIND[p]);
        if (p > 0) {
          it.classList.add('click');
          it.setAttribute('role', 'button'); it.tabIndex = 0;
          it.setAttribute('aria-label', ZOOM_CAP[p]);
          const k = p;
          it.addEventListener('click', e => { e.stopPropagation(); openZoom(k); });
          it.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openZoom(k); } });
        }
        if (!reduced()) it.classList.add('drop');
        body.appendChild(it);
      }
      col.cnt.textContent = c[p];
      col.el.classList.toggle('empty', c[p] === 0);
    }
    cols[3].el.hidden = c[3] === 0;
    $('#orchard').classList.toggle('has-th', c[3] > 0);
  }

  function updateButtons() {
    for (let p = 0; p < 4; p++) {
      cols[p].plus.disabled = busy || n + PV[p] > 1000;
      cols[p].minus.disabled = busy || n < PV[p];
    }
  }

  function renderCards() {
    const box = $('#cards');
    box.innerHTML = '';
    const ds = digitsOf(n);
    for (let p = ds.length - 1; p >= 0; p--) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'dcard c-' + COLS[p]; b.dataset.p = p;
      b.textContent = ds[p];
      b.setAttribute('aria-label', `${PN[p]}的数字 ${ds[p]}`);
      b.addEventListener('click', e => { e.stopPropagation(); explainDigit(p, b); });
      box.appendChild(b);
    }
  }

  function renderAnalysis() {
    const a = analysisOf(n);
    $('#an1').textContent = a.l1;
    const terms = a.terms;
    if (n === 0 || n < 10) {
      $('#an2').textContent = a.l2;
    } else {
      const ds = digitsOf(n); const spans = [];
      for (let i = ds.length - 1; i >= 0; i--) if (ds[i] !== 0) spans.push(`<span class="t-${COLS[i]}">${ds[i] * PV[i]}</span>`);
      $('#an2').innerHTML = `${n} = ` + spans.join(' + ');
    }
    void terms;
  }

  function hideBubble() { const b = $('#bubble'); b.hidden = true; $$('.dcard.on').forEach(x => x.classList.remove('on')); }
  function explainDigit(p, btn) {
    const d = digitsOf(n)[p];
    const b = $('#bubble');
    b.className = 'bubble c-' + COLS[p];
    b.textContent = d === 0
      ? `我是 0，我在${PN[p]}。0 不管在什么数位，数值都是 0，但我要占住${PN[p]}的位置。`
      : `我是 ${d}，我的数位是${PN[p]}，我的数值是 ${d * PV[p]}。`;
    b.hidden = false;
    $$('.dcard.on').forEach(x => x.classList.remove('on'));
    btn.classList.add('on');
    const col = cols[p].el;
    col.classList.remove('flash'); void col.offsetWidth; col.classList.add('flash');
  }
  document.addEventListener('click', e => {
    if (!e.target.closest('.dcard') && !e.target.closest('#bubble')) hideBubble();
  });

  function commit(v) {
    n = v;
    $('#numIn').value = n;
    render(split(n));
    renderCards(); renderAnalysis(); hideBubble(); updateButtons();
  }

  function visualize() {
    if (busy) return;
    const inp = $('#numIn');
    let v = parseInt(inp.value, 10);
    if (isNaN(v) || v < 0) v = 0;
    if (v > 1000) v = 1000;
    commit(v);
  }
  function randomize() {
    if (busy) return;
    commit(1 + rnd(1000));
  }

  /* ----- 动画：装篮（进位）与拆篮（退位）----- */
  const center = r => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  function flyEl(kind, x, y) {
    const f = mkContainer(kind);
    f.classList.add('fly');
    f.style.left = x + 'px'; f.style.top = y + 'px';
    document.body.appendChild(f);
    return f;
  }
  const anim = (el, kf, o) => el.animate(kf, Object.assign({ fill: 'forwards', easing: 'cubic-bezier(.3,.7,.3,1)' }, o)).finished;

  async function pack(c, p) { // c[p] 满 10 个：装进一个容器，送到下一位
    if (reduced()) { c[p] = 0; c[p + 1]++; render(c); return; }
    const body = cols[p].body, items = Array.from(body.children);
    const bc = center(body.getBoundingClientRect());
    const fly = flyEl(KIND[p + 1], bc.x, bc.y);
    fly.style.opacity = 0;
    items.forEach((it, i) => {
      const r = center(it.getBoundingClientRect());
      anim(it, [{ transform: 'none', opacity: 1 }, { transform: `translate(${bc.x - r.x}px,${bc.y - r.y}px) scale(.35)`, opacity: 0 }], { duration: 520, delay: i * 28 });
    });
    await sleep(160);
    await anim(fly, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.6)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1.12)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }], { duration: 520 });
    await sleep(250);
    if (p + 1 === 3) cols[3].el.hidden = false;
    await sleep(30);
    const tb = cols[p + 1].body.getBoundingClientRect();
    const tx = tb.left + tb.width / 2, ty = tb.top + Math.min(tb.height / 2, 90);
    await anim(fly, [{ left: bc.x + 'px', top: bc.y + 'px' }, { left: tx + 'px', top: ty + 'px' }], { duration: 720 });
    fly.remove();
    c[p] = 0; c[p + 1]++;
    render(c);
  }

  async function unpack(c, p) { // 从 p+1 位拆一个到 p 位（c[p] 应为 0）
    if (reduced()) { c[p + 1]--; c[p] += 10; render(c); return; }
    const src = cols[p + 1].body.lastElementChild;
    const sr = src.getBoundingClientRect();
    const s = center(sr);
    const fly = flyEl(KIND[p + 1], s.x, s.y);
    c[p + 1]--;
    render(c);
    await sleep(30);
    const tb = cols[p].body.getBoundingClientRect();
    const tx = tb.left + tb.width / 2, ty = tb.top + Math.min(tb.height / 2, 90);
    await anim(fly, [{ left: s.x + 'px', top: s.y + 'px', transform: 'translate(-50%,-50%) scale(1)' }, { left: tx + 'px', top: ty + 'px', transform: 'translate(-50%,-50%) scale(1.15)' }], { duration: 700 });
    c[p] += 10;
    render(c);
    const its = Array.from(cols[p].body.children);
    its.forEach((it, i) => it.animate([{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 380, delay: i * 30, fill: 'backwards' }));
    await anim(fly, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
    fly.remove();
    await sleep(220);
  }

  async function onStep(p, dir) {
    if (busy) return;
    hideBubble();
    const c = split(n);
    if (dir > 0) {
      if (n + PV[p] > 1000) return;
      busy = true; updateButtons();
      c[p]++;
      render(c);
      for (let q = p; q < 3 && c[q] === 10; q++) { await sleep(reduced() ? 0 : 280); await pack(c, q); }
      busy = false;
      commit(total(c));
    } else {
      if (n < PV[p]) return;
      busy = true; updateButtons();
      let q = p;
      while (c[q] === 0) {
        // 找最近的有东西的高位
        let s = q + 1; while (c[s] === 0) s++;
        // 从 s 逐级拆到 q
        for (let k = s - 1; k >= q; k--) { await unpack(c, k); }
        break;
      }
      const body = cols[p].body, last = body.lastElementChild;
      if (last && !reduced()) {
        await anim(last, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'translateY(-26px) scale(.4)', opacity: 0 }], { duration: 380 });
      }
      c[p]--;
      busy = false;
      commit(total(c));
    }
  }

  /* ----- 放大视图 ----- */
  let zoomTok = 0;
  let zoomOpenFlag = false;
  async function openZoom(p) {
    const z = $('#zoom'), stage = $('#zoomStage'), cap = $('#zoomCap');
    const tok = ++zoomTok;
    stage.innerHTML = '';
    const big = mkContainer(KIND[p]);
    big.classList.add('big');
    stage.appendChild(big);
    cap.textContent = ''; cap.classList.remove('show');
    z.hidden = false; zoomOpenFlag = true;
    const mws = $$('.mw', big);
    if (reduced()) { mws.forEach(m => m.classList.add('lit')); cap.textContent = ZOOM_CAP[p]; cap.classList.add('show'); return; }
    await sleep(350);
    for (let i = 0; i < mws.length; i++) {
      if (tok !== zoomTok) return;
      mws[i].classList.add('lit');
      await sleep(330);
    }
    if (tok !== zoomTok) return;
    cap.textContent = ZOOM_CAP[p]; cap.classList.add('show');
  }
  function closeZoom() { zoomTok++; zoomOpenFlag = false; $('#zoom').hidden = true; }
  $('#zoom').addEventListener('click', closeZoom);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && zoomOpenFlag) closeZoom(); });

  /* ---------- 题目渲染 ---------- */
  function renderVisual(box, v) {
    box.innerHTML = '';
    const mk = (kind, k) => {
      if (!k) return;
      const g = document.createElement('div'); g.className = 'vg vg-' + kind;
      for (let i = 0; i < k; i++) g.appendChild(mkContainer(kind));
      box.appendChild(g);
    };
    mk('crate', v.h); mk('basket', v.t); mk('apple', v.o);
  }

  /* ---------- 单人挑战 ---------- */
  const S = { qs: [], i: 0, score: 0, answered: false };
  function soloStart() {
    initAudio();
    S.qs = soloSet(); S.i = 0; S.score = 0;
    $('#soloStartArea').hidden = true; $('#soloEnd').hidden = true; $('#soloQArea').hidden = false;
    showSoloQ();
  }
  function showSoloQ() {
    const q = S.qs[S.i]; S.answered = false;
    $('#soloNo').textContent = `第 ${S.i + 1} / ${S.qs.length} 题`;
    $('#soloScore').textContent = `答对 ${S.score} 题`;
    $('#soloStem').innerHTML = q.stem;
    const vis = $('#soloVisual');
    if (q.visual) { vis.hidden = false; renderVisual(vis, q.visual); } else { vis.hidden = true; vis.innerHTML = ''; }
    const box = $('#soloOpts'); box.innerHTML = '';
    q.options.forEach(o => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'opt'; b.textContent = o; b.dataset.v = o;
      b.addEventListener('click', () => soloAnswer(b, o));
      box.appendChild(b);
    });
    $('#soloFb').innerHTML = ''; $('#soloFb').className = 'q-fb';
    $('#soloNext').hidden = true;
  }
  function soloAnswer(btn, o) {
    if (S.answered) return;
    S.answered = true;
    const q = S.qs[S.i];
    $$('#soloOpts .opt').forEach(b => { b.disabled = true; if (b.dataset.v === q.answer) b.classList.add('right'); });
    const fb = $('#soloFb');
    if (o === q.answer) {
      S.score++;
      fb.className = 'q-fb ok'; fb.innerHTML = `<b>答对了！</b> ${q.explain}`;
      fireworks(); playApplause();
    } else {
      btn.classList.add('wrong');
      fb.className = 'q-fb bad'; fb.innerHTML = `<b>正确答案是 ${q.answer}。</b> ${q.explain}`;
      playFail();
    }
    $('#soloScore').textContent = `答对 ${S.score} 题`;
    const nx = $('#soloNext');
    nx.textContent = S.i + 1 >= S.qs.length ? '看成绩' : '下一题';
    nx.hidden = false;
  }
  function soloNext() {
    if (!S.answered) return;
    if (S.i + 1 >= S.qs.length) {
      $('#soloQArea').hidden = true; $('#soloEnd').hidden = false;
      $('#soloEndScore').textContent = `答对 ${S.score} / ${S.qs.length} 题`;
      const st = Math.round(S.score / 2);
      $('#soloStars').textContent = '★'.repeat(st) + '☆'.repeat(5 - st);
      if (S.score >= 7) { fireworks(); playApplause(); }
    } else { S.i++; showSoloQ(); }
  }

  /* ---------- 四人竞赛 ---------- */
  const NAMES = ['学生 1', '学生 2', '学生 3', '学生 4'];
  const CC = ['red', 'blue', 'green', 'purple'];
  const COMP_N = 5;
  const C = { qs: [], players: [], started: false, finished: 0 };
  function buildComp() {
    const g = $('#compGrid');
    g.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const el = document.createElement('div');
      el.className = 'pcard pc-' + CC[i];
      el.innerHTML = `<div class="phead"><b>${NAMES[i]}</b><span class="pprog"></span><span class="pscore"></span></div><div class="pbody"><p class="wait">等待开始</p></div>`;
      g.appendChild(el);
    }
  }
  function compStart() {
    initAudio();
    $('#awards').hidden = true;
    C.qs = compSet(); C.started = true; C.finished = 0;
    C.players = [0, 1, 2, 3].map(() => ({ qi: 0, score: 0, done: false, t: 0, lock: false }));
    C.t0 = performance.now();
    for (let i = 0; i < 4; i++) showPQ(i);
  }
  function showPQ(i) {
    const P = C.players[i], card = $$('.pcard')[i], q = C.qs[P.qi];
    P.lock = false;
    card.classList.remove('shake', 'done', 'okflash');
    $('.pprog', card).textContent = `${P.qi + 1}/${COMP_N}`;
    $('.pscore', card).textContent = `答对 ${P.score}`;
    const body = $('.pbody', card);
    body.innerHTML = '';
    const st = document.createElement('p'); st.className = 'pstem'; st.innerHTML = q.stem; body.appendChild(st);
    const ob = document.createElement('div'); ob.className = 'popts';
    shuffle(q.options).forEach(o => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'opt'; b.textContent = o; b.dataset.v = o;
      b.addEventListener('click', () => pAnswer(i, b, o));
      ob.appendChild(b);
    });
    body.appendChild(ob);
    const fb = document.createElement('p'); fb.className = 'pfb'; body.appendChild(fb);
  }
  async function pAnswer(i, btn, o) {
    const P = C.players[i];
    if (P.lock || P.done) return;
    P.lock = true;
    const card = $$('.pcard')[i], q = C.qs[P.qi];
    $$('.opt', card).forEach(b => { b.disabled = true; });
    const fb = $('.pfb', card);
    if (o === q.answer) {
      P.score++;
      btn.classList.add('right');
      $('.pscore', card).textContent = `答对 ${P.score}`;
      fb.textContent = '答对了！'; fb.className = 'pfb ok';
      playApplause(); fireworksAt(card);
      await sleep(650);
    } else {
      btn.classList.add('wrong');
      $$('.opt', card).forEach(b => { if (b.dataset.v === q.answer) b.classList.add('right'); });
      fb.textContent = `正确答案是 ${q.answer}`; fb.className = 'pfb bad';
      card.classList.add('shake'); playFail();
      await sleep(1200);
    }
    P.qi++;
    if (P.qi >= COMP_N) {
      P.done = true; P.t = performance.now() - C.t0; C.finished++;
      card.classList.add('done');
      $('.pprog', card).textContent = `${COMP_N}/${COMP_N}`;
      $('.pbody', card).innerHTML = `<p class="pdone">完成！<br>答对 ${P.score} / ${COMP_N}</p>`;
      if (C.finished === 4) setTimeout(showAwards, 900);
    } else showPQ(i);
  }
  function showAwards() {
    const arr = C.players.map((p, i) => ({ i, score: p.score, t: p.t })).sort((a, b) => b.score - a.score || a.t - b.t);
    const med = ['🥇', '🥈', '🥉'];
    const box = $('#awardList'); box.innerHTML = '';
    arr.forEach((r, k) => {
      const d = document.createElement('div');
      d.className = 'arow pc-' + CC[r.i] + (k === 0 ? ' first' : '');
      d.innerHTML = `<span class="medal${med[k] ? '' : ' plain'}">${med[k] || '第 4 名'}</span><b>${NAMES[r.i]}</b><span>答对 ${r.score}/${COMP_N}</span>`;
      box.appendChild(d);
    });
    $('#awards').hidden = false;
    fireworks(); playApplause();
  }

  /* ---------- 模式切换 ---------- */
  let mode = 'learn';
  function setMode(m) {
    mode = m;
    $('#mode-learn').hidden = m !== 'learn'; $('#mode-comp').hidden = m !== 'comp';
    $('#tab-learn').classList.toggle('on', m === 'learn'); $('#tab-comp').classList.toggle('on', m === 'comp');
    $('#tab-learn').setAttribute('aria-pressed', m === 'learn'); $('#tab-comp').setAttribute('aria-pressed', m === 'comp');
    closeZoom(); hideBubble(); Guide.stop();
    window.scrollTo(0, 0);
    if (m === 'comp') { if (!LS.get('shuzhi-g-comp')) Guide.run('comp', compSteps()); }
    else { learnGuides(false); }
  }

  /* ---------- 第一次使用引导 ---------- */
  const Guide = {
    steps: null, idx: 0, name: '', raf: 0, t0: 0, onEnd: null, pending: false,
    layer: null,
    run(name, steps, onEnd) {
      this.stop();
      this.name = name; this.steps = steps; this.idx = 0; this.onEnd = onEnd || null;
      this.layer = $('#gLayer'); this.layer.hidden = false;
      this.enter();
      const loop = () => { this.tick(); this.raf = requestAnimationFrame(loop); };
      this.raf = requestAnimationFrame(loop);
    },
    get active() { return !!this.steps; },
    enter() {
      const s = this.steps[this.idx];
      this.t0 = performance.now();
      this.shown = false;
      this.layer.classList.toggle('info', !!s.info);
      $('.g-text', this.layer).textContent = s.text;
      $('.g-ok', this.layer).hidden = !s.info;
    },
    tick() {
      if (!this.steps) return;
      const s = this.steps[this.idx];
      const ready = !s.wait || s.wait();
      const el = s.target ? s.target() : null;
      const L = this.layer, ring = $('.g-ring', L), hand = $('.g-hand', L), bub = $('.g-bubble', L);
      if (s.target && (!el || (el.disabled)) && !s.info) {
        if (performance.now() - this.t0 > 2500 && ready) { this.advance(); }
        ring.style.display = hand.style.display = bub.style.display = 'none';
        return;
      }
      if (!ready) { ring.style.display = hand.style.display = bub.style.display = 'none'; return; }
      if (el && !this.shown) {
        const r0 = el.getBoundingClientRect();
        if (r0.top < 0 || r0.bottom > innerHeight) el.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
      }
      this.shown = true;
      bub.style.display = '';
      if (el && !s.info) {
        const r = el.getBoundingClientRect();
        ring.style.display = hand.style.display = '';
        const pad = 8;
        ring.style.left = (r.left - pad) + 'px'; ring.style.top = (r.top - pad) + 'px';
        ring.style.width = (r.width + pad * 2) + 'px'; ring.style.height = (r.height + pad * 2) + 'px';
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        hand.style.left = (cx - 10) + 'px'; hand.style.top = (cy - 4) + 'px';
        const bw = bub.offsetWidth, bh = bub.offsetHeight;
        let bx = cx - bw / 2, by = r.bottom + 84;
        if (by + bh > innerHeight - 8) by = r.top - bh - 20;
        if (by < 8) by = Math.max(8, innerHeight - bh - 12);
        bx = Math.max(8, Math.min(innerWidth - bw - 8, bx));
        bub.style.left = bx + 'px'; bub.style.top = by + 'px';
      } else {
        ring.style.display = hand.style.display = 'none';
        const bw = bub.offsetWidth, bh = bub.offsetHeight;
        bub.style.left = Math.max(8, (innerWidth - bw) / 2) + 'px';
        bub.style.top = 'auto';
      }
    },
    advance() {
      if (!this.steps) return;
      this.idx++;
      if (this.idx >= this.steps.length) this.finish(true);
      else this.enter();
    },
    finish(done) {
      const name = this.name, cb = this.onEnd;
      this.stop();
      LS.set('shuzhi-g-' + name, '1');
      if (cb) cb();
    },
    stop() {
      cancelAnimationFrame(this.raf);
      this.steps = null;
      const L = $('#gLayer'); if (L) L.hidden = true;
    }
  };
  document.addEventListener('click', e => {
    if (!Guide.active) return;
    const s = Guide.steps[Guide.idx];
    if (s.info) return;
    const el = s.target && s.target();
    if (el && el.contains(e.target)) setTimeout(() => { if (Guide.steps && Guide.steps[Guide.idx] === s) Guide.advance(); }, 60);
  }, true);
  $('.g-ok').addEventListener('click', () => Guide.advance());
  $('.g-skip').addEventListener('click', () => Guide.finish(false));

  const learnSteps = () => [
    { target: () => $('.col[data-p="0"] .plus'), text: '按 ＋ 放一个苹果。满 10 个会装成一篮！' },
    { target: () => $('.col[data-p="1"] .ctr'), text: '点篮子，看看里面有几个苹果', wait: () => !busy },
    { target: () => $('.dcard'), text: '点数字，看它的数位和数值', wait: () => !busy && !zoomOpenFlag },
    { info: true, text: '很棒！试试输入别的数字，或按「随机数字」。', wait: () => !busy }
  ];
  const soloSteps = () => [
    { target: () => $('#soloStart'), text: '按这里，每题选一个答案，答对放烟花！' },
    { target: () => $('#soloOpts .opt'), text: '点一个答案', wait: () => !$('#soloQArea').hidden },
    { target: () => $('#soloNext'), text: '看完解释，按「下一题」继续，一共 10 题。', wait: () => S.answered && !$('#soloNext').hidden }
  ];
  const compSteps = () => [
    { target: () => $('#compStart'), text: '每人答 5 题，答对越多排越前面，一样多就看谁先做完' },
    { info: true, text: '四位同学各答自己的卡片，全部答完就颁奖！' }
  ];
  function learnGuides(force) {
    if (force || !LS.get('shuzhi-g-learn')) {
      Guide.run('learn', learnSteps(), () => { soloGuideSoon(); });
    } else soloGuideSoon();
  }
  let soloObserved = false;
  function soloGuideSoon() {
    if (LS.get('shuzhi-g-solo') || soloObserved) return;
    soloObserved = true;
    const io = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting && e.intersectionRatio > 0.45) && !Guide.active && mode === 'learn' && !LS.get('shuzhi-g-solo')) {
        io.disconnect();
        Guide.run('solo', soloSteps());
        soloObserved = false;
      }
    }, { threshold: [0.45, 0.8] });
    io.observe($('#solo'));
  }
  $('#helpBtn').addEventListener('click', () => {
    if (mode === 'comp') Guide.run('comp', compSteps());
    else Guide.run('learn', learnSteps(), () => Guide.run('solo', soloSteps()));
  });

  /* ---------- 封面 ---------- */
  function splash() {
    const sp = $('#splash');
    if (PREVIEW) { sp.remove(); return Promise.resolve(); }
    return new Promise(resolve => {
      let loaded = false, timeOk = false, closed = false;
      const close = () => {
        if (closed) return; closed = true;
        sp.classList.add('out');
        setTimeout(() => { sp.remove(); resolve(); }, reduced() ? 0 : 650);
      };
      const check = () => { if (loaded && timeOk) close(); };
      const list = ['cover.jpg', 'apple.webp', 'basket.webp', 'crate.webp', 'cart.webp'];
      Promise.all(list.map(f => new Promise(res => { const im = new Image(); im.onload = im.onerror = res; im.src = 'assets/' + f; })))
        .then(() => { loaded = true; sp.classList.add('ready'); check(); });
      setTimeout(() => { timeOk = true; check(); }, 2500);
      sp.addEventListener('click', () => { if (loaded) close(); });
    });
  }

  /* ---------- 绑定与启动 ---------- */
  function init() {
    buildOrchard(); buildComp();
    commit(219);
    $('#showBtn').addEventListener('click', () => { initAudio(); visualize(); });
    $('#rndBtn').addEventListener('click', () => { initAudio(); randomize(); });
    $('#numIn').addEventListener('keydown', e => { if (e.key === 'Enter') visualize(); });
    $('#soloStart').addEventListener('click', soloStart);
    $('#soloNext').addEventListener('click', soloNext);
    $('#soloAgain').addEventListener('click', soloStart);
    $('#compStart').addEventListener('click', compStart);
    $('#awardAgain').addEventListener('click', compStart);
    $('#tab-learn').addEventListener('click', () => { if (mode !== 'learn') setMode('learn'); });
    $('#tab-comp').addEventListener('click', () => { if (mode !== 'comp') setMode('comp'); });
  }

  window.ShuzhiQuiz = { MAKE, TYPE_NAMES, selfCheck, soloSet, compSet, analysisOf };
  window.ShuzhiUI = { renderVisual };

  init();
  if (PREVIEW) {
    document.body.classList.add('preview');
    $('#splash').remove();
  } else {
    document.body.classList.add('booting');
    splash().then(() => { document.body.classList.remove('booting'); learnGuides(false); });
  }
})();
