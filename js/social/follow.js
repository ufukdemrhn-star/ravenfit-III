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
            _sayacDegistir(hedefUid, 'takipci', -1);
            _sayacDegistir(_fbUser.uid, 'takip', -1);
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
            _sayacDegistir(hedefUid, 'takipci', +1);
            _sayacDegistir(_fbUser.uid, 'takip', +1);
            cozumle(true);
          })
          .catch(function(e){ reddet(new Error('Takip edilemedi.')); });
      }
    });
  });
}

/* Sayacı artır/azalt.
   Not: Firestore increment atomiktir — iki cihazdan aynı anda
   takip edilse bile sayaç şaşmaz. */
function _sayacDegistir(uid, alan, miktar){
  if(!_fbDb) return;
  var guncelleme = {};
  guncelleme[alan] = firebase.firestore.FieldValue.increment(miktar);
  _fbDb.collection('profiles').doc(uid).set(guncelleme, {merge:true})
    .then(function(){
      /* Önbelleği de güncelle ki ekran hemen doğru göstersin */
      if(_profilOnbellek && _profilOnbellek[uid]){
        _profilOnbellek[uid][alan] = Math.max(0, (_profilOnbellek[uid][alan]||0) + miktar);
      }
    })
    .catch(function(e){ console.warn('Sayaç güncellenemedi:', e && e.message); });
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
