/* ══════════════════════════════════════════════════════════
   RavenFit — profile-edit.js
   Profil düzenleme (isim, kullanıcı adı, biyografi)
   ══════════════════════════════════════════════════════════ */

/* Biyografi sınırları.

   Not: 30 karakterlik satır sınırı, uzun satırları OTOMATİK BÖLER.
   Yani "Inquiries: ufukdemrhn@gmail.com" (31 karakter) iki satıra
   iner ve 6 satırlık bütçeyi hızla tüketir. Gerçek kullanımda
   (emoji, e-posta, çok dilli metin) 6 satır yetmiyor.

   Instagram karşılaştırması: 150 karakter, satır sınırı yok.
   Biz görsel düzeni korumak için satır sınırı koyuyoruz ama
   bütçeyi gerçekçi tutuyoruz. */
var PE_BIO_SINIR      = 150;   /* toplam karakter */
var PE_BIO_SATIR      = 6;     /* en fazla satır */
var PE_BIO_SATIR_UZUN = 35;    /* satır başına karakter */
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
      '<div class="pe-yardim" id="pe-nick-yardim">Giriş yaparken bu adı kullanırsın. Değiştirirsen giriş adın da değişir.</div>' +
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
        'rows="7" placeholder="Kendini kısaca anlat..." ' +
        'oninput="peBioSay()">' + _kacir(p.bio || '') + '</textarea>' +
      '<div class="pe-sayac" id="pe-bio-sayac">0 / ' + PE_BIO_SINIR + '</div>' +
    '</div>';

  var ov = document.getElementById('profile-edit-overlay');
  if(ov){ ov.classList.add('active'); document.body.style.overflow = 'hidden'; }
  _bioSonGecerli = (getYerelProfil().bio || '');
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

/* ══════════════════════════════════════════════════════════
   BİYOGRAFİ SINIRLARI

   Kurallar (basit ve öngörülebilir):
     • Toplam en fazla 150 karakter
     • Satır başına en fazla 35 karakter — aşınca alt satıra iner
     • En fazla 6 satır
     • Boş satır serbest (bölüm ayırıcı olarak kullanılabilir)

   ÖNEMLİ TASARIM KARARI:
   Metin her tuş vuruşunda YENİDEN YAZILMAZ. Önceki sürüm bunu
   yapıyordu ve imleç zıplıyor, Enter çalışmıyor, boşluk
   koyulamıyordu. Bunun yerine sınırı AŞAN girdi ENGELLENİR:
   metin geçersizse bir önceki geçerli hâline dönülür.
   Kullanıcı yazarken hiçbir şey kendiliğinden değişmez.
   ══════════════════════════════════════════════════════════ */

/* Metnin sınırlara uyup uymadığını söyler. */
function _bioGecerliMi(metin){
  var m = String(metin || '');
  if(m.length > PE_BIO_SINIR) return false;
  var satirlar = m.split('\n');
  if(satirlar.length > PE_BIO_SATIR) return false;
  for(var i=0;i<satirlar.length;i++){
    if(satirlar[i].length > PE_BIO_SATIR_UZUN) return false;
  }
  return true;
}

/* Kaydederken uygulanan son temizlik.
   Sadece baştaki/sondaki boş satırları atar — içerikteki
   boş satırlara dokunmaz, kullanıcı onları bilerek koymuştur. */
function _bioTemizle(metin){
  var satirlar = String(metin || '').split('\n')
    .map(function(x){ return x.replace(/\s+$/,''); });
  while(satirlar.length && satirlar[0] === '') satirlar.shift();
  while(satirlar.length && satirlar[satirlar.length-1] === '') satirlar.pop();
  return satirlar.slice(0, PE_BIO_SATIR).join('\n').slice(0, PE_BIO_SINIR);
}

var _bioSonGecerli = '';   /* son geçerli metin — geri dönüş noktası */

