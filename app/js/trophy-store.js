// trophy-store.js — earned-trophy progress, kept in the browser's localStorage.
// Progress is a set of trophy ids plus the spoiler-shield preference. Nothing
// leaves the machine: export downloads a JSON file, import reads one back.
const PROGRESS_KEY = 'leonida-ledger-v3-progress';
const SHIELD_KEY = 'leonida-ledger-v3-spoiler-shield';

export function loadEarned() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(ids) ? ids.filter((n) => Number.isInteger(n)) : []);
  } catch {
    return new Set();
  }
}

export function saveEarned(earned) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
  } catch {
    /* storage full or blocked: progress simply will not persist */
  }
}

export function loadShield() {
  try {
    return localStorage.getItem(SHIELD_KEY) === 'on';
  } catch {
    return false;
  }
}

export function saveShield(on) {
  try {
    localStorage.setItem(SHIELD_KEY, on ? 'on' : 'off');
  } catch {
    /* ignore */
  }
}

export function exportProgress(earned) {
  const payload = {
    app: 'leonida-ledger',
    edition: 'week-one-v3',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-ledger-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function parseImportedProgress(text) {
  const data = JSON.parse(text);
  const ids = Array.isArray(data) ? data : data.earned;
  if (!Array.isArray(ids)) throw new Error('no earned list in file');
  return new Set(ids.filter((n) => Number.isInteger(n)));
}
