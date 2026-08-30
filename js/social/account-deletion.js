/* ══════════════════════════════════════════════════════════
   RavenFit — account-deletion.js
   Hesap silme

   AKIŞ
   ──────────────────────────────────────────────────────────
   Kullanıcı sebep bildirir → iki kez onaylar → talep oluşur
     ↓
   Hesap HER YERDEN gizlenir (silinmez, gizlenir):
     profil · gönderiler · yorumlar · beğeniler
     takipçi/takip listeleri · keşfet · akış
     ↓
   İlk 7 GÜN: kullanıcı vazgeçebilir → her şey geri gelir
   7-15 gün : vazgeçilemez, silme bekleniyor
   15. gün  : tüm veriler kalıcı silinir

   deletionRequests/{uid} → { uid, sebep, aciklama, talepTarihi,
                              silmeTarihi, durum }

   ⚠️ OTOMATİK SİLME YOK
   15 günlük sayaç sunucu tarafı iş gerektirir (Cloud Functions
   = ücretli plan). Bu prototipte süre dolduğunda yönetici
   panelinde "süresi doldu" işaretlenir ve elle silinir.
   Gerçek uygulamada zamanlanmış görev kurulmalıdır.

   ⚠️ KVKK
   Silme hakkı yasal bir zorunluluktur. 15 günlük bekleme
   kullanıcı yararınadır (pişmanlık payı) ama kullanıcı
   isterse hemen silinmeyi talep edebilmelidir — yönetici
   panelinden anında silme bu yüzden var.
   ══════════════════════════════════════════════════════════ */

var SILME_BEKLEME_GUN = 15;
var SILME_CAYMA_GUN   = 7;    /* ilk 7 gün vazgeçilebilir */

var SILME_SEBEPLERI = [
  {id:'kullanmiyorum', ad:'Uygulamayı kullanmıyorum'},
  {id:'baska',         ad:'Başka bir uygulamaya geçiyorum'},
  {id:'gizlilik',      ad:'Gizlilik endişelerim var'},
  {id:'karmasik',      ad:'Kullanımı karmaşık geliyor'},
  {id:'eksik',         ad:'İhtiyacım olan özellikler yok'},
  {id:'gecici',        ad:'Geçici olarak ara veriyorum'},
  {id:'diger',         ad:'Diğer'}
];

var _silmeTalebi = null;   /* mevcut talep */
var _silmeSecim = {sebep:null, aciklama:''};

/* ── Durum sorgusu ───────────────────────────────────────── */

function silmeTalebiGetir(){
  return new Promise(function(cozumle){
    if(!_fbUser || !_fbDb) return cozumle(null);
    _fbDb.collection('deletionRequests').doc(_fbUser.uid).get()
      .then(function(d){
        _silmeTalebi = d.exists ? d.data() : null;
        cozumle(_silmeTalebi);
      })
      .catch(function(){ cozumle(null); });
  });
}

/* Bu hesap silinmeyi bekliyor mu? Gizleme filtreleri buna bakar. */
function silinmeyiBekliyorMu(profil){
  return !!(profil && profil.silinecek === true);
}

/* Kalan gün sayısı */
function _kalanGun(silmeTarihi){
  if(!silmeTarihi) return SILME_BEKLEME_GUN;
  var hedef = silmeTarihi.seconds ? silmeTarihi.seconds * 1000 : silmeTarihi;
  var fark = hedef - Date.now();
  return Math.max(0, Math.ceil(fark / 86400000));
}

/* Vazgeçme süresi geçti mi? */
function _caymaSuresiDoldu(talepTarihi){
  if(!talepTarihi) return false;
  var bas = talepTarihi.seconds ? talepTarihi.seconds * 1000 : talepTarihi;
  return (Date.now() - bas) > SILME_CAYMA_GUN * 86400000;
}

/* ── Ekran ───────────────────────────────────────────────── */

