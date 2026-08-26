/* ══════════════════════════════════════════════════════════
   RavenFit — privacy.js
   Engelleme ve gizli profil

   VERİ YAPISI
   ──────────────────────────────────────────────────────────
   blocks/{engelleyen}_{engellenen}
     → { engelleyen, engellenen, tarih }

   followRequests/{isteyen}_{hedef}
     → { isteyen, hedef, durum, tarih }

   profiles/{uid}.gizli = true|false

   ENGELLEME KARŞILIKLIDIR
   A, B'yi engellerse ikisi de birbirini göremez. Tek yönlü
   engelleme (ben görmeyeyim ama o görsün) kullanıcıyı korumaz —
   engellenen kişi içeriği takip etmeye devam eder.

   GİZLİ PROFİL
   Profil kartı görünür (avatar, isim, sayaçlar) ama gönderiler,
   istatistikler ve listeler yalnızca onaylı takipçilere açıktır.
   Gizli hesapların gönderileri keşfet akışında ÇIKMAZ;
   takip edenlerin akışında çıkar.
   ══════════════════════════════════════════════════════════ */

var _engelOnbellek = null;     /* {engelledigim:Set, engelleyen:Set} */
var _takipIstekOnbellek = {};  /* hedefUid → 'yok'|'beklemede' */

function _engelId(a, b){ return a + '_' + b; }

/* ── Engelleme ───────────────────────────────────────────── */

/* Engel listelerini bir kez yükler — her kontrolde sorgu atmamak için */
function engelleriYukle(){
  if(_engelOnbellek) return Promise.resolve(_engelOnbellek);
  if(!_fbUser || !_fbDb){
    _engelOnbellek = {engelledigim:{}, engelleyen:{}};
    return Promise.resolve(_engelOnbellek);
  }

  return Promise.all([
    _fbDb.collection('blocks').where('engelleyen','==',_fbUser.uid).limit(500).get()
      .catch(function(){ return {forEach:function(){}}; }),
    _fbDb.collection('blocks').where('engellenen','==',_fbUser.uid).limit(500).get()
      .catch(function(){ return {forEach:function(){}}; })
  ]).then(function(r){
    var benim = {}, bana = {};
    r[0].forEach(function(d){ benim[d.data().engellenen] = true; });
    r[1].forEach(function(d){ bana[d.data().engelleyen] = true; });
    _engelOnbellek = {engelledigim: benim, engelleyen: bana};
    return _engelOnbellek;
  });
}

/* Bu kişiyle aramda engel var mı? (iki yönlü) */
function engelliMi(uid){
  if(!_engelOnbellek) return false;
  return !!(_engelOnbellek.engelledigim[uid] || _engelOnbellek.engelleyen[uid]);
}

function benEngelledimMi(uid){
  return !!(_engelOnbellek && _engelOnbellek.engelledigim[uid]);
}

function engelle(uid){
  return new Promise(function(cozumle, reddet){
    if(!_fbUser || !_fbDb) return reddet(new Error('Giriş yapmalısın.'));
    if(uid === _fbUser.uid) return reddet(new Error('Kendini engelleyemezsin.'));

    _fbDb.collection('blocks').doc(_engelId(_fbUser.uid, uid)).set({
      engelleyen: _fbUser.uid,
      engellenen: uid,
      tarih: firebase.firestore.FieldValue.serverTimestamp()
    })
      .then(function(){
        if(_engelOnbellek) _engelOnbellek.engelledigim[uid] = true;
        /* Karşılıklı takipleri kaldır — engellenen kişi
           akışında içeriğimi görmeye devam etmesin */
        return Promise.all([
          _fbDb.collection('follows').doc(_fbUser.uid + '_' + uid).delete().catch(function(){}),
          _fbDb.collection('follows').doc(uid + '_' + _fbUser.uid).delete().catch(function(){})
        ]);
      })
      .then(function(){
        if(typeof _takipOnbellek !== 'undefined') delete _takipOnbellek[uid];
        cozumle(true);
      })
      .catch(function(){ reddet(new Error('Engellenemedi.')); });
  });
}

function engeliKaldir(uid){
  return new Promise(function(cozumle, reddet){
    if(!_fbUser || !_fbDb) return reddet(new Error('Giriş yapmalısın.'));
    _fbDb.collection('blocks').doc(_engelId(_fbUser.uid, uid)).delete()
      .then(function(){
        if(_engelOnbellek) delete _engelOnbellek.engelledigim[uid];
        cozumle(false);
      })
      .catch(function(){ reddet(new Error('Engel kaldırılamadı.')); });
  });
}

