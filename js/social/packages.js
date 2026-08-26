/* ══════════════════════════════════════════════════════════
   RavenFit — packages.js
   Hizmet paketleri

   packages/{id} → { uid, ad, aciklama, sure, fiyat, kapsam[],
                     aktif, tarih }

   Paketler gönderiler gibi paylaşılır ama TEK SÜTUN ızgarada
   listelenir — fiyat ve kapsam okunabilir olmalı, küçük kare
   içine sığmaz.

   ⚠️ ÖDEME YOK
   Bu sürümde satın alma yoktur. "İletişime Geç" butonu
   mesajlaşmaya yönlendirir. Gerçek ödeme için lisanslı
   ödeme kuruluşu, şirket ve sözleşme altyapısı gerekir.
   ══════════════════════════════════════════════════════════ */

var PAKET_SURELERI = [
  {id:'tek',    ad:'Tek Seans',  carpan:1},
  {id:'1ay',    ad:'1 Ay',       carpan:1},
  {id:'3ay',    ad:'3 Ay',       carpan:3},
  {id:'6ay',    ad:'6 Ay',       carpan:6},
  {id:'12ay',   ad:'12 Ay',      carpan:12}
];

/* Kapsam maddeleri — antrenör seçer, kullanıcı ne aldığını bilir */
var PAKET_KAPSAM = [
  {id:'program',   ad:'Kişiye özel antrenman programı', ikon:'📋'},
  {id:'diyet',     ad:'Beslenme planı',                 ikon:'🥗'},
  {id:'gorusme',   ad:'Görüntülü görüşme',              ikon:'📹'},
  {id:'mesaj',     ad:'Mesajla destek',                 ikon:'💬'},
  {id:'olcum',     ad:'Ölçüm takibi',                   ikon:'📏'},
  {id:'revizyon',  ad:'Program revizyonu',              ikon:'🔄'},
  {id:'form',      ad:'Form kontrolü (video analizi)',  ikon:'🎥'},
  {id:'supplement',ad:'Supplement önerisi',             ikon:'💊'}
];

var PAKET_MAX = 6;   /* profil başına en fazla paket */

var _paket = {
  id:null, ad:'', aciklama:'', sure:'1ay', fiyat:'',
  kapsam:[], kapsamAdet:{}, aktif:true
};

/* ── Paket düzenleyici ───────────────────────────────────── */
function openPackageEditor(paketId){
  if(!_fbUser || !_fbDb){
    showToast('Giriş yapmalısın.','warn');
    return;
  }
  var p = getYerelProfil();
  if(p.onay !== 'onayli'){
    showToast('Paket paylaşmak için onaylı profesyonel olmalısın.','warn');
    return;
  }

  _paket = {id:null, ad:'', aciklama:'', sure:'1ay', fiyat:'',
            kapsam:[], kapsamAdet:{}, aktif:true};

  var ov = document.getElementById('package-editor-overlay');
  if(!ov) return;
  ov.classList.add('active');
  document.body.style.overflow = 'hidden';

  if(paketId){
    _fbDb.collection('packages').doc(paketId).get()
      .then(function(doc){
        if(doc.exists){
          var d = doc.data();
          _paket = {
            id: paketId, ad: d.ad||'', aciklama: d.aciklama||'',
            sure: d.sure||'1ay', fiyat: d.fiyat||'',
            kapsam: d.kapsam||[], kapsamAdet: d.kapsamAdet||{},
            aktif: d.aktif !== false
          };
        }
        _pkCiz();
      })
      .catch(function(){ _pkCiz(); });
  } else {
    _pkCiz();
  }
}

function closePackageEditor(){
  var ov = document.getElementById('package-editor-overlay');
  if(ov) ov.classList.remove('active');
  document.body.style.overflow = '';
}

function _pkDurumSakla(){
  var ad = document.getElementById('pk-ad');
  var ac = document.getElementById('pk-aciklama');
  var fi = document.getElementById('pk-fiyat');
  if(ad) _paket.ad = ad.value;
  if(ac) _paket.aciklama = ac.value;
  if(fi) _paket.fiyat = fi.value;
}

