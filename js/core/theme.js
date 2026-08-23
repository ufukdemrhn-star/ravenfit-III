/* ══════════════════════════════════════════════════════════
   RavenFit — theme.js
   Tema yönetimi

   7 tema: dark · crimson · violet · forest · rose · ocean · light
   Renk tanımları css/themes.css içinde, tamamı WCAG 2.2 AA uyumlu.
   ══════════════════════════════════════════════════════════ */

/* Geçerli tema kodları — bilinmeyen değer gelirse dark'a düşer */
var TEMALAR = ['dark','crimson','violet','forest','rose','ocean','light'];

/* Aydınlık temalar — tarayıcıya bildirilir ki form kontrolleri,
   kaydırma çubuğu ve seçim rengi doğru varyantı kullansın. */
var ACIK_TEMALAR = ['light'];

function setTheme(t){
  applyTheme(t);
  _lsSet('rf_theme', t);
  saveToFirebase();
}

function applyTheme(t){
  /* Bilinmeyen tema geldiğinde (eski sürümden kalma vb.) dark'a dön */
  if(TEMALAR.indexOf(t) < 0) t = 'dark';

  var kok = document.documentElement;
  kok.setAttribute('data-theme', t);

  /* color-scheme: tarayıcının kendi çizdiği öğeleri (kaydırma çubuğu,
     tarih seçici, otomatik doldurma) temaya uydurur. Bunu belirtmezsek
     aydınlık temada koyu kaydırma çubuğu gibi tutarsızlıklar oluşur. */
  kok.style.colorScheme = (ACIK_TEMALAR.indexOf(t) >= 0) ? 'light' : 'dark';

  /* Mobil tarayıcı adres çubuğu rengi — gerçek zemin renginden okunur */
  var meta = document.querySelector('meta[name="theme-color"]');
  if(meta){
    var zemin = getComputedStyle(kok).getPropertyValue('--bg').trim();
    if(zemin) meta.setAttribute('content', zemin);
  }

  /* Seçili kartı işaretle */
  document.querySelectorAll('.theme-card').forEach(function(c){
    c.classList.toggle('act', c.dataset.t === t);
  });
}
