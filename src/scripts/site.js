// THE PAGE'S ONE SCRIPT: nav tone, the stone shelf (filter, sort, count), the configurator (a prefilled WhatsApp
// line, never a bag), the gem views, and the motion. Every rule here is Tier 0: a filter, a calculation, a handover.
// Content ships visible; motion is gated on gsap being present and reduced motion being off.
import data from '../data/stones.json';
import { SITE, RING_SIZES, METALS, PIECES, wa } from '../config.js';
import { createView, buildStone, buildPiece, stillPainter, supported } from './gem.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const html = document.documentElement;
const STONES = data.stones;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = { drawn: 0, stills: 0, errors: [], gl: false };
window.IslandCut = state;
window.addEventListener('error', e => state.errors.push(String(e.message || e)));

/* ---------- nav: solid after the first scroll, light over light sections ---------- */
const nav = $('.nav'), fab = $('.fab');
const onScroll = () => { nav.classList.toggle('scrolled', scrollY > 24); fab?.classList.toggle('on', scrollY > innerHeight * 0.8); };
addEventListener('scroll', onScroll, { passive: true }); onScroll();
// A link to #top always goes to the top. Left to the browser, a second press with #top already in the address scrolls nowhere.
$$('a[href="#top"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); history.replaceState(null, '', location.pathname + location.search); }));
// The floating door shows only where a section has no door of its own. The hero, the shelf, the configurator,
// the close and the footer all carry their own buttons at the right edge of a phone, so over those it steps aside.
const near = new Set();
const nearIO = new IntersectionObserver(es => { for (const e of es) e.isIntersecting ? near.add(e.target) : near.delete(e.target); fab?.classList.toggle('near', near.size > 0); });
$$('.hero, #stones, #set, .close, .footer').forEach(s => nearIO.observe(s));
const toneIO = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) nav.dataset.tone = e.target.classList.contains('dark') ? 'dark' : 'light'; }, { rootMargin: '-60px 0px -85% 0px' });
$$('section, footer').forEach(s => toneIO.observe(s));

/* ---------- the shelf ---------- */
const grid = $('#grid'), cards = $$('.stone', grid), countEl = $('#count'), empty = $('#empty');
const shelf = { colour: 'all', unheated: false, sort: 'desc' };
function applyShelf() {
  let n = 0;
  const live = cards.filter(c => (shelf.colour === 'all' || c.dataset.colour === shelf.colour) && (!shelf.unheated || c.dataset.treat === 'Unheated'));
  live.sort((a, b) => shelf.sort === 'desc' ? b.dataset.carat - a.dataset.carat : a.dataset.carat - b.dataset.carat);
  cards.forEach(c => { c.hidden = !live.includes(c); });
  live.forEach(c => grid.appendChild(c)); n = live.length;
  if (empty) { empty.hidden = n > 0; grid.appendChild(empty); }
  countEl.textContent = n === cards.length ? `All ${n} stones` : n === 1 ? '1 stone of ' + cards.length : `${n} stones of ${cards.length}`;
}
$$('[data-colour-chip]').forEach(b => b.addEventListener('click', () => {
  $$('[data-colour-chip]').forEach(x => x.setAttribute('aria-pressed', x === b)); shelf.colour = b.dataset.colourChip; applyShelf();
}));
$('#unheated')?.addEventListener('click', e => { shelf.unheated = !shelf.unheated; e.currentTarget.setAttribute('aria-pressed', shelf.unheated); applyShelf(); });
$('#sort')?.addEventListener('change', e => { shelf.sort = e.target.value; applyShelf(); });
$('#reset')?.addEventListener('click', () => { shelf.colour = 'all'; shelf.unheated = false; $$('[data-colour-chip]').forEach(x => x.setAttribute('aria-pressed', x.dataset.colourChip === 'all')); $('#unheated').setAttribute('aria-pressed', 'false'); applyShelf(); });
applyShelf();