function pkSureSec(sure){ _pkDurumSakla(); _paket.sure = sure; _pkCiz(); }

function pkKapsamToggle(id){
  _pkDurumSakla();
  var i = _paket.kapsam.indexOf(id);
  if(i >= 0){
    _paket.kapsam.splice(i,1);
    delete _paket.kapsamAdet[id];
  } else {
    _paket.kapsam.push(id);
    _paket.kapsamAdet[id] = '';
  }
  _pkCiz();
}

function pkKapsamAdet(id, deger){
  _paket.kapsamAdet[id] = deger;
}

function _pkCiz(){
  var el = document.getElementById('pk-body');
  if(!el) return;

  var html = '';

  html += '<div class="fg"><label class="fl">Paket Adı</label>' +
          '<input class="fi" id="pk-ad" type="text" maxlength="50" ' +
          'value="' + _pkKacir(_paket.ad) + '" placeholder="Örn: Başlangıç Paketi"></div>';

  /* Süre */
  html += '<div class="fl" style="margin:14px 0 8px">Süre</div>';
  html += '<div class="pk-sureler">';
  PAKET_SURELERI.forEach(function(s){
    html += '<button class="pk-sure' + (_paket.sure===s.id?' sec':'') + '" ' +
            'onclick="pkSureSec(\'' + s.id + '\')">' + s.ad + '</button>';
  });
  html += '</div>';

  /* Fiyat */
  html += '<div class="fg" style="margin-top:14px"><label class="fl">Fiyat (KDV dahil)</label>' +
          '<div class="iw"><input class="fi" id="pk-fiyat" type="number" inputmode="numeric" ' +
          'value="' + _pkKacir(_paket.fiyat) + '" placeholder="1500" oninput="pkFiyatDegisti()">' +
          '<span class="iu">₺</span></div></div>';

  /* Kazanç özeti — canlı */
  html += '<div class="pk-kazanc" id="pk-kazanc"></div>';

  /* Kapsam */
  html += '<div class="fl" style="margin:16px 0 8px">Pakete Dahil Olanlar</div>';
  html += '<div class="pk-kapsamlar">';
  PAKET_KAPSAM.forEach(function(k){
    var secili = _paket.kapsam.indexOf(k.id) >= 0;
    html += '<div class="pk-kapsam' + (secili?' sec':'') + '">';
    html +=   '<button class="pk-kapsam-btn" onclick="pkKapsamToggle(\'' + k.id + '\')">';
    html +=     '<span class="pk-kapsam-ikon">' + k.ikon + '</span>';
    html +=     '<span class="pk-kapsam-ad">' + k.ad + '</span>';
    html +=     '<span class="pk-kapsam-tik">' + (secili?'✓':'') + '</span>';
    html +=   '</button>';
    if(secili){
      html += '<input class="pk-kapsam-adet" type="text" maxlength="24" ' +
              'value="' + _pkKacir(_paket.kapsamAdet[k.id]||'') + '" ' +
              'placeholder="örn: haftada 2, sınırsız..." ' +
              'oninput="pkKapsamAdet(\'' + k.id + '\', this.value)">';
    }
    html += '</div>';
  });
  html += '</div>';

  html += '<div class="fg" style="margin-top:16px"><label class="fl">Açıklama</label>' +
          '<textarea class="fi" id="pk-aciklama" rows="3" maxlength="300" ' +
          'placeholder="Bu pakette neler yapıyorsun, kimler için uygun...">' +
          _pkKacir(_paket.aciklama) + '</textarea></div>';

  el.innerHTML = html;
  pkFiyatDegisti();
}

