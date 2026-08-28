/* ══════════════════════════════════════════════════════════
   RavenFit — admin/panel.js
   Yönetici paneli

   GÜVENLİK MODELİ
   ──────────────────────────────────────────────────────────
   Yöneticilik, Firestore'daki admins/{uid} belgesinin
   VARLIĞIYLA belirlenir. Bu belgeye HİÇBİR kural yazma izni
   vermez — yalnızca Firebase konsolundan elle eklenebilir.

   Böylece:
     • İstemci kendini yönetici YAPAMAZ
     • Kod kurcalansa bile Firestore kuralları reddeder
     • Panelin gizlenmesi bir güvenlik önlemi DEĞİL, sadece
       arayüz sadeleştirmesidir — asıl koruma kurallardadır

   Yani biri paneli zorla açsa bile hiçbir veri okuyamaz,
   hiçbir işlem yapamaz.
   ══════════════════════════════════════════════════════════ */

var _yoneticiMi = false;
var _adminSekme = 'basvurular';
var _adminListe = [];
var _adminAcikBelge = null;

/* Giriş sonrası bir kez çalışır — yöneticilik kontrolü */
function yoneticiKontrolEt(){
  _yoneticiMi = false;
  if(!_fbUser || !_fbDb) return Promise.resolve(false);

  return _fbDb.collection('admins').doc(_fbUser.uid).get()
    .then(function(doc){
      _yoneticiMi = doc.exists;
      _adminGirisGoster();
      return _yoneticiMi;
    })
    .catch(function(){
      /* Okuma reddedilirse yönetici değiliz — normal durum */
      _yoneticiMi = false;
      _adminGirisGoster();
      return false;
    });
}

/* Panel giriş bağlantısını göster/gizle */
function _adminGirisGoster(){
  var el = document.getElementById('admin-giris');
  if(el) el.style.display = _yoneticiMi ? 'flex' : 'none';
}

function openAdminPanel(){
  if(!_yoneticiMi){
    showToast('Bu alana erişim yetkin yok.','error');
    return;
  }
  var ov = document.getElementById('admin-screen');
  if(!ov) return;
  ov.classList.add('active');
  document.body.style.overflow = 'hidden';
  _adminYukle();
}

function closeAdminPanel(){
  var ov = document.getElementById('admin-screen');
  if(ov) ov.classList.remove('active');
  document.body.style.overflow = '';
}

function adminSekme(sekme){
  _adminSekme = sekme;
  document.querySelectorAll('.ad-sekme').forEach(function(b){
    b.classList.toggle('act', b.dataset.as === sekme);
  });
  _adminYukle();
}

function _adminYukle(){
  var el = document.getElementById('ad-body');
  if(el) el.innerHTML = '<div class="dsc-durum">Yükleniyor...</div>';

  if(_adminSekme === 'basvurular')      _adminBasvurulariYukle('beklemede');
  else if(_adminSekme === 'onayli')     _adminBasvurulariYukle('onayli');
  else if(_adminSekme === 'sikayet')    _adminSikayetleriYukle();
  else if(_adminSekme === 'silme')      _adminSilmeTalepleriYukle();
  else                                  _adminIcerikAra();
}

/* ── Başvurular ──────────────────────────────────────────── */
function _adminBasvurulariYukle(durum){
  if(!_fbDb) return;
  _fbDb.collection('applications').where('durum','==',durum).limit(100).get()
    .then(function(snap){
      var liste = [];
      snap.forEach(function(d){ var b = d.data(); b.id = d.id; liste.push(b); });
      liste.sort(function(a,b){
        var ta = a.tarih && a.tarih.seconds ? a.tarih.seconds : 0;
        var tb = b.tarih && b.tarih.seconds ? b.tarih.seconds : 0;
        return tb - ta;
      });
      _adminListe = liste;
      _adminBasvuruCiz(durum);
    })
    .catch(function(e){
      var el = document.getElementById('ad-body');
      if(el) el.innerHTML = '<div class="dsc-durum">Başvurular okunamadı.<br>' +
        '<span style="font-size:11px">' + (e && e.message || '') + '</span></div>';
    });
}

