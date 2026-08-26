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
