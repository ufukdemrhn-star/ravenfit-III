/* ══════════════════════════════════════════════════════════
   RavenFit — firebase.js
   Firebase kimlik doğrulama ve senkronizasyon
   ══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════
   🔥 FİREBASE ENTEGRASYONU
   ══════════════════════════════════════════════════════ */

/* NOT: _rfConfirmCb burada tekrar tanımlanmıştı ve yüklemede sıfırlıyordu.
   Artık yalnızca js/core/state.js içinde tanımlı. */
var _fbApp=null,_fbAuth=null,_fbDb=null,_fbUser=null,_fbSyncing=false;

/* Nickname → sahte email (Firebase email şartı için) */

function nickToEmail(nick){ return nick.toLowerCase().replace(/[^a-z0-9_]/g,''+'')+'@ravenfit.app'; }

function initFirebase(){
  if(_fbApp)return;
  try{
    var cfg={
      apiKey:"AIzaSyCHKPvCL7gtvuq83C-yY13sl3Vy7NCGWYs",
      authDomain:"raven-fit.firebaseapp.com",
      projectId:"raven-fit",
      storageBucket:"raven-fit.firebasestorage.app",
      messagingSenderId:"51772695425",
      appId:"1:51772695425:web:a91e45103caa21ee45be80"
    };
    _fbApp=firebase.initializeApp(cfg);
    _fbAuth=firebase.auth();
    _fbDb=firebase.firestore();
    _fbAuth.onAuthStateChanged(function(user){
      if(user){ _fbUser=user; onUserLoggedIn(user); }
      else { _fbUser=null; onUserLoggedOut(); }
    });
  }catch(e){ console.warn('Firebase init error:',e); }
}

function showAuthScreen(){
  document.getElementById('auth-screen').style.display='flex';
  document.getElementById('app-main').style.display='none';
}

function hideAuthScreen(){
  document.getElementById('auth-screen').style.display='none';
  document.getElementById('app-main').style.display='block';
  /* Eğer misafir banner/note görünüyorsa ve kullanıcı giriş yaptıysa kaldır */
  if(_fbUser){
    _isGuest=false;
    var bn=document.getElementById('guest-banner');
    if(bn) bn.remove();
    var note=document.getElementById('guest-mode-note');
    if(note) note.style.display='none';
  }
}

/* ── Misafir Girişi ──────────────────────────────────── */

var _isGuest=false;

function enterAsGuest(){
  _isGuest=true;
  hideAuthScreen();
  /* Mevcut localStorage verisini yükle (varsa) */
  try{
    var raw=_lsGet('rf_data');
    if(raw&&raw.length>2){
      var d=JSON.parse(raw);
      U=d.U||{};R=d.R||{};A=d.A||{};BT=d.BT||{};
      selST=d.selST||null;selGL=d.selGL||null;
    }
  }catch(e){}
  /* Verisi varsa results ekranına, yoksa splash'e git.
     Banner yalnızca sonuç ekranında gösterilir — splash ve wizard'da
     "Devam Et" butonuyla çakışıyordu (madde 6 & 7). */
  if(Object.keys(R).length&&R.bf){
    showResults();
  } else {
    goHome();
  }
  _syncGuestUI();
}

/* Misafir arayüzünü ekrana göre ayarlar.
   Banner  → sadece sonuç ekranında (alt menü varken)
   Giriş/Kayıt butonları → sadece splash ekranında */
function _syncGuestUI(){
  var sonucAktif = !!document.querySelector('#results.active');
  var splashAktif = !!document.querySelector('#splash.active');

  /* Banner */
  if(_isGuest && sonucAktif){ showGuestBanner(); }
  else { var bn=document.getElementById('guest-banner'); if(bn) bn.remove(); }

  /* Splash'teki giriş/kayıt butonları */
  var gb=document.getElementById('splash-guest-actions');
  if(gb) gb.style.display = (_isGuest && splashAktif) ? 'flex' : 'none';
}

