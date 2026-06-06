// ════════════════════════════════════════════════════════════
//  exercises.js — EGZERSİZ VERİSİ (ÇOKLU BRANŞ) + FİLTRELEME
// ════════════════════════════════════════════════════════════

export const BRANCHES = [
  { key: 'fitness',  label: '🏋️ Fitness', file: './data/exercises-fitness.json' },
  { key: 'swimming', label: '🏊 Yüzme',   file: './data/exercises-swimming.json' },
  { key: 'posture',  label: '🧘 Postür',  file: './data/exercises-posture.json' },
];

// Kategori → Türkçe etiket (fitness; diğer branşlarda ham değer kullanılır)
export const CAT_TR = {
  arms: 'Kol', core: 'Karın/Core', back: 'Sırt', glutes: 'Kalça',
  legs: 'Bacak', shoulders: 'Omuz', 'full-body': 'Tüm Vücut',
  chest: 'Göğüs', cardio: 'Kardiyo',
  // yüzme
  conditioning: 'Kondisyon', drill: 'Teknik Çalışma', endurance: 'Dayanıklılık',
  kick: 'Ayak Vuruşu', pull: 'Kulaç', speed: 'Hız', technique: 'Teknik',
  // postür
  kyphosis: 'Kifoz', 'lower-back': 'Bel', mobility: 'Mobilite',
  neck: 'Boyun', 'scoliosis-support': 'Skolyoz Destek',
};

// Bir branşın egzersizlerini yükle
export async function loadExercises(branch) {
  const b = BRANCHES.find(x => x.key === (branch || 'fitness')) || BRANCHES[0];
  const res = await fetch(b.file);
  if (!res.ok) throw new Error('exercises fetch ' + res.status);
  const data = await res.json();
  return data.exercises || (Array.isArray(data) ? data : []);
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

export function uniqueEquipment(list) {
  const s = new Set();
  list.forEach(e => (e.equipment || []).forEach(q => s.add(q)));
  return [...s].sort();
}
export function uniqueCategories(list) {
  const s = new Set();
  list.forEach(e => { if (e.category) s.add(e.category); });
  return [...s].sort();
}
