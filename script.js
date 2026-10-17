const menu = document.querySelector('.menu');
const nav = document.querySelector('.main-nav') || document.querySelector('nav');
const arabic = document.documentElement.lang === 'ar';
function setMenu(open) {
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', arabic ? (open ? 'إغلاق القائمة' : 'فتح القائمة') : (open ? 'Close navigation' : 'Open navigation'));
  nav.classList.toggle('open', open);
}
if (menu && nav) {
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menu.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!nav.contains(event.target) && !menu.contains(event.target)) setMenu(false);
  });
  window.matchMedia('(min-width: 1001px)').addEventListener('change', () => setMenu(false));
}

// Keep links shared before the five-page redesign useful.
if (document.body.dataset.page === 'index') {
  const legacySections = { '#about': 'about.html', '#expertise': 'services.html', '#approach': 'services.html#process', '#designs': 'projects.html#designs', '#contact': 'contact.html' };
  const destination = legacySections[location.hash];
  if (destination) {
    const target = new URL(destination, location.href);
    const category = new URL(location.href).searchParams.get('gallery');
    if (location.hash === '#designs' && ['villa', 'tower'].includes(category)) target.searchParams.set('gallery', category);
    location.replace(target.href);
  }
}
document.querySelectorAll('#year').forEach(e => e.textContent = new Date().getFullYear());
