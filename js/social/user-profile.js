/* ══════════════════════════════════════════════════════════
   RavenFit — user-profile.js
   BAŞKASININ PROFİLİ — tamamen ayrı ekran

   NEDEN AYRI EKRAN?
   ──────────────────────────────────────────────────────────
   Önceki sürüm başkasının profilini KENDİ profil ekranının
   üzerine yazıyordu. Bu şu hatalara yol açtı:
     • Geri dönünce kendi avatarın kayboluyordu
     • Rozetler hep kendi rozetlerin görünüyordu
     • "Hesabım" (çıkış, ayarlar) başkasının profilinde çıkıyordu
     • Gönderiler karışacaktı

   Artık başkasının profili KENDİ DOM'una sahip ayrı bir katman.
   Kendi profil ekranına hiç dokunulmaz.
   ══════════════════════════════════════════════════════════ */

var _upProfil = null;    /* görüntülenen profil verisi */
var _upUid = null;
var _upSekme = 'posts';

/* Kullanıcı profilini aç */
function openUserProfile(uid){
  if(!uid) return;
  /* Kendi profilim ise sosyal ekranı açma, kendi sekmene git */
  if(_fbUser && uid === _fbUser.uid){
    closeUserProfile();
    if(typeof switchMain === 'function') switchMain('profil');
    return;
  }

  _upUid = uid;
  _upSekme = 'posts';

  /* Altımızda açık ekran varsa yığına kaydet — geri dönünce
     kaldığı yerden devam etsin (bkz. js/social/nav-stack.js) */
  var kesfetAcik = _ekranAcikMi('discover-overlay');
  var akisAcik   = _ekranAcikMi('feed-screen');
  if(kesfetAcik)      navGizle('discover', closeDiscover, openDiscover);
  else if(akisAcik)   navGizle('feed', closeFeed, openFeed);
  closeFollowList();

  var ov = document.getElementById('user-profile-screen');
  if(!ov) return;
  ov.classList.add('active');
  document.body.style.overflow = 'hidden';

  _upYukleniyor();

  Promise.all([profilGetir(uid, true), engelleriYukle()]).then(function(r){
    var p = r[0];
    _upProfil = p;

    /* Engel varsa profil içeriği gösterilmez */
    if(typeof engelliMi === 'function' && engelliMi(uid)){
      return _upEngelliCiz(uid);
    }
    _upCiz();
  }).catch(function(e){
    var g = document.getElementById('up-body');
    if(g) g.innerHTML = '<div class="dsc-durum">Profil bulunamadı.<br>' +
                        '<span style="font-size:11px">' + (e && e.message || '') + '</span></div>';
  });
}

function closeUserProfile(){
  var ov = document.getElementById('user-profile-screen');
  if(ov) ov.classList.remove('active');
  _upProfil = null;
  _upUid = null;
  /* Altta bekleyen ekran varsa geri aç, yoksa kaydırmayı serbest bırak */
  if(!navGeri()) document.body.style.overflow = '';
}

/* Bir ekran şu an açık mı? */
function _ekranAcikMi(id){
  var el = document.getElementById(id);
  return !!(el && el.classList.contains('active'));
}

function _upYukleniyor(){
  var g = document.getElementById('up-body');
  if(g) g.innerHTML = '<div class="dsc-durum">Yükleniyor...</div>';
  var b = document.getElementById('up-nick');
  if(b) b.textContent = '';
}

/* Engel varsa — iki yönlü, kim engelledi belirtilmez */
function _upEngelliCiz(uid){
  var g = document.getElementById('up-body');
  if(!g) return;
  var benEngelledim = (typeof benEngelledimMi === 'function') && benEngelledimMi(uid);

  var nickEl = document.getElementById('up-nick');
  if(nickEl) nickEl.textContent = '';

  g.innerHTML =
    '<div class="up-engel">' +
      '<span class="ikon">🚫</span>' +
      '<strong>' + (benEngelledim ? 'Bu kullanıcıyı engelledin' : 'Bu profili görüntüleyemezsin') + '</strong>' +
      (benEngelledim
        ? 'Engeli kaldırırsan profilini yeniden görebilirsin.' +
          '<br><br><button class="btn btn-s" onclick="upEngeliKaldir(\'' + uid + '\')">Engeli Kaldır</button>'
        : 'Bu kullanıcının gizlilik ayarları profilini görmene izin vermiyor.') +
    '</div>';
}

