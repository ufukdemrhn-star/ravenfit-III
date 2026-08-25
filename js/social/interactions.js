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

var YORUM_MAX = 400;         /* yorum karakter sınırı */
var YORUM_SAYFA = 3;         /* ilk açılışta gösterilen yorum sayısı */
var YANIT_SAYFA = 3;         /* ilk açılışta gösterilen yanıt sayısı */
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

/* Yorum ekler. ustYorum verilirse o yoruma YANIT olur.
   Yanıtlar aynı koleksiyonda tutulur; ustYorum alanı hiyerarşiyi
   kurar. Ayrı koleksiyon yerine bu yöntem seçildi çünkü tek
   okumayla tüm yorum ağacı gelir. */
function yorumEkle(postId, metin, ustYorum){
  return new Promise(function(cozumle, reddet){
    if(!_fbUser || !_fbDb) return reddet(new Error('Yorum için giriş yapmalısın.'));
    metin = String(metin || '').trim();
    if(!metin) return reddet(new Error('Yorum boş olamaz.'));
    if(metin.length > YORUM_MAX) return reddet(new Error('Yorum en fazla ' + YORUM_MAX + ' karakter.'));

    _fbDb.collection('posts').doc(postId).collection('comments').add({
      uid: _fbUser.uid,
      metin: metin,
      ustYorum: ustYorum || null,
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
/* Yorumu siler. Bir üst yorumsa YANITLARI da silinir —
   yoksa yanıtlar sahipsiz kalır ve hiç görünmez. */
function yorumSil(postId, yorumId){
  return new Promise(function(cozumle, reddet){
    if(!_fbUser || !_fbDb) return reddet(new Error('Giriş yapmalısın.'));
    var kol = _fbDb.collection('posts').doc(postId).collection('comments');

    kol.where('ustYorum','==',yorumId).limit(200).get()
      .then(function(snap){
        /* Yanıtları ve beğenilerini temizle */
        return Promise.all(snap.docs.map(function(d){
          return yorumBegenileriniSil(d.id).then(function(){ return d.ref.delete(); });
        }));
      })
      .catch(function(){})
      .then(function(){ return yorumBegenileriniSil(yorumId); })
      .then(function(){ return kol.doc(yorumId).delete(); })
      .then(cozumle)
      .catch(function(){ reddet(new Error('Yorum silinemedi.')); });
  });
}

/* Oturum değişince önbelleği temizle */
function etkilesimOnbellegiTemizle(){
  _begeniOnbellek = {};
  _yorumBegeniOnbellek = {};
}


/* ══════════════════════════════════════════════════════════
   YORUM BEĞENİSİ

   commentLikes/{yorumId}_{uid} → { yorumId, postId, uid, tarih }

   Gönderi beğenisiyle aynı desen: belge kimliği çift anahtardan
   oluşur, böylece aynı yorum iki kez beğenilemez ve durum tek
   okumayla öğrenilir.
   ══════════════════════════════════════════════════════════ */

var _yorumBegeniOnbellek = {};

function _yorumBegeniId(yorumId, uid){ return yorumId + '_' + uid; }

function yorumBegendimMi(yorumId){
  return new Promise(function(cozumle){
    if(!_fbUser || !_fbDb) return cozumle(false);
    if(_yorumBegeniOnbellek[yorumId] !== undefined){
      return cozumle(_yorumBegeniOnbellek[yorumId]);
    }
    _fbDb.collection('commentLikes').doc(_yorumBegeniId(yorumId, _fbUser.uid)).get()
      .then(function(d){
        _yorumBegeniOnbellek[yorumId] = d.exists;
        cozumle(d.exists);
      })
      .catch(function(){ cozumle(false); });
  });
}

function yorumBegeniDegistir(yorumId, postId){
  return new Promise(function(cozumle, reddet){
    if(!_fbUser || !_fbDb) return reddet(new Error('Beğenmek için giriş yapmalısın.'));
    yorumBegendimMi(yorumId).then(function(begendi){
      var ref = _fbDb.collection('commentLikes').doc(_yorumBegeniId(yorumId, _fbUser.uid));
      if(begendi){
        ref.delete()
          .then(function(){ _yorumBegeniOnbellek[yorumId] = false; cozumle(false); })
          .catch(function(){ reddet(new Error('Beğeni kaldırılamadı.')); });
      } else {
        ref.set({
          yorumId: yorumId, postId: postId, uid: _fbUser.uid,
          tarih: firebase.firestore.FieldValue.serverTimestamp()
        })
          .then(function(){ _yorumBegeniOnbellek[yorumId] = true; cozumle(true); })
          .catch(function(){ reddet(new Error('Beğenilemedi.')); });
      }
    });
  });
}

/* Bir gönderideki TÜM yorum beğenilerini tek sorguda getirir.
   Yorum başına ayrı sorgu atmak yerine böyle yapılır — 20 yorumlu
   bir gönderide 20 sorgu yerine 1 sorgu olur. */
function yorumBegenileriGetir(postId){
  return new Promise(function(cozumle){
    if(!_fbDb) return cozumle({});
    _fbDb.collection('commentLikes').where('postId','==',postId).limit(500).get()
      .then(function(snap){
        var sayim = {};
        snap.forEach(function(d){
          var v = d.data();
          sayim[v.yorumId] = (sayim[v.yorumId] || 0) + 1;
          /* Kendi beğenimizi önbelleğe al */
          if(_fbUser && v.uid === _fbUser.uid) _yorumBegeniOnbellek[v.yorumId] = true;
        });
        cozumle(sayim);
      })
      .catch(function(){ cozumle({}); });
  });
}

/* Yorum silinince beğenileri de temizlenmeli — yetim kayıt kalmasın */
function yorumBegenileriniSil(yorumId){
  if(!_fbDb) return Promise.resolve();
  return _fbDb.collection('commentLikes').where('yorumId','==',yorumId).limit(500).get()
    .then(function(snap){
      return Promise.all(snap.docs.map(function(d){ return d.ref.delete(); }));
    })
    .catch(function(){});
}
