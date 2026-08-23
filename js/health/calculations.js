/* ══════════════════════════════════════════════════════════
   RavenFit — calculations.js
   Vücut ve kalori hesaplamaları
   ══════════════════════════════════════════════════════════ */

/* _sanitizeUserInputs: Hesaplama öncesi U objesindeki değerleri sınırlar.
   NaN, negatif veya anlamsız değerleri güvenli varsayılana çeker. */

function _sanitizeUserInputs(){
  var warnings = [];
  
  /* Kilo: 25-300 kg arası */
  if(U.weight != null){
    var w = parseFloat(U.weight);
    if(isNaN(w) || w <= 0){ U.weight = 70; warnings.push('weight invalid → 70'); }
    else if(w < 25){ U.weight = 25; warnings.push('weight <25 → 25'); }
    else if(w > 300){ U.weight = 300; warnings.push('weight >300 → 300'); }
    else U.weight = w;
  }
  
  /* Boy: 120-230 cm arası */
  if(U.height != null){
    var h = parseFloat(U.height);
    if(isNaN(h) || h <= 0){ U.height = 170; warnings.push('height invalid → 170'); }
    else if(h < 120){ U.height = 120; warnings.push('height <120 → 120'); }
    else if(h > 230){ U.height = 230; warnings.push('height >230 → 230'); }
    else U.height = h;
  }
  
  /* Yaş: 12-100 arası */
  if(U.age != null){
    var a = parseFloat(U.age);
    if(isNaN(a) || a <= 0){ U.age = 30; warnings.push('age invalid → 30'); }
    else if(a < 12){ U.age = 12; warnings.push('age <12 → 12'); }
    else if(a > 100){ U.age = 100; warnings.push('age >100 → 100'); }
    else U.age = a;
  }
  
  /* Bel: 40-200 cm arası */
  if(U.waist != null){
    var ws = parseFloat(U.waist);
    if(isNaN(ws) || ws <= 0){ U.waist = null; warnings.push('waist invalid → null'); }
    else if(ws < 40 || ws > 200){ warnings.push('waist out of range ['+ws+']'); /* tut, kullanıcıya görünür uyarı olarak bırak */ }
    else U.waist = ws;
  }
  
  /* Boyun: 25-70 cm arası */
  if(U.neck != null){
    var nk = parseFloat(U.neck);
    if(isNaN(nk) || nk <= 0){ U.neck = null; warnings.push('neck invalid → null'); }
    else if(nk < 25 || nk > 70){ warnings.push('neck out of range ['+nk+']'); }
    else U.neck = nk;
  }
  
  /* Kalça: 50-200 cm arası (kadınlar için) */
  if(U.hip != null){
    var hp = parseFloat(U.hip);
    if(isNaN(hp) || hp <= 0){ U.hip = null; warnings.push('hip invalid → null'); }
    else if(hp < 50 || hp > 200){ warnings.push('hip out of range ['+hp+']'); }
    else U.hip = hp;
  }
  
  /* Omuz: 70-170 cm arası (erkekler için) */
  if(U.shoulder != null){
    var sh = parseFloat(U.shoulder);
    if(isNaN(sh) || sh <= 0){ U.shoulder = null; warnings.push('shoulder invalid → null'); }
    else if(sh < 70 || sh > 170){ warnings.push('shoulder out of range ['+sh+']'); }
    else U.shoulder = sh;
  }
  
  if(warnings.length > 0){
    console.warn('🛡️ Input sanitize:', warnings.join(', '));
  }
  return warnings;
}

/* ── CALCULATIONS ─────────────────────────────────────── */

/* Navy (ABD Donanması) yağ oranı formülü.
   Not: log10 negatif/sıfır argümanla NaN döndürür. Bel ≤ boyun gibi
   fiziksel olarak imkânsız girdilerde bu yaşanabileceği için
   argümanlar alt sınırla korunur, bölme _safeDiv ile yapılır. */
function calcBF(){
  var h=U.height,nk=U.neck,wst=U.waist,hip=U.hip;
  var bf, payda;
  if(U.gender==='male'){
    /* Bel çevresi boyun çevresinden büyük olmalı — değilse 1 cm'e sabitle */
    var cevreE=Math.max(1, wst-nk);
    payda=1.0324-0.19077*Math.log10(cevreE)+0.15456*Math.log10(Math.max(1,h));
  } else {
    var cevreK=Math.max(1, wst+hip-nk);
    payda=1.29579-0.35004*Math.log10(cevreK)+0.22100*Math.log10(Math.max(1,h));
  }
  bf=_safeDiv(495, payda, 0)-450;
  return Math.max(2, Math.min(70, _safeRound(bf, 2)));
}