function upEngeliKaldir(uid){
  showConfirm('Engeli Kaldır','Bu kullanıcıyı yeniden görebileceksin.', function(){
    engeliKaldir(uid).then(function(){
      showToast('Engel kaldırıldı.');
      openUserProfile(uid);
    }).catch(function(e){ showToast('❌ ' + e.message,'error'); });
  }, 'Kaldır');
}

function _upCiz(){
  var p = _upProfil;
  if(!p) return;

  /* Üst başlık */
  var nickEl = document.getElementById('up-nick');
  if(nickEl) nickEl.textContent = '@' + (p.nickname || '');

  var bas = (p.isim || p.nickname || '?').charAt(0).toUpperCase();
  var avatar = p.avatar
    ? '<img src="' + p.avatar + '" alt="">'
    : '<span>' + bas + '</span>';
  var onayli = (typeof onayRozeti === 'function') ? onayRozeti(p, 15) : '';

  var html = '';

  /* Avatar + sayaçlar */
  html += '<div class="up-head">';
  html +=   '<div class="up-av">' + avatar + '</div>';
  html +=   '<div class="pr-counts">';
  html +=     '<div class="pr-count"><span class="pr-count-v" id="up-c-post">—</span>' +
              '<span class="pr-count-l">gönderi</span></div>';
  html +=     '<button class="pr-count" onclick="openFollowList(\'followers\',\'' + _upUid + '\')">' +
              '<span class="pr-count-v" id="up-c-followers">—</span>' +
              '<span class="pr-count-l">takipçi</span></button>';
  html +=     '<button class="pr-count" onclick="openFollowList(\'following\',\'' + _upUid + '\')">' +
              '<span class="pr-count-v" id="up-c-following">—</span>' +
              '<span class="pr-count-l">takip</span></button>';
  html +=   '</div>';
  html += '</div>';

  /* İsim + biyografi */
  html += '<div class="up-name">' + (p.isim || p.nickname || 'İsimsiz') + onayli + '</div>';
  if(typeof onayEtiketi === 'function'){
    var etiket = onayEtiketi(p);
    if(etiket) html += '<div style="margin-bottom:8px">' + etiket + '</div>';
  }
  if(p.bio) html += '<div class="up-bio">' + _upKacir(p.bio) + '</div>';

  /* Eylemler */
  html += '<div class="pr-actions" style="margin-bottom:14px">';
  html +=   '<button class="pr-act primary" id="up-takip-btn" disabled>...</button>';
  html +=   '<button class="pr-act" onclick="showToast(\'Mesajlaşma yakında eklenecek.\',\'warn\')">Mesaj At</button>';
  if(p.onay === 'onayli'){
    html += '<button class="pr-act" onclick="openPackageViewer(\'' + _upUid + '\')">Abone Ol</button>';
  }
  html += '</div>';

  /* İstatistikler — SADECE paylaştıkları */
  var icerikAcik = _upIcerikAcik();
  var ist = icerikAcik ? (p.istatistik || {}) : {};
  var vitrin = icerikAcik
    ? (p.vitrin || []).filter(function(id){ return ist[id] !== undefined; })
    : [];
  html += '<div class="rc">';
  html +=   '<div class="pr-stats-head">';
  html +=     '<div class="rct" style="margin:0">📊 İSTATİSTİKLER</div>';
  if(Object.keys(ist).length > vitrin.length){
    html +=   '<button class="pr-detay-btn" onclick="openUserStatsDetail()">Detaylar ›</button>';
  }
  html +=   '</div>';
  if(!vitrin.length){
    html += '<div class="pr-vitrin-bos">' +
            (icerikAcik ? 'Bu kullanıcı istatistiklerini paylaşmıyor.'
                        : '🔒 Gizli hesap — takip edince görünür') + '</div>';
  } else {
    html += '<div class="pr-vitrin">' + vitrin.map(function(id){
      var a = alanBul(id);
      return '<div class="pr-vit">' +
               '<div class="pr-vit-v">' + _upDeger(id, ist[id]) + '</div>' +
               '<div class="pr-vit-l">' + (a ? a.ad : id) + '</div>' +
             '</div>';
    }).join('') + '</div>';
  }
  html += '</div>';

  /* Rozetler — ONUN rozetleri */
  html += '<div class="rc">';
  html +=   '<div class="rct">🏅 Rozetler</div>';
  html +=   _upRozetler(p);
  html += '</div>';

  /* Sekmeler */
  html += '<div class="rc" style="padding:0;overflow:hidden">';
  html +=   '<div class="pr-tabs">';
  html +=     '<button class="pr-tab act" data-upt="posts" onclick="upSekme(\'posts\')" aria-label="Gönderiler">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">' +
              '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>' +
              '<rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>' +
              '</svg></button>';
  html +=     '<button class="pr-tab" data-upt="programs" onclick="upSekme(\'programs\')" aria-label="Programlar">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round">' +
              '<path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11"/></svg></button>';
  html +=     '<button class="pr-tab" data-upt="services" onclick="upSekme(\'services\')" aria-label="Hizmetler">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round">' +
              '<path d="M3 20v-1a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v1"/><circle cx="9.5" cy="7" r="3.5"/>' +
              '<path d="M16 4h5v6h-5z"/><path d="M18.5 10v3"/></svg></button>';
  html +=   '</div>';
  html +=   '<div id="up-tab-body"></div>';
  html += '</div>';

  var g = document.getElementById('up-body');
  if(g) g.innerHTML = html;

  _upSekmeCiz();
  _upSayaclar();
  _upTakipDurumu();
}

