// ════════════════════════════════════════════════════════════
//  selftest.js — MATEMATİĞİN SİGORTASI
//  Değerler calc.js + goals.js + supplements.js GERÇEK çıktılarıyla doğrulanmıştır.
// ════════════════════════════════════════════════════════════
import {
  calcBF, calcFFMI, calcBMR, calcIdealRange,
  calcGoalCalories, calcMacros, calcWaterTarget, calcAct
} from './calc.js';
import {
  recGoalDetailed, calcGoalGates, checkRedsRisk, ffmiBand, trainingAgeFrom
} from './goals.js';
import { SUPPS, calcSuppScores, SUPP_QS } from './supplements.js';
import { determineBodyProfile, getDietTipByProfile } from './profile.js';
import { _roundTripTest } from './storage.js';
import { filterExercises, uniqueCategories } from './exercises.js';
import { PROGRAMS } from './programs.js';
import { saveJSON, loadJSON, removeJSON } from './storage.js';
import { summarizeProgress, goalNote } from './progress.js';
import { THEMES } from './themes.js';

export function runSelfTest() {
  let passed = 0, failed = 0;
  const results = [];
  const approx = (a, e, tol, label) => { const ok = Math.abs(a - e) <= tol; results.push({ label, actual: a, ok }); ok ? passed++ : failed++; };
  const range = (a, min, max, label) => { const ok = a >= min && a <= max; results.push({ label, actual: a, ok }); ok ? passed++ : failed++; };
  const eq    = (a, e, label) => { const ok = a === e; results.push({ label, actual: a, ok }); ok ? passed++ : failed++; };

  // GRUP 1 — Vücut yağı (Navy)
  range(calcBF({ gender: 'male', height: 180, neck: 40, waist: 85 }), 12, 20, 'BF erkek (180/40/85)');
  range(calcBF({ gender: 'female', height: 165, neck: 33, waist: 75, hip: 95 }), 22, 30, 'BF kadın (165/33/75/95)');
  // GRUP 2 — FFMI
  const f = calcFFMI({ weight: 80, height: 180 }, 15);
  approx(f.ffmi, 21.0, 0.5, 'FFMI (80kg, %15, 180cm)');
  approx(f.ffm, 68, 0.5, 'FFM yağsız kütle');
  // GRUP 3 — BMR
  approx(calcBMR(70), 1882, 5, 'BMR (LM=70)');
  approx(calcBMR(50), 1450, 5, 'BMR (LM=50)');
  // GRUP 4 — Hedef kalori
  approx(calcGoalCalories(2500, 'cut', 15, true), 2063, 2, 'Hedef cut bf%15 (-%17.5)');
  approx(calcGoalCalories(2500, 'bulk', 15, true), 2750, 2, 'Hedef bulk bf%15 (+%10)');
  approx(calcGoalCalories(2500, 'maintain', 15, true), 2500, 2, 'Hedef maintain (%0)');
  approx(calcGoalCalories(2500, 'cut', 30, true), 2000, 2, 'Hedef cut bf%30 (-%20 tavan)');
  // GRUP 5 — Makrolar
  const m1 = calcMacros(2500, 'maintain', 'hybrid', 70, 80, 15, true, null);
  approx(m1.pg, 136, 2, 'Makro protein (bf%15, bw)');
  eq(m1.proteinSource, 'bw', 'Makro kaynak = bw');
  const m2 = calcMacros(2500, 'cut', 'hybrid', 60, 100, 35, true, null);
  approx(m2.pg, 144, 2, 'Makro protein (bf%35, LM 60×2.4)');
  eq(m2.proteinSource, 'lm', 'Makro kaynak = lm');
  // GRUP 6 — Su
  const w = calcWaterTarget(70, 'low', 0);
  eq(w.cups, 9, 'Su 70kg low = 9 bardak');
  approx(w.lt, 2.25, 0.01, 'Su 70kg low = 2.25 L');
  eq(calcWaterTarget(70, 'mid', 0).cups, 10, 'Su 70kg mid = 10 bardak');
  // GRUP 7 — İdeal kilo
  const ir = calcIdealRange(180);
  approx(ir.lo, 60, 1, 'İdeal lo (180cm)');
  approx(ir.hi, 81, 1, 'İdeal hi (180cm)');
  // GRUP 8 — Aktivite çarpanı
  approx(calcAct({ job: 0, sd: 0, sh: 0, ex: 0 }).m, 1.2, 0.001, 'Aktivite sedanter = 1.2');
  approx(calcAct({ job: 1, sd: 4, sh: 0, ex: 1 }).m, 1.55, 0.001, 'Aktivite orta = 1.55');
  // GRUP 9 — Hedef önerisi & uyarılar
  eq(recGoalDetailed(30, 22, true, 'intermediate').primary, 'cut', 'Öneri: yüksek yağ → cut');
  eq(recGoalDetailed(20, 20, true, 'beginner').primary, 'recomp', 'Öneri: yüksek yağ + yeni → recomp');
  eq(recGoalDetailed(10, 20, true, 'intermediate').primary, 'bulk', 'Öneri: düşük yağ + tecrübeli → bulk');
  eq(recGoalDetailed(5, 23, true, 'intermediate').primary, 'bulk', 'Öneri: çok düşük yağ → bulk');
  eq(calcGoalGates(30, true).bulk, 'risky', 'Gate: bf%30 bulk riskli');
  eq(calcGoalGates(7, true).cut, 'risky', 'Gate: bf%7 cut riskli');
  eq(calcGoalGates(20, true).bulk, 'safe', 'Gate: bf%20 bulk güvenli');
  eq(checkRedsRisk('cut', 5, true), true, 'RED-S: erkek bf%5 cut → risk');
  eq(checkRedsRisk('cut', 15, true), false, 'RED-S: erkek bf%15 cut → güvenli');
  eq(checkRedsRisk('cut', 12, false), true, 'RED-S: kadın bf%12 cut → risk');
  eq(checkRedsRisk('bulk', 5, true), false, 'RED-S: bulk için risk yok');
  eq(ffmiBand(20, true), 'mid', 'FFMI bandı (erkek 20) = mid');
  eq(trainingAgeFrom('gt3'), 'advanced', 'Antrenman yaşı: gt3 → advanced');

  // GRUP 10 — Supplement puanlama
  eq(Object.keys(SUPPS).length, 16, 'SUPPS 16 supplement içeriyor');
  const sortTop = (ans, user) => calcSuppScores(ans, user, null).filter(x => x.score > 0).sort((a, b) => b.score - a.score)[0].id;
  const byId = (ans, user) => Object.fromEntries(calcSuppScores(ans, user, null).map(x => [x.id, x.score]));
  const sb = byId({ goal: 'bulk', sport: 'bb', freq: 'high' }, { age: 25, gender: 'male' });
  eq(sb.kreatin, 75, 'Supp bulk: kreatin = 75');
  eq(sb.protein, 40, 'Supp bulk: protein = 40');
  eq(sortTop({ goal: 'bulk', sport: 'bb', freq: 'high' }, { age: 25, gender: 'male' }), 'kreatin', 'Supp bulk: #1 = kreatin');
  const sv = byId({ goal: 'health', diet: 'vegan', sun: 'none' }, { age: 40, gender: 'female' });
  eq(sv.vitD, 105, 'Supp vegan: vitD = 105');
  eq(sv.omega3, 80, 'Supp vegan: omega3 = 80');
  eq(sortTop({ goal: 'health', diet: 'vegan', sun: 'none' }, { age: 40, gender: 'female' }), 'vitD', 'Supp vegan: #1 = vitD');


  // GRUP 11 — Vücut profili & diyet ipucu
  const prof = (bf, ffmi, bmi, user) => determineBodyProfile(bf, ffmi, bmi, user).n;
  eq(prof(32, 22, 31, { gender: 'male', waist: 110, hip: 105, shoulder: 0 }), 'Obese (Obez)', 'Profil: erkek obez');
  eq(prof(12, 22, 24, { gender: 'male', waist: 82, hip: 95, shoulder: 0 }), 'Muscular (Kaslı)', 'Profil: erkek kaslı');
  eq(prof(20, 17, 23, { gender: 'male', waist: 90, hip: 95, shoulder: 0 }), 'Skinny-fat', 'Profil: erkek skinny-fat');
  eq(prof(10, 16, 19, { gender: 'male', waist: 74, hip: 90, shoulder: 0 }), 'Skinny (Zayıf)', 'Profil: erkek zayıf');
  eq(prof(38, 16, 31, { gender: 'female', waist: 95, hip: 110, shoulder: 0 }), 'Obese (Obez)', 'Profil: kadın obez');
  eq(getDietTipByProfile('Skinny (Zayıf)').length > 20, true, 'Diyet ipucu döndü (zayıf)');


  // GRUP 12 — Kalıcılık (storage) round-trip (gerçek veriyi kirletmez)
  const rt = _roundTripTest({ gender: 'female', weight: 62, goal: 'cut', actM: 1.55 });
  eq(rt && rt.weight, 62, 'Storage: kilo round-trip korunur');
  eq(rt && rt.goal, 'cut', 'Storage: hedef round-trip korunur');


  // GRUP 13 — Egzersiz filtreleme (mock veri)
  const exMock = [
    { id: 'a', name_tr: 'Barbell Curl', name_en: 'Curl', category: 'arms', equipment: ['barbell'] },
    { id: 'b', name_tr: 'Squat', name_en: 'Squat', category: 'legs', equipment: ['barbell'] },
    { id: 'c', name_tr: 'Sinav', name_en: 'Push Up', category: 'chest', equipment: ['bodyweight'] },
  ];
  eq(filterExercises(exMock, { cat: 'legs' }).length, 1, 'Egzersiz filtre: kategori legs');
  eq(filterExercises(exMock, { equip: 'bodyweight' }).length, 1, 'Egzersiz filtre: ekipman bodyweight');
  eq(filterExercises(exMock, { q: 'push' }).length, 1, 'Egzersiz filtre: arama (EN)');
  eq(filterExercises(exMock, {}).length, 3, 'Egzersiz filtre: bos -> hepsi');


  // GRUP 14 — Programlar bütünlüğü
  eq(PROGRAMS.length >= 3, true, 'Programlar: en az 3 program');
  eq(PROGRAMS.every(p => p.days.length >= 1 && p.days.every(d => d.items.length >= 1 && d.items.every(it => it.ex && it.sets))), true, 'Programlar: her gün/egzersiz dolu');


  // GRUP 15 — Genel JSON kayıt (programlar için) round-trip
  const JK = '__rf_json_test__';
  saveJSON(JK, [{ a: 7 }]);
  const gj = loadJSON(JK);
  removeJSON(JK);
  eq(gj && gj[0] && gj[0].a, 7, 'Storage JSON: kaydet/oku round-trip');


  // GRUP 16 — İlerleme özeti
  const sm = summarizeProgress([{ weight: 80, bf: 18 }, { weight: 78.5, bf: 16.5 }, { weight: 77, bf: 15 }]);
  eq(sm.count, 3, 'İlerleme: ölçüm sayısı 3');
  eq(sm.dW, -3, 'İlerleme: kilo farkı -3');
  eq(sm.dB, -3, 'İlerleme: yağ farkı -3');
  eq(goalNote('cut', -3).length > 5, true, 'İlerleme: cut yorumu döndü');
  eq(summarizeProgress([]), null, 'İlerleme: boş dizi null');


  // GRUP 17 — Supplement anketi
  eq(SUPP_QS.length, 10, 'Supplement anketi 10 soru');
  eq(SUPP_QS.every(q => q.key && q.opts && q.opts.length >= 2), true, 'Anket: her soru >=2 seçenek');
  const badSleep = Object.fromEntries(calcSuppScores({ sleep: 'bad' }, { age: 25, gender: 'male' }, null).map(x => [x.id, x.score]));
  eq(badSleep.zma >= 30, true, 'Anket: kötü uyku -> zma >=30');


  // GRUP 18 — Branş kategorileri
  const mockBr = [{ category: 'kick', equipment: ['fins'] }, { category: 'pull', equipment: [] }, { category: 'kick', equipment: [] }];
  eq(uniqueCategories(mockBr).length, 2, 'Branş: benzersiz kategori sayısı 2');
  eq(filterExercises(mockBr, { cat: 'kick' }).length, 2, 'Branş: kategori filtresi (kick=2)');


  // GRUP 19 — Temalar
  eq(THEMES.length, 6, 'Tema: 6 tema');
  eq(THEMES.every(t => t.key && t.vars && t.vars.accent && t.vars.bg && t.vars.surface), true, 'Tema: tüm renkler dolu');

  console.log(`%c🔬 Öz-test: ${passed} geçti, ${failed} kaldı`,
    failed === 0 ? 'color:#4ade80;font-weight:bold' : 'color:#f87171;font-weight:bold');
  results.forEach(r => console.log((r.ok ? '✅ ' : '❌ ') + r.label + ' → ' + r.actual));
  return { passed, failed, results };
}
