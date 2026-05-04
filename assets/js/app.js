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
  if (fileInput.files.length) handleFiles(Array.from(fileInput.files));
});

const uploadScreen = document.getElementById('upload-screen');
uploadScreen.addEventListener('dragover', e => { e.preventDefault(); uploadScreen.classList.add('over'); });
uploadScreen.addEventListener('dragleave', () => uploadScreen.classList.remove('over'));
uploadScreen.addEventListener('drop', e => {
  e.preventDefault(); uploadScreen.classList.remove('over');
  const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.json'));
  if (files.length) handleFiles(files);
});

function countPairs(messages) {
  let n = 0;
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role==='user' && messages[i+1].role==='assistant') { n++; i++; }
  }
  return n;
}

// ── BATCH FILE HANDLER ───────────────────────────────────────
async function handleFiles(files) {
  if (!files.length) return;

  // show progress if more than 1 file
  const multi = files.length > 1;
  let toast = null;
  if (multi) {
    toast = showToast(`Загрузка 0 / ${files.length}...`);
  }

  let lastId = null;
  let errors = 0;

  for (let i = 0; i < files.length; i++) {
    if (toast) toast.setText(`Загрузка ${i + 1} / ${files.length}...`);
    try {
      const { id } = await readFile(files[i]);
      lastId = id;
    } catch {
      errors++;
    }
  }

  renderFileList();

  if (toast) toast.remove();
  if (errors) showToast(`⚠ Не удалось загрузить: ${errors} файл(ов)`, 3000);

  // open the last successfully loaded file
  if (lastId) {
    const saved = loadFile(lastId);
    if (saved) {
      loadData(saved.data, lastId);
      setTimeout(() => {
        document.querySelectorAll('.file-item-main').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.file-pairs').forEach(el => el.style.display = 'none');
        const main = document.querySelector(`.file-item-main[data-id="${lastId}"]`);
        const pn   = document.getElementById(`pairs-nav-${lastId}`);
        if (main) main.classList.add('active');
        if (pn)   pn.style.display = 'block';
      }, 60);
    }
  }
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const jsonStr = e.target.result;
        const data = JSON.parse(jsonStr);
        const pairCount = countPairs(data.messages || []);
        const id = saveFile(jsonStr, file.name, pairCount);
        resolve({ id, data });
      } catch { reject(new Error('parse error')); }
    };
    reader.onerror = () => reject(new Error('read error'));
    reader.readAsText(file);
  });
}

// ── TOAST ────────────────────────────────────────────────────
function showToast(text, autoDismiss = 0) {
  let el = document.getElementById('lyra-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'lyra-toast';
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.classList.add('visible');
  if (autoDismiss) setTimeout(() => el.classList.remove('visible'), autoDismiss);
  return {
    setText: t => { el.textContent = t; },
    remove:  () => el.classList.remove('visible'),
  };
}

// ── LOAD DATA ────────────────────────────────────────────────
function loadData(data, fileId) {
  const messages = data.messages || [];
  const exp = data.exportedAt ? new Date(data.exportedAt).toLocaleString('ru-RU') : '';
  const pairCount = countPairs(messages);

  // get display name from storage
  const saved = loadFile(fileId);
  const displayName = saved ? saved.name : '';

  document.getElementById('header-file').innerHTML =
    `<strong>${esc(displayName)}</strong> · ${pairCount} запрос${pairCount===1?'':'ов'}${exp?' · '+exp:''}`;

  const searchEl = document.getElementById('search-input');
  if (searchEl) searchEl.value = '';
  document.getElementById('search-count').style.display = 'none';

  const navData = renderPairs(messages);
  buildNav(navData, fileId);
  initObserver();

  uploadScreen.style.display = 'none';
  document.getElementById('pairs-container').style.display = 'block';
  document.getElementById('search-bar').style.display = 'flex';
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
    if (q) { searchCount.textContent = `${visible} найдено`; searchCount.style.display = 'inline'; }
    else searchCount.style.display = 'none';
  }, 180);
});
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') { searchInput.value = ''; filterPairs(''); searchCount.style.display = 'none'; }
});

// ── INIT ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initSidebar((data, _name, id) => loadData(data, id));

  const lastId = getLastFileId();
  if (lastId) {
    const saved = loadFile(lastId);
    if (saved) {
      loadData(saved.data, lastId);
      setTimeout(() => {
        const main = document.querySelector(`.file-item-main[data-id="${lastId}"]`);
        if (main) {
          main.classList.add('active');
          const pn = document.getElementById(`pairs-nav-${lastId}`);
          if (pn) pn.style.display = 'block';
        }
      }, 60);
    }
  }
});

document.getElementById('burger').addEventListener('click', toggleSidebar);
document.getElementById('overlay').addEventListener('click', closeSidebar);

// close move menus on doc click
document.addEventListener('click', () => {
  document.querySelectorAll('.move-menu.open').forEach(m => m.classList.remove('open'));
});

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