function openAccountDeletion(){
  if(!_fbUser || !_fbDb){ showToast('Giriş yapmalısın.','warn'); return; }
  var ov = document.getElementById('delete-overlay');
  if(!ov) return;
  ov.classList.add('active');
  document.body.style.overflow = 'hidden';

  var el = document.getElementById('sl-body');
  if(el) el.innerHTML = '<div class="dsc-durum">Yükleniyor...</div>';

  _silmeSecim = {sebep:null, aciklama:''};
  silmeTalebiGetir().then(function(talep){
    if(talep) _slDurumCiz(talep);
    else _slFormCiz();
  });
}

function closeAccountDeletion(){
  var ov = document.getElementById('delete-overlay');
  if(ov) ov.classList.remove('active');
  document.body.style.overflow = '';
}

/* Talep varsa geri sayım ekranı */
function _slDurumCiz(talep){
  var el = document.getElementById('sl-body');
  var alt = document.getElementById('sl-foot');
  if(!el) return;

  var kalan = _kalanGun(talep.silmeTarihi);
  var caymaBitti = _caymaSuresiDoldu(talep.talepTarihi);
  var sebep = SILME_SEBEPLERI.find(function(s){ return s.id === talep.sebep; });

  el.innerHTML =
    '<div class="sl-durum">' +
      '<div class="sl-sayac">' + kalan + '</div>' +
      '<div class="sl-sayac-lbl">gün sonra silinecek</div>' +
      '<div class="sl-cizgi"><div style="width:' +
        Math.round((1 - kalan/SILME_BEKLEME_GUN) * 100) + '%"></div></div>' +
      '<div class="sl-durum-metin">' +
        'Hesabın <strong>gizlendi</strong>. Profilin, gönderilerin ve ' +
        'yorumların kimseye görünmüyor.' +
        (sebep ? '<br><br>Sebep: <strong>' + sebep.ad + '</strong>' : '') +
      '</div>' +
      (caymaBitti
        ? '<div class="sl-uyari">⏳ Vazgeçme süresi doldu (' + SILME_CAYMA_GUN +
          ' gün). Hesabın belirtilen tarihte kalıcı olarak silinecek.</div>'
        : '<div class="sl-bilgi">İlk ' + SILME_CAYMA_GUN + ' gün içinde ' +
          'vazgeçebilirsin. Vazgeçersen her şey eski hâline döner.</div>') +
    '</div>';

  if(alt){
    alt.innerHTML = caymaBitti
      ? '<button class="btn btn-s btn-full" onclick="closeAccountDeletion()">Kapat</button>'
      : '<button class="btn btn-s" onclick="closeAccountDeletion()">Kapat</button>' +
        '<button class="btn btn-p" onclick="slVazgec()">Silmekten Vazgeç</button>';
  }
}

/* Sebep formu */
function _slFormCiz(){
  var el = document.getElementById('sl-body');
  var alt = document.getElementById('sl-foot');
  if(!el) return;

  el.innerHTML =
    '<div class="sl-bilgi">Ayrıldığın için üzgünüz. Neyi ' +
      'daha iyi yapabileceğimizi bilmek bize yardımcı olur.</div>' +

    '<div class="fl" style="margin:16px 0 8px">Ayrılma Sebebin</div>' +
    '<div class="rp-sebepler">' +
      SILME_SEBEPLERI.map(function(s){
        return '<button class="rp-sebep" data-ss="' + s.id + '" ' +
               'onclick="slSebepSec(\'' + s.id + '\')">' + s.ad + '</button>';
      }).join('') +
    '</div>' +

    '<div class="fg" style="margin-top:14px">' +
      '<label class="fl">Eklemek istediğin bir şey var mı? ' +
        '<span style="color:var(--text3)">(isteğe bağlı)</span></label>' +
      '<textarea class="fi" id="sl-aciklama" rows="3" maxlength="300" ' +
        'placeholder="Görüşlerin bizim için değerli..."></textarea>' +
    '</div>' +

    '<div class="sl-ne-olur">' +
      '<div class="sl-ne-olur-baslik">Ne olacak?</div>' +
      '<div class="sl-adim"><span>1</span>Hesabın hemen <strong>gizlenir</strong> — ' +
        'profilin, gönderilerin ve yorumların kimseye görünmez</div>' +
      '<div class="sl-adim"><span>2</span>İlk <strong>' + SILME_CAYMA_GUN + ' gün</strong> ' +
        'içinde vazgeçebilirsin, her şey geri gelir</div>' +
      '<div class="sl-adim"><span>3</span><strong>' + SILME_BEKLEME_GUN + ' gün</strong> sonra ' +
        'tüm verilerin kalıcı olarak silinir</div>' +
    '</div>';

  if(alt){
    alt.innerHTML =
      '<button class="btn btn-s" onclick="closeAccountDeletion()">Vazgeç</button>' +
      '<button class="btn btn-p sl-tehlike" id="sl-devam-btn" onclick="slDevam()">Devam Et</button>';
  }
}