/* Misafir modundan çıkıp giriş ekranına dön (madde 7) */
function backToAuth(sekme){
  var bn=document.getElementById('guest-banner');
  if(bn) bn.remove();
  _isGuest=false;
  showAuthScreen();
  if(sekme==='register') showRegisterTab(); else showLoginTab();
}

function showGuestBanner(){
  if(document.getElementById('guest-banner'))return;
  var bn=document.createElement('div');
  bn.id='guest-banner';
  bn.style.cssText='position:fixed;bottom:68px;left:50%;transform:translateX(-50%);width:100%;max-width:640px;background:var(--card);border-top:1px solid var(--border);padding:8px 14px;display:flex;align-items:center;gap:10px;z-index:300;animation:slideUp .3s ease';
  bn.innerHTML='<span style="font-size:14px">👀</span>'+
    '<div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:700;color:var(--text)">Misafir Modu</div>'+
    '<div style="font-size:10px;color:var(--text2)">Veriler yalnızca bu cihazda</div></div>'+
    '<button onclick="exitGuestMode()" style="background:var(--accent);border:none;border-radius:8px;padding:6px 12px;font-family:\'Outfit\',sans-serif;font-size:11px;font-weight:700;color:#fff;cursor:pointer;flex-shrink:0">Hesap Oluştur</button>'+
    '<button onclick="document.getElementById(\'guest-banner\').style.display=\'none\'" style="background:none;border:none;color:var(--text3);font-size:18px;cursor:pointer;padding:0 2px;flex-shrink:0">✕</button>';
  document.body.appendChild(bn);
}

function exitGuestMode(){
  /* Banner'daki "Hesap Oluştur" butonu — kayıt sekmesine götürür */
  backToAuth('register');
}

/* ── Giriş Yap ───────────────────────────────────────── */

function doLogin(){
  var nick=document.getElementById('auth-nick').value.trim().toLowerCase();
  var pass=document.getElementById('auth-pass').value;
  var errEl=document.getElementById('auth-err');
  errEl.style.color='var(--accent)';errEl.textContent='';
  if(!nick||!pass){errEl.textContent='Kullanıcı adı ve şifre gerekli.';return;}
  if(nick.length<3){errEl.textContent='Kullanıcı adı en az 3 karakter olmalı.';return;}
  var email=nickToEmail(nick);
  var btn=document.getElementById('auth-btn-login');
  btn.textContent='Giriş yapılıyor...';btn.disabled=true;
  /* Eğer misafirken bir veri varsa, giriş yapmadan önce temizle
     (misafir verisi başka hesaba akmasın) */
  var hadGuestData=_isGuest;
  if(hadGuestData){
    _clearUserLocalData();
  }
  _fbAuth.signInWithEmailAndPassword(email,pass)
    .then(function(){btn.textContent='Giriş Yap';btn.disabled=false;})
    .catch(function(e){
      btn.textContent='Giriş Yap';btn.disabled=false;
      var msgs={
        'auth/user-not-found':'Bu kullanıcı adı kayıtlı değil.',
        'auth/wrong-password':'Şifre yanlış.',
        'auth/too-many-requests':'Çok fazla deneme. Biraz bekle.',
        'auth/invalid-credential':'Kullanıcı adı veya şifre hatalı.'
      };
      errEl.textContent=msgs[e.code]||'Hata: '+e.message;
    });
}

/* ── Kayıt Ol ────────────────────────────────────────── */

function _authClearErr(fieldId){
  var el=document.getElementById('auth-'+fieldId);
  if(el) el.classList.remove('auth-err-field');
}

function _authMarkErr(ids){
  /* ids: ['nick-r', 'pass-r', 'pass2'] gibi */
  ids.forEach(function(id){
    var el=document.getElementById('auth-'+id);
    if(el){
      el.classList.add('auth-err-field');
      /* Animasyonu restart için */
      el.style.animation='none';
      el.offsetHeight;
      el.style.animation='';
    }
  });
}

