// THE ONE PLACE AN ICON IS WRITTEN. Every icon is a symbol in assets/icons.svg, built by scripts/build-icons.mjs
// from Lucide and Simple Icons. Nothing on this site types icon path data by hand.
export const BASE = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
export const url = p => BASE + String(p || '').replace(/^\//, '');
const SPRITE = url('assets/icons.svg');
export const icon = (name, cls = '') => `<svg class="ic${name.startsWith('b-') ? ' b' : ''}${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false"><use href="${SPRITE}#${name}"></use></svg>`;
