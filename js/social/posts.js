/* ══════════════════════════════════════════════════════════
   RavenFit — posts.js
   Gönderi sistemi

   DEPOLAMA MİMARİSİ
   ──────────────────────────────────────────────────────────
   Firebase Storage ücretli plan gerektirdiği için fotoğraflar
   Firestore'da saklanır. Belge başına 1 MB sınırı var — ama
   HER BELGE kendi sınırına sahip. Bu yüzden:

     posts/{postId}            metin + küçük önizlemeler (~120 KB)
     posts/{postId}/media/{n}  her fotoğraf ayrı belge (~200 KB)

   Izgarada yalnızca önizlemeler yüklenir → akış hızlı kalır.
   Tam fotoğraf ancak gönderi açılınca iner.

   ÜRETİM NOTU: Gerçek uygulamada nesne depolamaya (S3/Cloudinary)
   taşınmalı. Arayüz değişmez, sadece bu dosya değişir.
   ══════════════════════════════════════════════════════════ */

var GONDERI_MAX_FOTO = 5;
var GONDERI_MAX_METIN = 500;   /* toplam karakter */
var GONDERI_MAX_SATIR = 20;    /* en fazla satır */
var GONDERI_SATIR_UZUN = 60;   /* satır başına karakter */

var GONDERI_TURLERI = [
  {id:'serbest',   ad:'Serbest',   ikon:'💬'},
  {id:'antrenman', ad:'Antrenman', ikon:'🏋️'},
  {id:'ilerleme',  ad:'İlerleme',  ikon:'📈'},
  {id:'tarif',     ad:'Tarif',     ikon:'🥗'}
];

/* ── Yeni gönderi durumu ─────────────────────────────────── */
var _yeniGonderi = { fotograflar:[], tur:'serbest' };

function openNewPost(){
  if(!_fbUser || !_fbDb){
    showToast('Gönderi paylaşmak için giriş yapmalısın.','warn');
    return;
  }
  _yeniGonderi = { fotograflar:[], tur:'serbest' };
  var ov = document.getElementById('new-post-overlay');
  if(!ov) return;
  ov.classList.add('active');
  document.body.style.overflow = 'hidden';
  _npCiz();
}

function closeNewPost(){
  var ov = document.getElementById('new-post-overlay');
  if(ov) ov.classList.remove('active');
  document.body.style.overflow = '';
  _yeniGonderi = { fotograflar:[], tur:'serbest' };
}

function npFotoSec(){
  var inp = document.getElementById('np-file-input');
  if(inp) inp.click();
}

function npFotoEklendi(olay){
  var inp = (olay && olay.target) ? olay.target : olay;
  if(!inp || !inp.files || !inp.files.length) return;

  var dosyalar = Array.prototype.slice.call(inp.files);
  var bosYer = GONDERI_MAX_FOTO - _yeniGonderi.fotograflar.length;
  if(bosYer <= 0){
    showToast('En fazla ' + GONDERI_MAX_FOTO + ' fotoğraf ekleyebilirsin.','warn');
    try { inp.value=''; } catch(e){}
    return;
  }
  if(dosyalar.length > bosYer){
    showToast(bosYer + ' fotoğraf daha ekleyebilirsin.','warn');
    dosyalar = dosyalar.slice(0, bosYer);
  }

  /* Otomatik kırpma yerine KULLANICI SEÇER:
     oranı ve kırpma konumunu kendisi belirler. */
  kirpiciAc(dosyalar, function(sonuclar){
    sonuclar.forEach(function(s){ _yeniGonderi.fotograflar.push(s); });
    _npCiz();
    if(sonuclar.length) showToast('✅ ' + sonuclar.length + ' fotoğraf eklendi.');
  });

  try { inp.value=''; } catch(e){}
}

function npFotoSil(i){
  _yeniGonderi.fotograflar.splice(i,1);
  _npCiz();
}

function npTurSec(tur){
  _yeniGonderi.tur = tur;
  _npCiz();
}