function calcFFMI(bf){
  var hm=U.height/100;
  var ffm=U.weight*(1-bf/100);
  /* Boy 0 gelirse bölme Infinity üretir — _safeDiv 0 döndürür */
  var ffmi=_safeDiv(ffm, hm*hm, 0);
  var norm=ffmi+6.1*(1.8-hm);
  return{
    ffmi: _safeRound(ffmi, 2),
    norm: _safeRound(norm, 2),
    ffm:  _safeRound(ffm, 2)
  };
}

function calcBMR(lm){return Math.round(370+21.6*lm);}

/* Vücut Tipi hesabı (Ektomorf/Mezomorf/Endomorf) — BT objesindeki cevaplara göre */

function calcBT(){
  var ec=0,me=0,en=0;
  Object.keys(BT).forEach(function(k){
    var q=BT[k];
    if(!q) return;
    ec += q.ec||0;
    me += q.me||0;
    en += q.en||0;
  });
  var t=ec+me+en||1;
  return{
    ecto: _safeRound(_safeDiv(ec, t, 0)*100, 2),
    meso: _safeRound(_safeDiv(me, t, 0)*100, 2),
    endo: _safeRound(_safeDiv(en, t, 0)*100, 2)
  };
}

/* İdeal kilo aralığı (BMI 18.5-24.9 üzerinden) */

function calcIdealRange(h){
  var hm=h/100, h2=hm*hm;
  return{
    lo: Math.round(18.5*h2*10)/10,
    hi: Math.round(24.9*h2*10)/10
  };
}

function calcAct(){
  // A.sd is now actual day count (0–6). Scale to 0–2 range for scoring.
  var sdScore = Math.min((A.sd||0) * 0.35, 2.1);
  var sc = (A.job||0) + sdScore + (A.sh||0) + (A.ex||0);
  if(sc<=1)  return{m:1.2,  lbl:'Sedanter — Hareketsiz yaşam'};
  if(sc<=2.5)return{m:1.375,lbl:'Az Aktif — Hafif egzersiz'};
  if(sc<=4.5)return{m:1.55, lbl:'Orta Aktif — Düzenli egzersiz'};
  if(sc<=6.5)return{m:1.725,lbl:'Çok Aktif — Yoğun egzersiz'};
  return{m:1.9,lbl:'Aşırı Aktif — Spor odaklı yaşam'};
}

/* ══════════════════════════════════════════════════════════
   YENİ KALORİ + MAKRO ALGORİTMASI (cut/recomp/maintain/bulk)
   ══════════════════════════════════════════════════════════ */

/* Yağ oranını bandına çevir: yüksek/orta/düşük */

function _bfBand(bf, male){
  if(male){
    if(bf>25) return 'highest';     /* >25 */
    if(bf>=15) return 'high';        /* 15-25 */
    if(bf>=10) return 'mid';         /* 10-15 */
    return 'low';                    /* <10 */
  } else {
    if(bf>35) return 'highest';     /* >35 */
    if(bf>=25) return 'high';        /* 25-35 */
    if(bf>=20) return 'mid';         /* 20-25 */
    return 'low';                    /* <20 */
  }
}

/* Hedef → TDEE ayarlaması (yüzde olarak, açığın orta noktasını al) */
/* ──────────────────────────────────────────────────────────
   MUTLAK KALORİ TABANI — GÜVENLİK AĞI
   Yüzde bazlı açık, küçük yapılı kişilerde tehlikeli derecede
   düşük mutlak kaloriye inebilir. Örnek: 45 kg, sedanter,
   yüksek yağ oranlı bir kadında TDEE ~1190 → -%22.5 = 922 kcal.
   Bu, tıbbi gözetim gerektiren VLCD sınırına yakındır.

   İki katmanlı taban:
     1) Klinik minimum — Kadın 1200, Erkek 1500 kcal
        (Bu değerlerin altı tıbbi gözetim gerektirir — NICE/NHS)
     2) BMR tabanı — bazal metabolizmanın altında kronik beslenme
        önerilmez.

   Taban devreye girerse R.calorieFloorApplied = true olur ve
   arayüzde kullanıcı bilgilendirilir.
   ────────────────────────────────────────────────────────── */

