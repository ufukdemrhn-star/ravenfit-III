/* ══════════════════════════════════════════════════════════
   RavenFit — pro-application.js
   Antrenör / diyetisyen başvurusu

   AKIŞ
     yok → beklemede → onayli | red
              ↑                    ↓
              └──── yeniden başvur ┘

   applications/{uid} → { uid, rol, ad, belge, aciklama, durum, tarih }

   ⚠️ YASAL NOT — ürünleşirken kritik
   Türkiye'de "diyetisyen" korumalı bir unvandır; yalnızca
   Beslenme ve Diyetetik mezunları kullanabilir. Onay veren
   platform, sahte belgeyle gelen birinin verdiği zarardan
   sorumlu tutulabilir. Bu prototipte onay MANUEL ve demo
   amaçlıdır; gerçek uygulamada belge doğrulama süreci
   hukuki danışmanlıkla kurulmalıdır.

   ⚠️ DEPOLAMA NOTU
   Belge görseli Firestore'da base64 tutulur (Storage ücretli
   plan istiyor). Belgeler kimlik bilgisi içerdiği için
   üretimde şifreli nesne depolamaya taşınmalıdır.
   ══════════════════════════════════════════════════════════ */

var PRO_ROLLER = [
  {id:'antrenor',   ad:'Antrenör',   ikon:'🏋️',
   aciklama:'Antrenörlük belgesi, sertifika veya federasyon lisansı'},
  {id:'diyetisyen', ad:'Diyetisyen', ikon:'🥗',
   aciklama:'Beslenme ve Diyetetik lisans diploması'}
];

var PRO_DURUMLAR = {
  yok:       {ad:'Başvuru yapılmadı', renk:'var(--text3)'},
  beklemede: {ad:'İnceleniyor',       renk:'var(--warn)'},
  onayli:    {ad:'Onaylandı',         renk:'var(--success)'},
  red:       {ad:'Reddedildi',        renk:'var(--danger)'}
};

var _basvuru = { rol:null, belge:null, ad:'', aciklama:'' };

/* ── Başvuru ekranı ──────────────────────────────────────── */
function openProApplication(){
  if(!_fbUser || !_fbDb){
    showToast('Başvuru için giriş yapmalısın.','warn');
    return;
  }
  var ov = document.getElementById('pro-app-overlay');
  if(!ov) return;
  ov.classList.add('active');
  document.body.style.overflow = 'hidden';

  var govde = document.getElementById('pa-body');
  if(govde) govde.innerHTML = '<div class="dsc-durum">Yükleniyor...</div>';

  /* Mevcut başvuru var mı? */
  _fbDb.collection('applications').doc(_fbUser.uid).get()
    .then(function(doc){
      if(doc.exists) _paDurumCiz(doc.data());
      else _paFormCiz();
    })
    .catch(function(){ _paFormCiz(); });
}

function closeProApplication(){
  var ov = document.getElementById('pro-app-overlay');
  if(ov) ov.classList.remove('active');
  document.body.style.overflow = '';
  _basvuru = { rol:null, belge:null, ad:'', aciklama:'' };
}

/* Mevcut başvurunun durumu */
function _paDurumCiz(b){
  var el = document.getElementById('pa-body');
  if(!el) return;
  var d = PRO_DURUMLAR[b.durum] || PRO_DURUMLAR.yok;
  var rol = PRO_ROLLER.find(function(r){ return r.id === b.rol; });

  var html = '<div class="pa-durum-kart">';
  html +=   '<div class="pa-durum-ikon">' + (rol ? rol.ikon : '📋') + '</div>';
  html +=   '<div class="pa-durum-rol">' + (rol ? rol.ad : '') + ' Başvurusu</div>';
  html +=   '<div class="pa-durum-rozet" style="color:' + d.renk + ';' +
            'background:color-mix(in srgb,' + d.renk + ' 14%,transparent)">' +
            d.ad + '</div>';

  if(b.durum === 'beklemede'){
    html += '<div class="pa-durum-metin">Başvurun inceleniyor. ' +
            'Sonuç bildirilene kadar bekleyebilirsin.</div>';
  } else if(b.durum === 'onayli'){
    html += '<div class="pa-durum-metin">Tebrikler! Profilinde onaylı ' +
            (rol ? rol.ad.toLowerCase() : 'profesyonel') + ' rozeti görünüyor. ' +
            'Artık hizmet paketlerini paylaşabilirsin.</div>';
  } else if(b.durum === 'red'){
    html += '<div class="pa-durum-metin">' +
            (b.redSebebi || 'Başvurun onaylanmadı.') + '</div>';
    html += '<button class="btn btn-p btn-full" style="margin-top:14px" ' +
            'onclick="_paFormCiz()">Yeniden Başvur</button>';
  }
  html += '</div>';

  if(b.durum === 'beklemede'){
    html += '<button class="btn btn-s btn-full" style="margin-top:12px" ' +
            'onclick="paBasvuruIptal()">Başvuruyu Geri Çek</button>';
  }

  el.innerHTML = html;
}

