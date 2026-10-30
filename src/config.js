// EVERY REAL WORLD VALUE LIVES HERE. Each line says where the fact came from. A value nobody has confirmed is
// null and the site prints nothing for it. Nothing on the page is invented to fill a gap.
export const SITE = {
  // THE WORKING NAME. Ten candidates with free .coms are in ~/Downloads/GEM-HOUSE-BRIEF.md (30 Oct 2026).
  // Change this one line and the whole page follows: title, mark, footer, share card, WhatsApp greeting.
  name: 'The Island Cut',
  short: 'Island Cut',
  tagline: 'Ceylon sapphires, cut on the island they came from',
  description: 'Loose Ceylon sapphires and finished pieces from a house in Sri Lanka. Every stone turns in daylight on a video call, with its report in frame, before anyone talks about money.',
  // DEMO LINE: Business Booster's own WhatsApp (bb-site, 30 Oct 2026). Replace with the house's number before launch.
  whatsapp: '94767412531',
  instagram: null,          // the house's handle, once given
  houseLine: null,          // the family, the generation and the bench, in the house's own words, once given
  founderName: null,
  robots: 'noindex,nofollow', // a demo must never compete with the house in Google. Flip at launch.
  themeDark: '#091228',
  themeLight: '#f6f3ee',
};
export const LINKS = [
  { href: '#stones', label: 'The stones' },
  { href: '#set', label: 'Set a stone' },
  { href: '#buy', label: 'How to buy' },
  { href: '#province', label: 'The province' },
];
// Ring sizes, US scale, inside diameter in mm (the trade's standard table, rounded to one decimal).
export const RING_SIZES = [[4, 14.9], [5, 15.7], [6, 16.5], [7, 17.3], [8, 18.1], [9, 19.0], [10, 19.8]];
export const METALS = [
  { key: 'platinum', label: 'Platinum', hex: '#d8dadf' },
  { key: 'yellow', label: '18k yellow gold', hex: '#d9a942' },
  { key: 'white', label: '18k white gold', hex: '#e4e4e0' },
  { key: 'rose', label: '18k rose gold', hex: '#d7a089' },
];
export const PIECES = [
  { key: 'ring', label: 'Ring' },
  { key: 'pendant', label: 'Pendant' },
  { key: 'earrings', label: 'Earrings' },
];
export const wa = text => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