function _applyCalorieFloor(cals, gl, male, bmr){
  /* Sadece açık oluşturan hedeflerde uygulanır */
  if(gl !== 'cut' && gl !== 'recomp') return {cal: cals, floored: false, kind: null};
  var clinicalMin = male ? 1500 : 1200;
  var bmrMin = (bmr && bmr > 0) ? Math.round(bmr) : 0;
  var floor = Math.max(clinicalMin, bmrMin);
  if(cals >= floor) return {cal: cals, floored: false, kind: null};
  return {
    cal: floor,
    floored: true,
    kind: (floor === bmrMin && bmrMin > clinicalMin) ? 'bmr' : 'clinical'
  };
}

function calcGoalCalories(tdee, gl, bf, male){
  var band=_bfBand(bf, male);
  var pct=0;
  if(gl==='cut'){
    /* Açık yüzdeleri yağ oranına göre ölçeklenir.
       Literatür: %15-25 aralığı; yağ deposu yüksek olan daha büyük
       açığı güvenle taşır, yağsız olan taşıyamaz.
       Mutlak güvenlik _applyCalorieFloor() ile ayrıca sağlanır. */
    var cutMap={highest:-22.5, high:-17.5, mid:-12.5, low:-7.5};
    pct=cutMap[band]||-15;
  } else if(gl==='recomp'){
    var recompMap={highest:-10, high:-5, mid:0, low:5};
    pct=recompMap[band]||0;
  } else if(gl==='maintain'){
    pct=0;
  } else if(gl==='bulk'){
    var bulkMap={lowest:15, low:15, mid:10, high:5};
    /* Bulk için band yeniden ölçekleniyor */
    var bulkBand;
    if(male){
      if(bf<10) bulkBand='lowest';
      else if(bf<15) bulkBand='low';
      else if(bf<20) bulkBand='mid';
      else bulkBand='high';
    } else {
      if(bf<18) bulkBand='lowest';
      else if(bf<25) bulkBand='low';
      else if(bf<30) bulkBand='mid';
      else bulkBand='high';
    }
    pct={lowest:15, low:15, mid:10, high:5}[bulkBand]||5;
  }
  return Math.round(tdee*(1+pct/100));
}

/* Hedef için protein g/kg (bodyweight!) */

function _proteinPerKg(gl, bf, male){
  var band=_bfBand(bf, male);
  /* Cut: high(1.8-2.0), mid(2.0-2.2), low(2.2-2.4) */
  /* Recomp: aynı tablo, çünkü protein vurgusu */
  /* Maintain: high(1.6-1.8), mid(1.8-2.0), low(2.0-2.2) */
  /* Bulk: high(1.6-1.8), mid(1.8-2.0), low(2.0-2.2) */
  if(gl==='cut'||gl==='recomp'){
    var m={highest:1.9, high:1.9, mid:2.1, low:2.3};
    return m[band]||2.0;
  } else {
    /* maintain ve bulk */
    var m={highest:1.7, high:1.7, mid:1.9, low:2.1};
    return m[band]||1.9;
  }
}

/* Hedef için yağ g/kg (bodyweight!) */

function _fatPerKg(gl, recompMode){
  if(gl==='recomp'){
    if(recompMode==='lowcarb') return 1.0;
    if(recompMode==='performance') return 0.65; /* 0.6-0.7 ort */
    return 0.8;
  }
  /* cut, maintain, bulk → ideal aralık 0.8-1.0, ort 0.9 */
  return 0.9;
}

/* Yeni makro hesabı */
/* ──────────────────────────────────────────────────────────
   PROTEİN HESABI — YAĞSIZ KÜTLE (LM) GEÇİŞİ
   Yağ dokusu metabolik olarak protein talep etmez. Yüksek yağ
   oranında toplam vücut ağırlığından hesaplamak protein ihtiyacını
   ciddi şekilde ŞİŞİRİR. Bu yüzden obezite eşiğinin üstünde
   hesap yağsız kütle (LM) üzerinden yapılır.

   Eşikler cinsiyete duyarlıdır (klinik obezite sınırları):
     Erkek  ≥ %25 yağ
     Kadın  ≥ %32 yağ
   (RED-S sürümündeki düz %30 eşiği kadınlar için yanlıştı —
    %30 kadınlarda obezite değil, ortalama üstü bir değerdir.)

   LM katsayısı: 2.4 g/kg — literatürde bu değerin üstünde ek
   kas koruma faydası gösterilememiştir.
   Kaynak: Clinical Nutrition ESPEN 2022 (n=2291), Helms 2014,
           ISSN Position Stand.
   ────────────────────────────────────────────────────────── */

