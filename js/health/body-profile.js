/* ══════════════════════════════════════════════════════════
   RavenFit — body-profile.js
   Vücut profili ve akıllı antrenman tavsiyesi
   ══════════════════════════════════════════════════════════ */

/* Vücut Profili Algoritması - cinsiyet bazlı ve daha dengeli sürüm */

function determineBodyProfile(bf, ffmi, bmi) {
  var male = U.gender === 'male';
  var swr = (male && U.shoulder && U.waist) ? (U.shoulder / U.waist) : 0;
  var whr = (!male && U.hip && U.waist) ? (U.waist / U.hip) : 0;

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

/* Akıllı Egzersiz Önerisi */

function getSmartWorkoutAdvice(goalOverride) {
  if (A.sd === undefined) return "";
  var days = A.sd;   // 0–6 actual day count
  var goal = goalOverride || selGL || R.recGoal;
  if (!goal) return "";
  var msg = "";

  /* Eski isim → yeni isim mapping (backward-compat) */
  var glMap={yag:'cut', idame:'maintain', kutle:'bulk'};
  if(glMap[goal]) goal=glMap[goal];

  if (goal === 'cut') {
    if (days === 0)        msg = "Yağ yakmak için egzersiz şart. Haftada en az 3 gün antrenman yapmalısın.";
    else if (days === 1)   msg = "Haftada 1 gün yağ kaybı için yeterli değil. Minimum 3 güne çıkmalısın, yoksa sonuç alamazsın.";
    else if (days === 2)   msg = "İyi bir başlangıç, ama yağ kaybı için haftada 3–4 gün idealdir.";
    else if (days <= 4)    msg = "Yağ kaybı için optimal antrenman sıklığındasın. Devam et!";
    else                   msg = "5+ gün fazla bile olabilir. Overtraining ve toparlanmaya dikkat et; dinlenme de antrenmanın bir parçası.";
  } else if (goal === 'bulk') {
    if (days === 0)        msg = "Açık konuşmak gerekirse; hiç antrenman yapmadan kas kazanamazsın. Hemen başlamalısın.";
    else if (days <= 2)    msg = "Kas gelişimi (hipertrofi) için minimum 3 gün şarttır. Şu an yetersiz kalıyorsun.";
    else if (days <= 4)    msg = "İdeal hipertrofi aralığındasın. Prog. overload ve yeterli uyku ile gelişim garantili!";
    else                   msg = "Yoğun bir hacim dönemi. Eklemlerini dinlendirmeyi ve toparlanmayı ihmal etme.";
  } else if (goal === 'maintain') {
    if (days <= 1)         msg = "Kas kütleni korumak için haftada 1–2 gün yeterli olabilir. Yine de hareketi artırmanı öneririz.";
    else if (days <= 3)    msg = "Mevcut formu korumak için iyi bir sıklık.";
    else                   msg = "Harika bir aktivite seviyesin. Formunu geliştirmeyi de düşünebilirsin.";
  } else if (goal === 'recomp') {
    if (days <= 1)         msg = "Recomp için minimum 3 gün antrenman şarttır. Daha az antrenman ile yağ kaybı + kas kazanımı çok zor.";
    else if (days <= 3)    msg = "Recomp için kabul edilebilir sıklık. Yüksek proteine ve antrenman yoğunluğuna dikkat et.";
    else                   msg = "Recomp için ideal antrenman sıklığı. Antrenman kalitesi ve toparlanma kritik.";
  }
  return msg;
}
