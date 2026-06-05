// ════════════════════════════════════════════════════════════
//  progress.js — İLERLEME ÖZETİ + HEDEFE GÖRE YORUM (saf mantık)
// ════════════════════════════════════════════════════════════

// Ölçüm dizisini özetle (ilk → son fark)
export function summarizeProgress(ms) {
  if (!ms || !ms.length) return null;
  const first = ms[0], last = ms[ms.length - 1];
  return {
    first, last, count: ms.length,
    dW: +(last.weight - first.weight).toFixed(1),
    dB: +(last.bf - first.bf).toFixed(1),
  };
}

// Hedefe göre kilo değişimi yorumu
export function goalNote(goal, dW) {
  if (goal === 'cut')
    return dW < -0.2 ? '👍 Cut hedefine uygun: kilo düşüyor.'
         : dW > 0.2 ? '⚠️ Cut hedefindeyken kilo artmış.'
         : 'Kilo sabit görünüyor.';
  if (goal === 'bulk')
    return dW > 0.2 ? '👍 Bulk hedefine uygun: kilo artıyor.'
         : dW < -0.2 ? '⚠️ Bulk hedefindeyken kilo düşmüş.'
         : 'Kilo sabit görünüyor.';
  if (goal === 'recomp')
    return 'Recomp: kilo sabit kalırken yağ ↓ / kas ↑ hedeflenir.';
  return 'Kilonu düzenli takip ediyorsun.';
}