function _adminBasvuruCiz(durum){
  var el = document.getElementById('ad-body');
  if(!el) return;

  if(!_adminListe.length){
    el.innerHTML = '<div class="dsc-durum">' +
      (durum === 'beklemede' ? 'Bekleyen başvuru yok.' : 'Onaylı hesap yok.') +
      '</div>';
    return;
  }

  el.innerHTML = _adminListe.map(function(b){
    var rol = (typeof PRO_ROLLER !== 'undefined')
      ? PRO_ROLLER.find(function(r){ return r.id === b.rol; }) : null;
    var tarih = b.tarih && b.tarih.seconds
      ? new Date(b.tarih.seconds*1000).toLocaleDateString('tr-TR') : '';

    var html = '<div class="ad-kart">';
    html +=   '<div class="ad-kart-ust">';
    html +=     '<span class="ad-rol">' + (rol ? rol.ikon + ' ' + rol.ad : b.rol) + '</span>';
    html +=     '<span class="ad-tarih">' + tarih + '</span>';
    html +=   '</div>';
    html +=   '<div class="ad-ad">' + _adKacir(b.ad || '') + '</div>';
    html +=   '<button class="ad-uid" onclick="adminProfilAc(\'' + b.uid + '\')">' +
                'Profili gör →</button>';
    if(b.aciklama){
      html += '<div class="ad-aciklama">' + _adKacir(b.aciklama) + '</div>';
    }

    /* Belge önizlemesi — tıklanınca tam ekran açılır */
    if(b.belge){
      html += '<button class="ad-belge" onclick="adminBelgeAc(\'' + b.uid + '\')">' +
                '<img src="' + b.belge + '" alt="Belge">' +
                '<span class="ad-belge-ipucu">🔍 Belgeyi büyüt</span>' +
              '</button>';
    } else {
      html += '<div class="ad-belge-yok">⚠️ Belge yüklenmemiş</div>';
    }

    html +=   '<div class="ad-eylemler">';
    if(durum === 'beklemede'){
      html +=   '<button class="ad-btn onay" onclick="adminOnayla(\'' + b.uid + '\')">✓ Onayla</button>';
      html +=   '<button class="ad-btn red" onclick="adminReddet(\'' + b.uid + '\')">✕ Reddet</button>';
    } else {
      html +=   '<button class="ad-btn red" onclick="adminOnayKaldir(\'' + b.uid + '\')">Onayı Kaldır</button>';
    }
    html +=   '</div>';
    html += '</div>';
    return html;
  }).join('');
}

/* Belgeyi tam ekran aç */
function adminBelgeAc(uid){
  var b = _adminListe.find(function(x){ return x.uid === uid; });
  if(!b || !b.belge) return;
  _adminAcikBelge = b;

  var img = document.getElementById('ad-belge-img');
  if(img) img.src = b.belge;
  var bilgi = document.getElementById('ad-belge-bilgi');
  if(bilgi) bilgi.textContent = (b.ad || '') + ' · ' + (b.rol || '');

  var ov = document.getElementById('admin-doc-overlay');
  if(ov) ov.classList.add('active');
}

function adminBelgeKapat(){
  var ov = document.getElementById('admin-doc-overlay');
  if(ov) ov.classList.remove('active');
  _adminAcikBelge = null;
}

/* ── Onay işlemleri ──────────────────────────────────────── */
function adminOnayla(uid){
  var b = _adminListe.find(function(x){ return x.uid === uid; });
  if(!b) return;

  showConfirm('Başvuruyu Onayla',
    (b.ad || '') + ' adlı kullanıcı "' + (b.rol === 'antrenor' ? 'Antrenör' : 'Diyetisyen') +
    '" olarak onaylanacak. Profilinde onaylı rozet görünecek.',
    function(){
      /* İki belge birden güncellenir:
         applications → kayıt/geçmiş
         profiles     → kullanıcının gördüğü durum */
      Promise.all([
        _fbDb.collection('applications').doc(uid).set({
          durum: 'onayli',
          onaylayan: _fbUser.uid,
          onayTarihi: firebase.firestore.FieldValue.serverTimestamp()
        }, {merge:true}),
        _fbDb.collection('profiles').doc(uid).set({
          onay: 'onayli',
          rol: b.rol
        }, {merge:true})
      ])
        .then(function(){
          if(typeof bildirimGonder === 'function') bildirimGonder(uid, 'onay');
          showToast('✅ Başvuru onaylandı.');
          _adminYukle();
        })
        .catch(function(e){
          showToast('❌ İşlem başarısız: ' + (e && e.message || ''),'error');
        });
    }, 'Onayla');
}