/* Gizli profilde içerik görünür mü? */
function _upIcerikAcik(){
  if(typeof icerikGorulebilirMi !== 'function') return true;
  return icerikGorulebilirMi(_upProfil);
}

/* Rozet şeridi — profilden gelen rozet listesi */
function _upRozetler(p){
  var idler = p.rozetler || [];
  if(!idler.length){
    return '<div class="bs-bos">Bu kullanıcı rozet sergilemiyor.</div>';
  }
  var defs = (typeof _getBadgeDefs === 'function') ? _getBadgeDefs() : [];
  var html = '<div class="bs-serit" data-adet="' + Math.min(idler.length,5) + '">';
  idler.slice(0,5).forEach(function(id){
    var b = defs.find(function(x){ return x.id === id; });
    if(!b) return;
    html += '<div class="bs-rozet" title="' + (b.desc_tr||'') + '">' +
              '<div class="bs-ikon">' + b.icon + '</div>' +
              '<div class="bs-ad">' + b.name_tr + '</div>' +
            '</div>';
  });
  return html + '</div>';
}

function upSekme(sekme){
  _upSekme = sekme;
  document.querySelectorAll('#user-profile-screen .pr-tab').forEach(function(t){
    t.classList.toggle('act', t.dataset.upt === sekme);
  });
  _upSekmeCiz();
}

function _upSekmeCiz(){
  var el = document.getElementById('up-tab-body');
  if(!el) return;
  var ad = _upProfil ? ('@' + (_upProfil.nickname||'')) : 'Bu kullanıcı';

  /* Gizli profil ve takip etmiyorsam içerik kilitli */
  if(!_upIcerikAcik()){
    el.innerHTML = '<div class="up-kilit">' +
      '<span class="ikon">🔒</span>' +
      '<strong>Bu hesap gizli</strong>' +
      'Gönderilerini ve istatistiklerini görmek için ' +
      'takip isteği gönder ve onaylanmasını bekle.' +
      '</div>';
    return;
  }
  if(_upSekme === 'posts'){
    el.innerHTML = '<div class="dsc-durum">Yükleniyor...</div>';
    if(typeof gonderileriGetir === 'function'){
      gonderileriGetir(_upUid, 30).then(function(liste){
        el.innerHTML = liste.length
          ? gonderiIzgarasi(liste, false)
          : '<div class="pr-tab-bos"><span class="ikon">📷</span>' +
            ad + ' henüz gönderi paylaşmamış.</div>';
        var pe = document.getElementById('up-c-post');
        if(pe) pe.textContent = _sayiKisalt(liste.length);
        if(typeof gonderiIstatistikDoldur === 'function') gonderiIstatistikDoldur(liste);
      });
    }
  } else if(_upSekme === 'programs'){
    el.innerHTML = '<div class="pr-tab-bos"><span class="ikon">🏋️</span>' +
                   '<strong>Antrenman Programları</strong><br>' +
                   '<span style="opacity:.7">Yakında</span></div>';
  } else {
    el.innerHTML = '<div class="dsc-durum">Yükleniyor...</div>';
    if(typeof paketleriGetir === 'function'){
      paketleriGetir(_upUid).then(function(liste){
        el.innerHTML = paketListesiHTML(liste, false);
      });
    }
  }
}

