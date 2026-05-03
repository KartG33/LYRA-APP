const DB_KEY = 'lyra_files_v2';

function getDB() {
  try { return JSON.parse(localStorage.getItem(DB_KEY) || '[]'); }
  catch { return []; }
}

function saveDB(db) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
  catch (e) { console.warn('LYRA: localStorage save failed', e); }
}

export function saveFile(jsonStr, filename, pairCount) {
  const db = getDB();
  const existing = db.find(f => f.name === filename);
  if (existing) {
    existing.data = jsonStr;
    existing.savedAt = Date.now();
    existing.pairCount = pairCount || existing.pairCount;
    saveDB(db);
    return existing.id;
  }
  const id = 'f_' + Date.now();
  db.unshift({ id, name: filename, data: jsonStr, savedAt: Date.now(), pairCount: pairCount || 0 });
  saveDB(db);
  return id;
}

export function getFiles() {
  return getDB().map(f => ({ id: f.id, name: f.name, savedAt: f.savedAt, pairCount: f.pairCount || 0 }));
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

export function getLastFileId() {
  const db = getDB();
  return db.length ? db[0].id : null;
}

export function loadSaved() { return null; }
