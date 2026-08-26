/* ══════════════════════════════════════════════════════════
   RavenFit — profile-sync.js
   Açık profili Firestore'a yayınlar

   GİZLİLİK İLKESİ
   ──────────────────────────────────────────────────────────
   profiles/{uid} belgesine YALNIZCA kullanıcının paylaşmayı
   seçtiği veriler yazılır. Kapalı bir değer buraya hiç girmez —
   yani başkası veritabanına erişse bile göremez.

   Sağlık verisi (tüm ölçüm geçmişi, özel durumlar, diyet)
   users/{uid} içinde kalır ve yalnızca sahibi okuyabilir.
   ══════════════════════════════════════════════════════════ */

var _profilYayinTimer = null;

/* Açık profili yayınlar. Sık çağrılabilir — 1 saniye geciktirilir. */
function yayinlaProfil(){
  clearTimeout(_profilYayinTimer);
  _profilYayinTimer = setTimeout(_profilYayinla, 1000);
}

function _profilYayinla(){
  if(!_fbUser || !_fbDb) return;
  if(typeof _isGuest !== 'undefined' && _isGuest) return;   /* misafir yayınlamaz */

  try {
    var p = profilNesnesiUret();
    var nick = (p.nickname || _lsGet('nickname') || '').toLowerCase();
    if(!nick) return;   /* kullanıcı adı yoksa profil aranamaz */

    /* Arama için önek dizisi.
       Firestore'da "içinde geçen" araması yok; önek araması
       array-contains ile yapılır. "ttt2" için:
       ['t','tt','ttt','ttt2'] */
    var onekler = [];
    for(var i = 1; i <= Math.min(nick.length, 20); i++){
      onekler.push(nick.slice(0, i));
    }
    /* İsimden de arama yapılabilsin */
    var isim = (p.isim || '').toLowerCase().trim();
    if(isim){
      isim.split(/\s+/).forEach(function(kelime){
        for(var j = 1; j <= Math.min(kelime.length, 12); j++){
          var on = kelime.slice(0, j);
          if(onekler.indexOf(on) < 0) onekler.push(on);
        }
      });
    }

    /* Avatar boyut koruması.
       Firestore belge sınırı 1 MB. Eski sürümlerden kalan büyük
       avatarlar (sıkıştırma öncesi) belgenin TAMAMINI yazılamaz
       hâle getirir — profil sessizce güncellenmez. Bu yüzden
       aşırı büyük avatar profile yazılmaz. */
    var avatar = p.avatar || '';
    if(avatar.length > 400 * 1024){
      console.warn('Avatar çok büyük (' + Math.round(avatar.length/1024) +
                   ' KB), profile yazılmadı. Fotoğrafı yeniden yükle.');
      avatar = '';
    }

    var belge = {
      nickname:   nick,
      onekler:    onekler.slice(0, 60),      /* Firestore dizi sınırı için kırp */
      isim:       p.isim || '',
      bio:        p.bio || '',
      avatar:     avatar,
      branslar:   p.branslar || [],
      rozetler:   (typeof getRozetVitrini === 'function') ? getRozetVitrini() : [],
      istatistik: p.istatistik || {},        /* SADECE paylaşılanlar */
      vitrin:     p.vitrin || [],
      rol:        p.rol || 'uye',
      gizli:      p.gizli === true,
      onay:       p.onay || 'yok',
      takipci:    p.takipciSayisi || 0,
      takip:      p.takipSayisi || 0,
      gonderi:    p.gonderiSayisi || 0,
      guncelleme: firebase.firestore.FieldValue.serverTimestamp()
    };

    _fbDb.collection('profiles').doc(_fbUser.uid).set(belge, {merge:true})
      .then(function(){
        /* Kendi profilimiz değiştiyse önbellekten düşür */
        if(_profilOnbellek) delete _profilOnbellek[_fbUser.uid];
      })
      .catch(function(e){
        console.warn('Profil yayınlanamadı:', e && e.message);
        if(typeof showToast === 'function'){
          showToast('⚠️ Profil buluta gönderilemedi.','warn');
        }
      });
  } catch(e){
    console.warn('Profil hazırlanamadı:', e && e.message);
  }
}

/* ── Profil okuma ────────────────────────────────────────── */

var _profilOnbellek = {};   /* uid → profil, tekrar okumayı önler */

function profilGetir(uid, tazele){
  return new Promise(function(cozumle, reddet){
    if(!tazele && _profilOnbellek[uid]) return cozumle(_profilOnbellek[uid]);
    if(!_fbDb) return reddet(new Error('Bağlantı yok'));
    _fbDb.collection('profiles').doc(uid).get()
      .then(function(doc){
        if(!doc.exists) return reddet(new Error('Profil bulunamadı'));
        var d = doc.data();
        d.uid = uid;
        _profilOnbellek[uid] = d;
        cozumle(d);
      })
      .catch(reddet);
  });
}

