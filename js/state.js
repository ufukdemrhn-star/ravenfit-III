// ════════════════════════════════════════════════════════════
//  state.js — Uygulamanın paylaşılan durumu TEK yerde
//  RavenFit2'de her yere dağılmış olan U, R, A, BT objeleri
//  burada toplanır. Her modül buradan import eder → veri akışı izlenebilir.
// ════════════════════════════════════════════════════════════

// Kullanıcı verisi
export const U = {
  gender: 'male',
  height: 180,   // cm
  neck: 40,      // cm
  waist: 85,     // cm
  hip: 95,       // cm (kadın hesabı için)
  weight: 80,    // kg
};

// Hesaplama sonuçları (bf, ffmi, bmr...)
export const R = {};
