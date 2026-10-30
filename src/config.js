// EVERY REAL WORLD VALUE LIVES HERE. Each line says where the fact came from. A value nobody has confirmed is
// null and the site prints nothing for it. Nothing on the page is invented to fill a gap.
export const SITE = {
  // THE WORKING NAME, kept by Thulaib on 30 Oct 2026 (bb_pending 916). Change this one line and the page follows.
  name: 'The Island Cut',
  tagline: 'A gem house in Sri Lanka',
  description: 'Loose Ceylon sapphires with a report you can check and finished pieces built around them. Every stone is shown in daylight on a video call before anyone talks about money.',
  // DEMO LINE: Business Booster's own WhatsApp. Replace with the house's number before launch (bb_pending 917).
  whatsapp: '94767412531',
  instagram: null,          // the house's handle, once given
  houseLine: null,          // the house's own words, once given (918 to 921 hold the open questions)
  robots: 'noindex,nofollow', // a demo must never compete with the house in Google. Flip at launch.
  theme: '#f4efe7',
  // The house works on Colombo time. Sri Lanka keeps +05:30 all year, so the sheet can state it without a table.
  zone: 'Asia/Colombo',
  // Viewing slots a specialist offers, Colombo clock, 24 hour. The house confirms its real hours before launch.
  slots: ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'],
};
export const LINKS = [
  { href: '#stones', label: 'Gemstones' },
  { href: '#jewellery', label: 'Jewellery' },
  { href: '#bespoke', label: 'Bespoke' },
  { href: '#craft', label: 'Our Craft' },
  { href: '#contact', label: 'Contact' },
];
// The four views the viewing room offers. Only media the house has captured is ever shown.
export const VIEWS = [
  { key: 'daylight', label: 'Daylight', icon: 'sun' },
  { key: 'indoor', label: 'Indoor light', icon: 'lamp' },
  { key: 'macro', label: 'Macro', icon: 'macro' },
  { key: 'rotation', label: 'Rotation', icon: 'rotate' },
];
export const wa = text => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