/* ---------- the configurator ---------- */
const cfg = { stone: STONES[0], piece: 'ring', metal: METALS[0], size: 7, inscribe: false, melee: false };
const sizeField = $('#size-field'), sizeSel = $('#size'), summary = $('#summary'), sendBtn = $('#send');
const stoneLine = s => `${s.name}, ${s.carat.toFixed(2)} ct, ${s.treatment.toLowerCase()}, ${s.lab} report (${s.ref})`;
function describe() {
  const s = cfg.stone, mm = RING_SIZES.find(r => r[0] === +cfg.size)?.[1];
  const piece = PIECES.find(p => p.key === cfg.piece).label.toLowerCase();
  const size = cfg.piece === 'ring' ? `, size ${cfg.size} (${mm} mm)` : '';
  const extras = [cfg.inscribe && 'the report number inscribed on the girdle', cfg.melee && 'one hidden Ceylon melee under the head'].filter(Boolean);
  const line = `${s.name}, ${s.carat.toFixed(2)} ct, as a ${piece} in ${cfg.metal.label.toLowerCase()}${size}.`;
  const extraLine = extras.length ? ` With ${extras.join(' and ')}.` : '';
  return { line, extraLine, text: `Hello ${SITE.name}. Could you draw ${stoneLine(s)} as a ${piece} in ${cfg.metal.label.toLowerCase()}${size}?${extraLine} I am in [your city]. (from the website, set a stone)` };
}
function paintSummary() {
  const d = describe();
  summary.firstElementChild.textContent = d.line + d.extraLine;
  sendBtn.href = wa(d.text);
  sizeField.hidden = cfg.piece !== 'ring';
}
$$('[data-stone-chip]').forEach(b => b.addEventListener('click', () => selectStone(b.dataset.stoneChip)));
function selectStone(ref) {
  cfg.stone = STONES.find(s => s.ref === ref) || STONES[0];
  $$('[data-stone-chip]').forEach(x => x.setAttribute('aria-pressed', x.dataset.stoneChip === cfg.stone.ref));
  paintSummary(); rebuildPiece();
}
$$('[data-piece]').forEach(b => b.addEventListener('click', () => { cfg.piece = b.dataset.piece; $$('[data-piece]').forEach(x => x.setAttribute('aria-pressed', x === b)); paintSummary(); rebuildPiece(); }));
$$('[data-metal]').forEach(b => b.addEventListener('click', () => { cfg.metal = METALS.find(m => m.key === b.dataset.metal); $$('[data-metal]').forEach(x => x.setAttribute('aria-pressed', x === b)); paintSummary(); rebuildPiece(); }));
sizeSel?.addEventListener('change', e => { cfg.size = +e.target.value; paintSummary(); rebuildPiece(); });
$('#inscribe')?.addEventListener('change', e => { cfg.inscribe = e.target.checked; paintSummary(); });
$('#melee')?.addEventListener('change', e => { cfg.melee = e.target.checked; paintSummary(); });
$$('[data-set]').forEach(b => b.addEventListener('click', () => { selectStone(b.dataset.set); $('#set').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }));
paintSummary();

/* ---------- gem views ---------- */
let heroView, setView, heroHold, setHold;
function liveView(canvas, build, { spin }) {
  const view = createView(canvas);
  const hold = new THREE_Group(); view.root.add(hold);
  let active = false, dragging = false, lastX = 0, lastY = 0, vel = 0, idle = 0, t = 0, raf = 0;
  const pose = { x: 0.55, y: 0 };
  const frame = () => {
    raf = 0; if (!active) return;
    t += 1 / 60;
    if (!dragging) {
      if (spin === 'turn') { pose.y += 0.006 + vel; vel *= 0.94; }
      else { idle += 1 / 60; vel *= 0.9; pose.y = (hold.userData.baseY || 0) + Math.sin(idle * 0.7) * 0.35 + vel * 20; }
    }
    hold.rotation.set(pose.x, pose.y, 0);
    view.render(); state.drawn++;
    if (!reduced || dragging || Math.abs(vel) > 0.0005) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  new IntersectionObserver(es => { active = es[0].isIntersecting; if (active) kick(); }, { threshold: 0.05 }).observe(canvas);
  canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); kick(); });
  canvas.addEventListener('pointermove', e => { if (!dragging) return; const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; pose.y += dx * 0.012; pose.x = Math.max(-0.4, Math.min(1.3, pose.x + dy * 0.008)); vel = dx * 0.0006; kick(); });
  const up = () => { dragging = false; kick(); };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  new ResizeObserver(() => kick()).observe(canvas);
  return { view, hold, pose, kick, set(obj, radius, p) { view.clear(); hold.clear(); view.root.add(hold); hold.add(obj); view.fit(radius); if (p) { pose.x = p.x; hold.userData.baseY = p.y; pose.y = p.y; } kick(); } };
}
// three's Group without importing three here twice: gem.js owns three; expose a tiny factory.
import { Group as THREE_Group } from 'three';

