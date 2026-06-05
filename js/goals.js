// ════════════════════════════════════════════════════════════
//  goals.js — HEDEF ÖNERİ KARAR AĞACI + UYARILAR
//  RavenFit2'den birebir. Pür fonksiyonlar (parametre alır).
// ════════════════════════════════════════════════════════════

// Cut/bulk için yumuşak kapı — engellemez, "riskli" işaretler
export function calcGoalGates(bf, male) {
  const gates = { cut: 'safe', bulk: 'safe', recomp: 'safe', maintain: 'safe' };
  if (male && bf > 25) gates.bulk = 'risky';
  else if (!male && bf > 32) gates.bulk = 'risky';
  if (male && bf < 8) gates.cut = 'risky';
  else if (!male && bf < 16) gates.cut = 'risky';
  return gates;
}

// Riskli hedef seçilince gösterilecek uyarı mesajı
export function gateWarning(goal, bf, male) {
  if (goal === 'bulk') {
    const limit = male ? '%25' : '%32';
    return '⚠️ Yağ oranın <strong>%' + bf.toFixed(1) + '</strong> ve bu seviyede bulk dönemi sağlıksız yağ kazanımına yol açabilir. ' + limit + ' altında olduğunda bulk daha güvenli. Önce <strong>recomp</strong> ile yağ oranını düşürmeni öneririz.';
  }
  if (goal === 'cut') {
    const limit2 = male ? '%8' : '%16';
    return '⚠️ Yağ oranın <strong>%' + bf.toFixed(1) + '</strong> — bu seviye zaten çok düşük. Cut hormon dengesini bozabilir, performansı düşürebilir. ' + limit2 + ' üzerinde cut güvenlidir. <strong>Maintain</strong> veya <strong>bulk</strong> düşünebilirsin.';
  }
  return null;
}

// FFMI bandı
export function ffmiBand(ffmi, male) {
  if (male) {
    if (ffmi < 18) return 'low';
    if (ffmi < 22) return 'mid';
    return 'high';
  } else {
    if (ffmi < 15) return 'low';
    if (ffmi < 18) return 'mid';
    return 'high';
  }
}

// Wizard cevabını ('none'/'lt1'/'1to3'/'gt3') antrenman yaşına çevir
export function trainingAgeFrom(answer, fallback) {
  if (answer === 'none' || answer === 'lt1') return 'beginner';
  if (answer === '1to3') return 'intermediate';
  if (answer === 'gt3') return 'advanced';
  return fallback || 'beginner';
}

// Önerilen hedef — Hibrit karar ağacı (BF bandı + antrenman yaşı + FFMI)
export function recGoalDetailed(bf, ffmi, male, trainingAge) {
  const ffmiB = ffmiBand(ffmi, male);
  let band;
  if (male) {
    if (bf > 25) band = 'very_high';
    else if (bf >= 18) band = 'high';
    else if (bf >= 12) band = 'mid';
    else if (bf >= 8) band = 'low';
    else band = 'very_low';
  } else {
    if (bf > 32) band = 'very_high';
    else if (bf >= 26) band = 'high';
    else if (bf >= 20) band = 'mid';
    else if (bf >= 16) band = 'low';
    else band = 'very_low';
  }

  let primary, alternative = null, reason = '';
  if (band === 'very_high') {
    primary = 'cut';
    alternative = (trainingAge === 'beginner') ? 'recomp' : null;
    reason = 'Yağ oranın yüksek (%' + bf.toFixed(1) + '), sağlıklı aralığa inmek için kalori açığı en mantıklı yol.';
    if (trainingAge === 'beginner') reason += ' Yeni başlayan olduğun için recomp da iyi bir seçenek.';
  } else if (band === 'high') {
    if (trainingAge === 'beginner') {
      primary = 'recomp'; alternative = 'cut';
      reason = 'Yağ oranın yüksek (%' + bf.toFixed(1) + ') ama yeni başlayansın — recomp ile aynı anda yağ verip kas kazanabilirsin (newbie gains).';
    } else {
      primary = 'cut'; alternative = 'recomp';
      reason = 'Yağ oranın orta-yüksek (%' + bf.toFixed(1) + '). Antrenman geçmişin var, cut ile odaklı yağ kaybı en verimli yol.';
    }
  } else if (band === 'mid') {
    if (trainingAge === 'beginner') {
      primary = 'recomp'; alternative = 'maintain';
      reason = 'Yağ oranın orta seviyede (%' + bf.toFixed(1) + '). Yeni başlayan olduğun için recomp en verimli — kas kazanmaya hazırsın.';
    } else if (ffmiB === 'low') {
      primary = 'maintain'; alternative = 'recomp';
      reason = 'Yağ oranın iyi (%' + bf.toFixed(1) + ') ama kas kütlen düşük (FFMI ' + ffmi.toFixed(1) + '). Önce temel kasları oluşturmak için maintain.';
    } else {
      primary = 'maintain'; alternative = 'bulk';
      reason = 'Yağ oranın orta (%' + bf.toFixed(1) + '), kas kütlen iyi. Formunu koruyabilir veya hafif bulk yapabilirsin.';
    }
  } else if (band === 'low') {
    if (trainingAge === 'beginner') {
      primary = 'maintain'; alternative = 'bulk';
      reason = 'Yağ oranın düşük (%' + bf.toFixed(1) + '), kas kütlen büyümeye hazır. Önce maintain ile alışkanlık kur, sonra bulk.';
    } else {
      primary = 'bulk'; alternative = ffmiB === 'high' ? 'maintain' : 'recomp';
      reason = 'Yağ oranın düşük (%' + bf.toFixed(1) + ') ve antrenman geçmişin var — kas kazanmaya hazırsın.';
      if (ffmiB === 'high') reason += ' Kas kütlen zaten iyi, maintain de iyi bir alternatif.';
    }
  } else {
    primary = 'bulk'; alternative = 'maintain';
    reason = 'Yağ oranın çok düşük (%' + bf.toFixed(1) + '). Sağlığın için kalori fazlasıyla beslenmen önemli.';
  }

  return {
    primary, alternative, reason,
    gates: calcGoalGates(bf, male),
    factors: { bf, bfBand: band, trainingAge, ffmi, ffmiBand: ffmiB },
  };
}

// RED-S riski — sadece cut'ta ve çok düşük yağda
export function checkRedsRisk(gl, bf, male) {
  if (gl !== 'cut' || bf == null) return false;
  if (male && bf < 6) return true;
  if (!male && bf < 14) return true;
  return false;
}
