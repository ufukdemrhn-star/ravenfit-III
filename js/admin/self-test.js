/* ══════════════════════════════════════════════════════════
   RavenFit — self-test.js
   Hesaplama doğrulama testi (geliştirme aracı)
   ══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   🧪 SELF-TEST — HESAPLAMA DOĞRULAMA
   Konsola  _ravenfitSelfTest()  yazarak çalıştır.
   Modülerleşme sırasında matematiğin bozulmadığını doğrular.
   Modülerleşmede → js/admin/self-test.js
   ══════════════════════════════════════════════════════════ */

function _ravenfitSelfTest(){
  console.log('%c🔬 RavenFit Self-Test başlıyor...', 'color:#4CC9F0;font-weight:bold;font-size:14px');
  console.log('-'.repeat(60));
  
  var passed = 0, failed = 0;
  var results = [];
  
  /* Tolerans ile karşılaştırma */
  function _approx(actual, expected, tolerance, label){
    var ok = Math.abs(actual - expected) <= tolerance;
    var status = ok ? '✅' : '❌';
    var msg = status + ' ' + label.padEnd(40) + ' → ' + 
              (typeof actual === 'number' ? actual.toFixed(2) : actual) + 
              ' (beklenen ~' + expected + ' ±' + tolerance + ')';
    console.log('%c' + msg, ok ? 'color:#2EC4B6' : 'color:#E63946;font-weight:bold');
    results.push({label: label, actual: actual, expected: expected, passed: ok});
    if(ok) passed++; else failed++;
    return ok;
  }
  
  /* Range içinde mi? */
  function _range(actual, min, max, label){
    var ok = actual >= min && actual <= max;
    var status = ok ? '✅' : '❌';
    var msg = status + ' ' + label.padEnd(40) + ' → ' + 
              (typeof actual === 'number' ? actual.toFixed(2) : actual) +
              ' (beklenen [' + min + '-' + max + '])';
    console.log('%c' + msg, ok ? 'color:#2EC4B6' : 'color:#E63946;font-weight:bold');
    results.push({label: label, actual: actual, range: [min, max], passed: ok});
    if(ok) passed++; else failed++;
    return ok;
  }
  
  /* Backup mevcut state */
  var bU = JSON.parse(JSON.stringify(U));
  var bR = JSON.parse(JSON.stringify(R));
  var bA = typeof A !== 'undefined' ? JSON.parse(JSON.stringify(A)) : null;
  var bSelGL = typeof selGL !== 'undefined' ? selGL : null;
  var bSelST = typeof selST !== 'undefined' ? selST : null;
  
  try {
    /* ════════ TEST 1: Navy Body Fat (Erkek) ════════ */
    console.log('%c\n📊 TEST GRUBU 1: Navy Vücut Yağı', 'color:#9B72FF;font-weight:bold');
    U.gender = 'male';
    U.height = 180;
    U.neck = 40;
    U.waist = 85;
    var bfMale = calcBF();
    _range(bfMale, 12, 20, 'calcBF (erkek 180cm, n40, w85)');
    
    /* TEST 2: Navy Body Fat (Kadın) */
    U.gender = 'female';
    U.height = 165;
    U.neck = 33;
    U.waist = 75;
    U.hip = 95;
    var bfFemale = calcBF();
    _range(bfFemale, 22, 30, 'calcBF (kadın 165cm, n33, w75, h95)');
    
    /* ════════ TEST 3: FFMI ════════ */
    console.log('%c\n📊 TEST GRUBU 2: FFMI', 'color:#9B72FF;font-weight:bold');
    U.gender = 'male';
    U.weight = 80;
    U.height = 180;
    var ffmiData = calcFFMI(15);
    _approx(ffmiData.ffmi, 21.0, 0.5, 'calcFFMI (80kg, 15%bf, 180cm)');
    _approx(ffmiData.ffm, 68, 0.5, 'calcFFMI.ffm (yağsız kütle)');
    
    /* ════════ TEST 4: BMR (Katch-McArdle) ════════ */
    console.log('%c\n📊 TEST GRUBU 3: BMR (Katch-McArdle)', 'color:#9B72FF;font-weight:bold');
    var bmr70 = calcBMR(70);
    _approx(bmr70, 1882, 5, 'calcBMR (LM=70)');
    var bmr50 = calcBMR(50);
    _approx(bmr50, 1450, 5, 'calcBMR (LM=50)');
    
    /* ════════ TEST 5: calcGoalCalories (Cut/Bulk) ════════ */
    console.log('%c\n📊 TEST GRUBU 4: Hedef Kalori', 'color:#9B72FF;font-weight:bold');
    var cutCal = calcGoalCalories(2500, 'cut', 15, true);
    _approx(cutCal, 2063, 25, 'calcGoalCalories (cut, bf15% → high band) -17.5%');
    var bulkCal = calcGoalCalories(2500, 'bulk', 15, true);
    _approx(bulkCal, 2750, 25, 'calcGoalCalories (bulk, bf15%, male) +10%');
    var maintCal = calcGoalCalories(2500, 'maintain', 15, true);
    _approx(maintCal, 2500, 5, 'calcGoalCalories (maintain) ±0');
    /* Cut en yüksek bf bandı: -22.5% (yağ deposu yüksek → daha büyük açık güvenli) */
    var cutHighest = calcGoalCalories(2500, 'cut', 30, true);
    _approx(cutHighest, 1938, 25, 'calcGoalCalories (cut, bf30% → highest band) -22.5%');
    
    /* ════════ TEST 6: Makro Hesabı ════════ */
    console.log('%c\n📊 TEST GRUBU 5: Makrolar', 'color:#9B72FF;font-weight:bold');
    /* Normal kullanıcı (erkek BF<25%) — bodyweight bazlı */
    var macros1 = calcMacros(2500, 'maintain', 'hybrid', 70, 80, 15, true, null);
    _range(macros1.pg, 130, 175, 'calcMacros protein (normal bf)');
    _approx(macros1.proteinSource === 'bw' ? 1 : 0, 1, 0, 'calcMacros source=bw (normal bf)');
    
    /* Obez kullanıcı (erkek BF≥25%) — LM bazlı */
    var macros2 = calcMacros(2500, 'cut', 'hybrid', 60, 100, 35, true, null);
    /* LM = 60, protein = 60 × 2.4 = 144 */
    _approx(macros2.pg, 144, 3, 'calcMacros protein (LM bazlı, bf35%)');
    _approx(macros2.proteinSource === 'lm' ? 1 : 0, 1, 0, 'calcMacros source=lm (obez)');
    
    /* Kadın eşiği farklı: %30 kadında obezite DEĞİL → bodyweight bazlı kalmalı */
    var macros3 = calcMacros(2000, 'cut', 'hybrid', 45, 65, 30, false, null);
    _approx(macros3.proteinSource === 'bw' ? 1 : 0, 1, 0, 'calcMacros kadın bf30% → bw (obezite değil)');
    /* Kadın %34 → obezite eşiği üstü → LM bazlı */
    var macros4 = calcMacros(2000, 'cut', 'hybrid', 45, 68, 34, false, null);
    _approx(macros4.proteinSource === 'lm' ? 1 : 0, 1, 0, 'calcMacros kadın bf34% → lm (obez)');

    /* ════════ TEST: Mutlak Kalori Tabanı ════════ */
    console.log('%c\n📊 TEST GRUBU 5b: Kalori Güvenlik Tabanı', 'color:#9B72FF;font-weight:bold');
    /* Küçük yapılı kadın: TDEE 1190, -22.5% = 922 → 1200'e yükselmeli */
    var fl1 = _applyCalorieFloor(922, 'cut', false, 992);
    _approx(fl1.cal, 1200, 0, 'Kalori tabanı: kadın 922 → 1200 (klinik min)');
    _approx(fl1.floored ? 1 : 0, 1, 0, 'Kalori tabanı: bayrak set edildi');
    /* Erkek klinik minimumu 1500 */
    var fl2 = _applyCalorieFloor(1300, 'cut', true, 1100);
    _approx(fl2.cal, 1500, 0, 'Kalori tabanı: erkek 1300 → 1500 (klinik min)');
    /* BMR klinik minimumun üstündeyse BMR taban olur */
    var fl3 = _applyCalorieFloor(1600, 'cut', true, 1800);
    _approx(fl3.cal, 1800, 0, 'Kalori tabanı: BMR 1800 taban oldu');
    /* Güvenli değer değişmemeli */
    var fl4 = _applyCalorieFloor(2200, 'cut', true, 1800);
    _approx(fl4.cal, 2200, 0, 'Kalori tabanı: güvenli değer korundu');
    _approx(fl4.floored ? 1 : 0, 0, 0, 'Kalori tabanı: gereksiz yere tetiklenmedi');
    /* Bulk'ta taban uygulanmaz */
    var fl5 = _applyCalorieFloor(900, 'bulk', false, 1000);
    _approx(fl5.cal, 900, 0, 'Kalori tabanı: bulk hedefinde uygulanmıyor');

    /* ════════ TEST: Bulk Uyarısı ════════ */
    console.log('%c\n📊 TEST GRUBU 5c: Bulk Risk Kontrolü', 'color:#9B72FF;font-weight:bold');
    var _sv_bf = R.bf, _sv_g = U.gender, _sv_ack = _bulkAcknowledged;
    _bulkAcknowledged = false;
    R.bf = 25; U.gender = 'male';
    _approx(_checkBulkRisk('bulk') ? 1 : 0, 1, 0, '_checkBulkRisk (erkek bf25% → riskli)');
    R.bf = 15;
    _approx(_checkBulkRisk('bulk') ? 1 : 0, 0, 0, '_checkBulkRisk (erkek bf15% → güvenli)');
    R.bf = 33; U.gender = 'female';
    _approx(_checkBulkRisk('bulk') ? 1 : 0, 1, 0, '_checkBulkRisk (kadın bf33% → riskli)');
    _approx(_checkBulkRisk('cut') ? 1 : 0, 0, 0, '_checkBulkRisk cut için false');
    R.bf = _sv_bf; U.gender = _sv_g; _bulkAcknowledged = _sv_ack;

    /* ════════ TEST 7: Su Hesabı ════════ */
    console.log('%c\n📊 TEST GRUBU 6: Su Hesabı', 'color:#9B72FF;font-weight:bold');
    /* Manuel hesap: 70kg → 35*70/1000 = 2.45 L */
    var w70 = (70 * 35) / 1000;
    _approx(w70, 2.45, 0.01, 'Su (70kg base, 35ml/kg)');
    /* Antrenman bonusu: +500 ml */
    var w70bonus = (70 * 35 + 500) / 1000;
    _approx(w70bonus, 2.95, 0.01, 'Su (70kg + antrenman bonus)');
    
    /* ════════ TEST 8: İdeal Kilo Aralığı ════════ */
    console.log('%c\n📊 TEST GRUBU 7: BMI Referans Aralığı', 'color:#9B72FF;font-weight:bold');
    var ir = calcIdealRange(180);
    _approx(ir.lo, 60, 1, 'calcIdealRange.lo (180cm BMI 18.5)');
    _approx(ir.hi, 81, 1, 'calcIdealRange.hi (180cm BMI 24.9)');
    
    /* ════════ TEST 9: Edge Cases ════════ */
    console.log('%c\n📊 TEST GRUBU 8: Edge Cases', 'color:#9B72FF;font-weight:bold');
    /* Geçersiz input sanitize ediliyor mu? */
    U.weight = -10;
    U.height = NaN;
    U.age = 999;
    _sanitizeUserInputs();
    _range(U.weight, 25, 300, '_sanitize: negatif kilo düzeltilmesi');
    _range(U.height, 120, 230, '_sanitize: NaN boy düzeltilmesi');
    _range(U.age, 12, 100, '_sanitize: max yaş düzeltilmesi');
    
    /* RED-S risk kontrolü */
    U.gender = 'male'; R.bf = 5;
    var redsMale = _checkRedsRisk('cut');
    _approx(redsMale ? 1 : 0, 1, 0, '_checkRedsRisk (erkek bf5%)');
    R.bf = 15;
    var redsMaleSafe = _checkRedsRisk('cut');
    _approx(redsMaleSafe ? 1 : 0, 0, 0, '_checkRedsRisk (erkek bf15% güvenli)');
    
    U.gender = 'female'; R.bf = 12;
    var redsFemale = _checkRedsRisk('cut');
    _approx(redsFemale ? 1 : 0, 1, 0, '_checkRedsRisk (kadın bf12%)');
    
    /* Bulk seçiminde RED-S çalışmamalı */
    R.bf = 5;
    var redsBulkNo = _checkRedsRisk('bulk');
    _approx(redsBulkNo ? 1 : 0, 0, 0, '_checkRedsRisk bulk için false');
    
  } catch(err){
    console.error('❌ Test sırasında hata:', err);
    failed++;
  } finally {
    /* Restore state */
    Object.assign(U, bU);
    Object.assign(R, bR);
    if(bA && typeof A !== 'undefined') Object.assign(A, bA);
    if(bSelGL !== null && typeof selGL !== 'undefined') selGL = bSelGL;
    if(bSelST !== null && typeof selST !== 'undefined') selST = bSelST;
    _redsAcknowledged = false; /* test sonrası reset */
  }
  
  /* SONUÇ */
  var total = passed + failed;
  var pct = total > 0 ? Math.round(passed/total*100) : 0;
  console.log('-'.repeat(60));
  var summaryStyle = failed === 0 ? 'color:#2EC4B6;font-weight:bold;font-size:14px' 
                                  : 'color:#FFB703;font-weight:bold;font-size:14px';
  console.log('%c📊 SONUÇ: '+passed+'/'+total+' geçti ('+pct+'%)', summaryStyle);
  if(failed > 0){
    console.log('%c⚠️ '+failed+' test başarısız oldu — yukarıdaki ❌ satırlara bak', 'color:#E63946');
  } else {
    console.log('%c🎉 Tüm testler geçti — sistem sağlıklı!', 'color:#2EC4B6;font-weight:bold');
  }
  
  return {passed: passed, failed: failed, total: total, results: results};
}
