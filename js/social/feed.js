/* ══════════════════════════════════════════════════════════
   RavenFit — feed.js
   Ana akış

   İKİ SEKME
     Takip  → yalnızca takip ettiklerinin gönderileri
     Keşfet → herkesin gönderileri, yeniden eskiye

   NEDEN İSTEMCİDE BİRLEŞTİRİLİYOR?
   Firestore'da "takip ettiklerimin gönderileri" tek sorguyla
   alınamaz — 'in' operatörü en fazla 30 değer kabul eder ve
   sıralama için bileşik dizin ister. Bu yüzden takip listesi
   parçalara bölünür, her parça ayrı sorgulanır ve sonuçlar
   istemcide tarihe göre birleştirilir.

   ÜRETİM NOTU: Kullanıcı sayısı arttığında bu yaklaşım yavaşlar.
   Gerçek uygulamada her kullanıcı için bir "akış" koleksiyonu
   tutulup gönderi paylaşıldığında takipçilere dağıtılmalıdır
   (fan-out). Demo ölçeğinde bu gereksiz karmaşıklık olurdu.
   ══════════════════════════════════════════════════════════ */

var AKIS_SAYFA = 10;
var _akisSekme = 'takip';
var _akisGonderiler = [];
var _akisProfiller = {};
var _akisYukleniyor = false;

function openFeed(){
  var ov = document.getElementById('feed-screen');
  if(!ov) return;
  ov.classList.add('active');
  document.body.style.overflow = 'hidden';
  _akisYukle();
}

function closeFeed(){
  var ov = document.getElementById('feed-screen');
  if(ov) ov.classList.remove('active');
  document.body.style.overflow = '';
}

function akisSekme(sekme){
  if(_akisSekme === sekme) return;
  _akisSekme = sekme;
  document.querySelectorAll('.fd-sekme').forEach(function(b){
    b.classList.toggle('act', b.dataset.fs === sekme);
  });
  _akisYukle();
}

function _akisYukle(){
  if(_akisYukleniyor) return;
  _akisYukleniyor = true;

  var el = document.getElementById('fd-body');
  if(el) el.innerHTML = '<div class="dsc-durum">Yükleniyor...</div>';

  var vaat = (_akisSekme === 'takip') ? _akisTakipGonderileri() : _akisTumGonderiler();

  vaat.then(function(gonderiler){
    _akisGonderiler = gonderiler;
    if(!gonderiler.length){
      _akisYukleniyor = false;
      return _akisBosCiz();
    }
    /* Yazar profillerini topluca getir */
    var uidler = [];
    gonderiler.forEach(function(g){ if(uidler.indexOf(g.uid) < 0) uidler.push(g.uid); });
    return Promise.all(uidler.map(function(u){
      return profilGetir(u).catch(function(){ return {uid:u, nickname:'kullanıcı'}; });
    })).then(function(profiller){
      _akisProfiller = {};
      profiller.forEach(function(p){ if(p) _akisProfiller[p.uid] = p; });
      _akisCiz();
      _akisYukleniyor = false;
    });
  }).catch(function(e){
    _akisYukleniyor = false;
    if(el) el.innerHTML = '<div class="dsc-durum">Akış yüklenemedi.<br>' +
                          '<span style="font-size:11px">' + (e && e.message || '') + '</span></div>';
  });
}

/* Takip edilenlerin gönderileri */
function _akisTakipGonderileri(){
  if(!_fbUser || !_fbDb) return Promise.resolve([]);

  return takipEdilenleriGetir(_fbUser.uid, 200).then(function(uidler){
    /* Kendi gönderilerimiz de akışta görünsün */
    if(uidler.indexOf(_fbUser.uid) < 0) uidler.push(_fbUser.uid);
    if(!uidler.length) return [];

    /* Firestore 'in' operatörü en fazla 30 değer alır — parçala */
    var parcalar = [];
    for(var i = 0; i < uidler.length; i += 30){
      parcalar.push(uidler.slice(i, i + 30));
    }

    return Promise.all(parcalar.map(function(parca){
      return _fbDb.collection('posts')
        .where('uid','in',parca)
        .limit(50).get()
        .then(function(snap){
          var liste = [];
          snap.forEach(function(d){ var g = d.data(); g.id = d.id; liste.push(g); });
          return liste;
        })
        .catch(function(){ return []; });
    })).then(function(gruplar){
      var hepsi = [];
      gruplar.forEach(function(g){ hepsi = hepsi.concat(g); });
      return _akisSirala(hepsi);
    });
  });
}

/* Tüm gönderiler — keşfet */
function _akisTumGonderiler(){
  if(!_fbDb) return Promise.resolve([]);
  return _fbDb.collection('posts').limit(60).get()
    .then(function(snap){
      var liste = [];
      snap.forEach(function(d){ var g = d.data(); g.id = d.id; liste.push(g); });
      return _akisSirala(liste);
    })
    .catch(function(){ return []; });
}

/* Yeniden eskiye. Sunucu zaman damgası istemcide sıralanır —
   bileşik dizin gerektirmemesi için. */
function _akisSirala(liste){
  liste.sort(function(a,b){
    var ta = a.tarih && a.tarih.seconds ? a.tarih.seconds : 0;
    var tb = b.tarih && b.tarih.seconds ? b.tarih.seconds : 0;
    return tb - ta;
  });
  return liste.slice(0, 60);
}