/* Sayaçlar — follows koleksiyonundan SAYILIR (yazma izni gerekmez) */
function _upSayaclar(){
  if(!_upUid) return;
  takipciSay(_upUid).then(function(n){
    var e = document.getElementById('up-c-followers'); if(e) e.textContent = _sayiKisalt(n);
  });
  takipSay(_upUid).then(function(n){
    var e = document.getElementById('up-c-following'); if(e) e.textContent = _sayiKisalt(n);
  });
  if(typeof gonderiSay === 'function'){
    gonderiSay(_upUid).then(function(n){
      var pe = document.getElementById('up-c-post');
      if(pe) pe.textContent = _sayiKisalt(n);
    });
  }
}

function _upTakipDurumu(){
  takipEdiyorMuyum(_upUid).then(function(ediyor){
    if(ediyor) return _upTakipButon('takipte');
    /* Takip etmiyorum — gizli profilse istek durumuna bak */
    if(gizliProfilMi(_upProfil)){
      takipIstegiDurumu(_upUid).then(function(durum){
        _upTakipButon(durum === 'beklemede' ? 'istekBekliyor' : 'istekGonder');
      });
    } else {
      _upTakipButon('takipEt');
    }
  });
}

/* Buton dört durumdan birinde olur:
   takipte · takipEt · istekGonder · istekBekliyor */
function _upTakipButon(durum){
  var b = document.getElementById('up-takip-btn');
  if(!b) return;
  b.disabled = false;

  var metinler = {
    takipte:       {yazi:'Takiptesin',      sinif:'following'},
    takipEt:       {yazi:'Takip Et',        sinif:'primary'},
    istekGonder:   {yazi:'Takip İsteği Gönder', sinif:'primary'},
    istekBekliyor: {yazi:'İstek Gönderildi', sinif:'following'}
  };
  var d = metinler[durum] || metinler.takipEt;
  b.textContent = d.yazi;
  b.className = 'pr-act ' + d.sinif;
  b.dataset.durum = durum;
  b.onclick = upTakipDegistir;
}

function upTakipDegistir(){
  var b = document.getElementById('up-takip-btn');
  if(!b) return;
  var durum = b.dataset.durum || 'takipEt';
  b.disabled = true; b.textContent = '...';

  var islem;
  if(durum === 'istekGonder'){
    islem = takipIstegiGonder(_upUid).then(function(){ return 'istekBekliyor'; });
  } else if(durum === 'istekBekliyor'){
    islem = takipIstegiGeriCek(_upUid).then(function(){ return 'istekGonder'; });
  } else {
    islem = takipDegistir(_upUid).then(function(ediyor){
      return ediyor ? 'takipte' : (gizliProfilMi(_upProfil) ? 'istekGonder' : 'takipEt');
    });
  }

  islem.then(function(yeniDurum){
    _upTakipButon(yeniDurum);
    _upSayaclar();
    var mesajlar = {
      takipte:       '✅ Takip ediliyor.',
      istekBekliyor: '✅ Takip isteği gönderildi.',
      istekGonder:   'İstek geri çekildi.',
      takipEt:       'Takip bırakıldı.'
    };
    showToast(mesajlar[yeniDurum] || '');
    /* Gizli profilde takip başlayınca içerik açılır */
    if(yeniDurum === 'takipte' && gizliProfilMi(_upProfil)) _upCiz();
  }).catch(function(e){
    _upTakipDurumu();
    showToast('❌ ' + e.message, 'error');
  });
}

