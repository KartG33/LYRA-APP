let observer = null;

export function buildNav(pairs) {
  const navList = document.getElementById('nav-list');
  navList.innerHTML = '';

  pairs.forEach(({ artist, idx }) => {
    const item = document.createElement('div');
    item.className = 'nav-item';
    item.dataset.idx = idx;
    item.innerHTML = `
      <span class="nav-num">#${idx + 1}</span>
      <span class="nav-artist">${esc(artist || '—')}</span>
    `;
    item.addEventListener('click', () => {
      document.getElementById(`pair-${idx}`)?.scrollIntoView({ behavior: 'smooth' });
      closeSidebar();
    });
    navList.appendChild(item);
  });
}

export function initObserver() {
  if (observer) observer.disconnect();

  observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = entry.target.id.replace('pair-', '');
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const active = document.querySelector(`.nav-item[data-idx="${idx}"]`);
        if (active) {
          active.classList.add('active');
          active.scrollIntoView({ block: 'nearest' });
        }
      }
    });
  }, { rootMargin: '-15% 0px -70% 0px' });

  document.querySelectorAll('.pair').forEach(p => observer.observe(p));
}

export function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const bg = document.getElementById('burger');
  const ov = document.getElementById('overlay');
  const open = sb.classList.toggle('open');
  bg.classList.toggle('open', open);
  ov.classList.toggle('visible', open);
}

export function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('burger').classList.remove('open');
  document.getElementById('overlay').classList.remove('visible');
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
