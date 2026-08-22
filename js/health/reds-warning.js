/* ══════════════════════════════════════════════════════════
   RavenFit — reds-warning.js
   RED-S ve Bulk sağlık uyarıları
   ══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   ⚠️ RED-S & BULK SAĞLIK UYARI SİSTEMLERİ
   Modülerleşmede → js/health/reds-warning.js
   ══════════════════════════════════════════════════════════ */

/* ── RED-S (Relative Energy Deficiency in Sport) ──────────
   Cut seçiminde yağ oranı çok düşükse uyarı çıkarır.
   Referans: IOC 2023 RED-S konsensüsü. */

var _redsPendingCallback = null;

   /* Bekleyen cut seçimi callback'i */

var _redsAcknowledged = false;

     /* Bu oturumda kabul edildi mi? */

function _checkRedsRisk(gl){
  if(gl !== 'cut') return false;
  if(_redsAcknowledged) return false; /* zaten kabul etti */
  var bf = R.bf;
  if(bf == null) return false;
  var male = U.gender === 'male';
  if(male && bf < 6) return true;
  if(!male && bf < 14) return true;
  return false;
}

function openRedsWarning(proceedCallback){
  _redsPendingCallback = proceedCallback || null;
  var body = document.getElementById('reds-warning-body');
  if(!body) return;
  
  var male = U.gender === 'male';
  var bf = R.bf;
  var threshold = male ? 6 : 14;
  
  body.innerHTML = 
    '<p style="margin:0 0 12px 0">Tahmini vücut yağ oranın <strong style="color:var(--warn)">%'+bf.toFixed(1)+'</strong>. '+(male?'Erkeklerde':'Kadınlarda')+' yaklaşık <strong>%'+threshold+'</strong> altındaki yağ oranlarında <strong>kalori açığı</strong> oluşturmak, literatürde aşağıdaki risk artışlarıyla <strong>ilişkilendirilmiştir</strong>:</p>'+
    '<ul style="margin:0 0 12px 18px;padding:0;font-size:12px;color:var(--text2);line-height:1.7">'+
      '<li>'+(male?'Testosteron seviyelerinde düşüş eğilimi':'Menstrual döngü düzensizlikleri (oligomenore / amenore)')+'</li>'+
      '<li>Tiroid hormonu (T3) düşüşü ve metabolik hızda yavaşlama</li>'+
      '<li>Kemik mineral yoğunluğu kaybı (stres kırığı riski artar)</li>'+
      '<li>Kas protein sentezinde azalma, kas kaybı eğilimi</li>'+
      '<li>Performans, güç ve toparlanma kapasitesinde düşüş</li>'+
      '<li>Bağışıklık fonksiyonunda gerileme</li>'+
      '<li>Uyku kalitesi ve ruh hali üzerinde olumsuz etkiler</li>'+
    '</ul>'+
    '<p style="margin:0;font-size:12px;color:var(--text2)">Bu eşik <strong>kesin bir tıbbi sınır değildir</strong>; bireysel genetik, spor türü, hormonal profil ve enerji alımına göre değişir. Ancak çoğunluk literatür bu seviyelerin altında <strong>düşük enerji erişilebilirliği (LEA)</strong> riskinin belirgin artığını göstermektedir.</p>';
  
  document.getElementById('reds-warning-overlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function redsWarningProceed(){
  _redsAcknowledged = true;
  document.getElementById('reds-warning-overlay').style.display = 'none';
  document.body.style.overflow = '';
  if(typeof _redsPendingCallback === 'function'){
    var cb = _redsPendingCallback;
    _redsPendingCallback = null;
    cb();
  }
}

function redsWarningCancel(){
  document.getElementById('reds-warning-overlay').style.display = 'none';
  document.body.style.overflow = '';
  _redsPendingCallback = null;
  /* selGL'i resetle veya maintain'e çek */
  if(typeof selGL !== 'undefined'){
    selGL = 'maintain';
    /* UI butonlarını yenile */
    try {
      document.querySelectorAll('[data-g="gl"]').forEach(function(b){
        b.classList.remove('sel');
        if(b.getAttribute('data-v')==='maintain') b.classList.add('sel');
      });
      if(typeof renderGoalStep === 'function') renderGoalStep();
      if(typeof renderAll === 'function') renderAll();
    } catch(e){ console.warn('RED-S cancel UI sync:',e); }
  }
}

/* ── BULK UYARI SİSTEMİ ───────────────────────────────────
   Bulk seçiminde yağ oranı yüksekse (E >%20, K >%30) uyarır.
   Referans: Helms, Trexler, Nuckols, Henselmans — hipertrofi literatürü. */

var _bulkPendingCallback = null;

var _bulkAcknowledged = false;

function _checkBulkRisk(gl){
  if(gl !== 'bulk') return false;
  if(_bulkAcknowledged) return false;
  var bf = R.bf;
  if(bf == null) return false;
  var male = U.gender === 'male';
  if(male && bf > 20) return true;
  if(!male && bf > 30) return true;
  return false;
}

function openBulkWarning(proceedCallback){
  _bulkPendingCallback = proceedCallback || null;
  var body = document.getElementById('bulk-warning-body');
  if(!body) return;
  
  var male = U.gender === 'male';
  var bf = R.bf;
  var threshold = male ? 20 : 30;
  
  body.innerHTML = 
    '<p style="margin:0 0 12px 0">Tahmini vücut yağ oranın <strong style="color:var(--warn)">%'+bf.toFixed(1)+'</strong>. '+(male?'Erkeklerde':'Kadınlarda')+' yaklaşık <strong>%'+threshold+'</strong> üzerindeki yağ oranlarında <strong>bulk</strong> başlatmak, çoğunluk literatürde aşağıdaki etkilerle <strong>ilişkilendirilmiştir</strong>:</p>'+
    '<ul style="margin:0 0 12px 18px;padding:0;font-size:12px;color:var(--text2);line-height:1.7">'+
      '<li><strong>Nutrient partitioning</strong> (besin dağıtımı) bozulabilir — kalori fazlası yağ depolama yönüne kayar</li>'+
      '<li>İnsülin duyarlılığında <strong>azalma eğilimi</strong> görülebilir</li>'+
      '<li>'+(male?'Aromataz aktivitesinde artış → östrojen-testosteron oranı değişebilir':'Hormonal dengede ve adipokine seviyelerinde değişim')+'</li>'+
      '<li>Kronik düşük seviyeli inflamasyon riski artar</li>'+
      '<li>Bulk sonunda gereken cut süresi <strong>uzayabilir</strong></li>'+
      '<li>Görsel olarak kas tanımı belirgin biçimde azalır</li>'+
      '<li>Toparlanma kalitesi ve uyku üzerinde olumsuz etkiler olabilir</li>'+
    '</ul>'+
    '<p style="margin:0;font-size:12px;color:var(--text2)">Önemli not: Bu konuda <strong>kanıt-bazlı yaklaşımlar tartışmalıdır</strong>. Bazı güncel araştırmalar (Nuckols, Trexler) yağ oranıyla p-ratio arasındaki ilişkinin daha zayıf olduğunu öne sürer. Yine de çoğunluk pratisyenler ve klasik hipertrofi rehberleri (Helms, ACSM) bu eşiklerin altında bulk başlatmayı önerir.</p>';
  
  document.getElementById('bulk-warning-overlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function bulkWarningProceed(){
  _bulkAcknowledged = true;
  document.getElementById('bulk-warning-overlay').style.display = 'none';
  document.body.style.overflow = '';
  if(typeof _bulkPendingCallback === 'function'){
    var cb = _bulkPendingCallback;
    _bulkPendingCallback = null;
    cb();
  }
}

function bulkWarningCancel(){
  document.getElementById('bulk-warning-overlay').style.display = 'none';
  document.body.style.overflow = '';
  _bulkPendingCallback = null;
  /* Recomp'a çek */
  if(typeof selGL !== 'undefined'){
    selGL = 'recomp';
    try {
      document.querySelectorAll('[data-g="gl"]').forEach(function(b){
        b.classList.remove('sel');
        if(b.getAttribute('data-v')==='recomp') b.classList.add('sel');
      });
      if(typeof renderGoalStep === 'function') renderGoalStep();
      if(typeof renderAll === 'function') renderAll();
    } catch(e){ console.warn('Bulk cancel UI sync:',e); }
  }
}
