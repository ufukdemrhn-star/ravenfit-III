// ════════════════════════════════════════════════════════════
//  storage.js — KALICILIK KATMANI
//  Uygulamanın geri kalanı SADECE saveUser/loadUser/clearUser çağırır.
//  Bugün localStorage'a yazar. Auth fazında bu dosyanın İÇİ Firebase'e
//  döner; çağıran hiçbir yer değişmez (per-user buluta yazılır).
// ════════════════════════════════════════════════════════════

const KEY = 'ravenfit_user_v1';

// localStorage yoksa (ör. test ortamı / SSR) bellek-içi yedek
const mem = {};
const backend = (typeof localStorage !== 'undefined' && localStorage) ? localStorage : {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, val) => { mem[k] = val; },
  removeItem: (k) => { delete mem[k]; },
};

// Senkronlanacak tüm anahtarlar (bulut senkronu için)
export const KEYS = {
  user: 'ravenfit_user_v1',
  programs: 'ravenfit_programs_v1',
  measurements: 'ravenfit_measurements_v1',
  supp: 'ravenfit_supp_v1',
  history: 'ravenfit_history_v1',
};

// Kayıt sonrası tetiklenecek bulut-senkron geri çağrısı
let syncHandler = null;
export function setSyncHandler(cb) { syncHandler = cb; }
function fireSync() { if (syncHandler) { try { syncHandler(); } catch (e) {} } }

// Tüm anahtarları ham JSON string olarak topla (buluta yazmak için)
export function exportAll() {
  const o = {};
  for (const [k, key] of Object.entries(KEYS)) {
    const r = backend.getItem(key);
    if (r != null) o[k] = r;
  }
  return o;
}
// Buluttan gelen veriyi localStorage'a yaz (syncHandler TETİKLEMEZ — echo önler)
export function importAll(o) {
  for (const [k, key] of Object.entries(KEYS)) {
    if (o && o[k] != null) backend.setItem(key, o[k]);
    else backend.removeItem(key);
  }
}
// Tüm yerel veriyi sil (çıkışta)
export function clearAll() {
  for (const key of Object.values(KEYS)) backend.removeItem(key);
}

// Kullanıcı verisini kaydet
export function saveUser(obj) {
  try { backend.setItem(KEY, JSON.stringify(obj)); fireSync(); return true; }
  catch (e) { console.warn('saveUser hata:', e); return false; }
}

// Kayıtlı veriyi getir (yoksa null)
export function loadUser() {
  try { const raw = backend.getItem(KEY); return raw ? JSON.parse(raw) : null; }
  catch (e) { console.warn('loadUser hata:', e); return null; }
}

// Veriyi sil
export function clearUser() {
  try { backend.removeItem(KEY); return true; }
  catch (e) { return false; }
}

// Kayıtlı veri var mı?
export function hasUser() {
  return loadUser() !== null;
}

// ── Genel amaçlı JSON kayıt (programlar, ölçümler vb. için) ──
export function saveJSON(key, obj) {
  try { backend.setItem(key, JSON.stringify(obj)); fireSync(); return true; }
  catch (e) { return false; }
}
export function loadJSON(key) {
  try { const r = backend.getItem(key); return r ? JSON.parse(r) : null; }
  catch (e) { return null; }
}
export function removeJSON(key) {
  try { backend.removeItem(key); fireSync(); return true; } catch (e) { return false; }
}

// Test yardımcısı — gerçek veriyi KİRLETMEDEN round-trip doğrular
export function _roundTripTest(obj) {
  const TKEY = '__rf_roundtrip_test__';
  try {
    backend.setItem(TKEY, JSON.stringify(obj));
    const back = JSON.parse(backend.getItem(TKEY));
    backend.removeItem(TKEY);
    return back;
  } catch (e) { return null; }
}
