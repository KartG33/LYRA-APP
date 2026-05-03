const DB_KEY = 'lyra_files_v2';

function getDB() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
  } catch { return []; }
}

function saveDB(db) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) {
    console.warn('LYRA: localStorage save failed', e);
  }
}

export function saveFile(jsonStr, filename) {
  const db = getDB();
  const id = 'f_' + Date.now();
  // check duplicate name
  const existing = db.find(f => f.name === filename);
  if (existing) {
    existing.data = jsonStr;
    existing.savedAt = Date.now();
  } else {
    db.unshift({ id, name: filename, data: jsonStr, savedAt: Date.now() });
  }
  saveDB(db);
  return existing ? existing.id : id;
}

export function getFiles() {
  return getDB().map(f => ({ id: f.id, name: f.name, savedAt: f.savedAt }));
}

export function loadFile(id) {
  const db = getDB();
  const f = db.find(f => f.id === id);
  if (!f) return null;
  try { return { data: JSON.parse(f.data), name: f.name }; } catch { return null; }
}

export function deleteFile(id) {
  const db = getDB().filter(f => f.id !== id);
  saveDB(db);
}

export function getLastFileId() {
  const db = getDB();
  return db.length ? db[0].id : null;
}

// legacy compat
export function loadSaved() { return null; }