function doRegister(){
  var nickEl=document.getElementById('auth-nick-r');
  var passEl=document.getElementById('auth-pass-r');
  var pass2El=document.getElementById('auth-pass2');
  var nick=nickEl.value.trim().toLowerCase();
  var pass=passEl.value;
  var pass2=pass2El.value;
  var errEl=document.getElementById('auth-err-r');
  errEl.style.color='var(--accent)';errEl.textContent='';
  /* Tüm hata vurgularını temizle */
  ['nick-r','pass-r','pass2'].forEach(_authClearErr);

  /* Nickname validasyon */
  if(!nick){
    errEl.textContent='Kullanıcı adı gerekli.';
    _authMarkErr(['nick-r']);
    return;
  }
  if(nick.length<3){
    errEl.textContent='Kullanıcı adı en az 3 karakter olmalı.';
    _authMarkErr(['nick-r']);
    return;
  }
  if(!/^[a-z0-9_]+$/.test(nick)){
    errEl.textContent='Sadece harf, rakam ve _ kullanabilirsin.';
    _authMarkErr(['nick-r']);
    return;
  }
  /* Şifre validasyon — 6 karakter şartı her iki kutucuğu kontrol et */
  var passShort=pass.length<6;
  var pass2Short=pass2.length<6;
  if(!pass||!pass2){
    errEl.textContent='Şifre alanlarını doldur.';
    var toMark=[];
    if(!pass) toMark.push('pass-r');
    if(!pass2) toMark.push('pass2');
    _authMarkErr(toMark);
    return;
  }
  if(passShort||pass2Short){
    errEl.textContent='Şifre en az 6 karakter olmalı.';
    /* Her iki şifre kutucuğunu da uyar (kullanıcı isteği) */
    var shortMarks=[];
    if(passShort) shortMarks.push('pass-r');
    if(pass2Short) shortMarks.push('pass2');
    _authMarkErr(shortMarks);
    return;
  }
  if(pass!==pass2){
    errEl.textContent='Şifreler eşleşmiyor.';
    /* Her iki şifre kutucuğunu da uyar */
    _authMarkErr(['pass-r','pass2']);
    return;
  }

  var email=nickToEmail(nick);
  var btn=document.getElementById('auth-btn-register');
  btn.textContent='Kayıt yapılıyor...';btn.disabled=true;
  _fbAuth.createUserWithEmailAndPassword(email,pass)
    .then(function(cred){
      btn.textContent='Kayıt Ol';btn.disabled=false;
      /* Misafir verisini hesaba taşı */
      if(_isGuest){
        _isGuest=false;
        var bn=document.getElementById('guest-banner');
        if(bn)bn.remove();
        var note=document.getElementById('guest-mode-note');
        if(note)note.style.display='none';
        showToast('✅ Hesap oluşturuldu! Veriler aktarılıyor...');
      }
      /* Misafir notunu kesin kapat (hesap oluştuktan sonra hep gizli) */
      try {
        var note2=document.getElementById('guest-mode-note');
        if(note2) note2.style.display='none';
        var bn2=document.getElementById('guest-banner');
        if(bn2) bn2.remove();
      } catch(e){}
      /* Kullanıcı adını Firebase'e kaydet */
      _fbDb.collection('users').doc(cred.user.uid)
        .set({nickname:nick,created:firebase.firestore.FieldValue.serverTimestamp()},{merge:true})
        .catch(function(e){ console.warn('Kullanıcı adı kaydedilemedi:', e && e.message); });
    })
    .catch(function(e){
      btn.textContent='Kayıt Ol';btn.disabled=false;
      var msgs={
        'auth/email-already-in-use':'Bu kullanıcı adı zaten alınmış.',
        'auth/weak-password':'Şifre çok zayıf.'
      };
      errEl.textContent=msgs[e.code]||'Hata: '+e.message;
      if(e.code==='auth/email-already-in-use') _authMarkErr(['nick-r']);
      else _authMarkErr(['pass-r','pass2']);
    });
}

