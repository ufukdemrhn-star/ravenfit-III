// ════════════════════════════════════════════════════════════
//  calc.js — HESAPLAMA MOTORU (saf fonksiyonlar)
//  RavenFit2'den BİREBİR alınan matematik. Tek fark: global U
//  yerine durumu parametre olarak alıyorlar → test edilebilir.
// ════════════════════════════════════════════════════════════

// ───────────────── VÜCUT KOMPOZİSYONU ─────────────────

// U.S. Navy çevre yöntemi (vücut yağ oranı %)
export function calcBF(u) {
  const h = u.height, nk = u.neck, wst = u.waist, hip = u.hip;
  let bf;
  if (u.gender === 'male') {
    bf = 495 / (1.0324 - 0.19077 * Math.log10(wst - nk) + 0.15456 * Math.log10(h)) - 450;
  } else {
    bf = 495 / (1.29579 - 0.35004 * Math.log10(wst + hip - nk) + 0.22100 * Math.log10(h)) - 450;
  }
  return Math.max(2, Math.round(bf * 100) / 100);
}

// FFMI — Yağsız Kütle İndeksi (Kouri normalizasyonu)
export function calcFFMI(u, bf) {
  const hm = u.height / 100;
  const ffm = u.weight * (1 - bf / 100);
  const ffmi = ffm / (hm * hm);
  const norm = ffmi + 6.1 * (1.8 - hm);
  return {
    ffmi: Math.round(ffmi * 100) / 100,
    norm: Math.round(norm * 100) / 100,
    ffm: Math.round(ffm * 100) / 100,
  };
}

// BMR — Bazal Metabolizma (Katch-McArdle)
export function calcBMR(lm) {
  return Math.round(370 + 21.6 * lm);
}

// İdeal kilo aralığı (sağlıklı BMI 18.5–24.9)
export function calcIdealRange(h) {
  const hm = h / 100, h2 = hm * hm;
  return {
    lo: Math.round(18.5 * h2 * 10) / 10,
    hi: Math.round(24.9 * h2 * 10) / 10,
  };
}

// Yağ oranını bandına çevir (highest/high/mid/low)
export function bfBand(bf, male) {
  if (male) {
    if (bf > 25) return 'highest';
    if (bf >= 15) return 'high';
    if (bf >= 10) return 'mid';
    return 'low';
  } else {
    if (bf > 35) return 'highest';
    if (bf >= 25) return 'high';
    if (bf >= 20) return 'mid';
    return 'low';
  }
}

// ───────────────── ENERJİ & MAKRO MOTORU ─────────────────

// Aktivite skoru → TDEE çarpanı (Harris-Benedict katsayıları)
// a = { job, sd, sh, ex }  (sd = haftalık aktif gün sayısı 0–6)
export function calcAct(a) {
  const sdScore = Math.min((a.sd || 0) * 0.35, 2.1);
  const sc = (a.job || 0) + sdScore + (a.sh || 0) + (a.ex || 0);
  if (sc <= 1)   return { m: 1.2,   lbl: 'Sedanter — Hareketsiz yaşam' };
  if (sc <= 2.5) return { m: 1.375, lbl: 'Az Aktif — Hafif egzersiz' };
  if (sc <= 4.5) return { m: 1.55,  lbl: 'Orta Aktif — Düzenli egzersiz' };
  if (sc <= 6.5) return { m: 1.725, lbl: 'Çok Aktif — Yoğun egzersiz' };
  return { m: 1.9, lbl: 'Aşırı Aktif — Spor odaklı yaşam' };
}

// Hedef → TDEE ayarlaması (yağ bandına göre; cut en fazla -%20, RED-S koruması)
export function calcGoalCalories(tdee, gl, bf, male) {
  const band = bfBand(bf, male);
  let pct = 0;
  if (gl === 'cut') {
    const cutMap = { highest: -20, high: -17.5, mid: -12.5, low: -7.5 };
    pct = cutMap[band] || -15;
  } else if (gl === 'recomp') {
    const recompMap = { highest: -10, high: -5, mid: 0, low: 5 };
    pct = recompMap[band] || 0;
  } else if (gl === 'maintain') {
    pct = 0;
  } else if (gl === 'bulk') {
    let bulkBand;
    if (male) {
      if (bf < 10) bulkBand = 'lowest';
      else if (bf < 15) bulkBand = 'low';
      else if (bf < 20) bulkBand = 'mid';
      else bulkBand = 'high';
    } else {
      if (bf < 18) bulkBand = 'lowest';
      else if (bf < 25) bulkBand = 'low';
      else if (bf < 30) bulkBand = 'mid';
      else bulkBand = 'high';
    }
    pct = { lowest: 15, low: 15, mid: 10, high: 5 }[bulkBand] || 5;
  }
  return Math.round(tdee * (1 + pct / 100));
}

// Hedef için protein g/kg (vücut ağırlığı bazlı, hedef+yağ bandına göre)
export function proteinPerKg(gl, bf, male) {
  const band = bfBand(bf, male);
  if (gl === 'cut' || gl === 'recomp') {
    const m = { highest: 1.9, high: 1.9, mid: 2.1, low: 2.3 };
    return m[band] || 2.0;
  } else {
    const m = { highest: 1.7, high: 1.7, mid: 1.9, low: 2.1 };
    return m[band] || 1.9;
  }
}

// Hedef için yağ g/kg
export function fatPerKg(gl, recompMode) {
  if (gl === 'recomp') {
    if (recompMode === 'lowcarb') return 1.0;
    if (recompMode === 'performance') return 0.65;
    return 0.8;
  }
  return 0.9;
}

// Makrolar — BF ≥ %30'da protein YAĞSIZ KÜTLE bazlı hesaplanır (ISSN 2023)
export function calcMacros(cals, gl, st, lm, bw, bf, male, recompMode) {
  bw = bw || lm;
  const prKg = proteinPerKg(gl, bf, male);
  const fatKg = fatPerKg(gl, recompMode);
  let pg, proteinSource;
  if (bf != null && bf >= 30 && lm && lm > 0) {
    pg = Math.round(lm * 2.4);   // yağsız kütle × 2.4 g/kg
    proteinSource = 'lm';
  } else {
    pg = Math.round(bw * prKg);  // vücut ağırlığı bazlı
    proteinSource = 'bw';
  }
  const fg = Math.round(bw * fatKg);
  const pc = pg * 4;
  const fc = fg * 9;
  const cc = Math.max(0, cals - pc - fc);
  const cg = Math.round(cc / 4);
  return {
    pg, fg, cg, pc, fc: Math.round(fc), cc: Math.round(cc),
    proteinSource,
    proteinPerKg: proteinSource === 'lm' ? 2.4 : prKg,
    proteinBase: proteinSource === 'lm' ? lm : bw,
  };
}

// Su hedefi — vücut ağırlığı 0.033 L/kg + antrenman eki (+ supplement eki sonra bağlanacak)
// freq: 'low' | 'mid' | 'high' | 'elite'
export function calcWaterTarget(weightKg, freq, suppExtra) {
  const baseLt = (weightKg || 70) * 0.033;
  const baseCups = Math.round(baseLt / 0.25);
  let actExtra = 0;
  if (freq === 'high' || freq === 'elite') actExtra = 2;
  else if (freq === 'mid') actExtra = 1;
  const totalCups = baseCups + actExtra + (suppExtra || 0);
  return {
    lt: Math.round(totalCups * 0.25 * 100) / 100,
    cups: totalCups,
    baseCups,
    actExtra,
    suppExtra: suppExtra || 0,
  };
}