function _useLeanMassProtein(bf, male){
  if(bf == null) return false;
  return male ? (bf >= 25) : (bf >= 32);
}

function calcMacros(cals, gl, st, lm, bw, bf, male, recompMode){
  bw=bw||lm; /* fallback */
  var prKg=_proteinPerKg(gl, bf, male);
  var fatKg=_fatPerKg(gl, recompMode);

  /* Yüksek yağ oranında protein yağsız kütle üzerinden hesaplanır */
  var pg, proteinSource, proteinPerKg, proteinBase;
  if(_useLeanMassProtein(bf, male) && lm && lm > 0){
    proteinPerKg = 2.4;
    proteinBase  = lm;
    pg = Math.round(lm * 2.4);
    proteinSource = 'lm';
  } else {
    proteinPerKg = prKg;
    proteinBase  = bw;
    pg = Math.round(bw * prKg);
    proteinSource = 'bw';
  }

  var fg=Math.round(bw*fatKg);
  var pc=pg*4;
  var fc=fg*9;
  var cc=Math.max(0, cals-pc-fc);
  var cg=Math.round(cc/4);
  return {
    pg:pg, fg:fg, cg:cg, pc:pc, fc:Math.round(fc), cc:Math.round(cc),
    proteinSource: proteinSource,   /* 'lm' | 'bw' — UI bilgilendirmesi için */
    proteinPerKg: proteinPerKg,
    proteinBase: proteinBase
  };
}

function calcAll(){
  try {
    /* ── INPUT SANITIZATION (güvenlik katmanı) ── */
    _sanitizeUserInputs();

    /* Temel hesaplar */
    R.bf=calcBF();
    if(!R.bf || isNaN(R.bf)) R.bf=20; /* fallback */
    var fd=calcFFMI(R.bf);
    R.ffmi=fd.ffmi; R.norm_ffmi=fd.norm; R.lm=fd.ffm;
    R.fm=_safeRound(U.weight-R.lm, 2);
    R.bmi=_safeRound(_safeDiv(U.weight, Math.pow(U.height/100,2), 0), 1);
    R.bmr=calcBMR(R.lm);
    var am=calcAct();
    R.actMult=am.m; R.actLbl=am.lbl;
    R.tdee=Math.round(R.bmr*R.actMult);
    R.bt=calcBT();
    R.iw=calcIdealRange(U.height);
    /* ──────────────────────────────────────────────────
       SU İHTİYACI — TEMEL HESAP (ACSM 2024 hidrasyon rehberi)
       Base: 35 ml/kg vücut ağırlığı
       + Antrenman bonusu: +500 ml (aktivite çarpanı ≥1.55 ise)
       Not: Supplement eki _calcWaterTarget() içinde ayrıca eklenir.
       ────────────────────────────────────────────────── */
    var waterBaseML = U.weight * 35;
    var waterBonusML = (R.actMult && R.actMult >= 1.55) ? 500 : 0;
    R.water = Math.round(waterBaseML + waterBonusML) / 1000;
    R.waterBase = Math.round(waterBaseML) / 1000;
    R.waterBonus = waterBonusML / 1000;
    R.waterHasTrainingBonus = waterBonusML > 0;
    R.minProt=Math.round(U.weight*1.6);
    R.maxProt=Math.round(U.weight*2.4);
    R.recGoal=recGoal();

    /* Eski hedef isimleri yeni ile mapla — backward compatibility */
    var glOld=selGL||R.recGoal||'maintain';
    var glMap={yag:'cut', idame:'maintain', kutle:'bulk'};
    if(glMap[glOld]){ selGL=glMap[glOld]; glOld=selGL; }
    var gl=selGL||R.recGoal||'maintain';
    var st=selST||'hybrid';
    var male=U.gender==='male';

    /* Hedef kalori */
    try {
      R.goalCal=calcGoalCalories(R.tdee, gl, R.bf, male);
      if(!R.goalCal || isNaN(R.goalCal)) R.goalCal=R.tdee;
      /* ── Mutlak kalori tabanı güvenlik kontrolü ── */
      var _fl=_applyCalorieFloor(R.goalCal, gl, male, R.bmr);
      R.goalCal=_fl.cal;
      R.calorieFloorApplied=_fl.floored;
      R.calorieFloorKind=_fl.kind;
    } catch(e){ console.warn('goalCal hata:',e); R.goalCal=R.tdee; }

    /* Makrolar */
    try {
      R.macros=calcMacros(R.goalCal, gl, st, R.lm, U.weight, R.bf, male, A.recompMode);
    } catch(e){
      console.warn('macros hata:',e);
      /* Fallback: temel makro */
      var pg=Math.round(U.weight*2.0), fg=Math.round(U.weight*0.9);
      var pc=pg*4, fc=fg*9, cc=Math.max(0, R.goalCal-pc-fc);
      R.macros={pg:pg, fg:fg, cg:Math.round(cc/4), pc:pc, fc:fc, cc:Math.round(cc)};
    }

    /* Oran (yalnız değerler varsa) */
    try {
      if(U.gender==='male' && U.shoulder && U.waist) R.swr=Math.round(U.shoulder/U.waist*100)/100;
      else if(U.waist && U.hip) R.whr=Math.round(U.waist/U.hip*100)/100;
    } catch(e){}
  } catch(err){
    console.error('calcAll fatal:',err);
  }
}

