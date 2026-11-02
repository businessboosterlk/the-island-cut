export function initAtelier() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Content stays readable without JS; animate only once, as each chapter arrives.
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      entry.target.animate([
        { opacity: 0, transform: 'translateY(26px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 850, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'none' });
    }
  }, { threshold: .12 });
  document.querySelectorAll('[data-atelier-reveal]').forEach(el => observer.observe(el));
  document.querySelectorAll('.atelier-questions details').forEach(detail => {
    detail.addEventListener('toggle', () => {
      if (detail.open) detail.querySelector('p').animate([
        { opacity: 0, transform: 'translateY(-6px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 300, easing: 'ease-out' });
    });
  });
}
