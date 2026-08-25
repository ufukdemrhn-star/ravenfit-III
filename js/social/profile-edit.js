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
var PE_BIO_SINIR      = 150;   /* toplam karakter — Instagram ile aynı */
var PE_BIO_SATIR      = 8;     /* en fazla satır (bölünmeler dahil) */
var PE_BIO_SATIR_UZUN = 34;    /* satır başına karakter */
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

/* Biyografiyi sınırlar içinde tutar.
   Üç kural birlikte uygulanır:
     • en fazla 150 karakter
     • en fazla 6 satır
     • her satır en fazla 30 karakter (uzun satır otomatik bölünür)
   Ayrıca ardışık boş satırlar tekile indirilir — kullanıcı
   boşlukla profili şişiremesin. */
function _bioDuzelt(metin, yazarken){
  var satirlar = String(metin || '').split('\n');
  var cikti = [];
  for(var i=0;i<satirlar.length;i++){
    var st = satirlar[i].replace(/\s+$/,'');       /* satır sonu boşluklarını at */
    /* Uzun satırı kelime sınırından böl */
    while(st.length > PE_BIO_SATIR_UZUN){
      var kes = st.lastIndexOf(' ', PE_BIO_SATIR_UZUN);
      if(kes <= 0) kes = PE_BIO_SATIR_UZUN;        /* boşluk yoksa sert kes */
      cikti.push(st.slice(0, kes).replace(/\s+$/,''));
      st = st.slice(kes).replace(/^\s+/,'');
      if(cikti.length >= PE_BIO_SATIR) break;
    }
    if(cikti.length >= PE_BIO_SATIR) break;
    cikti.push(st);
  }

  /* Üç veya daha fazla ardışık boş satırı ikiye indir.
     Tek boş satır bölüm ayırıcı olarak meşrudur — kullanıcı
     paragraf arası boşluk bırakabilmeli. */
  var temiz = [];
  var ardisik = 0;
  for(var j=0;j<cikti.length;j++){
    if(cikti[j] === ''){
      ardisik++;
      if(ardisik > 1) continue;      /* ikiden fazlasını at */
    } else {
      ardisik = 0;
    }
    temiz.push(cikti[j]);
  }

  /* Baştaki boş satırlar her zaman atılır */
  while(temiz.length && temiz[0] === '') temiz.shift();

  /* Sondaki boş satırlar:
       yazarken → KORUNUR, yoksa Enter'a basınca imleç ilerlemiyor
       kaydederken → atılır */
  if(!yazarken){
    while(temiz.length && temiz[temiz.length-1] === '') temiz.pop();
  } else {
    /* Yazarken bile en fazla 1 boş satır sonda kalabilir */
    while(temiz.length > 1 &&
          temiz[temiz.length-1] === '' && temiz[temiz.length-2] === ''){
      temiz.pop();
    }
  }

  var sonuc = temiz.slice(0, PE_BIO_SATIR).join('\n');
  if(sonuc.length > PE_BIO_SINIR) sonuc = sonuc.slice(0, PE_BIO_SINIR);
  return sonuc;
}

function peBioSay(){
  var t = document.getElementById('pe-bio');
  var s = document.getElementById('pe-bio-sayac');
  if(!t || !s) return;

  var imlec = t.selectionStart;
  var duzeltilmis = _bioDuzelt(t.value, true);   /* yazarken */
  if(duzeltilmis !== t.value){
    t.value = duzeltilmis;
    try { t.setSelectionRange(Math.min(imlec, duzeltilmis.length),
                              Math.min(imlec, duzeltilmis.length)); } catch(e){}
  }

  var satir = t.value ? t.value.split('\n').length : 0;
  s.innerHTML = t.value.length + ' / ' + PE_BIO_SINIR + ' karakter' +
                ' &nbsp;·&nbsp; ' + satir + ' / ' + PE_BIO_SATIR + ' satır';
  s.className = (t.value.length >= PE_BIO_SINIR || satir >= PE_BIO_SATIR)
                ? 'pe-sayac dolu' : 'pe-sayac';
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
    p.bio  = _bioDuzelt(document.getElementById('pe-bio').value, false);  /* kaydederken */
    saveYerelProfil(p);

    /* İsim U'ya da yazılır — uygulamanın diğer yerleri oradan okuyor */
    if(typeof U !== 'undefined' && p.isim){ U.name = p.isim; }
    if(typeof saveData === 'function') saveData();

    /* Hesabım bölümündeki kullanıcı adını da güncelle */
    var nickEl = document.getElementById('user-email-display');
    if(nickEl) nickEl.textContent = '@' + yeniNick;
    if(typeof setAvatarInitials === 'function') setAvatarInitials(yeniNick);

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