/* Başvuru formu */
function _paFormCiz(){
  var el = document.getElementById('pa-body');
  if(!el) return;

  var html = '';

  /* Bilgilendirme */
  html += '<div class="pa-bilgi">' +
          '<strong>Neden belge isteniyor?</strong>' +
          'Kullanıcıların güvenliği için antrenör ve diyetisyen ' +
          'hesapları doğrulanır. Belgen yalnızca inceleme için ' +
          'kullanılır, profilinde görünmez.' +
          '</div>';

  /* Rol seçimi */
  html += '<div class="fl" style="margin-bottom:8px">Başvuru Türü</div>';
  html += '<div class="pa-roller">';
  PRO_ROLLER.forEach(function(r){
    html += '<button class="pa-rol' + (_basvuru.rol===r.id?' sec':'') + '" ' +
            'onclick="paRolSec(\'' + r.id + '\')">' +
              '<span class="pa-rol-ikon">' + r.ikon + '</span>' +
              '<span class="pa-rol-ad">' + r.ad + '</span>' +
              '<span class="pa-rol-alt">' + r.aciklama + '</span>' +
            '</button>';
  });
  html += '</div>';

  /* Ad soyad */
  html += '<div class="fg" style="margin-top:16px">' +
            '<label class="fl">Belgedeki Ad Soyad</label>' +
            '<input class="fi" id="pa-ad" type="text" maxlength="60" ' +
              'value="' + _paKacir(_basvuru.ad) + '" ' +
              'placeholder="Belgede yazdığı gibi">' +
          '</div>';

  /* Belge yükleme */
  html += '<div class="fg" style="margin-top:14px">' +
            '<label class="fl">Belge Görseli</label>';
  if(_basvuru.belge){
    html +=   '<div class="pa-belge">' +
                '<img src="' + _basvuru.belge.veri + '" alt="Belge">' +
                '<button class="pa-belge-sil" onclick="paBelgeSil()" aria-label="Kaldır">&times;</button>' +
                '<span class="pa-belge-boyut">' + baytMetni(_basvuru.belge.bayt) + '</span>' +
              '</div>';
  } else {
    html +=   '<button class="pa-belge-ekle" onclick="paBelgeSec()">' +
                '<span>📄</span>Belge fotoğrafı yükle' +
                '<small>Diploma, sertifika veya lisans</small>' +
              '</button>';
  }
  html += '</div>';

  /* Açıklama */
  html += '<div class="fg" style="margin-top:14px">' +
            '<label class="fl">Açıklama <span style="color:var(--text3)">(isteğe bağlı)</span></label>' +
            '<textarea class="fi" id="pa-aciklama" rows="3" maxlength="300" ' +
              'placeholder="Uzmanlık alanın, deneyimin...">' +
              _paKacir(_basvuru.aciklama) + '</textarea>' +
          '</div>';

  /* Onay metni */
  html += '<label class="pa-onay">' +
            '<input type="checkbox" id="pa-kabul">' +
            '<span>Yüklediğim belgenin bana ait ve geçerli olduğunu, ' +
            'yanlış beyanın hesabımın kapatılmasına yol açabileceğini kabul ediyorum.</span>' +
          '</label>';

  el.innerHTML = html;
}

