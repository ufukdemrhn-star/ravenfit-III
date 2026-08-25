/* ══════════════════════════════════════════════════════════
   RavenFit — interactions.js
   Beğeni ve yorum

   VERİ YAPISI
   ──────────────────────────────────────────────────────────
   likes/{postId}_{uid}          → { postId, uid, tarih }
   posts/{postId}/comments/{id}  → { uid, metin, tarih }

   Beğeni belgesinin kimliği iki kimlikten oluşur:
     • Aynı gönderi iki kez beğenilemez
     • Beğeni durumu tek okumayla öğrenilir
     • Beğeniyi geri alma tek silme işlemidir

   Sayaçlar SAKLANMAZ, SAYILIR. Sebep: gönderi belgesine
   yalnızca sahibi yazabilir; başkası beğendiğinde sayacı
   artıramaz. Takip sisteminde de aynı yaklaşım kullanıldı.
   ══════════════════════════════════════════════════════════ */

var YORUM_MAX = 300;
var _begeniOnbellek = {};   /* postId → true/false */

function _begeniId(postId, uid){ return postId + '_' + uid; }

/* ── Beğeni ──────────────────────────────────────────────── */

function begendimMi(postId){
  return new Promise(function(cozumle){
    if(!_fbUser || !_fbDb) return cozumle(false);
    if(_begeniOnbellek[postId] !== undefined) return cozumle(_begeniOnbellek[postId]);
    _fbDb.collection('likes').doc(_begeniId(postId, _fbUser.uid)).get()
      .then(function(d){
        _begeniOnbellek[postId] = d.exists;
        cozumle(d.exists);
      })
      .catch(function(){ cozumle(false); });
  });
}

function begeniDegistir(postId){
  return new Promise(function(cozumle, reddet){
    if(!_fbUser || !_fbDb) return reddet(new Error('Beğenmek için giriş yapmalısın.'));

    begendimMi(postId).then(function(begendi){
      var ref = _fbDb.collection('likes').doc(_begeniId(postId, _fbUser.uid));
      if(begendi){
        ref.delete()
          .then(function(){ _begeniOnbellek[postId] = false; cozumle(false); })
          .catch(function(){ reddet(new Error('Beğeni kaldırılamadı.')); });
      } else {
        ref.set({
          postId: postId,
          uid: _fbUser.uid,
          tarih: firebase.firestore.FieldValue.serverTimestamp()
        })
          .then(function(){ _begeniOnbellek[postId] = true; cozumle(true); })
          .catch(function(){ reddet(new Error('Beğenilemedi.')); });
      }
    });
  });
}

function begeniSay(postId){
  return new Promise(function(cozumle){
    if(!_fbDb) return cozumle(0);
    var sorgu = _fbDb.collection('likes').where('postId','==',postId);
    if(typeof sorgu.count === 'function'){
      sorgu.count().get()
        .then(function(s){ cozumle(s.data().count || 0); })
        .catch(function(){ _begeniSayYedek(sorgu, cozumle); });
    } else {
      _begeniSayYedek(sorgu, cozumle);
    }
  });
}

function _begeniSayYedek(sorgu, cozumle){
  sorgu.limit(500).get()
    .then(function(s){ cozumle(s.size !== undefined ? s.size : (s.docs||[]).length); })
    .catch(function(){ cozumle(0); });
}

/* Beğenenlerin listesi */
function begenenleriGetir(postId, limit){
  return new Promise(function(cozumle){
    if(!_fbDb) return cozumle([]);
    _fbDb.collection('likes').where('postId','==',postId).limit(limit||50).get()
      .then(function(snap){
        var uidler = [];
        snap.forEach(function(d){ uidler.push(d.data().uid); });
        cozumle(uidler);
      })
      .catch(function(){ cozumle([]); });
  });
}

/* ── Yorum ───────────────────────────────────────────────── */

function yorumEkle(postId, metin){
  return new Promise(function(cozumle, reddet){
    if(!_fbUser || !_fbDb) return reddet(new Error('Yorum için giriş yapmalısın.'));
    metin = String(metin || '').trim();
    if(!metin) return reddet(new Error('Yorum boş olamaz.'));
    if(metin.length > YORUM_MAX) return reddet(new Error('Yorum en fazla ' + YORUM_MAX + ' karakter.'));

    _fbDb.collection('posts').doc(postId).collection('comments').add({
      uid: _fbUser.uid,
      metin: metin,
      tarih: firebase.firestore.FieldValue.serverTimestamp()
    })
      .then(function(ref){ cozumle(ref.id); })
      .catch(function(e){ reddet(new Error('Yorum eklenemedi.')); });
  });
}

function yorumlariGetir(postId, limit){
  return new Promise(function(cozumle){
    if(!_fbDb) return cozumle([]);
    _fbDb.collection('posts').doc(postId).collection('comments')
      .limit(limit || 100).get()
      .then(function(snap){
        var liste = [];
        snap.forEach(function(d){
          var y = d.data(); y.id = d.id;
          liste.push(y);
        });
        /* Eskiden yeniye — sohbet akışı gibi */
        liste.sort(function(a,b){
          var ta = a.tarih && a.tarih.seconds ? a.tarih.seconds : 0;
          var tb = b.tarih && b.tarih.seconds ? b.tarih.seconds : 0;
          return ta - tb;
        });
        cozumle(liste);
      })
      .catch(function(e){
        console.warn('Yorumlar okunamadı:', e && e.message);
        cozumle([]);
      });
  });
}

function yorumSay(postId){
  return new Promise(function(cozumle){
    if(!_fbDb) return cozumle(0);
    var sorgu = _fbDb.collection('posts').doc(postId).collection('comments');
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

/* Yorum silme — yorum sahibi veya gönderi sahibi silebilir */
function yorumSil(postId, yorumId){
  return new Promise(function(cozumle, reddet){
    if(!_fbUser || !_fbDb) return reddet(new Error('Giriş yapmalısın.'));
    _fbDb.collection('posts').doc(postId).collection('comments').doc(yorumId).delete()
      .then(cozumle)
      .catch(function(){ reddet(new Error('Yorum silinemedi.')); });
  });
}

/* Oturum değişince önbelleği temizle */
function etkilesimOnbellegiTemizle(){
  _begeniOnbellek = {};
}