function slSebepSec(sebep){
  _silmeSecim.sebep = sebep;
  document.querySelectorAll('.rp-sebep').forEach(function(b){
    b.classList.toggle('sec', b.dataset.ss === sebep);
  });
}

/* İlk onay */
function slDevam(){
  var ac = document.getElementById('sl-aciklama');
  if(ac) _silmeSecim.aciklama = ac.value.trim();

  if(!_silmeSecim.sebep){
    showToast('Bir sebep seç.','warn');
    return;
  }

  showConfirm('Emin misin?',
    'Hesabın gizlenecek ve ' + SILME_BEKLEME_GUN + ' gün sonra ' +
    'kalıcı olarak silinecek.\n\n' +
    'Bu süre içinde ilk ' + SILME_CAYMA_GUN + ' gün vazgeçebilirsin.',
    function(){ _slIkinciOnay(); },
    'Devam Et');
}

/* İkinci onay — kullanıcı adını yazarak doğrular */
function _slIkinciOnay(){
  var nick = (_lsGet('nickname') || '').toLowerCase();
  var el = document.getElementById('sl-body');
  var alt = document.getElementById('sl-foot');
  if(!el) return;

  el.innerHTML =
    '<div class="sl-son-onay">' +
      '<div class="sl-son-ikon">⚠️</div>' +
      '<div class="sl-son-baslik">Son Adım</div>' +
      '<div class="sl-son-metin">' +
        'Onaylamak için kullanıcı adını yaz:<br>' +
        '<strong>@' + nick + '</strong>' +
      '</div>' +
      '<input class="fi" id="sl-onay-input" type="text" ' +
        'placeholder="' + nick + '" autocomplete="off" autocapitalize="none" ' +
        'oninput="slOnayKontrol()" style="text-align:center;margin-top:14px">' +
    '</div>';

  if(alt){
    alt.innerHTML =
      '<button class="btn btn-s" onclick="openAccountDeletion()">Geri</button>' +
      '<button class="btn btn-p sl-tehlike" id="sl-sil-btn" onclick="slTalepOlustur()" disabled>' +
        'Hesabımı Sil</button>';
  }
}

function slOnayKontrol(){
  var inp = document.getElementById('sl-onay-input');
  var btn = document.getElementById('sl-sil-btn');
  if(!inp || !btn) return;
  var nick = (_lsGet('nickname') || '').toLowerCase();
  btn.disabled = inp.value.trim().toLowerCase() !== nick;
}

function slTalepOlustur(){
  var btn = document.getElementById('sl-sil-btn');
  if(btn){ btn.disabled = true; btn.textContent = 'İşleniyor...'; }

  var simdi = Date.now();
  var silmeTarihi = simdi + SILME_BEKLEME_GUN * 86400000;

  Promise.all([
    _fbDb.collection('deletionRequests').doc(_fbUser.uid).set({
      uid: _fbUser.uid,
      nickname: _lsGet('nickname') || '',
      sebep: _silmeSecim.sebep,
      aciklama: _silmeSecim.aciklama || '',
      talepTarihi: firebase.firestore.FieldValue.serverTimestamp(),
      silmeTarihi: {seconds: Math.floor(silmeTarihi/1000)},
      durum: 'bekliyor'
    }),
    /* Profili gizle — her yerden kaybolsun */
    _fbDb.collection('profiles').doc(_fbUser.uid).set({silinecek:true}, {merge:true})
  ])
    .then(function(){
      if(_profilOnbellek) delete _profilOnbellek[_fbUser.uid];
      showToast('Hesabın gizlendi. ' + SILME_BEKLEME_GUN + ' gün sonra silinecek.');
      openAccountDeletion();
    })
    .catch(function(e){
      if(btn){ btn.disabled = false; btn.textContent = 'Hesabımı Sil'; }
      showToast('❌ İşlem başarısız: ' + (e && e.message || ''),'error');
    });
}

