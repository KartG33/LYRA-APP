const KEY_DATA = 'lyra_last_file';
const KEY_NAME = 'lyra_last_name';

export function saveFile(jsonStr, filename) {
  try {
    localStorage.setItem(KEY_DATA, jsonStr);
    localStorage.setItem(KEY_NAME, filename);
  } catch (e) {
    console.warn('LYRA: localStorage save failed', e);
  }
}

export function loadSaved() {
  try {
    const data = localStorage.getItem(KEY_DATA);
    const name = localStorage.getItem(KEY_NAME) || 'restored.json';
    if (data) return { data: JSON.parse(data), name };
  } catch (e) {
    console.warn('LYRA: localStorage restore failed', e);
  }
  return null;
}

export function clearSaved() {
  try {
    localStorage.removeItem(KEY_DATA);
    localStorage.removeItem(KEY_NAME);
  } catch {}
}
