import { renderPairs } from './render.js';
import { buildNav, initObserver, toggleSidebar, closeSidebar, initSidebar, renderFileList } from './sidebar.js';
import { saveFile, loadFile, getLastFileId } from './storage.js';

// ── PWA SERVICE WORKER ───────────────────────────────────────
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

// drag-drop on upload screen
const uploadScreen = document.getElementById('upload-screen');
uploadScreen.addEventListener('dragover', e => { e.preventDefault(); uploadScreen.classList.add('over'); });
uploadScreen.addEventListener('dragleave', () => uploadScreen.classList.remove('over'));
uploadScreen.addEventListener('drop', e => {
  e.preventDefault();
  uploadScreen.classList.remove('over');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      const id = saveFile(e.target.result, file.name);
      renderFileList();
      loadData(data, file.name, id);
      // activate sidebar item
      setTimeout(() => {
        const item = document.querySelector(`.file-item[data-id="${id}"] .file-item-main`);
        if (item) {
          document.querySelectorAll('.file-item-main').forEach(el => el.classList.remove('active'));
          item.classList.add('active');
          const pairsNav = document.getElementById(`pairs-nav-${id}`);
          if (pairsNav) {
            document.querySelectorAll('.file-pairs').forEach(el => el.style.display = 'none');
            pairsNav.style.display = 'block';
          }
        }
      }, 50);
    } catch {
      alert('Ошибка парсинга JSON');
    }
  };
  reader.readAsText(file);
}

// ── LOAD DATA ────────────────────────────────────────────────
let _currentFileId = null;

function loadData(data, filename, fileId) {
  _currentFileId = fileId;
  const messages = data.messages || [];
  const exp = data.exportedAt ? new Date(data.exportedAt).toLocaleString('ru-RU') : '';

  let pairCount = 0;
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') { pairCount++; i++; }
  }

  document.getElementById('header-file').innerHTML =
    `<strong>${esc(filename)}</strong> · ${pairCount} запрос${pairCount === 1 ? '' : 'ов'}${exp ? ' · ' + exp : ''}`;

  const navData = renderPairs(messages);
  buildNav(navData, fileId);
  initObserver();

  uploadScreen.style.display = 'none';
  document.getElementById('pairs-container').style.display = 'block';
}

// ── INIT ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initSidebar((data, name, id) => loadData(data, name, id));

  // auto-open last file
  const lastId = getLastFileId();
  if (lastId) {
    const saved = loadFile(lastId);
    if (saved) {
      loadData(saved.data, saved.name, lastId);
      setTimeout(() => {
        const item = document.querySelector(`.file-item[data-id="${lastId}"] .file-item-main`);
        if (item) {
          item.classList.add('active');
          const pairsNav = document.getElementById(`pairs-nav-${lastId}`);
          if (pairsNav) pairsNav.style.display = 'block';
        }
      }, 50);
    }
  }
});

// ── SIDEBAR ──────────────────────────────────────────────────
document.getElementById('burger').addEventListener('click', toggleSidebar);
document.getElementById('overlay').addEventListener('click', closeSidebar);

// ── UTIL ─────────────────────────────────────────────────────
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