/* ── Çıkış Yap ───────────────────────────────────────── */

function doLogout(){
  showConfirm('Çıkış Yap','Hesabından çıkmak istiyor musun?',function(){
    /* Önce localStorage'taki kullanıcıya özel verileri temizle */
    _clearUserLocalData();
    _fbAuth.signOut();
    showToast('Çıkış yapıldı.');
  },'Çıkış Yap');
}

/* Tüm kullanıcı state'ini ve localStorage'ı sıfırla */

function _clearUserLocalData(){
  /* Memory state */
  U={};R={};A={};BT={};
  selST=null;selGL=null;
  step=0;
  _editingEntryIdx=null;
  _isGuest=false;
  /* localStorage temizle (kullanıcıya özel olanları) */
  var keysToRemove=['rf_data','rf_entries','rf_workout_logs','rf_custom_workouts',
                    'rf_branches','rf_supplements_used','rf_badges','rf_pr_plates',
                    'rf_water_today','avatar','nickname'];
  keysToRemove.forEach(function(k){
    try{ _lsRemove(k); }catch(e){}
  });
  /* Misafir banner'ını gizle */
  var bn=document.getElementById('guest-banner');
  if(bn) bn.remove();
  /* Misafir mode notunu gizle */
  var note=document.getElementById('guest-mode-note');
  if(note) note.style.display='none';
  /* Aktif ekranları gizle */
  try {
    var splash=document.getElementById('splash');if(splash){splash.style.display='none';splash.classList.remove('active');}
    var results=document.getElementById('results');if(results){results.style.display='none';results.classList.remove('active');}
    var wizard=document.getElementById('wizard');if(wizard){wizard.style.display='none';wizard.classList.remove('active');}
    var bnav=document.getElementById('bottom-nav');if(bnav) bnav.classList.remove('visible');
    /* main-screen aktif kalmasın (vucudum/antrenman vb) */
    document.querySelectorAll('.main-screen').forEach(function(m){m.classList.remove('active');});
    document.querySelectorAll('.bnav-btn').forEach(function(b){b.classList.remove('active');});
    /* Açık overlay/drawer varsa kapat */
    document.querySelectorAll('.calc-overlay.active').forEach(function(o){o.classList.remove('active');});
    var sd=document.getElementById('settings-drawer');if(sd){sd.classList.remove('open');}
    var sb=document.getElementById('sdw-overlay');if(sb){sb.classList.remove('open');}
    document.body.style.overflow='';
  } catch(e){}
  /* Wizard input'larını temizle */
  try {
    document.querySelectorAll('#wizard input.fi').forEach(function(inp){inp.value='';});
    document.querySelectorAll('.gbtn.sel').forEach(function(el){el.classList.remove('sel');});
    document.querySelectorAll('.oc.sel').forEach(function(el){el.classList.remove('sel');});
  } catch(e){}
  /* Timer'ları durdur */
  try {
    if(typeof _chronoInterval!=='undefined' && _chronoInterval) clearInterval(_chronoInterval);
    if(typeof _restInterval!=='undefined' && _restInterval) clearInterval(_restInterval);
    if(typeof _chronoMs!=='undefined') _chronoMs=0;
    if(typeof _chronoRunning!=='undefined') _chronoRunning=false;
    if(typeof _setCount!=='undefined') _setCount=0;
  } catch(e){}
}

/* ── Giriş Sonrası: Firebase'den Veri Yükle + Eski Veri Migrasyonu ── */

