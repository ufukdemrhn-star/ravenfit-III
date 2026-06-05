// ════════════════════════════════════════════════════════════
//  profile.js — VÜCUT PROFİLİ + DİYET İPUÇLARI (RavenFit2'den birebir)
//  determineBodyProfile artık global U yerine user parametresi alır.
// ════════════════════════════════════════════════════════════

export function determineBodyProfile(bf, ffmi, bmi, user) {
  var male = user.gender === 'male';
  var swr = (male && user.shoulder && user.waist) ? (user.shoulder / user.waist) : 0;
  var whr = (!male && user.hip && user.waist) ? (user.waist / user.hip) : 0;

  /* ── ERKEK ──────────────────────────────────────────────────── */
  if (male) {
    // 1. Obez — yüksek BF + yüksek BMI
    if (bf >= 30 || bmi >= 30.5)
      return {n:"Obese (Obez)",
        d:"Ciddi yüksek yağ oranı. Öncelik yağ kaybı ve günlük hareketi artırmak olmalı.",
        c:"var(--accent)"};

    // 2. Kilolu
    if (bf >= 25 || bmi >= 27.5)
      return {n:"Overweight (Kilolu)",
        d:"Yağ oranı yüksek. Hedefler bölümünde 'Yağ Kaybetme' seçimi daha uygun olur.",
        c:"var(--accent)"};

    // 3. Skinny — düşük yağ + düşük kas
    if (bf < 14 && ffmi < 17)
      return {n:"Skinny (Zayıf)",
        d:"Hem yağ oranın hem kas kütlen düşük. 'Kütle Kazanma' hedefiyle kalori fazlası ve protein odaklı antrenman başlat.",
        c:"var(--info)"};

    // 4. Athletic — ÖNCE kontrol edilmeli (bf 15-18 arası atletik insanlar skinny-fat'a düşmesin)
    //    Düşük yağ + iyi FFMI + iyi V-taper
    if (bf <= 15 && ffmi >= 20 && swr >= 1.45)
      return {n:"Athletic (Atletik)",
        d:"Düşük yağ, güçlü kas kütlesi ve iyi vücut oranlarıyla atletik bir yapıdasın. 'İdare-i Maslahat' ya da hafif hacim seçebilirsin.",
        c:"var(--success)"};

    // 5. Muscular — Athletic'ten SONRA kontrol edilmeli
    //    BF düşük + FFMI çok yüksek → Athletic (keskin görünüm)
    //    BF orta  + FFMI çok yüksek → Muscular (hacimli görünüm)
    if (ffmi >= 22 && bf < 20)
      return {n:"Muscular (Kaslı)",
        d:"Yüksek kas kütlesi ve kontrollü yağ oranı. Definasyon dönemiyle çizgileri daha belirgin hale getirebilirsin.",
        c:"var(--purple)"};

    // 6. Skinny-fat — daraltılmış eşik (FFMI<21 çok genişti, gerçek olmayan SF üretiyordu)
    //    Saf SF: bf≥20 + ffmi<19 (yüksek yağ, düşük kas)
    //    V-taper zayıf SF: bf≥18 + ffmi<19 + swr<1.48 (ince görünümlü ama yağlı)
    //    FFMI 19+ olan biri bu tanıma girmez (ortalama üstü kaslı demektir)
    if ((bf >= 20 && ffmi < 19) || (bf >= 18 && ffmi < 19 && swr < 1.48))
      return {n:"Skinny-fat",
        d:"Yağ oranın beklenenden yüksek, kas kütlen ise düşük — en yaygın durum bu. Direnç antrenmanı yaparken kalori açığı ya da idame tercih et. 'Yağ Kaybetme' ya da 'İdare-i Maslahat' seçmelisin.",
        c:"var(--warn)"};

    // 7. Bulky — yüksek FFMI + yüksek yağ
    //    FFMI≥22 şartı Muscular'dan ayrışmasını sağlar
    if (ffmi >= 22 && bf >= 20)
      return {n:"Bulky (Hacimli)",
        d:"Kas kütlen güçlü ama biraz fazla yağ taşıyorsun. Yavaş bir kalori açığıyla cut dönemi başlatmak çizgileri belirginleştirir.",
        c:"var(--warn)"};

    // 8. Lean — düşük yağ + orta-iyi kas
    //    Lean, Fit'ten ÖNCE kontrol edilmeli (bf aralıkları örtüşüyor)
    if (bf <= 17 && ffmi >= 18)
      return {n:"Lean (Yağsız/Fit)",
        d:"Düşük yağ oranı ve yeterli kas kütlesiyle temiz, fit bir görünümdesin. Kas kazanmaya odaklanırsan Athletic/Muscular kategorisine geçebilirsin.",
        c:"var(--info)"};

    // 9. Fit — dengeli yağ + yeterli kas
    if (bf >= 14 && bf < 22 && ffmi >= 18)
      return {n:"Fit",
        d:"Dengeli kas ve yağ oranıyla fit bir yapın var. 'İdare-i Maslahat' ile bu kompozisyonu koruyabilir ya da hedefe göre yönlenebilirsin.",
        c:"var(--success)"};

    // 10. Average — fallback (dürüst, nötr)
    return {n:"Average (Ortalama)",
      d:"Vücut kompozisyonun ortalama sınırda. Tutarlı antrenman ve beslenmeyle net bir profile geçmek mümkün.",
      c:"var(--text2)"};
  }

  /* ── KADIN ──────────────────────────────────────────────────── */

  // 1. Obez
  if (bf >= 38 || bmi >= 33)
    return {n:"Obese (Obez)",
      d:"Ciddi yüksek yağ oranı. Sürdürülebilir kalori açığı ve düzenli hareket önceliğin olmalı.",
      c:"var(--accent)"};

  // 2. Kilolu
  if (bf >= 30 || bmi >= 28.5)
    return {n:"Overweight (Kilolu)",
      d:"Yağ oranı yüksek. Hedefler bölümünde 'Yağ Kaybetme' seçimi daha doğru olur.",
      c:"var(--accent)"};

  // 3. Skinny — düşük yağ + düşük kas
  if (bf < 19 && ffmi < 14.5)
    return {n:"Skinny (Zayıf)",
      d:"Hem yağ oranın hem kas kütlen düşük. 'Kütle Kazanma' hedefiyle kalori fazlası ve protein odaklı antrenman başlat.",
      c:"var(--info)"};

  // 4. Skinny-fat — yüksek yağ (≥25%) + düşük kas (FFMI<16)
  //    Kadın için 24% BF ortalama sınırda, 25% dan itibaren SF bölgesi
  if (bf >= 25 && ffmi < 16)
    return {n:"Skinny-fat",
      d:"Kilo normal görünse de kas kütlen düşük ve yağ oranın beklenenden yüksek. Direnç antrenmanı yaparken kalori açığı ya da idame tercih et. 'Yağ Kaybetme' ya da 'İdare-i Maslahat' seçmelisin.",
      c:"var(--warn)"};

  // 5. Muscular — yüksek FFMI + kontrollü yağ
  if (ffmi >= 19 && bf < 24)
    return {n:"Muscular (Kaslı)",
      d:"Kas kütlen çok güçlü. İdame ya da kontrollü definasyon ile görünüm daha da netleşir.",
      c:"var(--purple)"};

  // 6. Athletic — düşük yağ + iyi kas + iyi bel/kalça oranı
  //    whr≤0.80 daha gerçekçi (eski 0.75 çok kısıtlayıcıydı)
  if (bf <= 23 && ffmi >= 16.5 && whr <= 0.80)
    return {n:"Athletic (Atletik)",
      d:"Düşük yağ, iyi kas kütlesi ve dengeli vücut oranlarıyla atletik bir yapıdasın. 'İdare-i Maslahat' en güvenli seçenek olur.",
      c:"var(--success)"};

  // 7. Bulky — iyi FFMI + yüksek yağ
  //    bf≥25 (eski 27 çok yüksekti; BF 26 FFMI 17.5 olan kadın Fit değil, Bulky)
  if (ffmi >= 17 && bf >= 25)
    return {n:"Bulky (Hacimli)",
      d:"Kas kütlesi iyi ama biraz yağ taşınıyor. Küçük bir yağ kaybı dönemi ile daha keskin bir görünüm elde edebilirsin.",
      c:"var(--warn)"};

  // 8. Lean — düşük/orta yağ + yeterli kas
  if (bf <= 22 && ffmi >= 15)
    return {n:"Lean (Yağsız/Fit)",
      d:"Düşük yağ oranı ve yeterli kas kütlesiyle fit görünüyorsun. Kas kazanmaya odaklanırsan Athletic kategorisine geçebilirsin.",
      c:"var(--info)"};

  // 9. Fit — orta yağ + orta kas
  //    bf≤25 (eski 28 çok gevşekti; 28% yağ Overweight'e yakın, Fit değil)
  if (bf <= 25 && ffmi >= 15.5)
    return {n:"Fit",
      d:"Dengeli kas + orta yağ oranı. 'İdare-i Maslahat' ile bu kompozisyonu koruyabilir ya da hedefe göre yönlenebilirsin.",
      c:"var(--success)"};

  // 10. Average — fallback
  return {n:"Average (Ortalama)",
    d:"Vücut kompozisyonun ortalama sınırda. Tutarlı antrenman ve beslenmeyle net bir profile geçmek mümkün.",
    c:"var(--text2)"};
}