/* Kullanıcı adından profil bulur */
function profilGetirNick(nick){
  return new Promise(function(cozumle, reddet){
    if(!_fbDb) return reddet(new Error('Bağlantı yok'));
    _fbDb.collection('profiles').where('nickname','==',nick.toLowerCase()).limit(1).get()
      .then(function(snap){
        if(snap.empty) return reddet(new Error('Kullanıcı bulunamadı'));
        var doc = snap.docs[0];
        var d = doc.data();
        d.uid = doc.id;
        _profilOnbellek[doc.id] = d;
        cozumle(d);
      })
      .catch(reddet);
  });
}

/* ── Arama: önek eşleşmesi ───────────────────────────────── */
function profilAra(sorgu, limit){
  sorgu = String(sorgu || '').toLowerCase().trim();
  limit = limit || 20;
  return new Promise(function(cozumle){
    if(!_fbDb || sorgu.length < 1) return cozumle([]);
    _fbDb.collection('profiles')
      .where('onekler','array-contains', sorgu)
      .limit(limit).get()
      .then(function(snap){
        var sonuc = [];
        snap.forEach(function(doc){
          if(_fbUser && doc.id === _fbUser.uid) return;   /* kendini listeleme */
          var d = doc.data(); d.uid = doc.id;
          _profilOnbellek[doc.id] = d;
          sonuc.push(d);
        });
        /* Kullanıcı adı tam başlayanlar önce gelsin */
        sonuc.sort(function(a,b){
          var aBas = (a.nickname||'').indexOf(sorgu) === 0 ? 0 : 1;
          var bBas = (b.nickname||'').indexOf(sorgu) === 0 ? 0 : 1;
          if(aBas !== bBas) return aBas - bBas;
          return (a.nickname||'').localeCompare(b.nickname||'');
        });
        cozumle(sonuc);
      })
      .catch(function(e){
        console.warn('Arama başarısız:', e && e.message);
        cozumle([]);
      });
  });
}

/* Son katılanlar — keşfet ekranı boşken gösterilir */
function sonKatilanlar(limit){
  return new Promise(function(cozumle){
    if(!_fbDb) return cozumle([]);
    _fbDb.collection('profiles')
      .orderBy('guncelleme','desc')
      .limit(limit || 12).get()
      .then(function(snap){
        var sonuc = [];
        snap.forEach(function(doc){
          if(_fbUser && doc.id === _fbUser.uid) return;
          var d = doc.data(); d.uid = doc.id;
          _profilOnbellek[doc.id] = d;
          sonuc.push(d);
        });
        cozumle(sonuc);
      })
      .catch(function(e){
        console.warn('Son katılanlar okunamadı:', e && e.message);
        cozumle([]);
      });
  });
}

/* ══════════════════════════════════════════════════════════
   ONAY DURUMU EŞİTLEMESİ

   Onay ve rol kararını YÖNETİCİ verir; kullanıcı kendi
   profilinde bu alanları değiştiremez. Bu yüzden tek doğru
   kaynak Firestore'daki profiles/{uid} belgesidir.

   Yerel kopya girişte oradan güncellenir. Bu olmadan yönetici
   onay verdiğinde kullanıcı hiçbir değişiklik görmez —
   rozet açılmaz, hizmet sekmesi kilitli kalır.
   ══════════════════════════════════════════════════════════ */
function _onayDurumunuEsitle(){
  if(!_fbUser || !_fbDb) return;

  _fbDb.collection('profiles').doc(_fbUser.uid).get()
    .then(function(doc){
      if(!doc.exists) return;
      var uzak = doc.data() || {};
      var yerel = getYerelProfil();

      var degisti = false;
      if(uzak.onay && uzak.onay !== yerel.onay){ yerel.onay = uzak.onay; degisti = true; }
      if(uzak.rol  && uzak.rol  !== yerel.rol ){ yerel.rol  = uzak.rol;  degisti = true; }

      if(!degisti) return;
      saveYerelProfil(yerel);

      /* Rozet kontrolü yeniden çalışsın — "Onaylı Koç" açılabilir */
      /* Rozet kontrolü — onay düştüyse 'Onaylı Koç' geri alınır,
         yükseldiyse verilir. checkAndAwardBadges ikisini de yapar. */
      if(typeof checkAndAwardBadges === 'function') checkAndAwardBadges();
      if(typeof renderProfil === 'function') renderProfil();
      if(typeof renderRozetVitrini === 'function') renderRozetVitrini();

      if(uzak.onay === 'onayli'){
        showToast('🎖️ Profesyonel hesabın onaylandı!');
      } else if(uzak.onay === 'red'){
        showToast('Başvurun onaylanmadı. Ayrıntılar için başvuru ekranına bak.','warn');
      }
    })
    .catch(function(e){ console.warn('Onay durumu okunamadı:', e && e.message); });
}
