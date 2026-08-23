/* ══════════════════════════════════════════════════════════
   RavenFit — avatar.js
   Profil fotoğrafı
   ══════════════════════════════════════════════════════════ */

/* ── AVATAR ─────────────────────────────────────────────── */

function triggerAvatarUpload(){
  document.getElementById('avatar-file-input').click();
}

function handleAvatarUpload(inp){
  var file=inp.files[0];if(!file)return;
  if(file.size>2*1024*1024){showToast('❌ Fotoğraf 2MB\'dan küçük olmalı.');return;}
  var reader=new FileReader();
  reader.onload=function(e){
    var b64=e.target.result;
    setAvatar(b64);
    /* Firebase Storage yerine Firestore'da base64 saklıyoruz */
    if(_fbUser&&_fbDb){
      _fbDb.collection('users').doc(_fbUser.uid).set({avatar:b64},{merge:true})
        .catch(function(e){
          console.warn('Avatar buluta yüklenemedi:', e && e.message);
          showToast('⚠️ Fotoğraf cihaza kaydedildi ama buluta yüklenemedi.','warn');
        });
    }
    showToast('✅ Profil fotoğrafı güncellendi!');
  };
  reader.readAsDataURL(file);
}

function setAvatar(b64OrNull){
  var img=document.getElementById('avatar-img');
  var ini=document.getElementById('avatar-initials');
  if(b64OrNull){
    if(img){img.src=b64OrNull;img.style.display='block';}
    if(ini)ini.style.display='none';
  } else {
    if(img){img.src='';img.style.display='none';}
    if(ini)ini.style.display='';
  }
}

function setAvatarInitials(nick){
  var ini=document.getElementById('avatar-initials');
  if(!ini)return;
  var letters=(nick||'?').slice(0,2).toUpperCase();
  ini.textContent=letters;
}
