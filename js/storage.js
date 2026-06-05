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

// Kullanıcı verisini kaydet
export function saveUser(obj) {
  try { backend.setItem(KEY, JSON.stringify(obj)); return true; }
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
