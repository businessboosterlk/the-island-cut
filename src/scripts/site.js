// THE ISLAND CUT, the page's one script. The ring that arrives and is seen three ways, the viewing room, the tray, the passport, the request sheet,
// the ring that comes apart, the builder and the box.
// No framework, no three.js, no GSAP. Every door ends in a prefilled WhatsApp message that says "from the website".
// The tray is saved on this device only (localStorage) and is never a reservation.
import { url, icon } from './icon.js';

const P = JSON.parse(document.getElementById('payload').textContent);
const STONES = P.stones, VIEWS = P.views, MAX = 3;
const byRef = r => STONES.find(s => s.ref === r);
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const wa = t => `https://wa.me/${P.whatsapp}?text=${encodeURIComponent(t)}`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const size = s => `${s.mm[0]} by ${s.mm[1]} by ${s.mm[2]} mm`;
const ct = s => `${s.carat.toFixed(2)} ct`;
const status = f => `<span class="status" data-s="${esc(f.status)}">${esc(f.status)}</span>`;
const srcOf = (s, w) => url(`assets/photos/${s.photo.file}-${w}.webp`);
const viewLabel = k => (VIEWS.find(v => v.key === k) || {}).label || k;
const askText = s => `Hello, from the website. I am asking about stone ${s.ref} (${s.title}, ${ct(s)}).`;
const state = { room: STONES[0].ref, view: 'daylight', tray: [], passport: null };
window.IslandCut = { state, stones: STONES.length, ready: false };

/* ───────── pictures: one function puts a stone's photograph in a frame, or the honest empty panel ───────── */
function picture(img, empty, s, sizes) {
  if (s.photo) {
    img.hidden = false; img.src = srcOf(s, 1600); img.srcset = `${srcOf(s, 800)} 800w, ${srcOf(s, 1600)} 1600w`; if (sizes) img.sizes = sizes;
    img.alt = s.photo.alt; img.width = s.photo.w; img.height = s.photo.h; img.style.objectPosition = s.photo.focus; empty.hidden = true;
  } else { img.hidden = true; img.removeAttribute('src'); img.removeAttribute('srcset'); img.alt = ''; empty.hidden = false; }
}

/* ───────── scroll stages: a sticky stage inside a taller track. Progress is 0 at the top of the track and 1 once
   the track has scrolled its travel. Read from the scroll and nothing else, so every stage is reversible. ───────── */
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function progress(track, stage) {
  const travel = track.offsetHeight - stage.offsetHeight; if (travel <= 0) return 0;
  const top = parseFloat(getComputedStyle(stage).top) || 0;
  return clamp((top - track.getBoundingClientRect().top) / travel, 0, 1);
}
function onScroll(fn) { let q = false; const ask = () => { if (!q) { q = true; requestAnimationFrame(() => { q = false; fn(); }); } }; addEventListener('scroll', ask, { passive: true }); addEventListener('resize', ask); return ask; }