export function getDietTipByProfile(n){
  var m={'Obese (Obez)':'Önceliğin kalori açığı ve günlük hareketi artırmak. Haftada 0.5-1kg kayıp hedefle. Şekerli içecekleri tamamen kes.','Overweight (Kilolu)':'Kontrollü kalori açığı ile yağ kaybına odaklan. Protein ağırlıklı beslen, işlenmiş gıdaları azalt.','Skinny (Zayıf)':'Kalori fazlası ile beslen. Protein ağırlıklı, sık öğünler. Ağırlık antrenmanı şart.','Athletic (Atletik)':'Mevcut formu korumak için dengeli beslen. Makro dağılımına dikkat et, kalori idame düzeyinde tut.','Muscular (Kaslı)':'Kas kütleni korumak için yeterli protein al. Definasyon istiyorsan hafif kalori açığı uygula.','Skinny-fat':'Protein ağırlıklı beslen (2g/kg). Kalori idame veya hafif açıkta tut. Direnç antrenmanı ile kas kazan.','Bulky (Hacimli)':'Yavaş kalori açığı (300-400 kcal) ile cut dönemi başlat. Proteini yüksek tut, kas kaybını önle.','Lean (Yağsız/Fit)':'Kas kazanmak istiyorsan hafif kalori fazlası ekle. Protein odaklı beslen.','Fit':'Dengeli beslenmeye devam et. Hedefe göre kalori ayarla. Makro dağılımını koru.','Average (Ortalama)':'Tutarlı beslenme ve antrenman ile net bir hedefe yönel. Protein alımını artır.'};
  return m[n]||'Dengeli ve protein ağırlıklı beslenmeye odaklan.';
}
