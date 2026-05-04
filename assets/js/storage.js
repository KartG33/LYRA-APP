const DB_KEY  = 'lyra_files_v3';
const LIB_KEY = 'lyra_libs_v1';

// ── DB HELPERS ───────────────────────────────────────────────
function getDB() {
  try { return JSON.parse(localStorage.getItem(DB_KEY) || '[]'); }
  catch { return []; }
}
function saveDB(db) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
  catch(e) { console.warn('LYRA storage:', e); }
}

function getLibDB() {
  try { return JSON.parse(localStorage.getItem(LIB_KEY) || '[]'); }
  catch { return []; }
}
function saveLibDB(db) {
  try { localStorage.setItem(LIB_KEY, JSON.stringify(db)); }
  catch(e) { console.warn('LYRA lib storage:', e); }
}

// ── AUTO NAME ────────────────────────────────────────────────
function autoName(parsed) {
  let d;
  try { d = parsed.exportedAt ? new Date(parsed.exportedAt) : new Date(); }
  catch { d = new Date(); }

  const dd   = String(d.getDate()).padStart(2,'0');
  const mm   = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  const hh   = String(d.getHours()).padStart(2,'0');
  const min  = String(d.getMinutes()).padStart(2,'0');

  // extract first artist_name from first user message
  let artist = '';
  try {
    const messages = parsed.messages || [];
    const firstUser = messages.find(m => m.role === 'user');
    if (firstUser) {
      const match = firstUser.content.match(/artist[_\s]name\s*:\s*([^,\n]+)/i);
      if (match) artist = match[1].trim();
    }
  } catch {}

  const base = `${dd}.${mm}.${yyyy} · ${hh}:${min}`;
  return artist ? `${base} · ${artist}` : base;
}

// ── CHAT FINGERPRINT ─────────────────────────────────────────
// Hash of the first user message content — identifies same chat
function fingerprint(parsed) {
  try {
    const messages = parsed.messages || [];
    const firstUser = messages.find(m => m.role === 'user');
    if (!firstUser) return null;
    // simple djb2 hash
    let h = 5381;
    const s = firstUser.content.slice(0, 500);
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) + h) ^ s.charCodeAt(i);
      h = h >>> 0;
    }
    return h.toString(36);
  } catch { return null; }
}

// ── FILES API ────────────────────────────────────────────────
export function saveFile(jsonStr, _originalFilename, pairCount) {
  const db = getDB();
  let parsed;
  try { parsed = JSON.parse(jsonStr); } catch { parsed = {}; }

  const fp = fingerprint(parsed);

  // check for same chat (same fingerprint = same chat, just re-exported)
  if (fp) {
    const existing = db.find(f => f.fp === fp);
    if (existing) {
      // auto-replace: update data, pairCount, savedAt — keep name, libId, id
      existing.data      = jsonStr;
      existing.pairCount = pairCount || existing.pairCount;
      existing.savedAt   = Date.now();
      // move to top
      const idx = db.indexOf(existing);
      db.splice(idx, 1);
      db.unshift(existing);
      saveDB(db);
      return existing.id;
    }
  }

  const id   = 'f_' + Date.now();
  const name = autoName(parsed);
  db.unshift({ id, name, data: jsonStr, savedAt: Date.now(), pairCount: pairCount || 0, libId: null, fp: fp || id });
  saveDB(db);
  return id;
}

export function getFiles() {
  return getDB().map(({ id, name, savedAt, pairCount, libId }) => ({ id, name, savedAt, pairCount: pairCount||0, libId: libId||null }));
}

export function loadFile(id) {
  const f = getDB().find(f => f.id === id);
  if (!f) return null;
  try { return { data: JSON.parse(f.data), name: f.name }; }
  catch { return null; }
}

export function deleteFile(id) {
  saveDB(getDB().filter(f => f.id !== id));
}

export function renameFile(id, newName) {
  const db = getDB();
  const f = db.find(f => f.id === id);
  if (f) { f.name = newName; saveDB(db); }
}

export function moveFileToLib(fileId, libId) {
  const db = getDB();
  const f = db.find(f => f.id === fileId);
  if (f) { f.libId = libId || null; saveDB(db); }
}

export function getLastFileId() {
  const db = getDB();
  return db.length ? db[0].id : null;
}

// ── LIBRARIES API ────────────────────────────────────────────
export function getLibraries() {
  return getLibDB();
}

export function createLibrary(name) {
  const db = getLibDB();
  const id = 'lib_' + Date.now();
  db.push({ id, name, createdAt: Date.now() });
  saveLibDB(db);
  return id;
}

export function renameLibrary(id, newName) {
  const db = getLibDB();
  const lib = db.find(l => l.id === id);
  if (lib) { lib.name = newName; saveLibDB(db); }
}

export function deleteLibrary(id) {
  // unassign files from this library
  const db = getDB();
  db.forEach(f => { if (f.libId === id) f.libId = null; });
  saveDB(db);
  saveLibDB(getLibDB().filter(l => l.id !== id));
}

export function loadSaved() { return null; }
