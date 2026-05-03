import { getFiles, loadFile, deleteFile } from './storage.js';
import { filterPairs } from './render.js';

let observer = null;
let _onFileSelect = null;
let _currentFileId = null;

export function initSidebar(onFileSelect) {
  _onFileSelect = onFileSelect;
  renderFileList();
}

export function renderFileList() {
  const files = getFiles();
  const navList = document.getElementById('nav-list');
  navList.innerHTML = '';

  if (!files.length) {
    navList.innerHTML = `<div class="nav-empty">Нет сохранённых файлов</div>`;
    return;
  }

  files.forEach(f => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.dataset.id = f.id;

    const date = new Date(f.savedAt).toLocaleDateString('ru-RU', { day:'2-digit', month:'2-digit' });
    const shortName = f.name.replace(/\.json$/i, '').slice(0, 26);
    const count = f.pairCount != null ? f.pairCount : '';

    item.innerHTML = `
      <div class="file-item-main" data-id="${f.id}">
        <span class="file-icon">▸</span>
        <div class="file-info">
          <div class="file-name">${esc(shortName)}</div>
          <div class="file-meta">${date}${count ? ` · ${count} зап.` : ''}</div>
        </div>
        <button class="file-del" data-id="${f.id}" title="Удалить">✕</button>
      </div>
      <div class="file-pairs" id="pairs-nav-${f.id}" style="display:none"></div>
    `;

    item.querySelector('.file-item-main').addEventListener('click', (e) => {
      if (e.target.classList.contains('file-del')) return;
      selectFile(f.id, item);
    });

    item.querySelector('.file-del').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Удалить "${f.name}"?`)) {
        deleteFile(f.id);
        renderFileList();
      }
    });

    navList.appendChild(item);
  });
}

function selectFile(id, itemEl) {
  document.querySelectorAll('.file-item-main').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.file-pairs').forEach(el => el.style.display = 'none');
  itemEl.querySelector('.file-item-main').classList.add('active');
  const pairsNav = itemEl.querySelector('.file-pairs');
  pairsNav.style.display = 'block';

  _currentFileId = id;
  const saved = loadFile(id);
  if (saved && _onFileSelect) _onFileSelect(saved.data, saved.name, id);
}

export function buildNav(pairs, fileId) {
  const pairsNav = document.getElementById(`pairs-nav-${fileId}`);
  if (!pairsNav) return;

  // Build artist filter list
  const artists = [...new Set(pairs.map(p => p.artist).filter(Boolean))];

  let filterHTML = '';
  if (artists.length > 1) {
    filterHTML = `
      <div class="artist-filter">
        <span class="artist-chip active" data-artist="">все</span>
        ${artists.map(a => `<span class="artist-chip" data-artist="${esc(a.toLowerCase())}">${esc(a)}</span>`).join('')}
      </div>`;
  }

  pairsNav.innerHTML = filterHTML;

  pairs.forEach(({ artist, idx }) => {
    const item = document.createElement('div');
    item.className = 'nav-item';
    item.dataset.idx = idx;
    item.dataset.artist = (artist || '').toLowerCase();
    item.innerHTML = `
      <span class="nav-num">#${idx + 1}</span>
      <span class="nav-artist">${esc(artist || '—')}</span>
    `;
    item.addEventListener('click', () => {
      document.getElementById(`pair-${idx}`)?.scrollIntoView({ behavior: 'smooth' });
      closeSidebar();
    });
    pairsNav.appendChild(item);
  });

  // Artist chip filter
  pairsNav.querySelectorAll('.artist-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      pairsNav.querySelectorAll('.artist-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const artist = chip.dataset.artist;
      pairsNav.querySelectorAll('.nav-item').forEach(item => {
        item.style.display = (!artist || item.dataset.artist === artist) ? '' : 'none';
      });
    });
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
        if (active) { active.classList.add('active'); active.scrollIntoView({ block: 'nearest' }); }
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
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
