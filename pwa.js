// Minimal PWA + offline storage helpers (vanilla IndexedDB)
(function () {
  const DB_NAME = 'equipment_inspection';
  const DB_VERSION = 1;
  const INSPECTIONS = 'inspections';
  const PHOTOS = 'photos';

  function uuid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    // Fallback
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(INSPECTIONS)) {
          db.createObjectStore(INSPECTIONS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(PHOTOS)) {
          db.createObjectStore(PHOTOS, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function savePhoto(file) {
    const db = await openDB();
    const id = uuid();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTOS, 'readwrite');
      tx.objectStore(PHOTOS).put({ id, blob: file, type: file.type, createdAt: new Date().toISOString() });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    return id;
  }

  async function getPhoto(photoId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTOS, 'readonly');
      const req = tx.objectStore(PHOTOS).get(photoId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function getPhotoUrl(photoId) {
    const rec = await getPhoto(photoId);
    if (!rec) return null;
    return URL.createObjectURL(rec.blob);
  }

  async function saveInspection(record) {
    const db = await openDB();
    const now = new Date().toISOString();
    const withId = { id: record.id || uuid(), createdAt: record.createdAt || now, updatedAt: now, ...record };
    await new Promise((resolve, reject) => {
      const tx = db.transaction(INSPECTIONS, 'readwrite');
      tx.objectStore(INSPECTIONS).put(withId);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    return withId.id;
  }

  async function getInspection(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(INSPECTIONS, 'readonly');
      const req = tx.objectStore(INSPECTIONS).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function listInspections() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(INSPECTIONS, 'readonly');
      const store = tx.objectStore(INSPECTIONS);
      const req = store.getAll ? store.getAll() : null;
      if (req) {
        req.onsuccess = () => {
          const arr = req.result || [];
          arr.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          resolve(arr);
        };
        req.onerror = () => reject(req.error);
      } else {
        // Fallback if getAll not supported
        const out = [];
        store.openCursor().onsuccess = e => {
          const cursor = e.target.result;
          if (cursor) {
            out.push(cursor.value);
            cursor.continue();
          } else {
            out.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
            resolve(out);
          }
        };
        tx.onerror = () => reject(tx.error);
      }
    });
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    }
  }

  window.AppStorage = {
    uuid,
    savePhoto,
    getPhoto,
    getPhotoUrl,
    saveInspection,
    getInspection,
    listInspections,
    registerServiceWorker,
  };

  // Auto-register SW on load
  try { registerServiceWorker(); } catch (e) {}
})();

