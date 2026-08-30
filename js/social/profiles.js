/* ══════════════════════════════════════════════════════════
   RavenFit — profiles.js
   Herkese açık profil veri katmanı

   VERİ AYRIMI — bu dosyanın varlık sebebi
   ──────────────────────────────────────────────────────────
   users/{uid}      ÖZEL. Sağlık verisi burada kalır: tüm ölçüm
                    geçmişi, özel durumlar (diyabet, hamilelik...),
                    diyet bilgisi. Sadece sahibi okuyabilir.

   profiles/{uid}   AÇIK. Kullanıcının GÖSTERMEYİ SEÇTİĞİ veriler.
                    Kapalı bir değer buraya hiç yazılmaz — yani
                    başkası veritabanından bile göremez.

   Bu ayrım sonradan eklenemez; en baştan böyle kurulmalıdır.
   ══════════════════════════════════════════════════════════ */

/* Paylaşılabilir istatistikler.
   kaynak: R (hesaplanan sonuçlar) veya U (kullanıcı girdisi)
   birim : ekranda gösterilecek son ek
   grup  : panelde gruplama başlığı */
var ISTATISTIK_ALANLARI = [
  /* ── Temel ── */
  {id:'weight',   ad:'Ağırlık',        kaynak:'U', anahtar:'weight', birim:'kg', grup:'temel', ondalik:1},
  {id:'height',   ad:'Boy',            kaynak:'U', anahtar:'height', birim:'cm', grup:'temel', ondalik:0},
  {id:'age',      ad:'Yaş',            kaynak:'U', anahtar:'age',    birim:'',   grup:'temel', ondalik:0},
  /* ── Hesaplanan ── */
  {id:'bf',       ad:'Yağ Oranı',      kaynak:'R', anahtar:'bf',     birim:'%',  grup:'hesap', ondalik:2},
  {id:'lm',       ad:'Yağsız Kütle',   kaynak:'R', anahtar:'lm',     birim:'kg', grup:'hesap', ondalik:2},
  {id:'ffmi',     ad:'FFMI',           kaynak:'R', anahtar:'ffmi',   birim:'',   grup:'hesap', ondalik:2},
  {id:'bmi',      ad:'VKİ',            kaynak:'R', anahtar:'bmi',    birim:'',   grup:'hesap', ondalik:1},
  {id:'goalCal',  ad:'Günlük Kalori',  kaynak:'R', anahtar:'goalCal',birim:'kcal',grup:'hesap',ondalik:0},
  {id:'swr',      ad:'Omuz/Bel Oranı', kaynak:'R', anahtar:'swr',    birim:'',   grup:'hesap', ondalik:2},
  /* ── Çevre ölçüleri ── */
  {id:'neck',     ad:'Boyun',          kaynak:'U', anahtar:'neck',    birim:'cm', grup:'olcu', ondalik:1},
  {id:'shoulder', ad:'Omuz',           kaynak:'U', anahtar:'shoulder',birim:'cm', grup:'olcu', ondalik:1},
  {id:'chest',    ad:'Göğüs',          kaynak:'U', anahtar:'chest',   birim:'cm', grup:'olcu', ondalik:1},
  {id:'arm',      ad:'Kol',            kaynak:'U', anahtar:'arm',     birim:'cm', grup:'olcu', ondalik:1},
  {id:'forearm',  ad:'Ön Kol',         kaynak:'U', anahtar:'forearm', birim:'cm', grup:'olcu', ondalik:1},
  {id:'waist',    ad:'Bel',            kaynak:'U', anahtar:'waist',   birim:'cm', grup:'olcu', ondalik:1},
  {id:'hip',      ad:'Kalça',          kaynak:'U', anahtar:'hip',     birim:'cm', grup:'olcu', ondalik:1},
  {id:'leg',      ad:'Bacak',          kaynak:'U', anahtar:'leg',     birim:'cm', grup:'olcu', ondalik:1},
  {id:'calf',     ad:'Kalf',           kaynak:'U', anahtar:'calf',    birim:'cm', grup:'olcu', ondalik:1}
];

var ISTATISTIK_GRUPLARI = {
  temel: 'Temel Bilgiler',
  hesap: 'Hesaplanan Değerler',
  olcu:  'Çevre Ölçüleri'
};

/* ──────────────────────────────────────────────────────────
   TÜRETME ZİNCİRLERİ

   Bazı değerler diğerlerinden hesaplanabilir. Kullanıcı bir
   değeri gizlese bile, kaynaklarını paylaşmışsa değer açığa
   çıkar. Bu tablo o ilişkileri tanımlar.

   hedef  : türetilebilen değer
   kaynak : hepsi açıksa hedefi ele veren alanlar
   ────────────────────────────────────────────────────────── */
var TURETME_ZINCIRLERI = [
  {hedef:'height', kaynak:['weight','bmi'],   aciklama:'Ağırlık ve VKİ birlikte boyu verir'},
  {hedef:'bf',     kaynak:['weight','lm'],    aciklama:'Ağırlık ve yağsız kütle yağ oranını verir'},
  {hedef:'lm',     kaynak:['weight','bf'],    aciklama:'Ağırlık ve yağ oranı yağsız kütleyi verir'},
  {hedef:'weight', kaynak:['lm','bf'],        aciklama:'Yağsız kütle ve yağ oranı ağırlığı verir'},
  {hedef:'weight', kaynak:['height','bmi'],   aciklama:'Boy ve VKİ ağırlığı verir'},
  {hedef:'bmi',    kaynak:['weight','height'],aciklama:'Ağırlık ve boy VKİ\'yi verir'},
  {hedef:'swr',    kaynak:['shoulder','waist'],aciklama:'Omuz ve bel oranı verir'},
  {hedef:'height', kaynak:['lm','ffmi'],      aciklama:'Yağsız kütle ve FFMI boyu verir'}
];

