/* ══════════════════════════════════════════════════════════
   RavenFit — avatar.js
   Profil fotoğrafı
   ══════════════════════════════════════════════════════════ */

/* ── AVATAR ─────────────────────────────────────────────── */

function triggerAvatarUpload(){
  document.getElementById('avatar-file-input').click();
}

/* HTML'den onchange="handleAvatarUpload(event)" ile çağrılır.
   Parametre bir Event nesnesidir, input değil — dosyalara
   event.target.files üzerinden erişilir. Önceki sürüm inp.files
   okuyordu ve undefined dönüyordu; fotoğraf hiç seçilemiyordu. */
function handleAvatarUpload(olay){
  var inp = (olay && olay.target) ? olay.target : olay;
  if(!inp || !inp.files) return;
  var file=inp.files[0];if(!file)return;
  if(file.size>2*1024*1024){showToast('❌ Fotoğraf 2MB\'dan küçük olmalı.');return;}
  /* Avatar SIKIŞTIRILIR.
     İki sebep:
       1. Firestore belge sınırı 1 MB. Ham 2 MB'lık bir fotoğraf
          base64'te ~2.7 MB olur ve profiles belgesinin TAMAMININ
          yazılması sessizce başarısız olur — bu yüzden karşı taraf
          profil fotoğrafını göremiyordu.
       2. Her profil görüntülemede indirileceği için küçük olmalı.
     400px / %80 kalite ≈ 50 KB. */
  gorselSikistir(file, 'avatar').then(function(sonuc){
    var b64 = sonuc.veri;
    setAvatar(b64);
    /* Firebase Storage yerine Firestore'da base64 saklıyoruz */
    if(_fbUser&&_fbDb){
      _fbDb.collection('users').doc(_fbUser.uid).set({avatar:b64},{merge:true})
        .catch(function(e){
          console.warn('Avatar buluta yüklenemedi:', e && e.message);
          showToast('⚠️ Fotoğraf cihaza kaydedildi ama buluta yüklenemedi.','warn');
        });
    }
    if(typeof yayinlaProfil === 'function') yayinlaProfil();
    showToast('✅ Profil fotoğrafı güncellendi!');
  }).catch(function(err){
    showToast('❌ ' + (err && err.message || 'Fotoğraf işlenemedi.'), 'error');
  });
  /* Aynı dosya tekrar seçilebilsin diye input sıfırlanır */
  try { inp.value = ''; } catch(e){}
}

function setAvatar(b64OrNull){
  var img=document.getElementById('avatar-img');
  var ini=document.getElementById('avatar-initials');
  if(b64OrNull){
    if(img){img.src=b64OrNull;img.style.display='block';}
    if(ini)ini.style.display='none';
    /* YEREL KAYIT — açık profile yazılabilmesi için gerekli.
       Önceki sürüm avatarı yalnızca ekrana basıyordu; localStorage'a
       hiç yazmadığı için profiles belgesine boş gidiyordu ve
       başkaları profil fotoğrafını göremiyordu. */
    _lsSet('avatar', b64OrNull);
  } else {
    if(img){img.src='';img.style.display='none';}
    if(ini)ini.style.display='';
    _lsRemove('avatar');
  }
}

function setAvatarInitials(nick){
  var ini=document.getElementById('avatar-initials');
  if(!ini)return;
  var letters=(nick||'?').slice(0,2).toUpperCase();
  ini.textContent=letters;
}


/* ══════════════════════════════════════════════════════════
   ESKİ AVATAR ONARIMI

   Sıkıştırma eklenmeden önce yüklenen avatarlar 2 MB'a kadar
   olabiliyor. Bu boyut Firestore belge sınırını aştığı için
   açık profile yazılamıyor ve başkaları fotoğrafı göremiyor.

   Girişte bir kez çalışır: avatar fazla büyükse küçültülüp
   yeniden kaydedilir. Kullanıcı hiçbir şey yapmaz.
   ══════════════════════════════════════════════════════════ */
function avatarOnar(){
  var mevcut = _lsGet('avatar');
  if(!mevcut || mevcut.length <= 400 * 1024) return;   /* sorun yok */

  try {
    var img = new Image();
    img.onload = function(){
      var hedef = 400;
      var olcek = Math.min(1, hedef / Math.max(img.width, img.height));
      var tuval = document.createElement('canvas');
      tuval.width  = Math.round(img.width  * olcek);
      tuval.height = Math.round(img.height * olcek);
      var ctx = tuval.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, tuval.width, tuval.height);
      var kucuk = tuval.toDataURL('image/jpeg', 0.8);

      console.log('Avatar küçültüldü: ' +
        Math.round(mevcut.length/1024) + ' KB → ' + Math.round(kucuk.length/1024) + ' KB');

      setAvatar(kucuk);
      if(_fbUser && _fbDb){
        _fbDb.collection('users').doc(_fbUser.uid)
          .set({avatar:kucuk},{merge:true}).catch(function(){});
      }
      if(typeof yayinlaProfil === 'function') yayinlaProfil();
    };
    img.src = mevcut;
  } catch(e){ console.warn('Avatar onarılamadı:', e && e.message); }
}
