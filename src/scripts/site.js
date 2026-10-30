// THE ISLAND CUT, the page's one script. Hero state, the viewing room, the tray, the passport and the request sheet.
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

/* ───────── the hero: the stone, or the honest frame where the finished piece will go ───────── */
{
  const frame = $('#hero-frame'), img = $('#hero-img'), piece = $('#hero-piece'), cap = $('#hero-cap');
  const CAP = cap.textContent;
  $$('.hero .state button').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.state; frame.dataset.state = k;
    $$('.hero .state button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    img.hidden = k !== 'stone'; piece.hidden = k === 'stone';
    cap.textContent = k === 'stone' ? CAP : 'The finished piece is shown here only once it exists and has been photographed.';
  }));
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