function adminReddet(uid){
  var sebep = prompt('Red sebebi (kullanıcıya gösterilecek):',
                     'Belge okunaklı değil veya geçerli değil.');
  if(sebep === null) return;

  Promise.all([
    _fbDb.collection('applications').doc(uid).set({
      durum: 'red',
      redSebebi: sebep,
      onaylayan: _fbUser.uid,
      onayTarihi: firebase.firestore.FieldValue.serverTimestamp()
    }, {merge:true}),
    _fbDb.collection('profiles').doc(uid).set({
      onay: 'red', rol: 'uye'
    }, {merge:true})
  ])
    .then(function(){
      showToast('Başvuru reddedildi.');
      _adminYukle();
    })
    .catch(function(e){ showToast('❌ İşlem başarısız.','error'); });
}

function adminOnayKaldir(uid){
  var b = _adminListe.find(function(x){ return x.uid === uid; });
  showConfirm('Onayı Kaldır',
    (b && b.ad ? b.ad + ' adlı kullanıcının ' : '') +
    'onayı kaldırılacak. Rozet ve hizmet paylaşma yetkisi kalkar.',
    function(){
      Promise.all([
        _fbDb.collection('applications').doc(uid).set({
          durum: 'red',
          redSebebi: 'Onay yönetici tarafından kaldırıldı.',
          onaylayan: _fbUser.uid,
          onayTarihi: firebase.firestore.FieldValue.serverTimestamp()
        }, {merge:true}),
        _fbDb.collection('profiles').doc(uid).set({onay:'red', rol:'uye'}, {merge:true})
      ])
        .then(function(){ showToast('Onay kaldırıldı.'); _adminYukle(); })
        .catch(function(){ showToast('❌ İşlem başarısız.','error'); });
    }, 'Onayı Kaldır');
}

function adminProfilAc(uid){
  closeAdminPanel();
  if(typeof openUserProfile === 'function') openUserProfile(uid);
}

function _adKacir(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ══════════════════════════════════════════════════════════
   HESAP KİMLİĞİ (UID)

   Yönetici tanımlarken Firebase konsolunda admins/{uid}
   belgesi oluşturmak gerekir. UID'i konsolda aramak zahmetli
   olduğu için uygulamadan kopyalanabilir hâle getirildi.
   ══════════════════════════════════════════════════════════ */
function uidKopyala(){
  if(!_fbUser){
    showToast('Giriş yapmadan hesap kimliği olmaz.','warn');
    return;
  }
  var uid = _fbUser.uid;

  function basarili(){
    showToast('✅ Kopyalandı: ' + uid.slice(0,10) + '…');
  }

  /* Modern pano API'si yalnızca güvenli bağlamda çalışır */
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(uid).then(basarili).catch(function(){
      _uidGoster(uid);
    });
  } else {
    _uidGoster(uid);
  }
}

/* Kopyalama başarısızsa elle seçilebilsin diye göster */
function _uidGoster(uid){
  showConfirm('Hesap Kimliğin',
    uid + '\n\nBu değeri Firebase konsolunda admins koleksiyonuna ' +
    'belge kimliği olarak gir.',
    function(){}, 'Tamam');
}

/* ══════════════════════════════════════════════════════════
   SİLME TALEPLERİ

   Otomatik silme sunucu tarafı iş gerektirdiği için (Cloud
   Functions = ücretli plan) süre dolduğunda yönetici elle siler.
   Panel geri sayımı gösterir ve süresi dolanları vurgular.
   ══════════════════════════════════════════════════════════ */