function _akisBosCiz(){
  var el = document.getElementById('fd-body');
  if(!el) return;
  if(_akisSekme === 'takip'){
    el.innerHTML = '<div class="fd-bos">' +
      '<span class="ikon">👥</span>' +
      '<strong>Akışın boş</strong>' +
      'Takip ettiğin kişilerin gönderileri burada görünür.<br>' +
      'Keşfet\'ten yeni kişiler bulabilirsin.' +
      '<button class="btn btn-p" onclick="closeFeed();openDiscover()">Keşfet\'e Git</button>' +
      '</div>';
  } else {
    el.innerHTML = '<div class="fd-bos">' +
      '<span class="ikon">📷</span>' +
      '<strong>Henüz gönderi yok</strong>' +
      'İlk gönderiyi sen paylaş.' +
      '</div>';
  }
}

function _akisCiz(){
  var el = document.getElementById('fd-body');
  if(!el) return;
  el.innerHTML = _akisGonderiler.map(_akisKartHTML).join('');
  /* Beğeni durumlarını ve sayıları doldur */
  _akisGonderiler.forEach(function(g){
    _akisKartIstatistik(g.id);
  });
}

/* Akıştaki tek gönderi kartı */
function _akisKartHTML(g){
  var p = _akisProfiller[g.uid] || {};
  var bas = (p.isim || p.nickname || '?').charAt(0).toUpperCase();
  var av = p.avatar ? '<img src="' + p.avatar + '" alt="">' : '<span>' + bas + '</span>';
  var tur = (typeof GONDERI_TURLERI !== 'undefined')
    ? GONDERI_TURLERI.find(function(t){ return t.id === g.tur; }) : null;
  var onayli = p.onay === 'onayli'
    ? ' <span class="dsc-onay" title="Onaylı hesap">✔</span>' : '';

  var html = '<article class="fd-kart">';

  /* Yazar */
  html += '<div class="fd-yazar">';
  html +=   '<button class="dsc-av" style="border:none;padding:0" ' +
            'onclick="closeFeed();openUserProfile(\'' + g.uid + '\')">' + av + '</button>';
  html +=   '<div class="dsc-bilgi">';
  html +=     '<div class="dsc-nick">@' + (p.nickname||'') + onayli + '</div>';
  html +=     '<div class="dsc-isim">' + _pdTarih(g.tarih) +
              (g.duzenlendi ? ' · düzenlendi' : '') + '</div>';
  html +=   '</div>';
  if(tur) html += '<span class="pd-tur">' + tur.ikon + ' ' + tur.ad + '</span>';
  html += '</div>';

  /* Kapak — tıklayınca gönderiye gider */
  var kapak = (g.onizlemeler && g.onizlemeler[0]) ? g.onizlemeler[0] : null;
  if(kapak){
    html += '<div class="fd-medya" onclick="closeFeed();openPost(\'' + g.id + '\')">';
    html +=   '<img src="' + kapak + '" alt="" loading="lazy">';
    if((g.fotoSayisi||0) > 1){
      html += '<span class="fd-coklu">⧉ ' + g.fotoSayisi + '</span>';
    }
    html += '</div>';
  }

  /* Metin — 3 satırda kırpılır */
  if(g.metin){
    html += '<div class="fd-metin" onclick="closeFeed();openPost(\'' + g.id + '\')">' +
              _npKacir(g.metin) + '</div>';
  }

  /* Eylemler */
  html += '<div class="fd-eylemler">';
  html +=   '<button class="fd-eylem" id="fb-' + g.id + '" onclick="akisBegen(\'' + g.id + '\')">' +
            '♡<span id="fbs-' + g.id + '"></span></button>';
  html +=   '<button class="fd-eylem" onclick="closeFeed();openPost(\'' + g.id + '\')">' +
            '💬<span id="fys-' + g.id + '"></span></button>';
  html += '</div>';

  html += '</article>';
  return html;
}

/* Kart istatistikleri — beğeni durumu ve sayılar */
function _akisKartIstatistik(postId){
  begendimMi(postId).then(function(begendi){
    var b = document.getElementById('fb-' + postId);
    if(b){
      b.classList.toggle('aktif', begendi);
      b.innerHTML = (begendi ? '♥' : '♡') +
        '<span id="fbs-' + postId + '">' + (b.dataset.sayi || '') + '</span>';
    }
  });
  begeniSay(postId).then(function(n){
    var e = document.getElementById('fbs-' + postId);
    var b = document.getElementById('fb-' + postId);
    if(b) b.dataset.sayi = n ? ' ' + n : '';
    if(e) e.textContent = n ? ' ' + n : '';
  });
  yorumSay(postId).then(function(n){
    var e = document.getElementById('fys-' + postId);
    if(e) e.textContent = n ? ' ' + n : '';
  });
}

function akisBegen(postId){
  var b = document.getElementById('fb-' + postId);
  if(b) b.disabled = true;
  begeniDegistir(postId).then(function(begendi){
    if(b) b.disabled = false;
    begeniSay(postId).then(function(n){
      if(b){
        b.classList.toggle('aktif', begendi);
        b.dataset.sayi = n ? ' ' + n : '';
        b.innerHTML = (begendi ? '♥' : '♡') +
          '<span id="fbs-' + postId + '">' + (n ? ' ' + n : '') + '</span>';
      }
    });
  }).catch(function(e){
    if(b) b.disabled = false;
    showToast('❌ ' + e.message, 'error');
  });
}

/* Akışı yenile — gönderi paylaşıldıktan sonra çağrılır */
function akisYenile(){
  var ov = document.getElementById('feed-screen');
  if(ov && ov.classList.contains('active')) _akisYukle();
}