function peBioSay(){
  var t = document.getElementById('pe-bio');
  var s = document.getElementById('pe-bio-sayac');
  if(!t) return;

  /* Satır 35 karakteri aştıysa, taşan kısmı alt satıra AKTAR.
     Bu tek istisna: kullanıcı yazmaya devam edebilsin diye
     otomatik alt satıra geçiş yapılır. Satır bütçesi doluysa
     bu da yapılmaz ve giriş engellenir. */
  var _s = t.value.split('\n');
  var _tasan = -1;
  for(var _i=0;_i<_s.length;_i++){
    if(_s[_i].length > PE_BIO_SATIR_UZUN){ _tasan = _i; break; }
  }
  if(_tasan >= 0 && _s.length < PE_BIO_SATIR && t.value.length <= PE_BIO_SINIR){
    var satir = _s[_tasan];
    /* Kelimeyi bölmemek için son boşluktan kes */
    var kes = satir.lastIndexOf(' ', PE_BIO_SATIR_UZUN);
    if(kes <= 0) kes = PE_BIO_SATIR_UZUN;
    var ust = satir.slice(0, kes).replace(/\s+$/,'');
    var alt = satir.slice(kes).replace(/^\s+/,'');
    _s.splice(_tasan, 1, ust, alt + (_s[_tasan+1] !== undefined ? '' : ''));
    var imlecOnce = t.selectionStart;
    t.value = _s.join('\n');
    /* İmleci taşan metnin sonuna taşı — yazmaya devam edebilsin */
    var yeniKonum = imlecOnce + 1;
    try { t.setSelectionRange(Math.min(yeniKonum, t.value.length),
                              Math.min(yeniKonum, t.value.length)); } catch(e){}
    _bioSonGecerli = t.value;
  }

  /* Sınır aşıldıysa son geçerli hâle dön — metni yeniden yazma */
  if(!_bioGecerliMi(t.value)){
    var imlec = t.selectionStart;
    t.value = _bioSonGecerli;
    var yeniImlec = Math.min(imlec, _bioSonGecerli.length);
    try { t.setSelectionRange(yeniImlec, yeniImlec); } catch(e){}
    /* Neden engellendiğini göster */
    if(s) s.classList.add('uyari');
    setTimeout(function(){ if(s) s.classList.remove('uyari'); }, 450);
  } else {
    _bioSonGecerli = t.value;
  }

  if(!s) return;
  var satirlar = t.value ? t.value.split('\n') : [];
  var enUzun = 0;
  satirlar.forEach(function(l){ if(l.length > enUzun) enUzun = l.length; });

  s.innerHTML =
    t.value.length + '/' + PE_BIO_SINIR + ' karakter' +
    ' &nbsp;·&nbsp; ' + satirlar.length + '/' + PE_BIO_SATIR + ' satır' +
    ' &nbsp;·&nbsp; satır ' + enUzun + '/' + PE_BIO_SATIR_UZUN;

  var dolu = t.value.length >= PE_BIO_SINIR ||
             satirlar.length >= PE_BIO_SATIR ||
             enUzun >= PE_BIO_SATIR_UZUN;
  s.className = dolu ? 'pe-sayac dolu' : 'pe-sayac';
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
  var yeniNick = document.getElementById('pe-nick').value.trim().toLowerCase();
  var eskiNick = (_lsGet('nickname') || '').toLowerCase();
  var p = getYerelProfil();

  var btn = document.getElementById('pe-kaydet');
  if(btn){ btn.disabled = true; btn.textContent = 'Kaydediliyor...'; }

  function _bitir(){
    p.nickname = yeniNick;
    p.isim = document.getElementById('pe-isim').value.trim();
    p.bio  = _bioTemizle(document.getElementById('pe-bio').value);
    saveYerelProfil(p);

    /* İsim U'ya da yazılır — uygulamanın diğer yerleri oradan okuyor */
    if(typeof U !== 'undefined' && p.isim){ U.name = p.isim; }
    if(typeof saveData === 'function') saveData();

    /* Hesabım bölümündeki kullanıcı adını da güncelle */
    var nickEl = document.getElementById('user-email-display');
    if(nickEl) nickEl.textContent = '@' + yeniNick;
    if(typeof setAvatarInitials === 'function') setAvatarInitials(yeniNick);

    if(typeof yayinlaProfil === 'function') yayinlaProfil();   /* açık profili güncelle */
    if(btn){ btn.disabled = false; btn.textContent = 'Kaydet'; }
    closeProfileEdit();
    showToast('✅ Profilin güncellendi.');
    renderProfil();
  }

  function _hata(mesaj){
    if(btn){ btn.disabled = false; btn.textContent = 'Kaydet'; }
    var yrd = document.getElementById('pe-nick-yardim');
    if(yrd){ yrd.textContent = mesaj; yrd.className = 'pe-yardim hata'; }
    showToast('❌ ' + mesaj, 'error');
  }

  /* Kullanıcı adı değişmediyse doğrudan kaydet */
  if(yeniNick === eskiNick){ return _bitir(); }

  /* Değişti — benzersizlik ve giriş bilgisi güncellenmeli */
  _nickBostaMi(yeniNick).then(function(bosta){
    if(!bosta){ return _hata('Bu kullanıcı adı zaten alınmış.'); }
    _nickDegistir(yeniNick)
      .then(_bitir)
      .catch(function(e){ _hata(e.message); });
  });
}