/* ══════════════════════════════════════════════════════════
   FFMI BANTLARI — TEK KAYNAK

   Bu tanım üç yerde kullanılır:
     • js/tabs/body.js        → renkli skala + rozet
     • js/health/ffmi-detail.js → detay tablosu
   Ayrı ayrı yazıldığında etiketler birbirini tutmuyordu
   (skala "İyi" derken rozet "Atletik" diyordu).
   ══════════════════════════════════════════════════════════ */
function _ffmiBands(male){
  return male
    ? [{ust:18, ad:'Zayıf',    cls:'bb', renk:'var(--info)', txt:'Kas kütlesi ortalamanın altında. Düzenli direnç antrenmanı ve yeterli protein alımıyla geliştirilebilir.'},
       {ust:20, ad:'Ortalama', cls:'bb', renk:'var(--info)', txt:'Yetişkin erkekler için ortalama kas kütlesi seviyesindesin.'},
       {ust:22, ad:'İyi',      cls:'bg', renk:'var(--success)', txt:'Ortalamanın üzerinde kas gelişimi. Düzenli antrenmanın etkisi görülüyor.'},
       {ust:24, ad:'Çok İyi',  cls:'bg', renk:'var(--success)', txt:'Atletik seviyede kas kütlesi. Güçlü ve dengeli bir fiziğin var.'},
       {ust:26, ad:'Elit',     cls:'bp', renk:'var(--purple)', txt:'İleri düzey kas gelişimi. Yıllarca disiplinli antrenmanın sonucu.'},
       {ust:30, ad:'İstisnai', cls:'br', renk:'var(--accent)', txt:'Doğal yollarla ulaşılması son derece nadir bir seviye.'}]
    : [{ust:14, ad:'Zayıf',    cls:'bb', renk:'var(--info)', txt:'Yağsız kütlen ortalamanın altında. Antrenman ve beslenmeyle ilerleyebilirsin.'},
       {ust:16, ad:'Ortalama', cls:'bb', renk:'var(--info)', txt:'Kadınlar için ortalama yağsız kütle seviyesindesin.'},
       {ust:18, ad:'İyi',      cls:'bg', renk:'var(--success)', txt:'Ortalamanın üzerinde kas gelişimi. İyi bir seviyedesin.'},
       {ust:20, ad:'Çok İyi',  cls:'bg', renk:'var(--success)', txt:'Atletik seviyede kas kütlesi. Güçlü bir fiziğin var.'},
       {ust:22, ad:'Elit',     cls:'bp', renk:'var(--purple)', txt:'İleri düzey kas gelişimi. Üst düzey bir seviye.'},
       {ust:26, ad:'İstisnai', cls:'br', renk:'var(--accent)', txt:'Kadınlarda doğal yollarla ulaşılması çok nadir.'}];
}

/* Verilen FFMI değerinin hangi banda düştüğünü döndürür. */
function _ffmiBand(ffmi, male){
  var b = _ffmiBands(male);
  for(var i=0;i<b.length;i++){ if(ffmi < b[i].ust) return b[i]; }
  return b[b.length-1];
}