/* Bir alan, açık olan diğer alanlardan türetilebiliyor mu?
   Döner: türeten zincir veya null */
function _turetilebilirMi(alanId, acikSet){
  for(var i=0;i<TURETME_ZINCIRLERI.length;i++){
    var z = TURETME_ZINCIRLERI[i];
    if(z.hedef !== alanId) continue;
    var hepsiAcik = z.kaynak.every(function(k){ return acikSet[k]; });
    if(hepsiAcik) return z;
  }
  return null;
}

/* Kullanıcının kaydettiği paylaşım tercihleri */
function getPaylasimAyarlari(){
  try {
    var ham = _lsGet('rf_share_stats');
    if(ham) return JSON.parse(ham);
  } catch(e){}
  /* Varsayılan: hiçbir şey paylaşılmaz */
  return {};
}

function savePaylasimAyarlari(ayarlar){
  _lsSet('rf_share_stats', JSON.stringify(ayarlar));
}

/* Vitrin: panelde üstte görünecek 4 değer */
function getVitrinAlanlari(){
  try {
    var ham = _lsGet('rf_showcase');
    if(ham){
      var d = JSON.parse(ham);
      if(Array.isArray(d) && d.length) return d.slice(0,4);
    }
  } catch(e){}
  return ['bf','lm','ffmi','goalCal'];   /* varsayılan vitrin */
}

function saveVitrinAlanlari(liste){
  _lsSet('rf_showcase', JSON.stringify((liste||[]).slice(0,4)));
}

/* ──────────────────────────────────────────────────────────
   Bir alanın güncel değerini okur.
   Kaynak U (kullanıcı girdisi) veya R (hesaplanan) olabilir.
   ────────────────────────────────────────────────────────── */
function _alanDegeri(alan){
  var kap = (alan.kaynak === 'R') ? (typeof R !== 'undefined' ? R : {})
                                  : (typeof U !== 'undefined' ? U : {});
  var v = kap ? kap[alan.anahtar] : null;
  if(v === null || v === undefined || v === '' || isNaN(v)) return null;
  return Number(v);
}

function alanBul(id){
  for(var i=0;i<ISTATISTIK_ALANLARI.length;i++){
    if(ISTATISTIK_ALANLARI[i].id === id) return ISTATISTIK_ALANLARI[i];
  }
  return null;
}

/* Ekranda gösterilecek biçimli değer — "22.23%" gibi */
function alanMetni(id){
  var a = alanBul(id);
  if(!a) return '—';
  var v = _alanDegeri(a);
  if(v === null) return '—';
  var s = a.ondalik > 0 ? v.toFixed(a.ondalik) : String(Math.round(v));
  return a.birim ? (s + (a.birim === '%' ? '%' : ' ' + a.birim)) : s;
}

/* ──────────────────────────────────────────────────────────
   Açık profil belgesini oluşturur.
   SADECE paylaşılmayı seçilen alanlar yazılır — kapalı olan
   değerler bu nesneye hiç girmez.
   ────────────────────────────────────────────────────────── */
function profilNesnesiUret(){
  var ayarlar = getPaylasimAyarlari();
  var istatistik = {};
  ISTATISTIK_ALANLARI.forEach(function(a){
    if(!ayarlar[a.id]) return;               /* kapalıysa hiç yazma */
    var v = _alanDegeri(a);
    if(v === null) return;
    istatistik[a.id] = v;
  });

  var profil = _lsGet('rf_profile');
  var p = {};
  try { p = profil ? JSON.parse(profil) : {}; } catch(e){}

  return {
    nickname:  p.nickname  || (typeof _fbUser !== 'undefined' && _fbUser ? '' : ''),
    isim:      p.isim      || (typeof U !== 'undefined' ? (U.name || '') : ''),
    bio:       p.bio       || '',
    avatar:    _lsGet('avatar') || '',
    branslar:  (typeof getUserBranches === 'function') ? getUserBranches() : [],
    rozetler:  p.rozetlerGoster === false ? [] :
               ((typeof getEarnedBadges === 'function') ? getEarnedBadges() : []),
    istatistik: istatistik,
    vitrin:    getVitrinAlanlari().filter(function(id){ return !!ayarlar[id]; }),
    rol:       p.rol   || 'uye',
    onay:      p.onay  || 'yok',
    /* ⚠️ Bu alanların EKSİK kalması ciddi hata üretir:
       yayinlaProfil() bu nesneyi profiles/{uid} belgesine yazar.
       Alan yoksa undefined → false olarak yazılır ve kullanıcının
       gizlilik ayarı ile silme durumu her yayında SIFIRLANIR. */
    gizli:     p.gizli === true,
    silinecek: p.silinecek === true,
    guncelleme: Date.now()
  };
}

/* Yerel profil bilgisi (isim, bio, nickname) */
function getYerelProfil(){
  try {
    var ham = _lsGet('rf_profile');
    if(ham) return JSON.parse(ham);
  } catch(e){}
  return {};
}

function saveYerelProfil(p){
  _lsSet('rf_profile', JSON.stringify(p || {}));
}
