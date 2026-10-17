// Preserve gallery filters and section links when following a previous /ar/ URL.
(() => {
  const destination = document.querySelector('meta[name="arabic-destination"]');
  if (!destination) return;
  const target = new URL(destination.content, location.href);
  if (target.origin !== location.origin) return;
  target.search = location.search;
  target.hash = location.hash;
  location.replace(target.href);
})();