/* Engellenen listesini getir — ayarlar ekranı için */
function engellenenleriGetir(){
  return new Promise(function(cozumle){
    if(!_fbUser || !_fbDb) return cozumle([]);
    _fbDb.collection('blocks').where('engelleyen','==',_fbUser.uid).limit(200).get()
      .then(function(snap){
        var uidler = [];
        snap.forEach(function(d){ uidler.push(d.data().engellenen); });
        cozumle(uidler);
      })
      .catch(function(){ cozumle([]); });
  });
}

/* ── Gizli profil ────────────────────────────────────────── */

function gizliProfilMi(profil){
  return !!(profil && profil.gizli === true);
}

/* Bu profilin içeriğini görebilir miyim? */
function icerikGorulebilirMi(profil){
  if(!profil) return false;
  if(engelliMi(profil.uid)) return false;
  if(_fbUser && profil.uid === _fbUser.uid) return true;   /* kendi profilim */
  if(!gizliProfilMi(profil)) return true;                  /* açık profil */
  /* Gizli — yalnızca takip ediyorsam */
  return typeof _takipOnbellek !== 'undefined' && _takipOnbellek[profil.uid] === true;
}

function gizlilikDegistir(gizli){
  return new Promise(function(cozumle, reddet){
    if(!_fbUser || !_fbDb) return reddet(new Error('Giriş yapmalısın.'));

    var p = getYerelProfil();
    p.gizli = !!gizli;
    saveYerelProfil(p);

    _fbDb.collection('profiles').doc(_fbUser.uid).set({gizli: !!gizli}, {merge:true})
      .then(function(){
        if(_profilOnbellek) delete _profilOnbellek[_fbUser.uid];
        cozumle(!!gizli);
      })
      .catch(function(e){ reddet(new Error('Ayar kaydedilemedi.')); });
  });
}

/* ── Takip isteği ────────────────────────────────────────── */

function _istekId(isteyen, hedef){ return isteyen + '_' + hedef; }

function takipIstegiDurumu(hedefUid){
  return new Promise(function(cozumle){
    if(!_fbUser || !_fbDb) return cozumle('yok');
    if(_takipIstekOnbellek[hedefUid]) return cozumle(_takipIstekOnbellek[hedefUid]);

    _fbDb.collection('followRequests').doc(_istekId(_fbUser.uid, hedefUid)).get()
      .then(function(d){
        var durum = d.exists ? (d.data().durum || 'beklemede') : 'yok';
        _takipIstekOnbellek[hedefUid] = durum;
        cozumle(durum);
      })
      .catch(function(){ cozumle('yok'); });
  });
}

function takipIstegiGonder(hedefUid){
  return new Promise(function(cozumle, reddet){
    if(!_fbUser || !_fbDb) return reddet(new Error('Giriş yapmalısın.'));
    _fbDb.collection('followRequests').doc(_istekId(_fbUser.uid, hedefUid)).set({
      isteyen: _fbUser.uid,
      hedef: hedefUid,
      durum: 'beklemede',
      tarih: firebase.firestore.FieldValue.serverTimestamp()
    })
      .then(function(){
        _takipIstekOnbellek[hedefUid] = 'beklemede';
        if(typeof bildirimGonder === 'function') bildirimGonder(hedefUid, 'takipIstegi');
        cozumle('beklemede');
      })
      .catch(function(){ reddet(new Error('İstek gönderilemedi.')); });
  });
}

function takipIstegiGeriCek(hedefUid){
  return new Promise(function(cozumle, reddet){
    if(!_fbUser || !_fbDb) return reddet(new Error('Giriş yapmalısın.'));
    _fbDb.collection('followRequests').doc(_istekId(_fbUser.uid, hedefUid)).delete()
      .then(function(){
        _takipIstekOnbellek[hedefUid] = 'yok';
        cozumle('yok');
      })
      .catch(function(){ reddet(new Error('İstek geri çekilemedi.')); });
  });
}

/* Bana gelen istekler */
function bekleyenIstekleriGetir(){
  return new Promise(function(cozumle){
    if(!_fbUser || !_fbDb) return cozumle([]);
    _fbDb.collection('followRequests')
      .where('hedef','==',_fbUser.uid)
      .where('durum','==','beklemede')
      .limit(100).get()
      .then(function(snap){
        var liste = [];
        snap.forEach(function(d){ var v = d.data(); v.id = d.id; liste.push(v); });
        cozumle(liste);
      })
      .catch(function(){ cozumle([]); });
  });
}

