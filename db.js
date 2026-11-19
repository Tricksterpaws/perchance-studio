// Tiny IndexedDB wrapper shared by the page and the service worker.
const DB_NAME = 'perchance-studio';
const STORE = 'images';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    let result;
    Promise.resolve(fn(store)).then(r => { result = r; });
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
  });
}

function addImage(blob, prompt = '') {
  return tx('readwrite', s => { s.add({ blob, prompt, created: Date.now() }); });
}

function deleteImage(id) {
  return tx('readwrite', s => { s.delete(id); });
}

function allImages() {
  return tx('readonly', s => new Promise(res => {
    const r = s.getAll();
    r.onsuccess = () => res(r.result.sort((a, b) => b.created - a.created));
  }));
}