/* Fiyat değişince kazanç özetini güncelle */
function pkFiyatDegisti(){
  var fi = document.getElementById('pk-fiyat');
  var kutu = document.getElementById('pk-kazanc');
  if(!fi || !kutu) return;

  var fiyat = Number(fi.value) || 0;
  if(fiyat <= 0){
    kutu.innerHTML = '<div class="pk-kazanc-bos">Fiyat gir, ne kazanacağını hesaplayalım.</div>';
    return;
  }

  var r = paketKazancHesapla({
    fiyat: fiyat, kdvDahil: true,
    adet: Number(_lsGet('rf_paket_adet')) || 12,
    digerGelir: Number(_lsGet('rf_diger_gelir')) || 0,
    giderOrani: (Number(_lsGet('rf_gider_orani')) || 15) / 100
  });

  kutu.innerHTML =
    '<div class="pk-kazanc-ust">' +
      '<div><div class="pk-kazanc-lbl">Cebine kalan</div>' +
        '<div class="pk-kazanc-net">' + paraFormat(r.netKazanc) + '</div></div>' +
      '<button class="pk-kazanc-detay" onclick="openPricingCalc()">Detay ›</button>' +
    '</div>' +
    '<div class="pk-kazanc-bar">' +
      '<span style="flex:' + Math.max(1, r.netKazanc)   + ';background:var(--success)" title="Net"></span>' +
      '<span style="flex:' + Math.max(1, r.vergi)       + ';background:var(--warn)"    title="Vergi"></span>' +
      '<span style="flex:' + Math.max(1, r.kdvTutari)   + ';background:var(--info)"    title="KDV"></span>' +
      '<span style="flex:' + Math.max(1, r.giderler)    + ';background:var(--text3)"   title="Gider"></span>' +
      '<span style="flex:' + Math.max(1, r.komisyon)    + ';background:var(--accent)"  title="Komisyon"></span>' +
    '</div>' +
    '<div class="pk-kazanc-not">Fiyatın %' + Math.round(r.netOran*100) + '\'i sana kalıyor</div>';
}

function pkKaydet(){
  _pkDurumSakla();
  if(!_paket.ad.trim())  return showToast('Paket adı gir.','warn');
  if(!Number(_paket.fiyat)) return showToast('Geçerli bir fiyat gir.','warn');
  if(!_paket.kapsam.length) return showToast('En az bir kapsam maddesi seç.','warn');

  var btn = document.getElementById('pk-kaydet-btn');
  if(btn){ btn.disabled = true; btn.textContent = 'Kaydediliyor...'; }

  var veri = {
    uid: _fbUser.uid,
    ad: _paket.ad.trim(),
    aciklama: _paket.aciklama.trim(),
    sure: _paket.sure,
    fiyat: Number(_paket.fiyat),
    kapsam: _paket.kapsam,
    kapsamAdet: _paket.kapsamAdet,
    aktif: _paket.aktif !== false,
    guncelleme: firebase.firestore.FieldValue.serverTimestamp()
  };

  var ref = _paket.id
    ? _fbDb.collection('packages').doc(_paket.id)
    : _fbDb.collection('packages').doc();
  if(!_paket.id) veri.tarih = firebase.firestore.FieldValue.serverTimestamp();

  ref.set(veri, {merge: !!_paket.id})
    .then(function(){
      if(btn){ btn.disabled = false; btn.textContent = 'Kaydet'; }
      closePackageEditor();
      showToast('✅ Paket kaydedildi.');
      if(typeof _renderProfilSekmesi === 'function') _renderProfilSekmesi();
    })
    .catch(function(e){
      if(btn){ btn.disabled = false; btn.textContent = 'Kaydet'; }
      showToast('❌ Kaydedilemedi: ' + (e && e.message || ''),'error');
    });
}

/* ── Paket okuma ve listeleme ────────────────────────────── */
function paketleriGetir(uid){
  return new Promise(function(cozumle){
    if(!_fbDb) return cozumle([]);
    _fbDb.collection('packages').where('uid','==',uid).limit(20).get()
      .then(function(snap){
        var liste = [];
        snap.forEach(function(d){ var p = d.data(); p.id = d.id; liste.push(p); });
        liste.sort(function(a,b){ return (a.fiyat||0) - (b.fiyat||0); });
        cozumle(liste);
      })
      .catch(function(){ cozumle([]); });
  });
}

