// ════════════════════════════════════════════════════════════
//  selftest.js — MATEMATİĞİN SİGORTASI
//  RavenFit2'deki öz-testin (TEST 1–4) modüler hali.
//  Her modül taşımasından sonra çalıştır: matematik bozulduysa
//  anında kırmızı yanar. Refactor'ın en değerli güvencesi budur.
// ════════════════════════════════════════════════════════════

import { calcBF, calcFFMI, calcBMR } from './calc.js';

export function runSelfTest() {
  let passed = 0, failed = 0;
  const results = [];

  function approx(actual, expected, tol, label) {
    const ok = Math.abs(actual - expected) <= tol;
    results.push({ label, actual, expected, tol, ok });
    ok ? passed++ : failed++;
  }
  function range(actual, min, max, label) {
    const ok = actual >= min && actual <= max;
    results.push({ label, actual, min, max, ok });
    ok ? passed++ : failed++;
  }

  // TEST 1 — Navy vücut yağı (erkek)
  range(calcBF({ gender: 'male', height: 180, neck: 40, waist: 85 }),
        12, 20, 'Navy BF (erkek 180/40/85)');

  // TEST 2 — Navy vücut yağı (kadın)
  range(calcBF({ gender: 'female', height: 165, neck: 33, waist: 75, hip: 95 }),
        22, 30, 'Navy BF (kadın 165/33/75/95)');

  // TEST 3 — FFMI
  const f = calcFFMI({ weight: 80, height: 180 }, 15);
  approx(f.ffmi, 21.0, 0.5, 'FFMI (80kg, %15, 180cm)');
  approx(f.ffm, 68, 0.5, 'FFMI yağsız kütle');

  // TEST 4 — BMR (Katch-McArdle)
  approx(calcBMR(70), 1882, 5, 'BMR (LM=70)');
  approx(calcBMR(50), 1450, 5, 'BMR (LM=50)');

  // Konsola dök
  console.log(`%c🔬 Öz-test: ${passed} geçti, ${failed} kaldı`,
              failed === 0 ? 'color:#4ade80;font-weight:bold' : 'color:#f87171;font-weight:bold');
  results.forEach(r => {
    const val = typeof r.actual === 'number' ? r.actual.toFixed(2) : r.actual;
    console.log((r.ok ? '✅ ' : '❌ ') + r.label + ' → ' + val);
  });

  return { passed, failed, results };
}