function slVazgec(){
  showConfirm('Silmekten Vazgeç',
    'Hesabın yeniden aktif olacak. Profilin, gönderilerin ve ' +
    'yorumların tekrar görünür hâle gelecek.',
    function(){
      Promise.all([
        _fbDb.collection('deletionRequests').doc(_fbUser.uid).delete(),
        _fbDb.collection('profiles').doc(_fbUser.uid).set({silinecek:false}, {merge:true})
      ])
        .then(function(){
          if(_profilOnbellek) delete _profilOnbellek[_fbUser.uid];
          _silmeTalebi = null;
          showToast('✅ Hesabın yeniden aktif.');
          closeAccountDeletion();
        })
        .catch(function(){ showToast('❌ İşlem başarısız.','error'); });
    }, 'Hesabımı Geri Getir');
}

/* Girişte kontrol — silinme bekleyen hesap uyarılır */
function silmeDurumuKontrol(){
  if(!_fbUser || !_fbDb) return;
  silmeTalebiGetir().then(function(talep){
    if(!talep) return;
    var kalan = _kalanGun(talep.silmeTarihi);
    showToast('⚠️ Hesabın ' + kalan + ' gün sonra silinecek. ' +
              'Ayarlardan vazgeçebilirsin.','warn');
  });
}

/* ══════════════════════════════════════════════════════════
   SİLİNMİŞ HESAP KİLİDİ

   Silinen kullanıcının CİHAZINDA localStorage hâlâ dolu:
   profil, ölçümler, gönderi geçmişi, kullanıcı adı. Giriş
   yaptığında saveData ve yayinlaProfil çalışıp bu verileri
   buluta geri yazıyor — hesap kendini diriltiyordu.

   Çözüm: girişte bulutta users/{uid} var mı diye bakılır.
   Yoksa hesap silinmiştir; yerel veri temizlenir ve oturum
   kapatılır. Kullanıcı silinmiş hesabına dönemez.
   ══════════════════════════════════════════════════════════ */

var _silinmisKilitCalisti = false;

function _silinmisHesapKilitle(){
  if(_silinmisKilitCalisti) return;
  _silinmisKilitCalisti = true;

  showToast('Bu hesap silinmiş.','error');

  /* Yerel veriyi temizle — yoksa bir sonraki girişte yine yazılır */
  try {
    if(typeof _clearUserLocalData === 'function') _clearUserLocalData();
  } catch(e){}

  setTimeout(function(){
    if(_fbAuth) _fbAuth.signOut().then(function(){
      if(typeof showAuthScreen === 'function') showAuthScreen();
      var e = document.getElementById('auth-err');
      if(e){
        e.style.color = 'var(--danger)';
        e.textContent = 'Bu hesap silinmiş. Yeni hesap oluşturabilirsin.';
      }
    });
  }, 1200);
}

/* Girişte hesabın hâlâ var olup olmadığını doğrular.
   Diğer tüm kancalardan ÖNCE çalışmalı. */
function silinmisHesapKontrol(){
  if(!_fbUser || !_fbDb) return Promise.resolve(true);
  _silinmisKilitCalisti = false;

  return _fbDb.collection('users').doc(_fbUser.uid).get()
    .then(function(d){
      if(!d.exists){
        _silinmisHesapKilitle();
        return false;
      }
      return true;
    })
    .catch(function(){ return true; });   /* okunamadıysa engelleme */
}
