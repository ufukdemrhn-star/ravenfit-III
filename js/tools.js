// ════════════════════════════════════════════════════════════
//  tools.js — ANTRENMAN HESAPLAYICILARI (RavenFit2'den BİREBİR)
//  Saf fonksiyonlar; UI app.js'te. Formüller node ile test edilir.
// ════════════════════════════════════════════════════════════

// ── 1RM Formülleri (birebir) ──
export function formulaEpley(kg, reps) { return kg * (1 + reps / 30); }
export function formulaBrzycki(kg, reps) { return reps < 37 ? kg * 36 / (37 - reps) : kg * (1 + reps / 30); }
export function formulaLombardi(kg, reps) { return kg * Math.pow(reps, 0.10); }
export function formulaWathen(kg, reps) { return (100 * kg) / (48.8 + 53.8 * Math.exp(-0.075 * reps)); }

// % 1RM dağılımı (Wathen bazlı)
export const ONE_RM_PCTS = [95, 90, 85, 80, 75, 70, 65, 60, 50];
export const ONE_RM_REP_MAP = { 95: '1-2', 90: '3-4', 85: '5-6', 80: '7-8', 75: '9-10', 70: '10-12', 65: '12-15', 60: '15-18', 50: '20+' };

// ── ÇALIŞMA SETİ (birebir — 30 test verisinden çıkarılmış tablo) ──
// Döner: { weights[], rest(dk), volume, start, base } veya { error }
export function calcWorkingSet(target, sets, reps, diff, fixed) {
  target = parseFloat(target) || 0;
  sets = parseInt(sets) || 3;
  reps = parseInt(reps) || 0;
  diff = diff || 'medium';
  fixed = fixed === true;

  if (sets < 1 || sets > 5) return { error: 'Set sayısı 1-5 arası olmalı' };
  if (reps < 1 || reps > 10) return { error: 'Tekrar sayısı 1-10 arası olmalı' };
  if (!target || !reps) return { error: 'Hedef + set + rep gir' };

  const round25 = (x) => Math.round(x / 2.5) * 2.5;

  let base;
  if (diff === 'easy') {
    if (reps === 2) base = 77.5;
    else if (reps === 3 || reps === 4) base = 75;
    else if (reps === 5) base = 72.5;
    else if (reps === 6) base = 70;
    else if (reps === 7 || reps === 8) base = 67.5;
    else base = 65;
  } else if (diff === 'medium') {
    if (reps === 2) base = 80;
    else if (reps === 3) base = 77.5;
    else if (reps === 4) base = 75;
    else if (reps === 5) {
      if (sets === 2) base = 77.5;
      else if (sets === 3) base = 75;
      else if (sets >= 5) base = 70;
      else base = 72.5;
    }
    else if (reps === 6) base = 70;
    else if (reps === 7 || reps === 8) base = 70;
    else if (reps === 9 || reps === 10) base = 65;
    else base = 60;
  } else { // hard
    if (reps === 2) base = 82.5;
    else if (reps === 3) base = 80;
    else if (reps === 4) base = 77.5;
    else if (reps === 5) base = 75;
    else if (reps === 6) base = 72.5;
    else if (reps === 7 || reps === 8) base = 70;
    else base = 65;
  }

  const start = round25(target * base / 100);

  // ── Artış pattern ──
  let weights = [];
  if (reps <= 4) {
    if (diff === 'easy' && reps === 4 && sets === 3) weights = [start, start, start + 2.5];
    else for (let i = 0; i < sets; i++) weights.push(start + i * 2.5);
  } else if (diff === 'hard') {
    for (let i = 0; i < sets; i++) weights.push(start + i * 2.5);
  } else if (diff === 'medium' && sets === 3 && reps === 5) {
    if (target >= 120) for (let i = 0; i < sets; i++) weights.push(start + i * 2.5);
    else weights = [start, start, start + 2.5];
  } else if (diff === 'easy' && sets === 3 && reps === 5) {
    if (target >= 150) for (let i = 0; i < sets; i++) weights.push(start + i * 2.5);
    else weights = [start, start + 2.5, start + 2.5];
  } else if (diff === 'medium' && sets === 5 && reps === 5) {
    weights = [start, start, start + 2.5, start + 5, start + 5];
  } else if (diff === 'medium' && sets === 4 && reps === 6) {
    weights = [start, start + 2.5, start + 2.5, start + 5];
  } else if (diff === 'medium' && sets === 4 && reps === 10) {
    weights = [start, start, start + 2.5, start + 2.5];
  } else if (diff === 'medium' && sets === 2 && reps === 5) {
    weights = [start, start + 2.5];
  } else {
    for (let i = 0; i < sets; i++) weights.push(start + Math.floor(i / 2) * 2.5);
  }

  // Sabit mod: piramit max'ını tüm setlere
  if (fixed) {
    const maxW = Math.max.apply(null, weights);
    weights = [];
    for (let i = 0; i < sets; i++) weights.push(maxW);
  }

  // Dinlenme (dk)
  let rest;
  if (reps <= 4) rest = diff === 'easy' ? 5 : diff === 'medium' ? 8 : 10;
  else rest = diff === 'easy' ? 2 : diff === 'medium' ? 3 : 5;

  const volume = weights.reduce((a, w) => a + w * reps, 0);
  return { weights, rest, volume, start, base, target, reps, fixed, diff };
}

// ── UYKU DÖNGÜSÜ (birebir — 90 dk döngü) ──
export function parseTime(s) {
  const p = (s || '').split(':');
  if (p.length !== 2) return null;
  return { h: parseInt(p[0]) || 0, m: parseInt(p[1]) || 0 };
}
export function addMin(t, delta) {
  let total = t.h * 60 + t.m + delta;
  while (total < 0) total += 1440;
  total = total % 1440;
  return { h: Math.floor(total / 60), m: total % 60 };
}
export function fmtTime(t, fmt24) {
  if (fmt24) return (t.h < 10 ? '0' : '') + t.h + ':' + (t.m < 10 ? '0' : '') + t.m;
  let h12 = t.h % 12; if (h12 === 0) h12 = 12;
  const suffix = t.h < 12 ? 'AM' : 'PM';
  return h12 + ':' + (t.m < 10 ? '0' : '') + t.m + ' ' + suffix;
}
// mode: 'wake' (kalkış saatine göre yat) | 'bed' (yatış saatine göre uyan)
// opts: { includeFall(true), isWorkoutDay(false) }
// Döner: [{ time:{h,m}, cycles, sleep }] (4 seçenek) veya null
export function calcSleep(mode, timeStr, opts) {
  opts = opts || {};
  const includeFall = opts.includeFall !== false;
  const isWorkoutDay = opts.isWorkoutDay === true;
  const FALL = includeFall ? 15 : 0;
  const CYCLE = 90;
  const sleepOptions = [{ cycles: 4, hours: 6 }, { cycles: 5, hours: 7.5 }, { cycles: 6, hours: 9 }, { cycles: 7, hours: 10.5 }];
  const t0 = parseTime(timeStr);
  if (!t0) return null;
  const times = [];
  sleepOptions.forEach(opt => {
    let totalMin = opt.cycles * CYCLE + FALL;
    if (isWorkoutDay) totalMin += 30;
    const t = mode === 'wake' ? addMin(t0, -totalMin) : addMin(t0, totalMin);
    times.push({ time: t, cycles: opt.cycles, sleep: opt.hours + (isWorkoutDay ? 0.5 : 0) });
  });
  return times;
}