function _npCiz(){
  var el = document.getElementById('np-body');
  if(!el) return;
  var f = _yeniGonderi.fotograflar;

  var html = '';

  /* Gönderi türü */
  html += '<div class="np-turler">';
  GONDERI_TURLERI.forEach(function(t){
    html += '<button class="np-tur' + (_yeniGonderi.tur===t.id?' sec':'') + '" ' +
            'onclick="npTurSec(\'' + t.id + '\')">' +
            '<span>' + t.ikon + '</span>' + t.ad + '</button>';
  });
  html += '</div>';

  /* Metin */
  var mevcutMetin = '';
  var eski = document.getElementById('np-metin');
  if(eski) mevcutMetin = eski.value;
  html += '<textarea class="fi np-metin" id="np-metin" rows="4" maxlength="' + GONDERI_MAX_METIN + '" ' +
          'placeholder="Ne paylaşmak istersin?" oninput="npMetinSay()">' +
          _npKacir(mevcutMetin) + '</textarea>';
  html += '<div class="np-sayac" id="np-sayac">' + mevcutMetin.length + ' / ' + GONDERI_MAX_METIN + '</div>';

  /* Fotoğraflar */
  html += '<div class="np-fotolar">';
  f.forEach(function(foto, i){
    html += '<div class="np-foto">' +
              '<img src="' + foto.onizleme.veri + '" alt="">' +
              '<button class="np-foto-sil" onclick="npFotoSil(' + i + ')" aria-label="Kaldır">&times;</button>' +
              '<span class="np-foto-boyut">' + baytMetni(foto.tam.bayt) + '</span>' +
            '</div>';
  });
  if(f.length < GONDERI_MAX_FOTO){
    html += '<button class="np-foto-ekle" onclick="npFotoSec()">' +
              '<span>+</span>' +
              '<small>' + f.length + '/' + GONDERI_MAX_FOTO + '</small>' +
            '</button>';
  }
  html += '</div>';
  html += '<div class="np-durum" id="np-durum"></div>';

  el.innerHTML = html;

  /* Metin alanına odaklan ve imleci sona al */
  var yeni = document.getElementById('np-metin');
  if(yeni && mevcutMetin){
    try { yeni.setSelectionRange(mevcutMetin.length, mevcutMetin.length); } catch(e){}
  }
}

/* ── Metin sınırları ─────────────────────────────────────
   Biyografideki yaklaşımın aynısı: metin yeniden yazılmaz,
   sınırı aşan girdi engellenir. Satır 60 karakteri aşarsa
   kelime sınırından alt satıra aktarılır. */
var _npSonGecerli = '';

function _npGecerliMi(metin){
  var m = String(metin || '');
  if(m.length > GONDERI_MAX_METIN) return false;
  var satirlar = m.split('\n');
  if(satirlar.length > GONDERI_MAX_SATIR) return false;
  for(var i=0;i<satirlar.length;i++){
    if(satirlar[i].length > GONDERI_SATIR_UZUN) return false;
  }
  return true;
}

function npMetinSay(){
  var t = document.getElementById('np-metin');
  var s = document.getElementById('np-sayac');
  if(!t) return;

  /* Uzun satırı alt satıra aktar */
  var sat = t.value.split('\n');
  var tasan = -1;
  for(var i=0;i<sat.length;i++){
    if(sat[i].length > GONDERI_SATIR_UZUN){ tasan = i; break; }
  }
  if(tasan >= 0 && sat.length < GONDERI_MAX_SATIR && t.value.length <= GONDERI_MAX_METIN){
    var satir = sat[tasan];
    var kes = satir.lastIndexOf(' ', GONDERI_SATIR_UZUN);
    if(kes <= 0) kes = GONDERI_SATIR_UZUN;
    var imlecOnce = t.selectionStart;
    sat.splice(tasan, 1,
      satir.slice(0, kes).replace(/\s+$/,''),
      satir.slice(kes).replace(/^\s+/,''));
    t.value = sat.join('\n');
    var yeni = Math.min(imlecOnce + 1, t.value.length);
    try { t.setSelectionRange(yeni, yeni); } catch(e){}
    _npSonGecerli = t.value;
  }

  /* Sınır aşıldıysa son geçerli hâle dön */
  if(!_npGecerliMi(t.value)){
    var im = t.selectionStart;
    t.value = _npSonGecerli;
    var k = Math.min(im, _npSonGecerli.length);
    try { t.setSelectionRange(k, k); } catch(e){}
    if(s){ s.classList.add('uyari'); setTimeout(function(){ s.classList.remove('uyari'); }, 450); }
  } else {
    _npSonGecerli = t.value;
  }

  if(s){
    var satirSayisi = t.value ? t.value.split('\n').length : 0;
    s.innerHTML = t.value.length + '/' + GONDERI_MAX_METIN + ' karakter' +
                  ' &nbsp;·&nbsp; ' + satirSayisi + '/' + GONDERI_MAX_SATIR + ' satır';
    s.className = (t.value.length >= GONDERI_MAX_METIN || satirSayisi >= GONDERI_MAX_SATIR)
                  ? 'np-sayac dolu' : 'np-sayac';
  }
}

