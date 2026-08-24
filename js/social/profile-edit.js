/* ══════════════════════════════════════════════════════════
   RavenFit — profile-edit.js
   Profil düzenleme (isim, kullanıcı adı, biyografi)
   ══════════════════════════════════════════════════════════ */

var PE_BIO_SINIR = 160;
var PE_ISIM_SINIR = 30;

function openProfileEdit(){
  var p = getYerelProfil();
  var nick = p.nickname || _lsGet('nickname') || '';

  var govde = document.getElementById('pe-body');
  if(!govde) return;

  govde.innerHTML =
    '<div class="fg" style="margin-bottom:14px">' +
      '<label class="fl">Kullanıcı Adı</label>' +
      '<div class="iw">' +
        '<span class="iu" style="left:12px;right:auto;color:var(--text3)">@</span>' +
        '<input class="fi" id="pe-nick" type="text" maxlength="24" ' +
          'style="padding-left:28px" value="' + _kacir(nick) + '" ' +
          'oninput="peNickKontrol()" autocomplete="off" autocapitalize="none">' +
      '</div>' +
      '<div class="pe-yardim" id="pe-nick-yardim">Harf, rakam, alt çizgi ve nokta kullanabilirsin.</div>' +
    '</div>' +

    '<div class="fg" style="margin-bottom:14px">' +
      '<label class="fl">İsim</label>' +
      '<input class="fi" id="pe-isim" type="text" maxlength="' + PE_ISIM_SINIR + '" ' +
        'value="' + _kacir(p.isim || (typeof U !== 'undefined' ? (U.name||'') : '')) + '" ' +
        'placeholder="Görünen adın">' +
    '</div>' +

    '<div class="fg">' +
      '<label class="fl">Biyografi</label>' +
      '<textarea class="fi pe-bio-alan" id="pe-bio" maxlength="' + PE_BIO_SINIR + '" ' +
        'rows="4" placeholder="Kendini kısaca anlat..." ' +
        'oninput="peBioSay()">' + _kacir(p.bio || '') + '</textarea>' +
      '<div class="pe-sayac" id="pe-bio-sayac">0 / ' + PE_BIO_SINIR + '</div>' +
    '</div>';

  var ov = document.getElementById('profile-edit-overlay');
  if(ov){ ov.classList.add('active'); document.body.style.overflow = 'hidden'; }
  peBioSay();
}

function closeProfileEdit(){
  var ov = document.getElementById('profile-edit-overlay');
  if(ov) ov.classList.remove('active');
  document.body.style.overflow = '';
}

function _kacir(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function peBioSay(){
  var t = document.getElementById('pe-bio');
  var s = document.getElementById('pe-bio-sayac');
  if(t && s) s.textContent = t.value.length + ' / ' + PE_BIO_SINIR;
}

/* Kullanıcı adı kuralları — anlık geri bildirim */
function peNickKontrol(){
  var inp = document.getElementById('pe-nick');
  var yrd = document.getElementById('pe-nick-yardim');
  if(!inp || !yrd) return true;

  var v = inp.value.trim().toLowerCase();
  inp.value = v;

  if(v.length === 0){
    yrd.textContent = 'Kullanıcı adı boş olamaz.';
    yrd.className = 'pe-yardim hata'; return false;
  }
  if(v.length < 3){
    yrd.textContent = 'En az 3 karakter olmalı.';
    yrd.className = 'pe-yardim hata'; return false;
  }
  if(!/^[a-z0-9._]+$/.test(v)){
    yrd.textContent = 'Sadece harf, rakam, nokta ve alt çizgi kullanılabilir.';
    yrd.className = 'pe-yardim hata'; return false;
  }
  if(/^[._]|[._]$/.test(v)){
    yrd.textContent = 'Nokta veya alt çizgiyle başlayıp bitemez.';
    yrd.className = 'pe-yardim hata'; return false;
  }
  yrd.textContent = 'Kullanılabilir görünüyor.';
  yrd.className = 'pe-yardim tamam';
  return true;
}

function saveProfileEdit(){
  if(!peNickKontrol()){
    showToast('❌ Kullanıcı adını düzelt.','error');
    return;
  }
  var p = getYerelProfil();
  p.nickname = document.getElementById('pe-nick').value.trim().toLowerCase();
  p.isim     = document.getElementById('pe-isim').value.trim();
  p.bio      = document.getElementById('pe-bio').value.trim();
  saveYerelProfil(p);

  /* İsim U'ya da yazılır — uygulamanın diğer yerleri oradan okuyor */
  if(typeof U !== 'undefined' && p.isim){ U.name = p.isim; }
  if(typeof saveData === 'function') saveData();

  closeProfileEdit();
  showToast('✅ Profilin güncellendi.');
  renderProfil();
}
