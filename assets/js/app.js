import { renderPairs, filterPairs } from './render.js';
import { buildNav, initObserver, toggleSidebar, closeSidebar, initSidebar, renderFileList } from './sidebar.js';
import { saveFile, loadFile, getLastFileId } from './storage.js';

// ── PWA ──────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/LYRA-APP/sw.js').catch(() => {});
  });
}

// ── FILE INPUT ───────────────────────────────────────────────
const fileInput = document.getElementById('file-input');
document.getElementById('btn-load').addEventListener('click', () => fileInput.click());
document.getElementById('btn-upload').addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

const uploadScreen = document.getElementById('upload-screen');
uploadScreen.addEventListener('dragover', e => { e.preventDefault(); uploadScreen.classList.add('over'); });
uploadScreen.addEventListener('dragleave', () => uploadScreen.classList.remove('over'));
uploadScreen.addEventListener('drop', e => {
  e.preventDefault(); uploadScreen.classList.remove('over');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

function countPairs(messages) {
  let n = 0;
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === 'user' && messages[i+1].role === 'assistant') { n++; i++; }
  }
  return n;
}

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      const pairCount = countPairs(data.messages || []);
      const id = saveFile(e.target.result, file.name, pairCount);
      renderFileList();
      loadData(data, file.name, id);
      activateSidebarFile(id);
    } catch { alert('Ошибка парсинга JSON'); }
  };
  reader.readAsText(file);
}

// ── LOAD DATA ────────────────────────────────────────────────
function loadData(data, filename, fileId) {
  const messages = data.messages || [];
  const exp = data.exportedAt ? new Date(data.exportedAt).toLocaleString('ru-RU') : '';
  const pairCount = countPairs(messages);

  document.getElementById('header-file').innerHTML =
    `<strong>${esc(filename)}</strong> · ${pairCount} запрос${pairCount === 1 ? '' : 'ов'}${exp ? ' · ' + exp : ''}`;

  // clear search
  const searchEl = document.getElementById('search-input');
  if (searchEl) searchEl.value = '';

  const navData = renderPairs(messages);
  buildNav(navData, fileId);
  initObserver();

  uploadScreen.style.display = 'none';
  document.getElementById('pairs-container').style.display = 'block';
  document.getElementById('search-bar').style.display = 'flex';
}

function activateSidebarFile(id) {
  setTimeout(() => {
    document.querySelectorAll('.file-item-main').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.file-pairs').forEach(el => el.style.display = 'none');
    const main = document.querySelector(`.file-item[data-id="${id}"] .file-item-main`);
    const nav  = document.getElementById(`pairs-nav-${id}`);
    if (main) main.classList.add('active');
    if (nav)  nav.style.display = 'block';
  }, 50);
}

// ── SEARCH ───────────────────────────────────────────────────
const searchInput = document.getElementById('search-input');
const searchCount = document.getElementById('search-count');

let searchTimer = null;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const q = searchInput.value;
    const visible = filterPairs(q);
    if (q) {
      searchCount.textContent = `${visible} найдено`;
      searchCount.style.display = 'inline';
    } else {
      searchCount.style.display = 'none';
    }
  }, 180);
});

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') { searchInput.value = ''; filterPairs(''); searchCount.style.display = 'none'; }
});

// ── INIT ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initSidebar((data, name, id) => loadData(data, name, id));

  const lastId = getLastFileId();
  if (lastId) {
    const saved = loadFile(lastId);
    if (saved) { loadData(saved.data, saved.name, lastId); activateSidebarFile(lastId); }
  }
});

document.getElementById('burger').addEventListener('click', toggleSidebar);
document.getElementById('overlay').addEventListener('click', closeSidebar);

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