/* ══════════════════════════════════════════════════════════
   KULLANICI ADI DEĞİŞTİRME

   Giriş sistemi kullanıcı adından e-posta türetiyor:
     nickToEmail('raven') → 'raven@ravenfit.app'

   Bu yüzden kullanıcı adı değişince Firebase Auth e-postası da
   değişmeli — aksi halde kullanıcı yeni adıyla giriş yapamaz.

   Üç adım, sırayla ve her biri başarısız olabilir:
     1. Benzersizlik kontrolü (Firestore)
     2. Auth e-postası güncelleme (yakın zamanda giriş gerektirir)
     3. Firestore nickname alanı güncelleme
   ══════════════════════════════════════════════════════════ */
/* Kullanıcı adı başkasında var mı?
   nicknames koleksiyonu tek kaynaktır — belge varsa alınmıştır. */
function _nickBostaMi(nick){
  return new Promise(function(cozumle){
    if(!_fbDb || !_fbUser){ return cozumle(true); }   /* çevrimdışı — izin ver */
    _fbDb.collection('nicknames').doc(nick).get()
      .then(function(doc){
        if(!doc.exists) return cozumle(true);
        var d = doc.data() || {};
        cozumle(d.uid === _fbUser.uid);   /* kendi adımızsa serbest */
      })
      .catch(function(e){
        console.warn('Kullanıcı adı kontrolü başarısız:', e && e.message);
        cozumle(true);   /* kontrol edilemezse engelleme */
      });
  });
}

/* ──────────────────────────────────────────────────────────
   Kullanıcı adını değiştirir.

   NEDEN AUTH E-POSTASI DEĞİŞTİRİLMİYOR?
   Firebase artık updateEmail() çağrısını engelliyor:
     auth/operation-not-allowed
     "Please verify the new email before changing email"
   Bizim e-postalar sahte (@ravenfit.app) olduğu için doğrulama
   maili asla ulaşmaz — bu yol tamamen kapalı.

   ÇÖZÜM: Auth e-postası kayıt anındaki hâliyle sabit kalır.
   Ayrı bir eşleme koleksiyonu tutulur:

     nicknames/{kullaniciAdi} → { uid, email }

   Girişte kullanıcı adı bu koleksiyondan aranır, karşılığındaki
   e-posta ile oturum açılır. Kullanıcı adı değişince yalnızca
   eşleme belgesi taşınır — Auth'a hiç dokunulmaz.
   ────────────────────────────────────────────────────────── */
function _nickDegistir(yeniNick){
  return new Promise(function(cozumle, reddet){
    var eskiNick = (_lsGet('nickname') || '').toLowerCase();

    if(!_fbUser || !_fbDb){
      _lsSet('nickname', yeniNick);
      return cozumle({yerel:true});
    }

    var eslemeler = _fbDb.collection('nicknames');
    var girisMaili = _fbUser.email;   /* DEĞİŞMEZ */

    eslemeler.doc(yeniNick).set({
      uid: _fbUser.uid,
      email: girisMaili,
      guncelleme: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(function(){
      return _fbDb.collection('users').doc(_fbUser.uid)
        .set({nickname: yeniNick}, {merge:true});
    })
    .then(function(){
      /* Eski eşlemeyi sil — başkası alabilsin */
      if(eskiNick && eskiNick !== yeniNick){
        return eslemeler.doc(eskiNick).delete().catch(function(){});
      }
    })
    .then(function(){
      _lsSet('nickname', yeniNick);
      cozumle({});
    })
    .catch(function(e){
      var kod = e && e.code;
      if(kod === 'permission-denied'){
        reddet(new Error('Bu kullanıcı adı başkasına ait.'));
      } else {
        reddet(new Error('Kullanıcı adı değiştirilemedi: ' +
                         (e && e.message || 'bilinmeyen hata')));
      }
    });
  });
}
