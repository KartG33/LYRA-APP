import { renderPairs } from './render.js';
import { buildNav, initObserver, toggleSidebar, closeSidebar } from './sidebar.js';
import { saveFile, loadSaved } from './storage.js';

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
      saveFile(e.target.result, file.name);
      loadData(data, file.name);
    } catch {
      alert('Ошибка парсинга JSON');
    }
  };
  reader.readAsText(file);
}

// ── LOAD DATA ────────────────────────────────────────────────
function loadData(data, filename) {
  const messages = data.messages || [];
  const exp = data.exportedAt ? new Date(data.exportedAt).toLocaleString('ru-RU') : '';

  // count pairs
  let pairCount = 0;
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') { pairCount++; i++; }
  }

  document.getElementById('header-file').innerHTML =
    `<strong>${esc(filename)}</strong> · ${pairCount} запрос${pairCount === 1 ? '' : 'ов'} · ${exp}`;

  const navData = renderPairs(messages);
  buildNav(navData);
  initObserver();

  uploadScreen.style.display = 'none';
  document.getElementById('pairs-container').style.display = 'block';
}

// ── AUTO-RESTORE ─────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const saved = loadSaved();
  if (saved) loadData(saved.data, saved.name);
});

// ── SIDEBAR ──────────────────────────────────────────────────
document.getElementById('burger').addEventListener('click', toggleSidebar);
document.getElementById('overlay').addEventListener('click', closeSidebar);

// ── UTIL ─────────────────────────────────────────────────────
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
