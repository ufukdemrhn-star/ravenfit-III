/* ══════════════════════════════════════════════════════════════
   RavenFit — TARAYICI TESTİ
   Hiçbir program kurmadan, doğrudan tarayıcı konsolunda çalışır.

   KULLANIM:
     Konsola şunu yapıştır ve Enter'a bas:

     fetch('tests/browser-test.js').then(r=>r.text()).then(eval)

   ══════════════════════════════════════════════════════════════ */

(function () {
  var pass = 0, fail = 0, warn = 0;
  var C = {
    ok:   'color:#2EC4B6;font-weight:bold',
    no:   'color:#E63946;font-weight:bold',
    wr:   'color:#FF9F1C;font-weight:bold',
    head: 'color:#9B72FF;font-weight:bold;font-size:13px',
    dim:  'color:#909090'
  };

  function t(label, cond, detail) {
    if (cond) { pass++; console.log('%c  ✅ ' + label, C.ok); }
    else { fail++; console.log('%c  ❌ ' + label + (detail ? '  → ' + detail : ''), C.no); }
  }
  function w(label, detail) {
    warn++; console.log('%c  ⚠️  ' + label + (detail ? '  → ' + detail : ''), C.wr);
  }
  function head(txt) { console.log('%c\n▸ ' + txt, C.head); }

  /* Fonksiyon kaynağındaki yorumları siler — yorumlardaki kelimeler
     yanlış alarma yol açmasın diye. */
  function kod(fn) {
    return fn.toString()
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/\/\/[^\n]*/g, ' ');
  }

  /* Bir ismin global olarak tanımlı olup olmadığını güvenle kontrol eder */
  function varMi(isim) {
    try { return typeof eval(isim) === 'function'; } catch (e) { return false; }
  }

  console.log('%c╔══════════════════════════════════════════════════╗', C.head);
  console.log('%c║   RAVENFIT — TARAYICI SAĞLIK TESTİ               ║', C.head);
  console.log('%c╚══════════════════════════════════════════════════╝', C.head);

  /* ═══════════════════════════════════════════════════
     0. EKRAN YAPISI  — en kritik kontrol
     Bir </div> eksikliği ekranları iç içe geçirir ve
     uygulama sessizce açılmaz. Konsolda hata çıkmaz.
     ═══════════════════════════════════════════════════ */
  head('0 — Ekran yapısı sağlam mı?');

  var authEl   = document.getElementById('auth-screen');
  var appEl    = document.getElementById('app-main');
  var splashEl = document.getElementById('splash');
  var wizEl    = document.getElementById('wizard');
  var resEl    = document.getElementById('results');

  t('Tüm ana ekranlar mevcut',
    !!(authEl && appEl && splashEl && wizEl && resEl));

  if (authEl && appEl) {
    t('auth-screen, app-main dışında', !appEl.contains(authEl),
      'iç içe geçmiş — </div> eksik olabilir');
  }
  if (appEl && splashEl && wizEl && resEl) {
    t('splash app-main içinde', appEl.contains(splashEl));
    t('wizard app-main içinde', appEl.contains(wizEl));
    t('results app-main içinde', appEl.contains(resEl));
    /* Ekranlar birbirinin İÇİNDE olmamalı — kardeş olmalılar */
    t('splash ve wizard iç içe değil',
      !splashEl.contains(wizEl) && !wizEl.contains(splashEl),
      'iç içe geçmiş — HTML yapısı bozuk');
    t('wizard ve results iç içe değil',
      !wizEl.contains(resEl) && !resEl.contains(wizEl));
  }

  /* Aynı anda yalnızca bir ekran aktif olmalı */
  var aktifSayisi = document.querySelectorAll('.screen.active').length;
  t('Tek ekran aktif', aktifSayisi === 1, aktifSayisi + ' ekran aktif');

  /* Kritik overlay'ler body seviyesinde mi? */
  ['ws-screen','warmup-overlay','settings-drawer','supp-modal'].forEach(function(id){
    var el = document.getElementById(id);
    if (el && appEl) {
      t(id + ' doğru seviyede', !splashEl || !splashEl.contains(el),
        'bir ekranın içine hapsolmuş');
    }
  });

  /* ═══════════════════════════════════════════════════
     1. MODÜLLER YÜKLENDİ Mİ?
     ═══════════════════════════════════════════════════ */
  head('1 — Modüller yüklendi mi?');

  var gerekli = {
    'core/state':        'saveData',
    'core/utils':        'clamp',
    'core/theme':        'applyTheme',
    'core/storage':      'getEntries',
    'ui/screens':        'showScreen',
    'ui/wizard':         'nextStep',
    'health/calc':       'calcAll',
    'health/reds':       '_checkRedsRisk',
    'nutrition/supp':    'calcSuppScores',
    'nutrition/water':   '_calcWaterTarget',
    'workout/engine':    '_doStartSession',
    'workout/tools':     'adjustRestTime',
    'calculators/pr':    '_prFeelSlider',
    'badges':            'checkAndAwardBadges',
    'auth/firebase':     'initFirebase',
    'admin/self-test':   '_ravenfitSelfTest'
  };
  var eksikModul = [];
  for (var k in gerekli) {
    if (!varMi(gerekli[k])) eksikModul.push(k);
  }
  t('16 modülün tamamı yüklü', eksikModul.length === 0, eksikModul.join(', '));

  /* ═══════════════════════════════════════════════════
     2. ÇİFT YÜKLEME KONTROLÜ  (A1)
     ═══════════════════════════════════════════════════ */
  head('2 — JSON dosyaları çift yükleniyor mu?  (A1 düzeltmesi)');

  try {
    var res = performance.getEntriesByType('resource');
    var sayac = {};
    res.forEach(function (r) {
      var m = r.name.match(/\/data\/([\w-]+\.json)/);
      if (m) sayac[m[1]] = (sayac[m[1]] || 0) + 1;
    });
    var isimler = Object.keys(sayac);
    if (isimler.length === 0) {
      w('Henüz JSON yüklenmemiş', 'sayfayı yenileyip tekrar dene');
    } else {
      var cift = isimler.filter(function (n) { return sayac[n] > 1; });
      t(isimler.length + ' JSON dosyası tek kez yüklendi', cift.length === 0,
        cift.map(function (n) { return n + ' ×' + sayac[n]; }).join(', '));
      console.log('%c     Yüklenen: ' + isimler.join(', '), C.dim);
    }
  } catch (e) { w('Performance API okunamadı', e.message); }

  /* ═══════════════════════════════════════════════════
     3. SET SAYACI  (A2)
     ═══════════════════════════════════════════════════ */
  head('3 — Set sayacı +/− butonları  (A2 düzeltmesi)');

  var src = kod(adjustRestTime);
  t('Doğru element ID kullanılıyor', src.indexOf('tools-rest-time-val') > -1);
  t('Eski bozuk ID kaldırıldı', src.indexOf("getElementById('rest-time-val')") === -1);
  t('Null koruması var', src.indexOf('if(el)') > -1 || src.indexOf('if (el)') > -1);

  /* Canlı test */
  var eski = _restTime;
  var hata = null;
  try {
    _restTime = 60; adjustRestTime(15);
    t('_restTime 60 → 75 oldu', _restTime === 75, 'değer: ' + _restTime);
    adjustRestTime(-15);
    t('_restTime 75 → 60 oldu', _restTime === 60, 'değer: ' + _restTime);
    _restTime = 20; adjustRestTime(-15);
    t('Alt sınır 15sn korunuyor', _restTime === 15, 'değer: ' + _restTime);
    _restTime = 295; adjustRestTime(15);
    t('Üst sınır 300sn korunuyor', _restTime === 300, 'değer: ' + _restTime);
  } catch (e) { hata = e.message; }
  t('Hiç hata fırlatmadı', hata === null, hata);
  _restTime = eski;

  /* ═══════════════════════════════════════════════════
     4. PR EKRANI LOGO YOLU  (A3)
     ═══════════════════════════════════════════════════ */
  head('4 — PR ekranı logo yolu  (A3 düzeltmesi)');

  var prSrc = kod(_prFeelSlider);
  t('JS artık <style> enjekte etmiyor', prSrc.indexOf('<style>') === -1);

  /* Stil artık CSS dosyasında — gerçek stylesheet'ten oku */
  var prKuralVar = false, logoYolu = '';
  try {
    for (var i = 0; i < document.styleSheets.length; i++) {
      var rules;
      try { rules = document.styleSheets[i].cssRules; } catch (e) { continue; }
      if (!rules) continue;
      for (var j = 0; j < rules.length; j++) {
        var txt = rules[j].cssText || '';
        if (txt.indexOf('pr-feel-bg') > -1) {
          prKuralVar = true;
          if (txt.indexOf('logo.png') > -1) logoYolu = txt;
        }
      }
    }
  } catch (e) {}
  t('.pr-feel-* kuralları stylesheet\'te yüklü', prKuralVar);
  /* CSS içindeki url() CSS DOSYASININ konumuna göre çözülür.
     css/calculators.css'ten bakınca doğru yol ../assets/icons/logo.png */
  t('Logo yolu ../assets/ ile başlıyor (CSS göreli yol)',
    logoYolu === '' || logoYolu.indexOf('../assets/icons/logo.png') > -1 ||
    logoYolu.indexOf('/assets/icons/logo.png') > -1,
    logoYolu.slice(0, 100));

  /* Asıl kanıt: tarayıcı görseli gerçekten indirebiliyor mu? */
  var prLogo = new Image();
  prLogo.onload = function () {
    console.log('%c  ✅ PR arka plan logosu yükleniyor (' + prLogo.width + '×' + prLogo.height + ')', C.ok);
  };
  prLogo.onerror = function () {
    console.log('%c  ❌ PR arka plan logosu YÜKLENEMİYOR — yol kırık', C.no);
  };
  prLogo.src = 'assets/icons/logo.png';

  /* Animasyon keyframe'leri tanımlı mı? */
  var kfBulunan = [];
  try {
    for (var ki = 0; ki < document.styleSheets.length; ki++) {
      var kr;
      try { kr = document.styleSheets[ki].cssRules; } catch (e) { continue; }
      if (!kr) continue;
      for (var kj = 0; kj < kr.length; kj++) {
        if (kr[kj].type === 7 || (kr[kj].cssText || '').indexOf('@keyframes') === 0) {
          var nm = kr[kj].name || (kr[kj].cssText.match(/@keyframes\s+(\w+)/) || [])[1];
          if (nm && nm.indexOf('prFeel') === 0) kfBulunan.push(nm);
        }
      }
    }
  } catch (e) {}
  t('prFeel animasyonları tanımlı', kfBulunan.length >= 2,
    'bulunan: ' + (kfBulunan.join(', ') || 'yok'));

  /* Dosya gerçekten var mı? */
  var img = new Image();
  img.onload = function () { console.log('%c  ✅ assets/icons/logo.png dosyası erişilebilir', C.ok); };
  img.onerror = function () { console.log('%c  ❌ assets/icons/logo.png BULUNAMADI', C.no); };
  img.src = 'assets/icons/logo.png';

  /* ═══════════════════════════════════════════════════
     5. KRONOMETRE TIMER  (A4)
     ═══════════════════════════════════════════════════ */
  head('5 — Kronometre gereksiz timer kuruyor mu?  (A4 düzeltmesi)');

  var chSrc = kod(_toolsChronoToggle);
  t('Ölü "chrono-display" araması kaldırıldı', chSrc.indexOf('chrono-display') === -1);
  t('Tek timer kuruluyor', (chSrc.match(/setInterval/g) || []).length === 1,
    (chSrc.match(/setInterval/g) || []).length + ' adet bulundu');

  var rsSrc = kod(_toolsChronoReset);
  t('Reset ölü ID aramıyor',
    rsSrc.indexOf("getElementById('chrono-display')") === -1 &&
    rsSrc.indexOf("getElementById('chrono-toggle')") === -1);

  /* ═══════════════════════════════════════════════════
     5b. ÖLÜ KOD TEMİZLİĞİ  (Faz B)
     ═══════════════════════════════════════════════════ */
  head('5b — Ölü kod temizlendi mi?  (Faz B)');

  var silinmesiGereken = [
    'chronoToggle','chronoReset','updateChronoDisplay','setDone',
    'startRestTimer','skipRest','resetSets',
    'renderMealSuggestions','renderDietAdvice','renderHiddenCalCalc',
    'toggleAcc','kgToUnit','goalAdj','showWorkoutTool',
    'startWorkoutSession','_calcSleepRender'
  ];
  var halaVar = silinmesiGereken.filter(varMi);
  t(silinmesiGereken.length + ' ölü fonksiyon silindi', halaVar.length === 0,
    halaVar.join(', '));

  /* Güvenlik yardımcıları artık KULLANILIYOR olmalı */
  t('_safeRound hesaplamalara bağlandı',
    kod(calcFFMI).indexOf('_safeRound') > -1);
  t('_safeDiv hesaplamalara bağlandı',
    kod(calcFFMI).indexOf('_safeDiv') > -1);
  t('calcBF log10 koruması var',
    kod(calcBF).indexOf('Math.max(1') > -1);

  /* Canlı uç durum testi */
  var yedekU = JSON.parse(JSON.stringify(U || {}));
  try {
    U = {gender:'male', height:175, neck:40, waist:40, weight:80};
    var ucBf = calcBF();
    t('Bel = boyun → NaN üretmiyor', isFinite(ucBf) && !isNaN(ucBf), 'sonuç: ' + ucBf);
    U = {gender:'male', height:0, weight:80};
    var ucF = calcFFMI(20);
    t('Boy 0 → Infinity üretmiyor', isFinite(ucF.ffmi), 'ffmi: ' + ucF.ffmi);
  } catch (e) { t('Uç durum testi', false, e.message); }
  U = yedekU;

  t('_safeRound(1.005,2) = 1.01 (IEEE 754 düzeltmesi)',
    _safeRound(1.005, 2) === 1.01, 'sonuç: ' + _safeRound(1.005, 2));
  t('_safeDiv(10,0) = 0 (sıfıra bölme koruması)', _safeDiv(10, 0) === 0);

  /* ═══════════════════════════════════════════════════
     5c. CSS DÜZENİ  (Faz C)
     ═══════════════════════════════════════════════════ */
  head('5c — CSS düzeni  (Faz C)');

  /* Duplicate .mlist-* kaldırıldı mı? */
  var mlistSayisi = 0;
  try {
    for (var si = 0; si < document.styleSheets.length; si++) {
      var rs;
      try { rs = document.styleSheets[si].cssRules; } catch (e) { continue; }
      if (!rs) continue;
      for (var rj = 0; rj < rs.length; rj++) {
        if ((rs[rj].selectorText || '') === '.mlist-row') mlistSayisi++;
      }
    }
  } catch (e) {}
  t('.mlist-row tek kez tanımlı', mlistSayisi === 1, mlistSayisi + ' kez bulundu');

  /* Yüklenen CSS dosyası sayısı */
  var cssLink = document.querySelectorAll('link[rel="stylesheet"][href^="css/"]');
  t('8 CSS modülü yüklü', cssLink.length === 8, cssLink.length + ' bulundu');

  /* Önbellek kırıcı sürüm damgası var mı? */
  var surumluCss = 0;
  for (var ci = 0; ci < cssLink.length; ci++) {
    if ((cssLink[ci].getAttribute('href') || '').indexOf('?v=') > -1) surumluCss++;
  }
  t('CSS dosyalarında sürüm damgası var', surumluCss === cssLink.length,
    surumluCss + '/' + cssLink.length);

  /* PR logo yolu — eski önbellek kalmış mı? */
  if (logoYolu && logoYolu.indexOf('logo.png') > -1) {
    var eskiYol = /url\(["']?assets\/icons\/logo\.png/.test(logoYolu);
    t('CSS önbellekten eski sürüm gelmiyor', !eskiYol,
      eskiYol ? 'Ctrl+Shift+R ile sert yenile!' : '');
  }

  /* ═══════════════════════════════════════════════════
     5d. DOM ID BÜTÜNLÜĞÜ  (Faz D)
     ═══════════════════════════════════════════════════ */
  head('5d — Kritik DOM elementleri yerinde mi?  (Faz D)');

  /* Sayfa açılışında var olması gereken elementler */
  var kritikId = [
    'splash','wizard','results','auth-screen','bottom-nav',
    'ws-screen','ws-body','warmup-overlay','ws-rest-overlay',
    'reds-warning-overlay','bulk-warning-overlay','ffmi-detail-overlay',
    'settings-drawer','sdw-overlay','avatar-initials','avatar-img',
    'user-email-display','workout-main','supp-modal'
  ];
  var eksikId = kritikId.filter(function (id) { return !document.getElementById(id); });
  t(kritikId.length + ' kritik element mevcut', eksikId.length === 0, eksikId.join(', '));

  /* Faz D'de düzeltilen eski ID referansları */
  t('ws-footer class olarak erişiliyor', !!document.querySelector('.ws-footer'));
  t('Eski "avatar-display" ID\'si kullanılmıyor',
    !document.getElementById('avatar-display'));
  t('Eski "settings-bg" ID\'si kullanılmıyor',
    !document.getElementById('settings-bg'));

  /* ═══════════════════════════════════════════════════
     5e. GÜVENLİ DEPOLAMA  (Faz E)
     ═══════════════════════════════════════════════════ */
  head('5e — Depolama katmanı güvenli mi?  (Faz E)');

  t('_lsSet tanımlı', varMi('_lsSet'));
  t('_lsGet tanımlı', varMi('_lsGet'));
  t('_lsKullanim tanımlı', varMi('_lsKullanim'));
  t('saveData güvenli katmanı kullanıyor', kod(saveData).indexOf('_lsSet') > -1);

  /* Kota dolduğunda çökmemeli — sahte hata ile dene */
  var gercekSet = localStorage.setItem.bind(localStorage);
  var hataYakalandi = false;
  try {
    localStorage.setItem = function () {
      var e = new Error('quota'); e.name = 'QuotaExceededError'; e.code = 22; throw e;
    };
    var sonuc = _lsSet('__test__', 'x');
    t('Kota hatasında istisna fırlatmıyor', true);
    t('false döndürüyor', sonuc === false);
  } catch (e) {
    hataYakalandi = true;
    t('Kota hatasında istisna fırlatmıyor', false, e.message);
  } finally {
    localStorage.setItem = gercekSet;
    try { localStorage.removeItem('__test__'); } catch (e) {}
  }

  /* Kullanım raporu */
  try {
    var kul = _lsKullanim();
    t('Depolama kullanımı okunuyor', typeof kul.toplamKB === 'number',
      kul.toplamKB + ' KB kullanılıyor');
    console.log('%c     Doluluk: %' + kul.doluluk + '  ·  ' + kul.kalemler.length + ' RavenFit kaydı', C.dim);
    if (kul.kalemler.length) {
      console.log('%c     En büyük: ' + kul.kalemler[0].anahtar +
        ' (' + Math.round(kul.kalemler[0].bayt / 1024) + ' KB)', C.dim);
    }
  } catch (e) { t('Depolama kullanımı okunuyor', false, e.message); }

  /* ═══════════════════════════════════════════════════
     5f. DAYANIKLILIK  (Faz F)
     ═══════════════════════════════════════════════════ */
  head('5f — Dayanıklılık  (Faz F)');

  /* Yedekleme tüm veriyi kapsıyor mu? */
  t('YEDEK_ANAHTARLARI tanımlı', typeof YEDEK_ANAHTARLARI !== 'undefined');
  if (typeof YEDEK_ANAHTARLARI !== 'undefined') {
    t('11 veri türü yedekleniyor', YEDEK_ANAHTARLARI.length >= 11,
      YEDEK_ANAHTARLARI.length + ' anahtar');
    t('Antrenman geçmişi yedek kapsamında',
      YEDEK_ANAHTARLARI.indexOf('rf_workout_logs') > -1);
    t('Rozetler yedek kapsamında',
      YEDEK_ANAHTARLARI.indexOf('rf_badges') > -1);
  }

  /* İçe aktarma doğrulama yapıyor mu? */
  var impSrc = kod(importData);
  t('İçe aktarma yapı doğruluyor', impSrc.indexOf('typeof') > -1);
  t('İçe aktarma kullanıcı onayı istiyor', impSrc.indexOf('showConfirm') > -1);
  t('İçe aktarma dosya boyutu sınırlıyor', impSrc.indexOf('1024') > -1);

  /* Antrenman motoru timer sızdırmıyor mu? */
  t('Oturum başlangıcı eski timer\'ı temizliyor',
    kod(_doStartSession).indexOf('clearInterval') > -1);

  /* Firestore çağrıları korumalı mı? */
  t('Avatar yükleme hata yakalıyor',
    kod(handleAvatarUpload).indexOf('.catch') > -1);

  /* ═══════════════════════════════════════════════════
     5g. TEMA SİSTEMİ
     ═══════════════════════════════════════════════════ */
  head('5g — Tema sistemi');

  t('7 tema tanımlı', typeof TEMALAR !== 'undefined' && TEMALAR.length === 7,
    typeof TEMALAR !== 'undefined' ? TEMALAR.length + ' tema' : 'TEMALAR yok');

  /* Her temanın değişkenleri gerçekten yükleniyor mu? */
  var kok = document.documentElement;
  var oncekiTema = kok.getAttribute('data-theme') || 'dark';
  var GEREKLI = ['--bg','--card','--card2','--text','--text2','--text3',
                 '--accent','--accent-btn','--on-accent','--success','--warn',
                 '--info','--overlay','--shadow-md'];
  var eksikToplam = [];
  (typeof TEMALAR !== 'undefined' ? TEMALAR : []).forEach(function(tema){
    kok.setAttribute('data-theme', tema);
    var st = getComputedStyle(kok);
    GEREKLI.forEach(function(v){
      if(!st.getPropertyValue(v).trim()) eksikToplam.push(tema + v);
    });
  });
  kok.setAttribute('data-theme', oncekiTema);
  t('Tüm temalarda 14 değişken tanımlı', eksikToplam.length === 0,
    eksikToplam.slice(0,3).join(', '));

  /* Tema kartları ve seçili işaret */
  var kartlar = document.querySelectorAll('.theme-card');
  t('7 tema kartı çizildi', kartlar.length === 7, kartlar.length + ' kart');
  var secili = document.querySelectorAll('.theme-card.act');
  t('Tek tema seçili işaretli', secili.length === 1, secili.length + ' seçili');

  /* color-scheme ayarlanıyor mu? */
  t('color-scheme ayarlanmış', !!kok.style.colorScheme,
    kok.style.colorScheme || 'boş');

  /* Bilinmeyen tema dark'a düşmeli */
  applyTheme('boyle-bir-tema-yok');
  t('Bilinmeyen tema dark\'a düşüyor',
    kok.getAttribute('data-theme') === 'dark',
    kok.getAttribute('data-theme'));
  applyTheme(oncekiTema);

  /* ═══════════════════════════════════════════════════
     6. VERİ DOSYALARI
     ═══════════════════════════════════════════════════ */
  head('6 — Veri dosyaları yüklendi mi?');

  var veri = {
    'Fitness egzersizleri': EXERCISES_DATA && EXERCISES_DATA.exercises,
    'Fitness programları':  WORKOUTS_DATA && WORKOUTS_DATA.workouts,
    'Yüzme egzersizleri':   EXERCISES_SWIM && EXERCISES_SWIM.exercises,
    'Yüzme programları':    WORKOUTS_SWIM && WORKOUTS_SWIM.workouts,
    'Postür egzersizleri':  EXERCISES_POST && EXERCISES_POST.exercises,
    'Postür programları':   WORKOUTS_POST && WORKOUTS_POST.workouts,
    'Özel durumlar':        CONDITIONS_DATA && CONDITIONS_DATA.conditions,
    'Rozetler':             BADGES_DATA && BADGES_DATA.badges
  };
  for (var v in veri) {
    var arr = veri[v];
    t(v + (arr ? ' (' + arr.length + ' kayıt)' : ''), !!arr && arr.length > 0);
  }

  /* ═══════════════════════════════════════════════════
     7. GÖRSEL DOSYALAR
     ═══════════════════════════════════════════════════ */
  head('7 — Görseller erişilebilir mi?');
  ['assets/icons/logo.png', 'assets/icons/favicon.png',
   'assets/icons/icon-192.png', 'assets/icons/icon-512.png'].forEach(function (p) {
    var i = new Image();
    i.onload = function () { console.log('%c  ✅ ' + p, C.ok); };
    i.onerror = function () { console.log('%c  ❌ ' + p + ' BULUNAMADI', C.no); };
    i.src = p;
  });

  /* ═══════════════════════════════════════════════════
     ÖZET
     ═══════════════════════════════════════════════════ */
  setTimeout(function () {
    console.log('%c\n' + '─'.repeat(52), C.dim);
    var toplam = pass + fail;
    var yuzde = toplam ? Math.round(pass / toplam * 100) : 0;
    console.log('%c📊 SONUÇ: ' + pass + '/' + toplam + ' test geçti (%' + yuzde + ')',
      fail === 0 ? C.ok : C.no);
    if (warn) console.log('%c⚠️  ' + warn + ' uyarı', C.wr);
    if (fail === 0) {
      console.log('%c🎉 Tüm düzeltmeler doğrulandı — sistem sağlıklı!', C.ok);
      console.log('%c\n👉 Şimdi hesaplama testini de çalıştır:  _ravenfitSelfTest()', C.head);
    } else {
      console.log('%c⚠️  Yukarıdaki ❌ satırlara bak', C.no);
    }
    console.log('%c' + '─'.repeat(52), C.dim);
  }, 400);

})();
