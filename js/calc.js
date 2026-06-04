// ════════════════════════════════════════════════════════════
//  calc.js — HESAPLAMA MOTORU (saf fonksiyonlar)
//  RavenFit2'den BİREBİR alınan matematik. Tek fark: artık global
//  U objesini okumak yerine, durumu parametre olarak alıyorlar
//  → test edilebilir, bağımsız, "Selenium'dan daha temiz".
// ════════════════════════════════════════════════════════════

// ── U.S. Navy çevre yöntemi (vücut yağ oranı %) ──
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

// ── FFMI — Yağsız Kütle İndeksi (Kouri normalizasyonu) ──
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

// ── BMR — Bazal Metabolizma (Katch-McArdle) ──
export function calcBMR(lm) {
  return Math.round(370 + 21.6 * lm);
}

// ── İdeal kilo aralığı (sağlıklı BMI 18.5–24.9) ──
export function calcIdealRange(h) {
  const hm = h / 100, h2 = hm * hm;
  return {
    lo: Math.round(18.5 * h2 * 10) / 10,
    hi: Math.round(24.9 * h2 * 10) / 10,
  };
}

// ── Yağ oranını bandına çevir (highest/high/mid/low) ──
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
