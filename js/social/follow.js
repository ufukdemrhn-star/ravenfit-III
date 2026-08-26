/* ══════════════════════════════════════════════════════════
   RavenFit — follow.js
   Takip sistemi

   VERİ YAPISI
   ──────────────────────────────────────────────────────────
   follows/{takipEden}_{takipEdilen} → { takipEden, takipEdilen, tarih }

   Belge kimliği iki uid'den oluşur. Bu sayede:
     • Aynı kişi iki kez takip edilemez (aynı kimlik)
     • Takip durumu tek okumayla öğrenilir (sorgu gerekmez)
     • Takip bırakma tek silme işlemidir

   Sayaçlar profiles belgesinde tutulur — her seferinde
   saymak yerine artırılıp azaltılır.
   ══════════════════════════════════════════════════════════ */

var _takipOnbellek = {};   /* uid → true/false */

function _takipId(edenUid, edilenUid){
  return edenUid + '_' + edilenUid;
}

/* Bu kişiyi takip ediyor muyum? */
function takipEdiyorMuyum(hedefUid){
  return new Promise(function(cozumle){
    if(!_fbUser || !_fbDb) return cozumle(false);
    if(_takipOnbellek[hedefUid] !== undefined){
      return cozumle(_takipOnbellek[hedefUid]);
    }
    _fbDb.collection('follows').doc(_takipId(_fbUser.uid, hedefUid)).get()
      .then(function(doc){
        _takipOnbellek[hedefUid] = doc.exists;
        cozumle(doc.exists);
      })
      .catch(function(){ cozumle(false); });
  });
}

/* Takip et / bırak — mevcut duruma göre tersine çevirir */
function takipDegistir(hedefUid){
  return new Promise(function(cozumle, reddet){
    if(!_fbUser || !_fbDb){
      return reddet(new Error('Takip için giriş yapmalısın.'));
    }
    if(hedefUid === _fbUser.uid){
      return reddet(new Error('Kendini takip edemezsin.'));
    }

    takipEdiyorMuyum(hedefUid).then(function(ediyor){
      var ref = _fbDb.collection('follows').doc(_takipId(_fbUser.uid, hedefUid));

      if(ediyor){
        /* Takibi bırak */
        ref.delete()
          .then(function(){
            _takipOnbellek[hedefUid] = false;
            cozumle(false);
          })
          .catch(function(e){ reddet(new Error('Takip bırakılamadı.')); });
      } else {
        /* Takip et */
        ref.set({
          takipEden: _fbUser.uid,
          takipEdilen: hedefUid,
          tarih: firebase.firestore.FieldValue.serverTimestamp()
        })
          .then(function(){
            _takipOnbellek[hedefUid] = true;
            cozumle(true);
          })
          .catch(function(e){ reddet(new Error('Takip edilemedi.')); });
      }
    });
  });
}

/* ──────────────────────────────────────────────────────────
   SAYAÇLAR — YAZILMAZ, SAYILIR

   Önceki sürüm takipçi sayısını profiles/{hedefUid} belgesine
   yazmaya çalışıyordu. Ama güvenlik kuralı gereği bir kullanıcı
   BAŞKASININ profil belgesine yazamaz — işlem sessizce reddediliyor,
   sayaç hiç artmıyordu.

   Çözüm: sayaçları saklamak yerine follows koleksiyonundan
   saymak. Firestore'un count() toplaması bunun için tasarlanmıştır;
   belge okumaz, yalnızca sayar — ucuzdur.
   ────────────────────────────────────────────────────────── */

/* Bu kişiyi kaç kişi takip ediyor? */
function takipciSay(uid){
  return _follows_say('takipEdilen', uid);
}

/* Bu kişi kaç kişiyi takip ediyor? */
function takipSay(uid){
  return _follows_say('takipEden', uid);
}

function _follows_say(alan, uid){
  return new Promise(function(cozumle){
    if(!_fbDb) return cozumle(0);
    var sorgu = _fbDb.collection('follows').where(alan, '==', uid);
    /* count() destekleniyorsa kullan — çok daha ucuz */
    if(typeof sorgu.count === 'function'){
      sorgu.count().get()
        .then(function(snap){ cozumle(snap.data().count || 0); })
        .catch(function(){ _follows_sayYedek(sorgu, cozumle); });
    } else {
      _follows_sayYedek(sorgu, cozumle);
    }
  });
}

/* count() yoksa belgeleri çekip say */
function _follows_sayYedek(sorgu, cozumle){
  sorgu.limit(500).get()
    .then(function(snap){ cozumle(snap.size !== undefined ? snap.size : (snap.docs||[]).length); })
    .catch(function(){ cozumle(0); });
}

/* Takipçi listesi — beni takip edenler */
function takipcileriGetir(uid, limit){
  return new Promise(function(cozumle){
    if(!_fbDb) return cozumle([]);
    _fbDb.collection('follows')
      .where('takipEdilen','==',uid).limit(limit||50).get()
      .then(function(snap){
        var uidler = [];
        snap.forEach(function(d){ uidler.push(d.data().takipEden); });
        cozumle(uidler);
      })
      .catch(function(){ cozumle([]); });
  });
}

/* Takip listesi — benim takip ettiklerim */
function takipEdilenleriGetir(uid, limit){
  return new Promise(function(cozumle){
    if(!_fbDb) return cozumle([]);
    _fbDb.collection('follows')
      .where('takipEden','==',uid).limit(limit||50).get()
      .then(function(snap){
        var uidler = [];
        snap.forEach(function(d){ uidler.push(d.data().takipEdilen); });
        cozumle(uidler);
      })
      .catch(function(){ cozumle([]); });
  });
}

/* Birden fazla profili tek seferde getir */
function profilleriGetir(uidler){
  return Promise.all(uidler.map(function(uid){
    return profilGetir(uid).catch(function(){ return null; });
  })).then(function(liste){
    return liste.filter(Boolean);
  });
}


/* ──────────────────────────────────────────────────────────
   ÖNBELLEK TEMİZLİĞİ

   Takip durumu ve profiller bellekte tutulur. Kullanıcı çıkış
   yapıp başka hesapla girerse bu veriler önceki oturumdan
   sızar: "zaten takip ediyorsun" gibi yanlış durumlar oluşur.
   Çıkışta mutlaka temizlenmeli.
   ────────────────────────────────────────────────────────── */
function sosyalOnbellegiTemizle(){
  _takipOnbellek = {};
  if(typeof _profilOnbellek !== 'undefined'){
    for(var k in _profilOnbellek) delete _profilOnbellek[k];
  }
  if(typeof _upProfil !== 'undefined') _upProfil = null;
  if(typeof _upUid !== 'undefined') _upUid = null;
  if(typeof _kesfetSorgu !== 'undefined') _kesfetSorgu = '';
  if(typeof etkilesimOnbellegiTemizle === 'function') etkilesimOnbellegiTemizle();
  if(typeof gizlilikOnbellegiTemizle === 'function') gizlilikOnbellegiTemizle();
}