function _adminSilmeTalepleriYukle(){
  if(!_fbDb) return;
  _fbDb.collection('deletionRequests').limit(100).get()
    .then(function(snap){
      var liste = [];
      snap.forEach(function(d){ var t = d.data(); t.id = d.id; liste.push(t); });
      /* Süresi dolanlar üstte — acil olanlar önce görünsün */
      liste.sort(function(a,b){
        var ta = a.silmeTarihi && a.silmeTarihi.seconds ? a.silmeTarihi.seconds : 0;
        var tb = b.silmeTarihi && b.silmeTarihi.seconds ? b.silmeTarihi.seconds : 0;
        return ta - tb;
      });
      _adminListe = liste;
      _adminSilmeCiz();
    })
    .catch(function(e){
      var el = document.getElementById('ad-body');
      if(el) el.innerHTML = '<div class="dsc-durum">Talepler okunamadı.<br>' +
        '<span style="font-size:11px">' + (e && e.message || '') + '</span></div>';
    });
}

function _adminSilmeCiz(){
  var el = document.getElementById('ad-body');
  if(!el) return;

  if(!_adminListe.length){
    el.innerHTML = '<div class="dsc-durum">Silme talebi yok.</div>';
    return;
  }

  el.innerHTML = _adminListe.map(function(t){
    var kalan = _adKalanGun(t.silmeTarihi);
    var doldu = kalan <= 0;
    var sebep = (typeof SILME_SEBEPLERI !== 'undefined')
      ? SILME_SEBEPLERI.find(function(s){ return s.id === t.sebep; }) : null;
    var talepTarih = t.talepTarihi && t.talepTarihi.seconds
      ? new Date(t.talepTarihi.seconds*1000).toLocaleDateString('tr-TR') : '';

    var html = '<div class="ad-kart' + (doldu ? ' sure-doldu' : '') + '">';
    html +=   '<div class="ad-kart-ust">';
    html +=     '<span class="ad-rol">@' + _adKacir(t.nickname || t.uid.slice(0,8)) + '</span>';
    html +=     '<span class="ad-tarih">' + talepTarih + '</span>';
    html +=   '</div>';

    /* Geri sayım */
    html +=   '<div class="ad-sayac' + (doldu ? ' doldu' : '') + '">';
    html +=     '<div class="ad-sayac-gun">' + (doldu ? '⚠️' : kalan) + '</div>';
    html +=     '<div class="ad-sayac-lbl">' +
                (doldu ? 'Süre doldu — silinmeli' : 'gün kaldı') + '</div>';
    html +=   '</div>';

    if(sebep){
      html += '<div class="ad-ad" style="font-size:13px">Sebep: ' + sebep.ad + '</div>';
    }
    if(t.aciklama){
      html += '<div class="ad-aciklama">' + _adKacir(t.aciklama) + '</div>';
    }

    html +=   '<div class="ad-eylemler">';
    html +=     '<button class="ad-btn" onclick="adminProfilAc(\'' + t.uid + '\')">Profili Gör</button>';
    html +=     '<button class="ad-btn" onclick="adminSilmeIptal(\'' + t.uid + '\')">Talebi İptal Et</button>';
    html +=     '<button class="ad-btn red" onclick="adminHesabiSil(\'' + t.uid + '\')">Hemen Sil</button>';
    html +=   '</div>';
    html += '</div>';
    return html;
  }).join('');
}

function _adKalanGun(silmeTarihi){
  if(!silmeTarihi || !silmeTarihi.seconds) return 0;
  var fark = silmeTarihi.seconds * 1000 - Date.now();
  return Math.max(0, Math.ceil(fark / 86400000));
}

function adminSilmeIptal(uid){
  showConfirm('Talebi İptal Et',
    'Hesap yeniden aktif olacak. Kullanıcının profili, gönderileri ve ' +
    'yorumları tekrar görünür hâle gelecek.',
    function(){
      Promise.all([
        _fbDb.collection('deletionRequests').doc(uid).delete(),
        _fbDb.collection('profiles').doc(uid).set({silinecek:false}, {merge:true})
      ])
        .then(function(){
          if(_profilOnbellek) delete _profilOnbellek[uid];
          showToast('Talep iptal edildi, hesap aktif.');
          _adminYukle();
        })
        .catch(function(){ showToast('❌ İşlem başarısız.','error'); });
    }, 'İptal Et');
}

