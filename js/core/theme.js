/* ══════════════════════════════════════════════════════════
   RavenFit — theme.js
   Tema yönetimi

   5 tema: gece · okyanus · menekse · bakir · aydinlik
   Renkler css/themes.css içinde, OKLCH ile üretilmiş,
   tamamı WCAG 2.2 AA uyumlu.
   ══════════════════════════════════════════════════════════ */

var TEMALAR = ['gece','okyanus','menekse','bakir','aydinlik'];

/* Aydınlık temalar — tarayıcıya bildirilir ki kaydırma çubuğu,
   tarih seçici ve otomatik doldurma doğru varyantı kullansın. */
var ACIK_TEMALAR = ['aydinlik'];

/* Eski sürümlerden kalan tema kodları yeni karşılıklarına çevrilir.
   Kullanıcının kaydı bozulmasın diye göç haritası tutulur. */
var TEMA_GOC = {
  'dark':    'gece',
  'ocean':   'okyanus',
  'violet':  'menekse',
  'crimson': 'bakir',      /* kızıl → sıcak bakır */
  'rose':    'menekse',    /* gül kaldırıldı → en yakın: menekşe */
  'forest':  'okyanus',    /* orman kaldırıldı → en yakın: okyanus */
  'light':   'aydinlik'
};

function _temaCoz(t){
  if(!t) return 'gece';
  if(TEMALAR.indexOf(t) >= 0) return t;
  if(TEMA_GOC[t]) return TEMA_GOC[t];
  return 'gece';
}

function setTheme(t){
  t = _temaCoz(t);
  applyTheme(t);
  _lsSet('rf_theme', t);
  saveToFirebase();
}

function applyTheme(t){
  t = _temaCoz(t);
  var kok = document.documentElement;
  kok.setAttribute('data-theme', t);

  /* color-scheme: tarayıcının kendi çizdiği öğeleri temaya uydurur.
     Belirtilmezse aydınlık temada koyu kaydırma çubuğu gibi
     tutarsızlıklar oluşur. */
  kok.style.colorScheme = (ACIK_TEMALAR.indexOf(t) >= 0) ? 'light' : 'dark';

  /* Mobil adres çubuğu rengi — gerçek zemin renginden okunur */
  var meta = document.querySelector('meta[name="theme-color"]');
  if(meta){
    var zemin = getComputedStyle(kok).getPropertyValue('--bg').trim();
    if(zemin) meta.setAttribute('content', zemin);
  }

  /* Seçili kartı işaretle */
  document.querySelectorAll('.theme-card').forEach(function(c){
    c.classList.toggle('act', c.dataset.t === t);
  });

  /* Eski kod kaydedilmişse sessizce yenisine geçir */
  var kayitli = _lsGet('rf_theme');
  if(kayitli && kayitli !== t) _lsSet('rf_theme', t);
}
