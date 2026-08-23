/* ══════════════════════════════════════════════════════════
   RavenFit — storage.js
   localStorage okuma/yazma, dışa/içe aktarma
   ══════════════════════════════════════════════════════════ */

function getEntries(){try{return JSON.parse(_lsGet('rf_entries')||'[]');}catch(e){return[];}}

/* Merkezi entry yazma — tüm ölçüm kayıtları buradan geçer.
   Modülerleşmede → js/core/storage.js */

function _setEntries(entries){
  try { _lsSet('rf_entries', JSON.stringify(entries)); }
  catch(e){ console.warn('_setEntries hata:', e); }
}

function resetAll(){
  showConfirm('Tüm Verileri Sıfırla','Tüm veriler, ölçümler ve geçmiş kayıtlar silinecek. Emin misin?',function(){
    _lsRemove('rf_data');_lsRemove('rf_entries');_lsRemove('rf_water_today');_lsRemove('rf_workout_logs');_lsRemove('rf_custom_workouts');_lsRemove('rf_supplements_used');_lsRemove('rf_badges');
    /* Firebase'den de sil */
    if(_fbUser&&_fbDb){
      _fbDb.collection('users').doc(_fbUser.uid).set({rf_data:'',rf_entries:'[]',updated:firebase.firestore.FieldValue.serverTimestamp()},{merge:true})
        .catch(function(e){ console.warn('Bulut sıfırlama başarısız:', e && e.message); });
    }
    U={};R={};A={};BT={};selST=null;selGL=null;step=0;clearInterval(_chronoInterval);clearInterval(_restInterval);_setCount=0;_chronoRunning=false;_chronoMs=0;_restActive=false;_suppStep=0;_suppAnswers={};
    document.querySelectorAll('#wizard input.fi').forEach(function(inp){inp.value='';});
    document.querySelectorAll('.gbtn.sel').forEach(function(el){el.classList.remove('sel');});
    document.querySelectorAll('.oc.sel').forEach(function(el){el.classList.remove('sel');});
    document.getElementById('bottom-nav').classList.remove('visible');
    goHome();
    showToast('Tüm veriler sıfırlandı.','success');
  },'Evet, Sıfırla');
}

/* ── Export / Import ─────────────────────────────────── */

/* Yedeklenen tüm localStorage anahtarları.
   Firebase senkronu ile aynı listede olmalı — aksi halde yedekten
   dönen kullanıcı antrenman geçmişini, rozetlerini kaybeder. */
var YEDEK_ANAHTARLARI = [
  'rf_data',               /* profil, ölçüler, hedefler */
  'rf_entries',            /* haftalık ölçüm kayıtları */
  'rf_workout_logs',       /* antrenman geçmişi */
  'rf_custom_workouts',    /* kullanıcının oluşturduğu programlar */
  'rf_branches',           /* seçili branşlar */
  'rf_badges',             /* kazanılan rozetler */
  'rf_supplements_used',   /* kullanılan supplementler */
  'rf_pr_plates',          /* PR testi plaka ayarları */
  'rf_theme',              /* tema */
  'rf_unit',               /* birim (kg/lb) */
  'rf_level_mode'          /* seviye modu */
];

function exportData(){
  var data = {
    _format: 'ravenfit-backup',
    version: '0.5.0.0',
    exported: new Date().toISOString()
  };
  var kayitli = 0;
  YEDEK_ANAHTARLARI.forEach(function(k){
    var v = _lsGet(k);
    if(v !== null && v !== undefined){ data[k] = v; kayitli++; }
  });

  var blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ravenfit_yedek_' + new Date().toLocaleDateString('tr-TR').replace(/\./g,'-') + '.json';
  a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
  showToast('✅ ' + kayitli + ' veri türü yedeklendi!');
}