/* Tek sütun paket listesi — fiyat ve kapsam okunabilir olmalı */
function paketListesiHTML(liste, benimMi){
  if(!liste.length){
    return '<div class="pr-tab-bos"><span class="ikon">📣</span>' +
           (benimMi
             ? '<strong>Henüz paket yok</strong><br>İlk hizmet paketini oluştur.' +
               '<br><br><button class="btn btn-p" onclick="openPackageEditor()">+ Paket Oluştur</button>'
             : 'Bu kullanıcı henüz hizmet paketi paylaşmamış.') +
           '</div>';
  }

  var html = '<div class="pkl">';
  liste.forEach(function(p){
    if(!benimMi && p.aktif === false) return;
    var sure = PAKET_SURELERI.find(function(s){ return s.id === p.sure; });
    var pasif = p.aktif === false;

    html += '<div class="pkl-kart' + (pasif?' pasif':'') + '">';
    html +=   '<div class="pkl-ust">';
    html +=     '<div class="pkl-ad">' + _pkKacir(p.ad) +
                (pasif ? ' <span class="pkl-pasif">Pasif</span>' : '') + '</div>';
    html +=     '<div class="pkl-fiyat">' + paraFormat(p.fiyat) +
                '<span>/' + (sure ? sure.ad : p.sure) + '</span></div>';
    html +=   '</div>';

    if(p.aciklama){
      html += '<div class="pkl-aciklama">' + _pkKacir(p.aciklama) + '</div>';
    }

    if(p.kapsam && p.kapsam.length){
      html += '<div class="pkl-kapsam">';
      p.kapsam.forEach(function(kid){
        var k = PAKET_KAPSAM.find(function(x){ return x.id === kid; });
        if(!k) return;
        var adet = p.kapsamAdet && p.kapsamAdet[kid];
        html += '<div class="pkl-madde">' +
                  '<span class="pkl-madde-ikon">' + k.ikon + '</span>' +
                  '<span>' + k.ad + (adet ? ' <b>· ' + _pkKacir(adet) + '</b>' : '') + '</span>' +
                '</div>';
      });
      html += '</div>';
    }

    html += '<div class="pkl-eylemler">';
    if(benimMi){
      html += '<button class="pkl-btn" onclick="openPackageEditor(\'' + p.id + '\')">✏️ Düzenle</button>';
      html += '<button class="pkl-btn" onclick="paketAktiflik(\'' + p.id + '\',' + !pasif + ')">' +
              (pasif ? 'Yayınla' : 'Gizle') + '</button>';
      html += '<button class="pkl-btn sil" onclick="paketSil(\'' + p.id + '\')">Sil</button>';
    } else {
      html += '<button class="pkl-btn birincil" onclick="showToast(\'Mesajlaşma yakında eklenecek.\',\'warn\')">' +
              'İletişime Geç</button>';
    }
    html += '</div>';
    html += '</div>';
  });
  html += '</div>';

  if(benimMi && liste.length < PAKET_MAX){
    html += '<button class="btn btn-s btn-full" style="margin-top:10px" ' +
            'onclick="openPackageEditor()">+ Yeni Paket</button>';
  }
  return html;
}

function paketAktiflik(id, gizle){
  _fbDb.collection('packages').doc(id).set({aktif: !gizle}, {merge:true})
    .then(function(){
      showToast(gizle ? 'Paket gizlendi.' : 'Paket yayınlandı.');
      if(typeof _renderProfilSekmesi === 'function') _renderProfilSekmesi();
    })
    .catch(function(){ showToast('❌ İşlem başarısız.','error'); });
}

function paketSil(id){
  showConfirm('Paketi Sil','Bu paket kalıcı olarak silinecek.', function(){
    _fbDb.collection('packages').doc(id).delete()
      .then(function(){
        showToast('Paket silindi.');
        if(typeof _renderProfilSekmesi === 'function') _renderProfilSekmesi();
      })
      .catch(function(){ showToast('❌ Silinemedi.','error'); });
  }, 'Sil');
}

function _pkKacir(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
