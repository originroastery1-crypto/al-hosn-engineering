(() => {
  const section = document.getElementById('designs');
  if (!section) return;
  const grid = section.querySelector('.design-grid');
  const cards = [...grid.querySelectorAll('.design-card')];
  const buttons = [...section.querySelectorAll('[data-gallery-filter]')];
  const toolbar = section.querySelector('.gallery-toolbar');
  const status = section.querySelector('.gallery-count');
  const viewer = section.querySelector('.design-viewer');
  const closeButton = viewer.querySelector('.viewer-close');
  const image = viewer.querySelector('.viewer-image');
  const media = viewer.querySelector('.viewer-media');
  const zoomButton = viewer.querySelector('.viewer-zoom');
  const title = viewer.querySelector('#viewer-title');
  const description = viewer.querySelector('#viewer-description');
  const counter = viewer.querySelector('.viewer-count');
  const rtl = document.documentElement.dir === 'rtl';
  const numbers = new Intl.NumberFormat(rtl ? 'ar' : 'en');
  let current = 0;
  let opener = null;
  const visibleCards = () => cards.filter(card => !card.hidden);
  function zoom(enabled) {
    media.classList.toggle('is-zoomed', enabled);
    zoomButton.setAttribute('aria-pressed', String(enabled));
    zoomButton.textContent = rtl ? (enabled ? 'تصغير الصورة' : 'تكبير الصورة') : (enabled ? 'Zoom out' : 'Zoom in');
    media.scrollTop = 0;
    media.scrollLeft = 0;
  }

  function filter(type, updateURL) {
    const selected = ['villa', 'tower'].includes(type) ? type : 'all';
    cards.forEach(card => card.hidden = selected !== 'all' && card.dataset.designType !== selected);
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.galleryFilter === selected)));
    grid.dataset.filter = selected;
    status.textContent = `${numbers.format(visibleCards().length)} ${rtl ? 'تصاميم' : 'designs'}`;
    if (updateURL) {
      const url = new URL(location.href);
      if (selected === 'all') url.searchParams.delete('gallery');
      else url.searchParams.set('gallery', selected);
      history.replaceState(null, '', url);
      window.dispatchEvent(new Event('galleryfilterchange'));
    }
  }

  function show(index) {
    const visible = visibleCards();
    current = (index + visible.length) % visible.length;
    const card = visible[current];
    const original = card.querySelector('img');
    zoom(false);
    media.dataset.orientation = Number(original.getAttribute('width')) > Number(original.getAttribute('height')) ? 'landscape' : 'portrait';
    media.style.setProperty('--image-width', `${original.getAttribute('width')}px`);
    image.src = original.currentSrc || original.src;
    image.alt = original.alt;
    title.textContent = card.querySelector('h3').textContent;
    description.textContent = card.querySelector('figcaption p').textContent;
    counter.textContent = `${numbers.format(current + 1)} / ${numbers.format(visible.length)}`;
  }

  toolbar.hidden = false;
  filter(new URL(location.href).searchParams.get('gallery'), false);
  buttons.forEach(button => button.addEventListener('click', () => filter(button.dataset.galleryFilter, true)));
  window.addEventListener('popstate', () => filter(new URL(location.href).searchParams.get('gallery'), false));

  if (typeof viewer.showModal !== 'function') return;
  cards.forEach(card => card.querySelectorAll('[data-open-design]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      show(visibleCards().indexOf(card));
      viewer.showModal();
      document.body.classList.add('viewer-open');
      closeButton.focus();
    });
  }));
  closeButton.addEventListener('click', () => viewer.close());
  zoomButton.addEventListener('click', () => zoom(zoomButton.getAttribute('aria-pressed') !== 'true'));
  viewer.querySelector('.viewer-previous').addEventListener('click', () => show(current - 1));
  viewer.querySelector('.viewer-next').addEventListener('click', () => show(current + 1));
  // Recognize a deliberate one-finger horizontal swipe. Let the browser handle
  // vertical scrolling, pinch gestures, and panning a zoomed image.
  let swipe = null;
  const resetSwipe = () => { swipe = null; };
  media.addEventListener('touchstart', event => {
    resetSwipe();
    if (event.touches.length !== 1 || media.classList.contains('is-zoomed')) return;
    const touch = event.touches[0];
    swipe = { id: touch.identifier, x: touch.clientX, y: touch.clientY, time: event.timeStamp };
  }, { passive: true });
  media.addEventListener('touchmove', event => {
    if (!swipe) return;
    if (event.touches.length !== 1) return resetSwipe();
    const touch = event.touches[0];
    if (touch.identifier !== swipe.id) return resetSwipe();
    const dx = Math.abs(touch.clientX - swipe.x);
    const dy = Math.abs(touch.clientY - swipe.y);
    if (dy > 12 && dy > dx) resetSwipe();
  }, { passive: true });
  media.addEventListener('touchcancel', resetSwipe, { passive: true });
  media.addEventListener('touchend', event => {
    const gesture = swipe;
    resetSwipe();
    if (!gesture || event.touches.length || !viewer.open || media.classList.contains('is-zoomed')) return;
    const touch = [...event.changedTouches].find(touch => touch.identifier === gesture.id);
    if (!touch) return;
    const dx = touch.clientX - gesture.x;
    const dy = touch.clientY - gesture.y;
    const threshold = Math.min(72, Math.max(44, media.clientWidth * 0.14));
    if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.35 || event.timeStamp - gesture.time > 800) return;
    show(current + ((rtl ? dx > 0 : dx < 0) ? 1 : -1));
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      image.animate([
        { opacity: 0.65, transform: `translateX(${dx < 0 ? 18 : -18}px)` },
        { opacity: 1, transform: 'translateX(0)' }
      ], { duration: 180, easing: 'ease-out' });
    }
  }, { passive: true });
  viewer.addEventListener('close', resetSwipe);
  viewer.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      const controls = [...viewer.querySelectorAll('button:not([disabled])')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const forward = rtl ? event.key === 'ArrowLeft' : event.key === 'ArrowRight';
      show(current + (forward ? 1 : -1));
    }
  });
  viewer.addEventListener('click', event => {
    if (event.target !== viewer) return;
    const rect = viewer.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) viewer.close();
  });
  viewer.addEventListener('close', () => {
    document.body.classList.remove('viewer-open');
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  });
})();