function _npKacir(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ── Paylaş ──────────────────────────────────────────────── */
function npPaylas(){
  var metinEl = document.getElementById('np-metin');
  var metin = metinEl ? metinEl.value.trim() : '';
  var f = _yeniGonderi.fotograflar;

  if(!metin && !f.length){
    showToast('Bir şeyler yaz veya fotoğraf ekle.','warn');
    return;
  }
  if(!_fbUser || !_fbDb){
    showToast('Giriş yapmalısın.','error');
    return;
  }

  var btn = document.getElementById('np-paylas-btn');
  if(btn){ btn.disabled = true; btn.textContent = 'Paylaşılıyor...'; }
  var durum = document.getElementById('np-durum');
  if(durum) durum.textContent = 'Gönderi oluşturuluyor...';

  var postRef = _fbDb.collection('posts').doc();
  var postId = postRef.id;

  /* Ana belge: metin + küçük önizlemeler (ızgarada gösterilir) */
  var anaBelge = {
    uid: _fbUser.uid,
    metin: metin,
    tur: _yeniGonderi.tur,
    fotoSayisi: f.length,
    onizlemeler: f.map(function(x){ return x.onizleme.veri; }),
    begeni: 0,
    yorum: 0,
    tarih: firebase.firestore.FieldValue.serverTimestamp()
  };

  postRef.set(anaBelge)
    .then(function(){
      /* Tam fotoğraflar ayrı belgelere — her biri kendi 1 MB bütçesinde */
      if(!f.length) return;
      if(durum) durum.textContent = 'Fotoğraflar yükleniyor...';
      return Promise.all(f.map(function(foto, i){
        return postRef.collection('media').doc(String(i)).set({
          sira: i,
          veri: foto.tam.veri,
          genislik: foto.tam.genislik,
          yukseklik: foto.tam.yukseklik
        });
      }));
    })
    .then(function(){
      if(btn){ btn.disabled = false; btn.textContent = 'Paylaş'; }
      closeNewPost();
      showToast('✅ Gönderin paylaşıldı!');
      /* Profil ızgarasını tazele */
      if(typeof _renderProfilSekmesi === 'function') _renderProfilSekmesi();
      if(typeof renderProfil === 'function') renderProfil();
    })
    .catch(function(e){
      if(btn){ btn.disabled = false; btn.textContent = 'Paylaş'; }
      if(durum) durum.textContent = '';
      console.warn('Gönderi hatası:', e);
      showToast('❌ Gönderi paylaşılamadı: ' + (e && e.message || ''),'error');
    });
}

/* ── Gönderi okuma ───────────────────────────────────────── */

function gonderileriGetir(uid, limit){
  return new Promise(function(cozumle){
    if(!_fbDb) return cozumle([]);
    _fbDb.collection('posts')
      .where('uid','==',uid)
      .limit(limit || 30).get()
      .then(function(snap){
        var liste = [];
        snap.forEach(function(d){
          var g = d.data(); g.id = d.id;
          liste.push(g);
        });
        /* Yeniden eskiye — tarih alanı sunucuda oluştuğu için
           istemcide sıralanır (bileşik dizin gerektirmez) */
        liste.sort(function(a,b){
          var ta = a.tarih && a.tarih.seconds ? a.tarih.seconds : 0;
          var tb = b.tarih && b.tarih.seconds ? b.tarih.seconds : 0;
          return tb - ta;
        });
        cozumle(liste);
      })
      .catch(function(e){
        console.warn('Gönderiler okunamadı:', e && e.message);
        cozumle([]);
      });
  });
}

function gonderiSay(uid){
  return new Promise(function(cozumle){
    if(!_fbDb) return cozumle(0);
    var sorgu = _fbDb.collection('posts').where('uid','==',uid);
    if(typeof sorgu.count === 'function'){
      sorgu.count().get()
        .then(function(s){ cozumle(s.data().count || 0); })
        .catch(function(){ cozumle(0); });
    } else {
      sorgu.limit(200).get()
        .then(function(s){ cozumle(s.size !== undefined ? s.size : (s.docs||[]).length); })
        .catch(function(){ cozumle(0); });
    }
  });
}

/* Tam fotoğrafları getir — gönderi açılınca */
function gonderiMedyaGetir(postId){
  return new Promise(function(cozumle){
    if(!_fbDb) return cozumle([]);
    _fbDb.collection('posts').doc(postId).collection('media').get()
      .then(function(snap){
        var liste = [];
        snap.forEach(function(d){ liste.push(d.data()); });
        liste.sort(function(a,b){ return (a.sira||0) - (b.sira||0); });
        cozumle(liste);
      })
      .catch(function(){ cozumle([]); });
  });
}

/* ── Izgara çizimi ───────────────────────────────────────── */
function gonderiIzgarasi(liste, sahibiMiyim){
  if(!liste.length){
    return '<div class="pr-tab-bos"><span class="ikon">📷</span>' +
           (sahibiMiyim ? 'Henüz gönderi yok.<br>İlk gönderini paylaş.'
                        : 'Henüz gönderi paylaşılmamış.') + '</div>';
  }
  return '<div class="pr-grid">' + liste.map(function(g){
    var kapak = (g.onizlemeler && g.onizlemeler[0]) ? g.onizlemeler[0] : null;
    var coklu = (g.fotoSayisi||0) > 1 ? '<span class="pr-grid-multi">⧉</span>' : '';
    var tur = GONDERI_TURLERI.find(function(t){ return t.id === g.tur; });
    return '<div class="pr-grid-item" onclick="openPost(\'' + g.id + '\')">' +
             (kapak
               ? '<img src="' + kapak + '" alt="">'
               : '<div class="pr-grid-yazi">' + (tur?tur.ikon+' ':'') +
                 _npKacir((g.metin||'').slice(0,80)) + '</div>') +
             coklu +
             '<span class="pr-grid-stat" id="gs-' + g.id + '"></span>' +
           '</div>';
  }).join('') + '</div>';
}

/* Izgaradaki beğeni ve yorum sayılarını doldurur.
   Ayrı çağrılır çünkü sayımlar asenkron gelir — ızgara
   beklemeden çizilsin, sayılar sonra düşsün. */
function gonderiIstatistikDoldur(liste){
  (liste || []).forEach(function(g){
    var el = document.getElementById('gs-' + g.id);
    if(!el) return;
    Promise.all([
      begeniSay(g.id).catch(function(){ return 0; }),
      yorumSay(g.id).catch(function(){ return 0; })
    ]).then(function(r){
      var b = r[0], y = r[1];
      if(!b && !y){ el.textContent = ''; return; }
      var parcalar = [];
      if(b) parcalar.push('♥ ' + b);
      if(y) parcalar.push('💬 ' + y);
      el.textContent = parcalar.join('  ');
    });
  });
}

/* ── Gönderi detay ───────────────────────────────────────── */
var _acikGonderi = null;

function openPost(postId){
  if(!_fbDb) return;
  var ov = document.getElementById('post-detail-overlay');
  if(!ov) return;
  ov.classList.add('active');
  document.body.style.overflow = 'hidden';

  var g = document.getElementById('pd-body');
  if(g) g.innerHTML = '<div class="dsc-durum">Yükleniyor...</div>';

  _fbDb.collection('posts').doc(postId).get()
    .then(function(doc){
      if(!doc.exists) throw new Error('Gönderi bulunamadı');
      var post = doc.data(); post.id = doc.id;
      _acikGonderi = post;
      return Promise.all([post, profilGetir(post.uid), gonderiMedyaGetir(postId)]);
    })
    .then(function(r){
      _pdCiz(r[0], r[1], r[2]);
    })
    .catch(function(e){
      if(g) g.innerHTML = '<div class="dsc-durum">' + (e.message||'Açılamadı') + '</div>';
    });
}

function closePost(){
  var ov = document.getElementById('post-detail-overlay');
  if(ov) ov.classList.remove('active');
  document.body.style.overflow = '';
  _acikGonderi = null;
}

function _pdCiz(post, profil, medya){
  var el = document.getElementById('pd-body');
  if(!el) return;

  var bas = (profil.isim || profil.nickname || '?').charAt(0).toUpperCase();
  var av = profil.avatar ? '<img src="' + profil.avatar + '" alt="">' : '<span>' + bas + '</span>';
  var tur = GONDERI_TURLERI.find(function(t){ return t.id === post.tur; });
  var benimMi = _fbUser && post.uid === _fbUser.uid;

  var html = '';

  /* Başlık: yazar */
  html += '<div class="pd-yazar">';
  html +=   '<button class="dsc-av" style="border:none;padding:0" onclick="closePost();openUserProfile(\'' + post.uid + '\')">' + av + '</button>';
  html +=   '<div class="dsc-bilgi">';
  html +=     '<div class="dsc-nick">@' + (profil.nickname||'') + '</div>';
  html +=     '<div class="dsc-isim">' + _pdTarih(post.tarih) + '</div>';
  html +=   '</div>';
  if(tur) html += '<span class="pd-tur">' + tur.ikon + ' ' + tur.ad + '</span>';
  html += '</div>';

  /* Fotoğraflar — masaüstünde ok butonlarıyla, mobilde kaydırarak */
  if(medya && medya.length){
    html += '<div class="pd-galeri">';
    html +=   '<div class="pd-medya" id="pd-medya">';
    medya.forEach(function(m){
      html += '<img src="' + m.veri + '" alt="" loading="lazy">';
    });
    html +=   '</div>';
    if(medya.length > 1){
      /* Masaüstünde dokunmatik kaydırma yok — ok butonları şart */
      html += '<button class="pd-ok sol" onclick="pdKaydir(-1)" aria-label="Önceki">‹</button>';
      html += '<button class="pd-ok sag" onclick="pdKaydir(1)" aria-label="Sonraki">›</button>';
      html += '<div class="pd-noktalar" id="pd-noktalar">';
      for(var i=0;i<medya.length;i++){
        html += '<span class="pd-nokta' + (i===0?' act':'') + '" onclick="pdGit(' + i + ')"></span>';
      }
      html += '</div>';
    }
    html += '</div>';
  }

  /* Metin — 3 satırdan uzunsa katlanır */
  if(post.metin){
    var satirlar = post.metin.split('\n');
    var uzun = satirlar.length > 3 || post.metin.length > 180;
    html += '<div class="pd-metin' + (uzun ? ' katli' : '') + '" id="pd-metin">' +
              _npKacir(post.metin) + '</div>';
    if(uzun){
      html += '<button class="pd-devam" id="pd-devam" onclick="pdMetinAc()">… devamını gör</button>';
    }
  }

  /* Eylem çubuğu */
  html += '<div class="pd-eylemler">';
  html +=   '<button class="pd-eylem" id="pd-begen-btn" onclick="pdBegen()">♡ Beğen</button>';
  html +=   '<button class="pd-eylem" onclick="pdYorumaOdaklan()">💬 Yorum</button>';
  if(benimMi){
    html += '<button class="pd-eylem sil" onclick="gonderiSil(\'' + post.id + '\')">🗑 Sil</button>';
  }
  html += '</div>';

  /* Sayaç şeridi */
  html += '<div class="pd-sayaclar">';
  html +=   '<button class="pd-sayac" id="pd-begeni-sayac" onclick="pdBegenenler()">0 beğeni</button>';
  html +=   '<span class="pd-sayac-ayrac">·</span>';
  html +=   '<span class="pd-sayac" id="pd-yorum-sayac">0 yorum</span>';
  html += '</div>';

  /* Yorumlar */
  html += '<div class="pd-yorumlar" id="pd-yorumlar"></div>';

  /* Yorum yazma */
  html += '<div class="pd-yorum-yaz">';
  html +=   '<input type="text" id="pd-yorum-input" placeholder="Yorum yaz..." ' +
            'maxlength="' + YORUM_MAX + '" oninput="pdYorumSay()" ' +
            'onkeydown="if(event.key===\'Enter\')pdYorumGonder()">';
  html +=   '<button id="pd-yorum-btn" onclick="pdYorumGonder()" disabled>Gönder</button>';
  html += '</div>';

  el.innerHTML = html;

  /* Galeri her açılışta İLK fotoğraftan başlar (madde 4).
     Tarayıcı kaydırma konumunu koruyabildiği için açıkça sıfırlanır. */
  _pdIndex = 0;
  var g = document.getElementById('pd-medya');
  if(g){
    g.scrollLeft = 0;
    _pdKaydirmaDinle();
  }
  _pdNoktaGuncelle();

  /* Beğeni ve yorumları yükle */
  _pdBegeniDurumu(post.id);
  _pdYorumlariCiz(post.id);
}

function _pdTarih(ts){
  if(!ts || !ts.seconds) return 'az önce';
  var d = new Date(ts.seconds * 1000);
  var fark = (Date.now() - d.getTime()) / 1000;
  if(fark < 60) return 'az önce';
  if(fark < 3600) return Math.floor(fark/60) + ' dakika önce';
  if(fark < 86400) return Math.floor(fark/3600) + ' saat önce';
  if(fark < 604800) return Math.floor(fark/86400) + ' gün önce';
  return d.toLocaleDateString('tr-TR');
}

function gonderiSil(postId){
  showConfirm('Gönderiyi Sil',
    'Bu gönderi kalıcı olarak silinecek. Emin misin?',
    function(){
      var ref = _fbDb.collection('posts').doc(postId);
      /* Önce alt koleksiyondaki fotoğraflar, sonra ana belge */
      ref.collection('media').get()
        .then(function(snap){
          return Promise.all(snap.docs.map(function(d){ return d.ref.delete(); }));
        })
        .then(function(){ return ref.delete(); })
        .then(function(){
          closePost();
          showToast('Gönderi silindi.');
          if(typeof _renderProfilSekmesi === 'function') _renderProfilSekmesi();
          if(typeof renderProfil === 'function') renderProfil();
        })
        .catch(function(e){
          showToast('❌ Silinemedi: ' + (e && e.message || ''),'error');
        });
    }, 'Evet, Sil');
}


/* ══════════════════════════════════════════════════════════
   GÖNDERİ GALERİSİ

   Mobilde parmakla kaydırılır. Masaüstünde dokunmatik kaydırma
   olmadığı için ok butonları ve nokta göstergesi eklendi.
   ══════════════════════════════════════════════════════════ */
var _pdIndex = 0;

function pdKaydir(yon){
  var el = document.getElementById('pd-medya');
  if(!el) return;
  var toplam = el.children.length;
  _pdIndex = Math.max(0, Math.min(toplam - 1, _pdIndex + yon));
  pdGit(_pdIndex);
}

function pdGit(i){
  var el = document.getElementById('pd-medya');
  if(!el) return;
  _pdIndex = i;
  el.scrollTo({left: el.clientWidth * i, behavior:'smooth'});
  _pdNoktaGuncelle();
}

function _pdNoktaGuncelle(){
  document.querySelectorAll('#pd-noktalar .pd-nokta').forEach(function(n, i){
    n.classList.toggle('act', i === _pdIndex);
  });
  /* Uçlardaki okları gizle */
  var el = document.getElementById('pd-medya');
  var toplam = el ? el.children.length : 0;
  var sol = document.querySelector('.pd-ok.sol');
  var sag = document.querySelector('.pd-ok.sag');
  if(sol) sol.style.visibility = _pdIndex <= 0 ? 'hidden' : 'visible';
  if(sag) sag.style.visibility = _pdIndex >= toplam-1 ? 'hidden' : 'visible';
}

/* Parmakla kaydırınca göstergeyi güncelle */
function _pdKaydirmaDinle(){
  var el = document.getElementById('pd-medya');
  if(!el) return;
  el.onscroll = function(){
    var i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    if(i !== _pdIndex){ _pdIndex = i; _pdNoktaGuncelle(); }
  };
}

/* Açıklamayı aç/kapa */
function pdMetinAc(){
  var m = document.getElementById('pd-metin');
  var b = document.getElementById('pd-devam');
  if(!m || !b) return;
  var acik = !m.classList.contains('katli');
  m.classList.toggle('katli', acik);
  b.textContent = acik ? '… devamını gör' : '▲ daha az göster';
}


/* ══════════════════════════════════════════════════════════
   GÖNDERİ ETKİLEŞİMLERİ — beğeni ve yorum arayüzü
   ══════════════════════════════════════════════════════════ */

function _pdBegeniDurumu(postId){
  begendimMi(postId).then(_pdBegeniButon);
  begeniSay(postId).then(function(n){
    var e = document.getElementById('pd-begeni-sayac');
    if(e) e.textContent = n + ' beğeni';
  });
}

function _pdBegeniButon(begendi){
  var b = document.getElementById('pd-begen-btn');
  if(!b) return;
  b.innerHTML = begendi ? '♥ Beğenildi' : '♡ Beğen';
  b.classList.toggle('begenili', begendi);
}

function pdBegen(){
  if(!_acikGonderi) return;
  var postId = _acikGonderi.id;
  var b = document.getElementById('pd-begen-btn');
  if(b) b.disabled = true;

  begeniDegistir(postId).then(function(begendi){
    if(b) b.disabled = false;
    _pdBegeniButon(begendi);
    begeniSay(postId).then(function(n){
      var e = document.getElementById('pd-begeni-sayac');
      if(e) e.textContent = n + ' beğeni';
    });
  }).catch(function(e){
    if(b) b.disabled = false;
    showToast('❌ ' + e.message, 'error');
  });
}

/* Beğenenler listesi */
function pdBegenenler(){
  if(!_acikGonderi) return;
  var postId = _acikGonderi.id;

  var baslik = document.getElementById('fl-baslik');
  if(baslik) baslik.textContent = 'Beğenenler';
  var govde = document.getElementById('fl-body');
  if(govde) govde.innerHTML = '<div class="dsc-durum">Yükleniyor...</div>';

  var ov = document.getElementById('follow-list-overlay');
  if(ov){ ov.classList.add('active'); }

  begenenleriGetir(postId, 50)
    .then(profilleriGetir)
    .then(function(liste){
      if(!govde) return;
      if(!liste.length){
        govde.innerHTML = '<div class="dsc-durum">Henüz beğeni yok.</div>';
        return;
      }
      govde.innerHTML = liste.map(function(p){
        var bas = (p.isim || p.nickname || '?').charAt(0).toUpperCase();
        var av = p.avatar ? '<img src="' + p.avatar + '" alt="">' : '<span>' + bas + '</span>';
        return '<button class="dsc-satir" onclick="closeFollowList();closePost();openUserProfile(\'' + p.uid + '\')">' +
                 '<div class="dsc-av">' + av + '</div>' +
                 '<div class="dsc-bilgi"><div class="dsc-nick">@' + (p.nickname||'') + '</div>' +
                 '<div class="dsc-isim">' + (p.isim||'') + '</div></div></button>';
      }).join('');
    });
}

/* ── Yorumlar ────────────────────────────────────────────── */

function _pdYorumlariCiz(postId){
  var el = document.getElementById('pd-yorumlar');
  if(!el) return;
  el.innerHTML = '<div class="pd-yorum-durum">Yorumlar yükleniyor...</div>';

  yorumlariGetir(postId, 100).then(function(liste){
    var sayacEl = document.getElementById('pd-yorum-sayac');
    if(sayacEl) sayacEl.textContent = liste.length + ' yorum';

    if(!liste.length){
      el.innerHTML = '<div class="pd-yorum-durum">Henüz yorum yok. İlk yorumu sen yaz.</div>';
      return;
    }

    /* Yorum sahiplerinin profillerini topluca getir */
    var uidler = [];
    liste.forEach(function(y){ if(uidler.indexOf(y.uid) < 0) uidler.push(y.uid); });

    Promise.all(uidler.map(function(u){
      return profilGetir(u).catch(function(){ return {uid:u, nickname:'kullanıcı'}; });
    })).then(function(profiller){
      var harita = {};
      profiller.forEach(function(p){ if(p) harita[p.uid] = p; });

      var benimGonderim = _fbUser && _acikGonderi && _acikGonderi.uid === _fbUser.uid;

      el.innerHTML = liste.map(function(y){
        var p = harita[y.uid] || {};
        var bas = (p.isim || p.nickname || '?').charAt(0).toUpperCase();
        var av = p.avatar
          ? '<img src="' + p.avatar + '" alt="">'
          : '<span>' + bas + '</span>';
        /* Yorum sahibi veya gönderi sahibi silebilir */
        var silebilir = _fbUser && (y.uid === _fbUser.uid || benimGonderim);
        return '<div class="pd-yorum">' +
                 '<button class="pd-yorum-av" onclick="closePost();openUserProfile(\'' + y.uid + '\')">' +
                   av + '</button>' +
                 '<div class="pd-yorum-govde">' +
                   '<div class="pd-yorum-ust">' +
                     '<span class="pd-yorum-nick">@' + (p.nickname||'kullanıcı') + '</span>' +
                     '<span class="pd-yorum-tarih">' + _pdTarih(y.tarih) + '</span>' +
                   '</div>' +
                   '<div class="pd-yorum-metin">' + _npKacir(y.metin) + '</div>' +
                 '</div>' +
                 (silebilir
                   ? '<button class="pd-yorum-sil" onclick="pdYorumSil(\'' + y.id + '\')" ' +
                     'aria-label="Yorumu sil">&times;</button>'
                   : '') +
               '</div>';
      }).join('');
    });
  });
}

function pdYorumSay(){
  var inp = document.getElementById('pd-yorum-input');
  var btn = document.getElementById('pd-yorum-btn');
  if(inp && btn) btn.disabled = !inp.value.trim();
}

function pdYorumaOdaklan(){
  var inp = document.getElementById('pd-yorum-input');
  if(inp){ inp.focus(); inp.scrollIntoView({behavior:'smooth', block:'center'}); }
}

function pdYorumGonder(){
  if(!_acikGonderi) return;
  var inp = document.getElementById('pd-yorum-input');
  var btn = document.getElementById('pd-yorum-btn');
  if(!inp) return;
  var metin = inp.value.trim();
  if(!metin) return;

  if(btn){ btn.disabled = true; btn.textContent = '...'; }

  yorumEkle(_acikGonderi.id, metin).then(function(){
    inp.value = '';
    if(btn){ btn.textContent = 'Gönder'; btn.disabled = true; }
    _pdYorumlariCiz(_acikGonderi.id);
  }).catch(function(e){
    if(btn){ btn.textContent = 'Gönder'; btn.disabled = false; }
    showToast('❌ ' + e.message, 'error');
  });
}

function pdYorumSil(yorumId){
  if(!_acikGonderi) return;
  var postId = _acikGonderi.id;
  showConfirm('Yorumu Sil', 'Bu yorum kalıcı olarak silinecek.', function(){
    yorumSil(postId, yorumId)
      .then(function(){ _pdYorumlariCiz(postId); showToast('Yorum silindi.'); })
      .catch(function(e){ showToast('❌ ' + e.message, 'error'); });
  }, 'Sil');
}