/* Hesabı ve tüm verilerini siler.

   Silinen: gönderiler (fotoğraf + yorum dahil), beğeniler,
   yorum beğenileri, takip ilişkileri, engeller, bildirimler,
   paketler, başvuru, kullanıcı adı eşlemesi, açık profil,
   özel veri belgesi.

   ⚠️ Firebase Auth hesabı silinmez — istemciden başkasının
   Auth kaydı silinemez. Kullanıcı bir daha giriş yaparsa
   boş bir hesapla karşılaşır. Gerçek uygulamada Admin SDK
   ile sunucu tarafında silinmelidir. */
function adminHesabiSil(uid){
  showConfirm('Hesabı Kalıcı Olarak Sil',
    'Bu kullanıcının TÜM verileri silinecek:\n\n' +
    '• Gönderiler, fotoğraflar, yorumlar\n' +
    '• Beğeniler ve takip ilişkileri\n' +
    '• Profil ve ölçüm verileri\n' +
    '• Hizmet paketleri\n\n' +
    'Bu işlem GERİ ALINAMAZ.',
    function(){ _adminSilmeYurut(uid); },
    'Kalıcı Olarak Sil');
}

function _adminSilmeYurut(uid){
  showToast('Siliniyor, lütfen bekle...');

  /* Alt koleksiyonlu gönderiler önce temizlenir */
  var gonderiSil = _fbDb.collection('posts').where('uid','==',uid).limit(300).get()
    .then(function(snap){
      return Promise.all(snap.docs.map(function(d){
        var ref = d.ref;
        return ref.collection('media').get()
          .then(function(m){ return Promise.all(m.docs.map(function(x){ return x.ref.delete(); })); })
          .then(function(){ return ref.collection('comments').get(); })
          .then(function(c){ return Promise.all(c.docs.map(function(x){ return x.ref.delete(); })); })
          .then(function(){ return ref.delete(); })
          .catch(function(){});
      }));
    }).catch(function(){});

  /* Düz koleksiyonlar — alan adı her birinde farklı */
  var toplu = [
    ['likes',          'uid'],
    ['commentLikes',   'uid'],
    ['packages',       'uid'],
    ['follows',        'takipEden'],
    ['follows',        'takipEdilen'],
    ['blocks',         'engelleyen'],
    ['blocks',         'engellenen'],
    ['notifications',  'hedef'],
    ['notifications',  'kimden'],
    ['followRequests', 'isteyen'],
    ['followRequests', 'hedef'],
    ['reports',        'sikayetEden']
  ].map(function(p){
    return _fbDb.collection(p[0]).where(p[1],'==',uid).limit(300).get()
      .then(function(snap){
        return Promise.all(snap.docs.map(function(d){ return d.ref.delete(); }));
      }).catch(function(){});
  });

  /* Tekil belgeler */
  var nick = null;
  var tekil = _fbDb.collection('users').doc(uid).get()
    .then(function(d){ if(d.exists) nick = (d.data().nickname||'').toLowerCase(); })
    .catch(function(){})
    .then(function(){
      var isler = [
        _fbDb.collection('profiles').doc(uid).delete().catch(function(){}),
        _fbDb.collection('users').doc(uid).delete().catch(function(){}),
        _fbDb.collection('applications').doc(uid).delete().catch(function(){}),
        _fbDb.collection('deletionRequests').doc(uid).delete().catch(function(){})
      ];
      if(nick) isler.push(_fbDb.collection('nicknames').doc(nick).delete().catch(function(){}));
      return Promise.all(isler);
    });

  Promise.all([gonderiSil].concat(toplu).concat([tekil]))
    .then(function(){
      if(_profilOnbellek) delete _profilOnbellek[uid];
      showToast('✅ Hesap ve tüm verileri silindi.');
      _adminYukle();
    })
    .catch(function(e){
      showToast('⚠️ Silme kısmen tamamlandı: ' + (e && e.message || ''),'warn');
      _adminYukle();
    });
}