function onUserLoggedIn(user){
  hideAuthScreen();
  /* Onceki kullanıcıdan kalan inline display:none ve aktif sınıfları temizle */
  try {
    ['splash','results','wizard'].forEach(function(id){
      var el=document.getElementById(id);
      if(el){ el.style.display=''; el.classList.remove('active'); }
    });
    document.querySelectorAll('.main-screen').forEach(function(m){m.classList.remove('active');});
    document.querySelectorAll('.bnav-btn').forEach(function(b){b.classList.remove('active');});
    document.body.style.overflow='';
  } catch(e){}
  _fbDb.collection('users').doc(user.uid).get()
    .then(function(doc){
      var fbHasData=false;
      if(doc.exists){
        var d=doc.data();
        /* Kullanıcı adını göster */
        var nick=d.nickname||(user.email?user.email.replace('@ravenfit.app',''):'');
        var nickEl=document.getElementById('user-email-display');
        if(nickEl)nickEl.textContent='@'+nick;
        setAvatarInitials(nick);
        /* Avatar */
        if(d.avatar){setAvatar(d.avatar);}else{setAvatar(null);}
        /* Firebase'de veri var mı? */
        if(d.rf_data&&d.rf_data.length>2){
          fbHasData=true;
          try{
            var fd=JSON.parse(d.rf_data);
            U=fd.U||{};R=fd.R||{};A=fd.A||{};BT=fd.BT||{};
            selST=fd.selST||null;selGL=fd.selGL||null;
            _lsSet('rf_data',d.rf_data);
          }catch(e){}
        }
        if(d.rf_entries&&d.rf_entries.length>2){
          try{ _lsSet('rf_entries',d.rf_entries); }catch(e){}
        }
        if(d.rf_workout_logs&&d.rf_workout_logs.length>2){
          try{ _lsSet('rf_workout_logs',d.rf_workout_logs); }catch(e){}
        }
        if(d.rf_custom_workouts&&d.rf_custom_workouts.length>2){
          try{ _lsSet('rf_custom_workouts',d.rf_custom_workouts); }catch(e){}
        }
        if(d.rf_branches&&d.rf_branches.length>2){
          try{ _lsSet('rf_branches',d.rf_branches); }catch(e){}
        }
        if(d.rf_supplements_used&&d.rf_supplements_used.length>2){
          try{ _lsSet('rf_supplements_used',d.rf_supplements_used); }catch(e){}
        }
        if(d.rf_badges&&d.rf_badges.length>2){
          try{ _lsSet('rf_badges',d.rf_badges); }catch(e){}
        }
        if(d.rf_theme){
          _lsSet('rf_theme',d.rf_theme);
          applyTheme(d.rf_theme);
        }
        if(d.rf_unit){
          try{ _lsSet('rf_unit',d.rf_unit); }catch(e){}
        }
        if(d.rf_level_mode){
          try{ _lsSet('rf_level_mode',d.rf_level_mode); }catch(e){}
        }
      }
      /* MİGRASYON: Firebase'de veri yok ama localStorage'da var → yükle */
      if(!fbHasData){
        try{
          var raw=_lsGet('rf_data');
          if(raw&&raw.length>2){
            var ld=JSON.parse(raw);
            U=ld.U||{};R=ld.R||{};A=ld.A||{};BT=ld.BT||{};
            selST=ld.selST||null;selGL=ld.selGL||null;
            /* Eski veriyi Firebase'e yükle */
            saveToFirebase();
            showToast('📤 Mevcut verilerin buluta aktarıldı!');
          }
        }catch(e){}
      }
      if(Object.keys(R).length && R.tdee){
        /* Kullanıcının analizi tamamlanmış — direkt sonuç ekranına geç */
        try {
          showResults();
        } catch(e){
          console.warn('showResults hatası, splash gösteriliyor:',e);
          goHome();
        }
      } else {
        /* Analiz tamamlanmamış — splash ekranını göster */
        goHome();
      }
      if(fbHasData) showToast('Hoş geldin! 👋');
    })
    .catch(function(e){
      console.warn('Veri yükleme hatası:',e);
      /* Hata olsa da localStorage'dan yükle */
      try{
        var raw=_lsGet('rf_data');
        if(raw){var d=JSON.parse(raw);U=d.U||{};R=d.R||{};A=d.A||{};BT=d.BT||{};}
      }catch(ex){}
      if(Object.keys(R).length && R.tdee){
        try { showResults(); } catch(err){ goHome(); }
      } else {
        /* Hata + analiz yok → splash göster */
        goHome();
      }
    });
}