/* İsteği kabul et — takip ilişkisi kurulur, istek silinir */
function takipIstegiKabul(isteyenUid){
  return new Promise(function(cozumle, reddet){
    if(!_fbUser || !_fbDb) return reddet(new Error('Giriş yapmalısın.'));
    /* Takip belgesini İSTEYEN adına oluşturamayız (kural engeller).
       Bu yüzden istek belgesi 'onayli' işaretlenir; isteyen taraf
       kendi tarafında takip belgesini oluşturur. */
    _fbDb.collection('followRequests').doc(_istekId(isteyenUid, _fbUser.uid))
      .set({durum:'onayli', onayTarihi: firebase.firestore.FieldValue.serverTimestamp()}, {merge:true})
      .then(function(){
        if(typeof bildirimGonder === 'function') bildirimGonder(isteyenUid, 'istekKabul');
        cozumle();
      })
      .catch(function(){ reddet(new Error('İstek kabul edilemedi.')); });
  });
}

function takipIstegiReddet(isteyenUid){
  return new Promise(function(cozumle, reddet){
    if(!_fbUser || !_fbDb) return reddet(new Error('Giriş yapmalısın.'));
    _fbDb.collection('followRequests').doc(_istekId(isteyenUid, _fbUser.uid)).delete()
      .then(cozumle)
      .catch(function(){ reddet(new Error('İstek reddedilemedi.')); });
  });
}

/* Onaylanmış isteklerimi takip ilişkisine çevir.
   Girişte bir kez çalışır — hedef kabul ettiyse takip başlar. */
function onaylananIstekleriIsle(){
  if(!_fbUser || !_fbDb) return Promise.resolve(0);
  return _fbDb.collection('followRequests')
    .where('isteyen','==',_fbUser.uid)
    .where('durum','==','onayli')
    .limit(50).get()
    .then(function(snap){
      var islemler = [];
      snap.forEach(function(d){
        var hedef = d.data().hedef;
        islemler.push(
          _fbDb.collection('follows').doc(_fbUser.uid + '_' + hedef).set({
            takipEden: _fbUser.uid,
            takipEdilen: hedef,
            tarih: firebase.firestore.FieldValue.serverTimestamp()
          }).then(function(){ return d.ref.delete(); })
        );
      });
      return Promise.all(islemler).then(function(){ return islemler.length; });
    })
    .catch(function(){ return 0; });
}

/* Oturum değişince önbellekleri temizle */
function gizlilikOnbellegiTemizle(){
  _engelOnbellek = null;
  _takipIstekOnbellek = {};
}

/* ══════════════════════════════════════════════════════════
   GİZLİLİK AYARLARI EKRANI
   ══════════════════════════════════════════════════════════ */

function openPrivacySettings(){
  if(!_fbUser){ showToast('Giriş yapmalısın.','warn'); return; }
  var ov = document.getElementById('privacy-overlay');
  if(!ov) return;
  ov.classList.add('active');
  document.body.style.overflow = 'hidden';
  _gzCiz();
}

function closePrivacySettings(){
  var ov = document.getElementById('privacy-overlay');
  if(ov) ov.classList.remove('active');
  document.body.style.overflow = '';
}

function _gzCiz(){
  var el = document.getElementById('gz-body');
  if(!el) return;

  var p = getYerelProfil();
  var gizli = p.gizli === true;

  var html = '';

  /* Gizli hesap anahtarı */
  html += '<div class="sp-satir' + (gizli?' acik':'') + '" style="padding:14px 13px">' +
            '<div class="sp-sol">' +
              '<div class="sp-ad">🔒 Gizli Hesap</div>' +
              '<div class="sp-deger">' +
                (gizli ? 'Yalnızca onayladığın takipçiler görebilir'
                       : 'Herkes gönderilerini görebilir') +
              '</div>' +
            '</div>' +
            '<div class="sp-sag">' +
              '<button class="sp-anahtar' + (gizli?' on':'') + '" onclick="gzGizlilikToggle()" ' +
                'aria-label="Gizli hesap"><span></span></button>' +
            '</div>' +
          '</div>';

  html += '<div class="sp-ipucu">Gizli hesapta gönderilerin Keşfet akışında ' +
          'görünmez. Takip etmek isteyenler önce istek gönderir, sen onaylarsın.</div>';

  /* Bekleyen takip istekleri */
  html += '<div class="sp-grup-baslik">Takip İstekleri</div>';
  html += '<div id="gz-istekler"><div class="dsc-durum">Yükleniyor...</div></div>';

  /* Engellenenler */
  html += '<div class="sp-grup-baslik">Engellenen Hesaplar</div>';
  html += '<div id="gz-engelliler"><div class="dsc-durum">Yükleniyor...</div></div>';

  el.innerHTML = html;
  _gzIstekleriCiz();
  _gzEngellileriCiz();
}