function paRolSec(rol){
  _paFormDurumuSakla();
  _basvuru.rol = rol;
  _paFormCiz();
}

function _paFormDurumuSakla(){
  var ad = document.getElementById('pa-ad');
  var ac = document.getElementById('pa-aciklama');
  if(ad) _basvuru.ad = ad.value;
  if(ac) _basvuru.aciklama = ac.value;
}

function paBelgeSec(){
  var inp = document.getElementById('pa-file-input');
  if(inp) inp.click();
}

function paBelgeEklendi(olay){
  var inp = (olay && olay.target) ? olay.target : olay;
  if(!inp || !inp.files || !inp.files.length) return;
  _paFormDurumuSakla();

  var el = document.getElementById('pa-body');
  /* Belge okunabilir kalmalı — avatar profilinden daha büyük */
  gorselSikistir(inp.files[0], 'tam').then(function(sonuc){
    _basvuru.belge = sonuc;
    _paFormCiz();
  }).catch(function(e){
    showToast('❌ ' + (e && e.message || 'Belge işlenemedi.'),'error');
  });
  try { inp.value = ''; } catch(e){}
}

function paBelgeSil(){
  _paFormDurumuSakla();
  _basvuru.belge = null;
  _paFormCiz();
}

function paGonder(){
  _paFormDurumuSakla();
  var kabul = document.getElementById('pa-kabul');

  if(!_basvuru.rol){ return showToast('Başvuru türünü seç.','warn'); }
  if(!_basvuru.ad.trim()){ return showToast('Belgedeki ad soyadı gir.','warn'); }
  if(!_basvuru.belge){ return showToast('Belge görseli yükle.','warn'); }
  if(!kabul || !kabul.checked){ return showToast('Beyanı kabul etmelisin.','warn'); }

  var btn = document.getElementById('pa-gonder-btn');
  if(btn){ btn.disabled = true; btn.textContent = 'Gönderiliyor...'; }

  _fbDb.collection('applications').doc(_fbUser.uid).set({
    uid: _fbUser.uid,
    rol: _basvuru.rol,
    ad: _basvuru.ad.trim(),
    aciklama: (_basvuru.aciklama || '').trim(),
    belge: _basvuru.belge.veri,
    durum: 'beklemede',
    tarih: firebase.firestore.FieldValue.serverTimestamp()
  })
    .then(function(){
      /* Yerel profile de yaz — arayüz hemen güncellensin */
      var p = getYerelProfil();
      p.rol = _basvuru.rol;
      p.onay = 'beklemede';
      saveYerelProfil(p);
      if(typeof yayinlaProfil === 'function') yayinlaProfil();

      if(btn){ btn.disabled = false; btn.textContent = 'Başvuruyu Gönder'; }
      showToast('✅ Başvurun alındı, inceleniyor.');
      openProApplication();   /* durum ekranına dön */
      if(typeof renderProfil === 'function') renderProfil();
    })
    .catch(function(e){
      if(btn){ btn.disabled = false; btn.textContent = 'Başvuruyu Gönder'; }
      showToast('❌ Başvuru gönderilemedi: ' + (e && e.message || ''),'error');
    });
}

function paBasvuruIptal(){
  showConfirm('Başvuruyu Geri Çek',
    'Başvurun silinecek. Daha sonra yeniden başvurabilirsin.',
    function(){
      _fbDb.collection('applications').doc(_fbUser.uid).delete()
        .then(function(){
          var p = getYerelProfil();
          p.rol = 'uye'; p.onay = 'yok';
          saveYerelProfil(p);
          if(typeof yayinlaProfil === 'function') yayinlaProfil();
          _basvuru = { rol:null, belge:null, ad:'', aciklama:'' };
          _paFormCiz();
          showToast('Başvurun geri çekildi.');
          if(typeof renderProfil === 'function') renderProfil();
        })
        .catch(function(){ showToast('❌ İşlem başarısız.','error'); });
    }, 'Geri Çek');
}

function _paKacir(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