function importData(){
  var inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json';
  inp.onchange = function(e){
    var file = e.target.files[0];
    if(!file) return;
    if(file.size > 20 * 1024 * 1024){
      showToast('❌ Dosya çok büyük (20 MB üstü).','error');
      return;
    }
    var reader = new FileReader();
    reader.onerror = function(){ showToast('❌ Dosya okunamadı.','error'); };
    reader.onload = function(ev){
      var data;
      try {
        data = JSON.parse(ev.target.result);
      } catch(ex){
        showToast('❌ Geçersiz dosya — JSON okunamadı.','error');
        return;
      }

      /* ── Yapı doğrulaması ── */
      if(!data || typeof data !== 'object' || Array.isArray(data)){
        showToast('❌ Bu bir RavenFit yedek dosyası değil.','error');
        return;
      }
      var tanidik = YEDEK_ANAHTARLARI.filter(function(k){ return k in data; });
      if(tanidik.length === 0){
        showToast('❌ Dosyada RavenFit verisi bulunamadı.','error');
        return;
      }
      /* Her değer string olmalı (localStorage formatı) */
      var bozuk = tanidik.filter(function(k){ return typeof data[k] !== 'string'; });
      if(bozuk.length){
        showToast('❌ Yedek dosyası bozuk: ' + bozuk[0],'error');
        return;
      }

      /* ── Kullanıcı onayı — mevcut veri silinecek ── */
      var tarih = data.exported
        ? new Date(data.exported).toLocaleDateString('tr-TR')
        : 'bilinmiyor';
      showConfirm(
        'Yedeği Geri Yükle',
        tanidik.length + ' veri türü bulundu (yedek tarihi: ' + tarih + ').\n\n' +
        'Mevcut verilerinin üzerine yazılacak. Devam edilsin mi?',
        function(){
          var yazildi = 0;
          tanidik.forEach(function(k){
            if(_lsSet(k, data[k])) yazildi++;
          });
          if(yazildi === 0){
            showToast('❌ Hiçbir veri yazılamadı (depolama dolu olabilir).','error');
            return;
          }
          if(typeof saveToFirebase === 'function') saveToFirebase();
          showToast('✅ ' + yazildi + ' veri türü geri yüklendi. Yenileniyor...');
          setTimeout(function(){ location.reload(); }, 1500);
        },
        'Evet, Geri Yükle'
      );
    };
    reader.readAsText(file);
  };
  inp.click();
}

/* ══════════════════════════════════════════════════════════
   GÜVENLİ DEPOLAMA KATMANI

   Sorun: localStorage kotası dolduğunda setItem istisna fırlatır.
   Bu istisna yakalanmazsa çağıran fonksiyon yarıda kesilir —
   örneğin saveData() içinde Firebase senkronizasyonuna hiç
   sıra gelmez ve kullanıcı verisi hem yerelde hem bulutta kaybolur.

   Tipik kota: 5–10 MB. Avatar (2 MB'a kadar base64) + zamanla
   büyüyen antrenman geçmişi bu sınırı gerçekten zorlayabilir.
   ══════════════════════════════════════════════════════════ */

var _lsKotaUyarildi = false;

/* Güvenli yazma. Başarılıysa true, değilse false döner — asla fırlatmaz. */
function _lsSet(anahtar, deger){
  try {
    localStorage.setItem(anahtar, deger);
    return true;
  } catch(e){
    var kotaHatasi = e && (
      e.name === 'QuotaExceededError' ||
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      e.code === 22 || e.code === 1014
    );
    if(kotaHatasi){
      console.warn('⚠️ localStorage kotası doldu — yazılamadı:', anahtar);
      /* Kullanıcıyı bir kez uyar, her yazmada rahatsız etme */
      if(!_lsKotaUyarildi){
        _lsKotaUyarildi = true;
        if(typeof showToast === 'function'){
          showToast('⚠️ Cihaz depolaması doldu. Profil → Ayarlar → Verileri Dışa Aktar ile yedek al.','error');
        }
      }
    } else {
      console.warn('localStorage yazma hatası:', e && e.message);
    }
    return false;
  }
}

/* Güvenli okuma — depolama erişilemezse varsayılan döner. */
function _lsGet(anahtar, varsayilan){
  try {
    var v = localStorage.getItem(anahtar);
    return v === null ? (varsayilan === undefined ? null : varsayilan) : v;
  } catch(e){
    return varsayilan === undefined ? null : varsayilan;
  }
}

/* Güvenli silme. */
function _lsRemove(anahtar){
  try { localStorage.removeItem(anahtar); return true; }
  catch(e){ return false; }
}

/* Depolama kullanımı — Ayarlar ekranında gösterilir.
   Boyut UTF-16 varsayımıyla hesaplanır (karakter başına 2 bayt). */
function _lsKullanim(){
  var toplam = 0, kalemler = [];
  try {
    for(var i = 0; i < localStorage.length; i++){
      var k = localStorage.key(i);
      var v = localStorage.getItem(k) || '';
      var bayt = (k.length + v.length) * 2;
      toplam += bayt;
      if(k.indexOf('rf_') === 0 || k === 'avatar'){
        kalemler.push({anahtar:k, bayt:bayt});
      }
    }
  } catch(e){}
  kalemler.sort(function(a,b){ return b.bayt - a.bayt; });
  return {
    toplamBayt: toplam,
    toplamKB: Math.round(toplam / 1024),
    kalemler: kalemler,
    /* Tarayıcılarda tipik sınır 5 MB */
    doluluk: Math.min(100, Math.round(toplam / (5 * 1024 * 1024) * 100))
  };
}