function gzGizlilikToggle(){
  var p = getYerelProfil();
  var yeni = !(p.gizli === true);

  gizlilikDegistir(yeni).then(function(){
    showToast(yeni ? '🔒 Hesabın artık gizli.' : 'Hesabın herkese açık.');
    _gzCiz();
    if(typeof renderProfil === 'function') renderProfil();
  }).catch(function(e){ showToast('❌ ' + e.message,'error'); });
}

function _gzIstekleriCiz(){
  var el = document.getElementById('gz-istekler');
  if(!el) return;

  bekleyenIstekleriGetir().then(function(istekler){
    if(!istekler.length){
      el.innerHTML = '<div class="dsc-durum" style="padding:18px">Bekleyen istek yok.</div>';
      return;
    }
    return Promise.all(istekler.map(function(i){
      return profilGetir(i.isteyen).catch(function(){ return {uid:i.isteyen, nickname:'kullanıcı'}; });
    })).then(function(profiller){
      el.innerHTML = profiller.map(function(p){
        var bas = (p.isim || p.nickname || '?').charAt(0).toUpperCase();
        var av = p.avatar ? '<img src="' + p.avatar + '" alt="">' : '<span>' + bas + '</span>';
        return '<div class="gz-istek">' +
                 '<div class="dsc-av">' + av + '</div>' +
                 '<div class="dsc-bilgi">' +
                   '<div class="dsc-nick">@' + (p.nickname||'') + '</div>' +
                   '<div class="dsc-isim">' + (p.isim||'') + '</div>' +
                 '</div>' +
                 '<div class="gz-istek-btnlar">' +
                   '<button class="gz-btn kabul" onclick="gzKabul(\'' + p.uid + '\')">Kabul</button>' +
                   '<button class="gz-btn" onclick="gzReddet(\'' + p.uid + '\')">Reddet</button>' +
                 '</div>' +
               '</div>';
      }).join('');
    });
  });
}

function gzKabul(uid){
  takipIstegiKabul(uid).then(function(){
    showToast('✅ İstek kabul edildi.');
    _gzIstekleriCiz();
  }).catch(function(e){ showToast('❌ ' + e.message,'error'); });
}

function gzReddet(uid){
  takipIstegiReddet(uid).then(function(){
    showToast('İstek reddedildi.');
    _gzIstekleriCiz();
  }).catch(function(e){ showToast('❌ ' + e.message,'error'); });
}

function _gzEngellileriCiz(){
  var el = document.getElementById('gz-engelliler');
  if(!el) return;

  engellenenleriGetir().then(function(uidler){
    if(!uidler.length){
      el.innerHTML = '<div class="dsc-durum" style="padding:18px">Engellenen hesap yok.</div>';
      return;
    }
    return Promise.all(uidler.map(function(u){
      return profilGetir(u).catch(function(){ return {uid:u, nickname:'kullanıcı'}; });
    })).then(function(profiller){
      el.innerHTML = profiller.map(function(p){
        var bas = (p.isim || p.nickname || '?').charAt(0).toUpperCase();
        var av = p.avatar ? '<img src="' + p.avatar + '" alt="">' : '<span>' + bas + '</span>';
        return '<div class="gz-istek">' +
                 '<div class="dsc-av">' + av + '</div>' +
                 '<div class="dsc-bilgi">' +
                   '<div class="dsc-nick">@' + (p.nickname||'') + '</div>' +
                 '</div>' +
                 '<button class="gz-btn" onclick="gzEngelKaldir(\'' + p.uid + '\')">Kaldır</button>' +
               '</div>';
      }).join('');
    });
  });
}

function gzEngelKaldir(uid){
  engeliKaldir(uid).then(function(){
    showToast('Engel kaldırıldı.');
    _gzEngellileriCiz();
  }).catch(function(e){ showToast('❌ ' + e.message,'error'); });
}