/* ───────── the hero (clip 5): one ring, three stills. The first arrives on its own (a CSS transition, started once the
   still has loaded, so it is never seen half way) and only then do the words land. The scroll then picks the stage:
   a different still, a different line, a slow drift of scale inside the stage. Read from the scroll and nothing else,
   so scrolling up swaps back. Under reduced motion: no entrance, the upright still, every line shown. ───────── */
{
  const track = $('#hero-track'), stage = $('#hero-stage'), turn = $('#turn'), stills = $$('#turn .still'), words = $$('#hero-words li');
  const N = stills.length, at = words.map(w => Number(w.dataset.at));
  const H = window.IslandCut.hero = { stages: N, loaded: 0, stage: 0, progress: 0, entered: false, reduced: REDUCE };
  const cur = (list, i) => list.forEach((el, k) => { if (k === i) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current'); });
  function show(i) { cur(stills, i); cur(words, i); H.stage = i; turn.dataset.stage = String(i); }
  function put() {
    const p = progress(track, stage); H.progress = p;
    let i = 0; at.forEach((a, k) => { if (p >= a) i = k; });
    const span = (k => (k < N ? at[k] : 1) - at[i])(i + 1), local = span > 0 ? clamp((p - at[i]) / span, 0, 1) : 0;
    show(i); turn.style.setProperty('--drift', (1 + (i === N - 1 ? 0.10 : 0.05) * local).toFixed(3));
  }
  function enter() { if (H.entered) return; H.entered = true; stage.dataset.entered = 'true'; }
  stills.forEach(im => { const done = () => { H.loaded++; }; if (im.complete && im.naturalWidth) done(); else im.addEventListener('load', done, { once: true }); });
  if (REDUCE) { show(1); H.progress = 0.5; enter(); }
  else {
    onScroll(put); put();
    const go = () => { requestAnimationFrame(() => requestAnimationFrame(enter)); setTimeout(enter, 900); }; /* a hidden tab stalls animation frames (seen 1 Nov 2026): the timer makes sure the ring never stays stuck in its entrance pose */
    if (stills[0].complete) go(); else { stills[0].addEventListener('load', go, { once: true }); stills[0].addEventListener('error', go, { once: true }); }
  }
}

/* ───────── customise: the ring comes apart as the stage scrolls and goes back together on the way up ───────── */
{
  const track = $('#explode-track'), stage = $('#explode');
  const E = window.IslandCut.explode = { p: 0 };
  function put() { const p = REDUCE ? 1 : progress(track, stage); E.p = p; stage.style.setProperty('--p', p.toFixed(3)); stage.dataset.apart = String(p > 0.5); }
  if (!REDUCE) onScroll(put);
  put();
}

/* ───────── the box: a short real loop while it is on screen, the open shot and the door on the tap ───────── */
{
  const box = $('#box'), loop = $('#box-loop'), opened = $('#box-open'), tap = $('#box-tap'), reveal = $('#box-reveal');
  const X = window.IslandCut.box = { playing: false, open: false };
  const play = v => { const p = v.play(); if (p && p.catch) p.catch(() => { /* a browser that refuses to play shows the poster, which is the same box */ }); };
  if (!REDUCE && 'IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => {
    if (X.open) return;
    if (e.isIntersecting) { play(loop); X.playing = true; } else { loop.pause(); X.playing = false; }
  }), { threshold: 0.25 }).observe(box);
  tap.addEventListener('click', () => {
    X.open = true; X.playing = false; box.dataset.open = 'true';
    loop.pause(); loop.hidden = true; opened.hidden = false; if (!REDUCE) play(opened);
    tap.hidden = true; reveal.hidden = false;
    $('#close-request').focus({ preventScroll: true });
  });
}

