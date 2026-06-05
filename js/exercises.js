// ════════════════════════════════════════════════════════════
//  exercises.js — EGZERSİZ VERİSİ + FİLTRELEME
//  Veriyi data/exercises-fitness.json'dan yükler (fetch).
//  filterExercises saf fonksiyondur (test edilebilir).
// ════════════════════════════════════════════════════════════

// Kategori → Türkçe etiket
export const CAT_TR = {
  arms: 'Kol', core: 'Karın/Core', back: 'Sırt', glutes: 'Kalça',
  legs: 'Bacak', shoulders: 'Omuz', 'full-body': 'Tüm Vücut',
  chest: 'Göğüs', cardio: 'Kardiyo',
};
// Filtre sırası (pills)
export const CATEGORIES = ['arms', 'shoulders', 'chest', 'back', 'core', 'legs', 'glutes', 'full-body', 'cardio'];

// Egzersizleri yükle (yalnızca fitness branşı şimdilik)
export async function loadExercises() {
  const res = await fetch('./data/exercises-fitness.json');
  if (!res.ok) throw new Error('exercises fetch ' + res.status);
  const data = await res.json();
  return data.exercises || [];
}

// Saf filtreleme — kategori + ekipman + arama
export function filterExercises(list, f) {
  f = f || {};
  const q = (f.q || '').trim().toLowerCase();
  return list.filter(e => {
    if (f.cat && e.category !== f.cat) return false;
    if (f.equip && !(e.equipment || []).includes(f.equip)) return false;
    if (q && !((e.name_tr || '').toLowerCase().includes(q) ||
               (e.name_en || '').toLowerCase().includes(q))) return false;
    return true;
  });
}

// Listeden benzersiz ekipmanları çıkar (dropdown için)
export function uniqueEquipment(list) {
  const set = new Set();
  list.forEach(e => (e.equipment || []).forEach(q => set.add(q)));
  return [...set].sort();
}