function rebuildPiece() {
  if (!setHold) return;
  const g = buildPiece(cfg.piece, cfg.stone, cfg.metal.hex, RING_SIZES.find(r => r[0] === +cfg.size)?.[1] || 17.3);
  setHold.set(g, g.userData.radius, g.userData.pose);
  $('#set-cap').textContent = `${cfg.stone.name}, ${cfg.stone.mm[0]} by ${cfg.stone.mm[1]} mm, drawn to size. Drag to turn.`;
}
function startGems() {
  if (!supported()) { html.dataset.gl = 'off'; return; }
  try {
    html.dataset.gl = 'ok'; state.gl = true;
    const heroCanvas = $('#hero-canvas');
    heroHold = liveView(heroCanvas, null, { spin: 'turn' }); state.hero = heroHold;
    const hs = STONES[0], m = buildStone(hs);
    heroHold.set(m, m.userData.halfW * 1.35, { x: 0.55, y: 0.3 });
    const setCanvas = $('#set-canvas');
    setHold = liveView(setCanvas, null, { spin: 'sway' }); state.set = setHold;
    rebuildPiece();
    // One still per idle slice, and none until the hero's words have landed, so the intro never stutters.
    const idle = window.requestIdleCallback || (f => setTimeout(f, 40));
    const queue = STONES.slice(); let painter = null;
    const paintOne = () => {
      try {
        if (!painter) painter = stillPainter();
        const s = queue.shift(); if (!s) { painter.dispose(); return; }
        const tile = $(`.tile[data-ref="${s.ref}"]`);
        if (tile) {
          const img = new Image(); img.src = painter.paint(s); img.width = 560; img.height = 560; img.alt = tile.dataset.alt || ''; img.decoding = 'async';
          tile.prepend(img); state.stills++;
        }
        idle(paintOne);
      } catch (e) { state.errors.push('stills: ' + e.message); }
    };
    setTimeout(() => idle(paintOne), reduced ? 0 : 1600);
  } catch (e) { state.errors.push('gl: ' + e.message); html.dataset.gl = 'off'; }
}
startGems();

/* ---------- motion (bb-motion-master): one idea per scene, one duration, gated ---------- */
function wordMask(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  words.forEach((w, i) => { const o = document.createElement('span'); o.className = 'wm'; const n = document.createElement('span'); n.className = 'w'; n.textContent = w; o.appendChild(n); el.appendChild(o); if (i < words.length - 1) el.appendChild(document.createTextNode(' ')); });
  return $$('.w', el);
}
async function startMotion() {
  if (reduced || !gsap) return;
  gsap.registerPlugin(ScrollTrigger);
  html.classList.add('motion-on');
  const D = 1.2, E = 'expo.out';
  await document.fonts.ready;
  const h1 = wordMask($('.hero h1'));
  gsap.set(h1, { yPercent: 115 });
  gsap.to(h1, { yPercent: 0, duration: D, ease: E, stagger: 0.08, delay: 0.1 });
  gsap.from('.hero .lead, .hero-ctas', { autoAlpha: 0, y: 18, duration: D, ease: E, delay: 0.5, stagger: 0.1 });
  gsap.from('.stage', { autoAlpha: 0, scale: 0.92, duration: D * 1.4, ease: E, delay: 0.2 });
  $$('[data-rv]').forEach(el => gsap.from(el, { autoAlpha: 0, y: 28, duration: D, ease: E, scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));
  const stones = $$('.stone', grid);
  gsap.set(stones, { clipPath: 'inset(0 0 100% 0)' });
  ScrollTrigger.create({ trigger: grid, start: 'top 85%', once: true, onEnter: () => gsap.to(stones, { clipPath: 'inset(0 0 0% 0)', duration: D, ease: E, stagger: 0.1 }) });
  $$('.step').forEach(st => gsap.fromTo(st, { opacity: 0.35 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: st, start: 'top 85%', end: 'top 55%', scrub: true } }));
  $$('.kin span').forEach((w, i) => gsap.fromTo(w, { xPercent: i % 2 ? 6 : -6 }, { xPercent: i % 2 ? -6 : 6, ease: 'none', scrollTrigger: { trigger: '.province', start: 'top bottom', end: 'bottom top', scrub: 1 } }));
  const h2 = wordMask($('.close h2'));
  gsap.set(h2, { yPercent: 115 });
  ScrollTrigger.create({ trigger: '.close', start: 'top 70%', once: true, onEnter: () => gsap.to(h2, { yPercent: 0, duration: D, ease: E, stagger: 0.1 }) });
}
startMotion();
