// ════════════════════════════════════════════════════════════
//  programs.js — HAZIR ANTRENMAN PROGRAMLARI
//  Her item bir egzersiz havuzu ID'sine referans verir (ex).
//  Kendi programını oluşturma 10b'de eklenecek.
// ════════════════════════════════════════════════════════════
export const PROGRAMS = [
  {
    id: 'fullbody-baslangic',
    name: 'Full Body — Başlangıç',
    desc: 'Haftada 3 gün, A/B dönüşümlü. Yeni başlayanlar için.',
    level: 'Başlangıç',
    days: [
      { name: 'A Günü', items: [
        { ex: 'leg-press', sets: 3, reps: '10-12' },
        { ex: 'bench-press', sets: 3, reps: '8-10' },
        { ex: 'barbell-row', sets: 3, reps: '8-10' },
        { ex: 'barbell-overhead-press', sets: 3, reps: '10' },
        { ex: 'plank', sets: 3, reps: '30 sn' },
      ] },
      { name: 'B Günü', items: [
        { ex: 'barbell-romanian-deadlift', sets: 3, reps: '8-10' },
        { ex: 'lat-pulldown-narrow-grip', sets: 3, reps: '10-12' },
        { ex: 'dumbbell-front-lunge', sets: 3, reps: '10' },
        { ex: 'barbell-curl', sets: 3, reps: '12' },
        { ex: 'tricep-pushdown', sets: 3, reps: '12' },
      ] },
    ],
  },
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    desc: 'İtiş / çekiş / bacak. Haftada 3-6 gün.',
    level: 'Orta',
    days: [
      { name: 'Push (İtiş)', items: [
        { ex: 'bench-press', sets: 4, reps: '6-8' },
        { ex: 'barbell-overhead-press', sets: 3, reps: '8-10' },
        { ex: 'cable-lateral-raise', sets: 3, reps: '15' },
        { ex: 'tricep-pushdown', sets: 3, reps: '12' },
      ] },
      { name: 'Pull (Çekiş)', items: [
        { ex: 'barbell-row', sets: 4, reps: '6-8' },
        { ex: 'lat-pulldown-narrow-grip', sets: 3, reps: '10' },
        { ex: 'machine-assisted-pull-up', sets: 3, reps: '8-10' },
        { ex: 'barbell-curl', sets: 3, reps: '12' },
      ] },
      { name: 'Legs (Bacak)', items: [
        { ex: 'leg-press', sets: 4, reps: '10' },
        { ex: 'barbell-romanian-deadlift', sets: 3, reps: '8' },
        { ex: 'dumbbell-front-lunge', sets: 3, reps: '10' },
        { ex: 'leg-press-machine-calf-raise', sets: 4, reps: '15' },
      ] },
    ],
  },
  {
    id: 'upper-lower',
    name: 'Upper / Lower',
    desc: 'Üst / alt vücut. Haftada 4 gün.',
    level: 'Orta',
    days: [
      { name: 'Üst Vücut', items: [
        { ex: 'bench-press', sets: 4, reps: '8' },
        { ex: 'barbell-row', sets: 4, reps: '8' },
        { ex: 'barbell-overhead-press', sets: 3, reps: '10' },
        { ex: 'barbell-curl', sets: 3, reps: '12' },
        { ex: 'tricep-pushdown', sets: 3, reps: '12' },
      ] },
      { name: 'Alt Vücut', items: [
        { ex: 'leg-press', sets: 4, reps: '10' },
        { ex: 'barbell-romanian-deadlift', sets: 3, reps: '8' },
        { ex: 'dumbbell-front-lunge', sets: 3, reps: '12' },
        { ex: 'leg-press-machine-calf-raise', sets: 4, reps: '15' },
        { ex: 'plank', sets: 3, reps: '45 sn' },
      ] },
    ],
  },
];