/* ── Çıkış Sonrası ────────────────────────────────────── */

function onUserLoggedOut(){
  _redsAcknowledged=false;_bulkAcknowledged=false;
  _clearUserLocalData();
  /* Yıkımları görsel temizle */
  document.getElementById('bottom-nav').classList.remove('visible');
  /* Sayfa yüklenmiş elementleri sıfırla */
  try {
    /* Avatar iki parçadan oluşuyor: baş harf yazısı + yüklenen resim */
    var avIni=document.getElementById('avatar-initials');
    if(avIni){ avIni.textContent='?'; avIni.style.display=''; }
    var avImg=document.getElementById('avatar-img');
    if(avImg){ avImg.src=''; avImg.style.display='none'; }
    var nickEl=document.getElementById('user-email-display');
    if(nickEl) nickEl.textContent='';
  } catch(e){}
  showAuthScreen();
}

/* ── Firebase'e Kaydet (debounced, kilit sorunu giderildi) ── */

var _fbSaveTimer=null;

function saveToFirebase(){
  if(!_fbUser||!_fbDb)return;
  /* Debounce: 800ms içinde birden fazla kayıt gelirse sadece sonuncuyu gönder */
  clearTimeout(_fbSaveTimer);
  _fbSaveTimer=setTimeout(function(){
    var dataStr=JSON.stringify({U:U,R:R,A:A,BT:BT,selST:selST,selGL:selGL});
    var entriesStr=_lsGet('rf_entries')||'[]';
    var logsStr=_lsGet('rf_workout_logs')||'[]';
    var customStr=_lsGet('rf_custom_workouts')||'[]';
    var branchesStr=_lsGet('rf_branches')||'["fitness"]';
    var suppsUsedStr=_lsGet('rf_supplements_used')||'[]';
    var badgesStr=_lsGet('rf_badges')||'[]';
    var themeStr=_lsGet('rf_theme')||'dark';
    var unitStr=_lsGet('rf_unit')||'kg';
    var levelModeStr=_lsGet('rf_level_mode')||'auto';
    _fbDb.collection('users').doc(_fbUser.uid).set({
      rf_data:dataStr,
      rf_entries:entriesStr,
      rf_workout_logs:logsStr,
      rf_custom_workouts:customStr,
      rf_branches:branchesStr,
      rf_supplements_used:suppsUsedStr,
      rf_badges:badgesStr,
      rf_theme:themeStr,
      rf_unit:unitStr,
      rf_level_mode:levelModeStr,
      updated:firebase.firestore.FieldValue.serverTimestamp()
    },{merge:true})
    .then(function(){/* ok */})
    .catch(function(e){console.warn('Firebase kayıt hatası:',e);});
  },800);
}

/* ── Auth sekme toggle ────────────────────────────────── */

function showLoginTab(){
  document.getElementById('auth-tab-login').style.background='var(--accent-btn)';
  document.getElementById('auth-tab-login').style.color='var(--on-accent)';
  document.getElementById('auth-tab-register').style.background='transparent';
  document.getElementById('auth-tab-register').style.color='var(--text2)';
  document.getElementById('auth-form-login').style.display='block';
  document.getElementById('auth-form-register').style.display='none';
  document.getElementById('auth-err').textContent='';
}

function showRegisterTab(){
  document.getElementById('auth-tab-register').style.background='var(--accent-btn)';
  document.getElementById('auth-tab-register').style.color='var(--on-accent)';
  document.getElementById('auth-tab-login').style.background='transparent';
  document.getElementById('auth-tab-login').style.color='var(--text2)';
  document.getElementById('auth-form-login').style.display='none';
  document.getElementById('auth-form-register').style.display='block';
  document.getElementById('auth-err-r').textContent='';
}