/* ───────── the viewing room ───────── */
function room(ref, view) {
  if (ref) state.room = ref; if (view) state.view = view;
  const s = byRef(state.room), has = s.media[state.view];
  $$('[data-pick]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pick === s.ref)));
  $$('.tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.view === state.view)));
  const img = $('#stage-img'), empty = $('#stage-empty');
  if (has === 'photo') { picture(img, empty, s, '(min-width:900px) 58vw, 100vw'); $('#stage-cap').textContent = `${viewLabel(state.view)}. ${s.photo.credit}.`; }
  else {
    img.hidden = true; empty.hidden = false;
    $('#stage-empty-h').textContent = `${viewLabel(state.view)} not captured yet for ${s.ref}`;
    $('#stage-empty-p').textContent = state.view === 'rotation' ? 'A rotation clip is filmed in daylight on request. Nothing is simulated.' : 'This view is photographed on request. Nothing is simulated.';
    $('#stage-cap').textContent = `No ${viewLabel(state.view).toLowerCase()} view of ${s.ref} has been captured.`;
  }
  $('#room-ref').textContent = s.ref; $('#room-title').textContent = s.title;
  $('#room-facts').innerHTML = [['Weight', ct(s)], ['Size', size(s)], ['Treatment', `${esc(s.treatment.value)} ${status(s.treatment)}`], ['Lab report', status(s.lab)]].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  const want = has === 'photo' ? `Hello, from the website. Could I see stone ${s.ref} (${s.title}) under indoor light, close up or turning, on a call or as a clip?` : `Hello, from the website. Could I see stone ${s.ref} (${s.title}) in ${viewLabel(state.view).toLowerCase()}, on a call or as a clip?`;
  $('#room-ask').href = wa(want);
  $('#room-compare').setAttribute('aria-pressed', String(state.tray.includes(s.ref)));
}
$$('[data-pick]').forEach(b => b.addEventListener('click', () => room(b.dataset.pick)));
$$('.tab').forEach(t => t.addEventListener('click', () => room(null, t.dataset.view)));
$$('[data-room]').forEach(b => b.addEventListener('click', () => { room(b.dataset.room, 'daylight'); $('#viewing').scrollIntoView({ block: 'start' }); }));
$('#room-passport').addEventListener('click', () => passport(state.room, $('#room-passport')));
$('#room-compare').addEventListener('click', () => toggle(state.room));

/* ───────── the tray: up to three stones, saved on this device ───────── */
const KEY = 'island-cut-tray';
try { state.tray = (JSON.parse(localStorage.getItem(KEY) || '[]') || []).filter(byRef).slice(0, MAX); } catch { state.tray = []; }
const ROWS = [['Colour', s => esc(s.colour)], ['Cut', s => esc(s.cut)], ['Weight', s => ct(s)], ['Size', s => size(s)], ['Treatment', s => `${esc(s.treatment.value)} ${status(s.treatment)}`], ['Lab report', s => `${esc(s.lab.value)} ${status(s.lab)}`], ['Provenance', s => `${esc(s.origin.value)} ${status(s.origin)}`]];
function toggle(ref) {
  const warn = $('#tray-warn');
  if (state.tray.includes(ref)) state.tray = state.tray.filter(r => r !== ref);
  else if (state.tray.length >= MAX) { warn.hidden = false; $('#tray').dataset.open = 'true'; $('#tray-open').setAttribute('aria-expanded', 'true'); $('#tray-open').textContent = 'Close'; return tray(); }
  else state.tray.push(ref);
  warn.hidden = true; tray();
}
function tray() {
  try { localStorage.setItem(KEY, JSON.stringify(state.tray)); } catch { /* private mode: the tray still works for this visit */ }
  const t = $('#tray'), n = state.tray.length, picks = state.tray.map(byRef);
  t.dataset.on = String(n > 0); document.body.classList.toggle('tray-on', n > 0);
  if (!n) { t.dataset.open = 'false'; $('#tray-open').setAttribute('aria-expanded', 'false'); $('#tray-open').textContent = 'Open'; }
  $('#tray-what').textContent = `Comparing ${n} of ${MAX}`;
  $('#tray-refs').textContent = picks.map(s => `${s.ref} ${s.title}`).join(', ');
  $$('[data-compare]').forEach(b => b.setAttribute('aria-pressed', String(state.tray.includes(b.dataset.compare))));
  $('#room-compare').setAttribute('aria-pressed', String(state.tray.includes(state.room)));
  if (state.passport) $('#pp-compare').setAttribute('aria-pressed', String(state.tray.includes(state.passport)));
  $('#cmp-head').innerHTML = '<th scope="col"><span class="vh">Fact</span></th>' + picks.map(s => `<th scope="col">${esc(s.title)}<small>${esc(s.ref)}</small><button class="rm" type="button" data-remove="${esc(s.ref)}" aria-label="Remove ${esc(s.ref)} from the tray">${icon('close')}</button></th>`).join('');
  const diff = $('#diff').checked;
  $('#cmp-body').innerHTML = ROWS.map(([k, f]) => { const vals = picks.map(f); const same = vals.length > 1 && vals.every(v => v === vals[0]); return `<tr data-same="${same}"${same && diff ? ' hidden' : ''}><th scope="row">${k}</th>${vals.map(v => `<td>${v}</td>`).join('')}</tr>`; }).join('');
  $$('[data-remove]').forEach(b => b.addEventListener('click', () => toggle(b.dataset.remove)));
}
$$('[data-compare]').forEach(b => b.addEventListener('click', () => toggle(b.dataset.compare)));
$('#tray-open').addEventListener('click', () => { const t = $('#tray'), open = t.dataset.open !== 'true'; t.dataset.open = String(open); $('#tray-open').setAttribute('aria-expanded', String(open)); $('#tray-open').textContent = open ? 'Close' : 'Open'; if (!open) $('#tray-warn').hidden = true; });
$('#tray-clear').addEventListener('click', () => { state.tray = []; $('#tray-warn').hidden = true; tray(); });
$('#diff').addEventListener('change', tray);

/* ───────── the passport: one stone, every fact with its status ───────── */
let opener = null;
function passport(ref, from) {
  const s = byRef(ref); state.passport = ref; opener = from || document.activeElement;
  $('#pp-ref').textContent = s.ref; $('#pp-title').textContent = s.title;
  picture($('#pp-img'), $('#pp-empty'), s, '(min-width:900px) 560px, 100vw');
  $('#pp-cap').textContent = s.photo ? s.photo.credit : 'No photograph on this record yet.';
  $('#pp-dl').innerHTML = [['Reference', esc(s.ref)], ['Colour', esc(s.colour)], ['Cut', esc(s.cut)], ['Weight', ct(s)], ['Dimensions', size(s)], ['Treatment', `${esc(s.treatment.value)} ${status(s.treatment)}`], ['Lab report', `${esc(s.lab.value)} ${status(s.lab)}`], ['Provenance', `${esc(s.origin.value)} ${status(s.origin)}`]].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  $('#pp-views').innerHTML = VIEWS.map(v => `<li><span>${esc(v.label)}</span><span>${s.media[v.key] ? 'Captured, daylight photograph' : 'Not captured yet'}</span></li>`).join('');
  $('#pp-ask').href = wa(askText(s));
  $('#pp-compare').setAttribute('aria-pressed', String(state.tray.includes(ref)));
  open($('#passport'));
}
$$('[data-passport]').forEach(b => b.addEventListener('click', () => passport(b.dataset.passport, b)));
$('#pp-compare').addEventListener('click', () => toggle(state.passport));

/* ───────── the request: a time with a specialist, carrying the stones ───────── */
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = n => String(n).padStart(2, '0');
function request(from, carry) {
  opener = from || document.activeElement;
  /* the passport hands its stone over as `carry`, because by the time the request opens the passport is already shut */
  const refs = carry ? carry.slice() : (state.passport && $('#passport').open ? [state.passport] : state.tray.slice());
  const picks = refs.map(byRef);
  $('#req-stones').innerHTML = picks.length ? picks.map(s => `<span class="chip static">${esc(s.ref)} ${esc(s.title)}</span>`).join('') : '<span class="note">No stone chosen yet. A specialist can walk the table with you.</span>';
  const day = $('#req-day');
  if (!day.options.length) {
    const now = new Date();
    for (let i = 1; i <= 7; i++) { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i); const o = document.createElement('option'); o.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; o.textContent = `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; day.appendChild(o); }
    for (const t of P.slots) { const o = document.createElement('option'); o.value = t; o.textContent = t; $('#req-time').appendChild(o); }
  }
  $('#request').dataset.sent = 'false';
  times(picks); open($('#request'));
}
function times(picks) {
  const [y, m, d] = $('#req-day').value.split('-').map(Number), [hh, mm] = $('#req-time').value.split(':').map(Number);
  /* Sri Lanka keeps +05:30 all year: the Colombo slot as an instant, then the visitor's own clock on it */
  const at = new Date(Date.UTC(y, m - 1, d, hh - 5, mm - 30));
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'your time zone';
  const local = at.toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  const colombo = `${$('#req-day').selectedOptions[0].textContent}, ${$('#req-time').value}`;
  $('#req-local').textContent = zone === 'Asia/Colombo' ? `${colombo} Colombo time` : `${local} in ${zone}`;
  $('#req-zone').textContent = zone === 'Asia/Colombo' ? 'You are on the house’s own clock.' : `${colombo} on the house’s clock in Colombo.`;
  const refs = (picks || (state.passport && $('#passport').open ? [byRef(state.passport)] : state.tray.map(byRef))).map(s => `${s.ref} ${s.title}`).join(', ');
  $('#req-send').href = wa(`Hello, from the website. I would like a viewing with a specialist on a video call.${refs ? ` Stones: ${refs}.` : ' No stone chosen yet, please walk me through the table.'} Day and time: ${colombo} Colombo time${zone === 'Asia/Colombo' ? '' : ` (${local} ${zone})`}. Please confirm.`);
}
$('#req-day').addEventListener('change', () => times());
$('#req-time').addEventListener('change', () => times());
/* success is shown only once the door has actually been opened: the click on the real WhatsApp link */
$('#req-send').addEventListener('click', () => { $('#request').dataset.sent = 'true'; });
$$('[data-request]').forEach(b => b.addEventListener('click', () => request(b)));

/* ───────── the builder: setting, stone, size, the details, then a name and a number. No price anywhere. The choices
   ride into the WhatsApp message like the tray does, and are kept on this device only. ───────── */
const B = P.builder, RING = 'island-cut-ring', ORDER = ['setting', 'stone', 'size', 'metal', 'band'];
const STEPS = ['setting', 'stone', 'size', 'details', 'ready'];
const ring = { setting: null, stone: null, size: null, metal: null, band: null, name: '', number: '' };
try { const k = JSON.parse(localStorage.getItem(RING) || '{}'); for (const g of ORDER) if (B.groups[g].options.some(o => o.key === k[g])) ring[g] = k[g]; if (typeof k.name === 'string') ring.name = k.name.slice(0, 80); if (typeof k.number === 'string') ring.number = k.number.slice(0, 32); } catch { /* nothing kept */ }
let step = 'setting';
window.IslandCut.ring = ring;
const optLabel = (g, k) => { const o = B.groups[g].options.find(o => o.key === k); return o ? o.label : null; };
const keepRing = () => { try { localStorage.setItem(RING, JSON.stringify(ring)); } catch { /* private mode */ } };
const digits = s => String(s).replace(/\D/g, '');
const complete = () => ring.name.trim().length >= 2 && digits(ring.number).length >= 7;
const missing = k => k === 'details' ? !(ring.metal && ring.band) : !ring[k];
const groupHtml = (g, titled) => `<div class="group" data-group="${g}">${titled ? `<p class="glabel">${esc(B.groups[g].label)}</p>` : ''}<p class="ask">${esc(B.groups[g].ask)}</p><div class="opts">${B.groups[g].options.map(o => `<button type="button" class="opt" data-option="${g}:${o.key}" aria-pressed="${String(ring[g] === o.key)}"><strong>${esc(o.label)}</strong><span>${esc(o.why)}</span></button>`).join('')}</div></div>`;
const summary = () => `<dl class="sum">${ORDER.map(g => `<div><dt>${esc(B.groups[g].label)}</dt><dd>${esc(optLabel(g, ring[g]) || 'Not chosen')}</dd><button type="button" class="chg" data-step="${g === 'metal' || g === 'band' ? 'details' : g}">Change</button></div>`).join('')}</dl>`;
function ringText(kind) {
  const parts = ORDER.map(g => `${B.groups[g].label}: ${optLabel(g, ring[g]) || 'not chosen'}`).join('. ');
  return `Hello, from the website. My ring. ${parts}. Name: ${ring.name.trim()}. Number: ${ring.number.trim()}. ${kind === 'custom' ? 'Please make it fully custom with a specialist, starting from these choices.' : 'Please take it as it is and tell me the next step.'}`;
}
function doors() {
  const ok = complete();
  for (const a of $$('#bld-acts [data-door]')) { a.setAttribute('aria-disabled', String(!ok)); a.href = ok ? wa(ringText(a.dataset.door)) : '#'; }
  const why = $('#bld-why'); if (why) why.textContent = ok ? 'Either door opens WhatsApp with your choices, your name and your number. Nothing is priced here. A person replies.' : 'Add your name and your number so a person can reply. Nothing is priced here.';
}
function build() {
  const d = $('#builder'), i = STEPS.indexOf(step), body = $('#bld-body'), acts = $('#bld-acts');
  d.dataset.step = step;
  $('#bld-step').textContent = step === 'ready' ? 'Almost ready' : `Step ${i + 1} of 4`;
  $('#bld-title').textContent = step === 'ready' ? 'Your ring is almost ready' : B.titles[step];
  if (step === 'details') body.innerHTML = groupHtml('metal', true) + groupHtml('band', true);
  else if (step === 'ready') body.innerHTML = `<div class="ready">${summary()}<div class="field"><label for="bld-name">Your name</label><input type="text" id="bld-name" autocomplete="name" maxlength="80" value="${esc(ring.name)}"></div><div class="field"><label for="bld-number">Your WhatsApp number</label><input type="text" id="bld-number" inputmode="tel" autocomplete="tel" maxlength="32" value="${esc(ring.number)}"></div><p class="note" id="bld-why"></p></div>`;
  else body.innerHTML = groupHtml(step, false);
  if (step === 'ready') acts.innerHTML = `<a class="door fill" data-door="asis" href="#" target="_blank" rel="noopener">${icon('b-whatsapp')}Send it as it is</a><a class="door" data-door="custom" href="#" target="_blank" rel="noopener">${icon('b-whatsapp')}Make it fully custom</a><button class="door quiet" type="button" data-back>Back</button>`;
  else acts.innerHTML = `<button class="door fill" type="button" data-next${missing(step) ? ' disabled' : ''}>Next</button><button class="door quiet" type="button" ${i === 0 ? 'data-close>Not now' : 'data-back>Back'}</button>`;
  $$('[data-option]', body).forEach(b => b.addEventListener('click', () => { const [g, k] = b.dataset.option.split(':'); ring[g] = k; keepRing(); $$(`[data-option^="${g}:"]`, body).forEach(x => x.setAttribute('aria-pressed', String(x === b))); const n = $('[data-next]', acts); if (n) n.disabled = missing(step); }));
  $$('[data-step]', body).forEach(b => b.addEventListener('click', () => { step = b.dataset.step; build(); }));
  const nx = $('[data-next]', acts); if (nx) nx.addEventListener('click', () => { if (missing(step)) return; step = STEPS[i + 1]; build(); });
  const bk = $('[data-back]', acts); if (bk) bk.addEventListener('click', () => { step = STEPS[Math.max(0, i - 1)]; build(); });
  const cl = $('[data-close]', acts); if (cl) cl.addEventListener('click', () => d.close());
  if (step === 'ready') {
    $('#bld-name').addEventListener('input', e => { ring.name = e.target.value; keepRing(); doors(); });
    $('#bld-number').addEventListener('input', e => { ring.number = e.target.value; keepRing(); doors(); });
    $$('[data-door]', acts).forEach(a => a.addEventListener('click', e => { if (!complete()) { e.preventDefault(); (ring.name.trim().length < 2 ? $('#bld-name') : $('#bld-number')).focus(); } }));
    doors();
  }
  body.scrollTop = 0;
}
function builder(from) { opener = from || document.activeElement; step = 'setting'; build(); open($('#builder')); }
$$('[data-build]').forEach(b => b.addEventListener('click', () => builder(b)));

/* ───────── sheets: native dialog, Escape closes, focus returns to what opened it ───────── */
function open(d) { if (d.open) return; d.showModal(); document.body.classList.add('sheet-open'); d.scrollTop = 0; const first = d.querySelector('.scroll'); if (first) first.scrollTop = 0; }
for (const d of $$('dialog')) {
  d.addEventListener('close', () => { document.body.classList.remove('sheet-open'); if (d.id === 'passport') state.passport = null; if (opener && opener.isConnected && document.body.contains(opener)) opener.focus(); });
  d.addEventListener('click', e => { if (e.target === d) d.close(); });
  d.querySelectorAll('[data-close], .x').forEach(b => b.addEventListener('click', () => d.close()));
}
/* "View with a specialist" inside the passport carries that stone, then closes the passport under the request */
$('#pp-spec').addEventListener('click', () => { const keep = state.passport; $('#passport').close(); request($('#pp-spec'), keep ? [keep] : []); });

/* ───────── the brand mark always reaches the top, even with #top already in the address ───────── */
$$('[data-top]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0 }); history.replaceState(null, '', location.pathname + location.search); }));

room(); tray();
window.IslandCut.ready = true;
