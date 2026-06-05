// ════════════════════════════════════════════════════════════
//  selftest.js — MATEMATİĞİN SİGORTASI
//  Değerler calc.js + goals.js'in GERÇEK çıktılarıyla doğrulanmıştır.
// ════════════════════════════════════════════════════════════
import {
  calcBF, calcFFMI, calcBMR, calcIdealRange,
  calcGoalCalories, calcMacros, calcWaterTarget, calcAct
} from './calc.js';
import {
  recGoalDetailed, calcGoalGates, checkRedsRisk, ffmiBand, trainingAgeFrom
} from './goals.js';

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

  console.log(`%c🔬 Öz-test: ${passed} geçti, ${failed} kaldı`,
    failed === 0 ? 'color:#4ade80;font-weight:bold' : 'color:#f87171;font-weight:bold');
  results.forEach(r => console.log((r.ok ? '✅ ' : '❌ ') + r.label + ' → ' + r.actual));
  return { passed, failed, results };
}