/* İstatistik detay penceresi — ONUN verileri */
function openUserStatsDetail(){
  if(!_upProfil) return;
  var ist = _upProfil.istatistik || {};
  var alanlar = ISTATISTIK_ALANLARI.filter(function(a){ return ist[a.id] !== undefined; });

  var baslik = document.getElementById('sd-baslik');
  if(baslik) baslik.textContent = '@' + (_upProfil.nickname||'') + ' — İstatistikler';

  var govde = document.getElementById('sd-body');
  if(govde){
    if(!alanlar.length){
      govde.innerHTML = '<div class="pr-tab-bos"><span class="ikon">📊</span>Paylaşılan istatistik yok.</div>';
    } else {
      var html = '';
      ['temel','hesap','olcu'].forEach(function(grup){
        var g = alanlar.filter(function(a){ return a.grup === grup; });
        if(!g.length) return;
        html += '<div class="sp-grup-baslik">' + ISTATISTIK_GRUPLARI[grup] + '</div>';
        g.forEach(function(a){
          html += '<div class="sp-satir acik">' +
                    '<div class="sp-sol"><div class="sp-ad">' + a.ad + '</div></div>' +
                    '<div class="sp-sag" style="font-size:15px;font-weight:700;color:var(--accent)">' +
                      _upDeger(a.id, ist[a.id]) + '</div></div>';
        });
      });
      govde.innerHTML = html;
    }
  }
  var ov = document.getElementById('stats-detail-overlay');
  if(ov){ ov.classList.add('active'); }
}

function _upDeger(id, deger){
  var a = alanBul(id);
  if(!a || deger === null || deger === undefined) return '—';
  var v = Number(deger);
  if(isNaN(v)) return '—';
  var s = a.ondalik > 0 ? v.toFixed(a.ondalik) : String(Math.round(v));
  return a.birim ? (s + (a.birim === '%' ? '%' : ' ' + a.birim)) : s;
}

function _upKacir(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ══════════════════════════════════════════════════════════
   KULLANICI SEÇENEKLERİ MENÜSÜ
   Şikâyet ve engelleme tek yerde toplandı.
   ══════════════════════════════════════════════════════════ */
function upMenuAc(){
  if(!_upUid) return;
  var nick = _upProfil ? ('@' + (_upProfil.nickname||'')) : 'Kullanıcı';

  var baslik = document.getElementById('um-baslik');
  if(baslik) baslik.textContent = nick;

  var engelli = (typeof benEngelledimMi === 'function') && benEngelledimMi(_upUid);
  var el = document.getElementById('um-body');
  if(el){
    el.innerHTML =
      '<button class="um-secenek" onclick="upMenuKapat();openReport(\'profil\',\'' + _upUid + '\',\'' + _upUid + '\')">' +
        '<span class="um-ikon">🚩</span>' +
        '<span><strong>Şikâyet Et</strong><small>Kurallara aykırı davranış bildir</small></span>' +
      '</button>' +
      '<button class="um-secenek tehlike" onclick="upEngelToggle()">' +
        '<span class="um-ikon">' + (engelli ? '✅' : '🚫') + '</span>' +
        '<span><strong>' + (engelli ? 'Engeli Kaldır' : 'Engelle') + '</strong>' +
        '<small>' + (engelli
          ? 'Profilini yeniden görebilirsin'
          : 'Birbirinizi göremez, mesajlaşamazsınız') + '</small></span>' +
      '</button>';
  }

  var ov = document.getElementById('user-menu-overlay');
  if(ov) ov.classList.add('active');
}

function upMenuKapat(){
  var ov = document.getElementById('user-menu-overlay');
  if(ov) ov.classList.remove('active');
}

function upEngelToggle(){
  var uid = _upUid;
  var engelli = (typeof benEngelledimMi === 'function') && benEngelledimMi(uid);
  var nick = _upProfil ? ('@' + (_upProfil.nickname||'')) : 'Bu kullanıcı';
  upMenuKapat();

  if(engelli){
    showConfirm('Engeli Kaldır', nick + ' kullanıcısını yeniden görebileceksin.', function(){
      engeliKaldir(uid).then(function(){
        showToast('Engel kaldırıldı.');
        openUserProfile(uid);
      }).catch(function(e){ showToast('❌ ' + e.message,'error'); });
    }, 'Kaldır');
  } else {
    showConfirm('Engelle',
      nick + ' kullanıcısını engellemek üzeresin.\n\n' +
      '• Birbirinizin profilini göremezsiniz\n' +
      '• Mevcut takipler kaldırılır\n' +
      '• Mesajlaşamazsınız\n\n' +
      'Bu işlemi daha sonra geri alabilirsin.',
      function(){
        engelle(uid).then(function(){
          showToast('Kullanıcı engellendi.');
          closeUserProfile();
        }).catch(function(e){ showToast('❌ ' + e.message,'error'); });
      }, 'Engelle');
  }
}
