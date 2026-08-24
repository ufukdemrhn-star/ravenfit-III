/* ══════════════════════════════════════════════════════════
   RavenFit — stats-panel.js
   İstatistik paylaşım paneli

   OTOMATİK KİLİT MANTIĞI (C+B yaklaşımı)
   ──────────────────────────────────────────────────────────
   Bazı değerler diğerlerinden hesaplanabilir. Örnek: kullanıcı
   yağ oranını gizlese bile ağırlık ve yağsız kütleyi paylaştıysa
   yağ oranı hesaplanabilir — yani aslında gizlemiş olmuyor.

   Bu panel o durumda:
     1. Türetilen alanı KİLİTLİ gösterir (kapatılamaz)
     2. Kilide tıklanınca hangi kaynağın kapatılacağını SORAR

   Böylece kullanıcı kendini farkında olmadan ifşa edemez.
   ══════════════════════════════════════════════════════════ */

var _spAyarlar = null;    /* panel açıkken üzerinde çalışılan kopya */
var _spVitrin  = null;

function openStatsPanel(){
  _spAyarlar = Object.assign({}, getPaylasimAyarlari());
  _spVitrin  = getVitrinAlanlari().slice();
  var ov = document.getElementById('stats-panel-overlay');
  if(!ov) return;
  ov.classList.add('active');
  document.body.style.overflow = 'hidden';
  _spRender();
}

function closeStatsPanel(){
  var ov = document.getElementById('stats-panel-overlay');
  if(ov) ov.classList.remove('active');
  document.body.style.overflow = '';
}

/* Şu an açık olan alanların kümesi */
function _spAcikSet(){
  var s = {};
  for(var k in _spAyarlar){ if(_spAyarlar[k]) s[k] = true; }
  return s;
}

/* Bir alanı aç/kapat. Kilitliyse kaynak seçimi sorulur. */
function spToggle(alanId){
  var acik = _spAcikSet();

  /* Kapatılmak isteniyor mu? */
  if(_spAyarlar[alanId]){
    /* Kapatılacak — ama türetilebiliyorsa engelle ve sor */
    var gecici = Object.assign({}, acik);
    delete gecici[alanId];
    var zincir = _turetilebilirMi(alanId, gecici);
    if(zincir){
      _spKaynakSor(alanId, zincir);
      return;
    }
    delete _spAyarlar[alanId];
    /* Vitrinden de çıkar */
    _spVitrin = _spVitrin.filter(function(x){ return x !== alanId; });
  } else {
    _spAyarlar[alanId] = true;
  }
  _spRender();
}

/* Kilitli alanı gizlemek için hangi kaynağın kapatılacağını sorar */
function _spKaynakSor(alanId, zincir){
  var hedef = alanBul(alanId);
  var secenekler = zincir.kaynak.map(function(k){
    var a = alanBul(k);
    return '<button class="sp-kaynak-btn" onclick="spKaynakKapat(\'' + k + '\')">' +
             '<span class="sp-kaynak-ad">' + (a ? a.ad : k) + '</span>' +
             '<span class="sp-kaynak-val">' + alanMetni(k) + '</span>' +
           '</button>';
  }).join('');

  var el = document.getElementById('sp-soru');
  if(!el) return;
  el.innerHTML =
    '<div class="sp-soru-kutu">' +
      '<div class="sp-soru-baslik">🔒 ' + (hedef ? hedef.ad : alanId) + ' gizlenemiyor</div>' +
      '<div class="sp-soru-metin">' + zincir.aciklama + '. ' +
        'Bu değeri gerçekten gizlemek için aşağıdakilerden birini de kapatman gerekiyor:</div>' +
      '<div class="sp-kaynak-liste">' + secenekler + '</div>' +
      '<button class="sp-soru-iptal" onclick="spSoruKapat()">Vazgeç</button>' +
    '</div>';
  el.classList.add('active');
}

function spKaynakKapat(kaynakId){
  delete _spAyarlar[kaynakId];
  _spVitrin = _spVitrin.filter(function(x){ return x !== kaynakId; });
  spSoruKapat();
  _spRender();
}

function spSoruKapat(){
  var el = document.getElementById('sp-soru');
  if(el){ el.classList.remove('active'); el.innerHTML = ''; }
}

/* Vitrin seçimi — en fazla 4 */
function spVitrinToggle(alanId){
  if(!_spAyarlar[alanId]) return;                /* kapalı alan vitrine giremez */
  var i = _spVitrin.indexOf(alanId);
  if(i >= 0){
    _spVitrin.splice(i,1);
  } else {
    if(_spVitrin.length >= 4){
      showToast('Vitrinde en fazla 4 değer olabilir. Birini çıkar.','warn');
      return;
    }
    _spVitrin.push(alanId);
  }
  _spRender();
}

function _spRender(){
  var govde = document.getElementById('sp-body');
  if(!govde) return;

  var acik = _spAcikSet();
  var acikSayisi = Object.keys(acik).length;
  var html = '';

  /* Özet şerit */
  html += '<div class="sp-ozet">' +
            '<div><strong>' + acikSayisi + '</strong> değer paylaşılıyor</div>' +
            '<div><strong>' + _spVitrin.length + '/4</strong> vitrinde</div>' +
          '</div>';

  html += '<div class="sp-ipucu">Vitrindeki değerler profilinde doğrudan görünür. ' +
          'Diğer paylaştıkların "Detaylar" penceresinde listelenir.</div>';

  /* Gruplar */
  ['temel','hesap','olcu'].forEach(function(grup){
    var alanlar = ISTATISTIK_ALANLARI.filter(function(a){ return a.grup === grup; });
    if(!alanlar.length) return;

    html += '<div class="sp-grup-baslik">' + ISTATISTIK_GRUPLARI[grup] + '</div>';

    alanlar.forEach(function(a){
      var deger  = alanMetni(a.id);
      var varMi  = deger !== '—';
      var açık   = !!_spAyarlar[a.id];

      /* Kapatılırsa türetilebilir mi? → kilitli göster */
      var gecici = Object.assign({}, acik);
      delete gecici[a.id];
      var zincir = açık ? _turetilebilirMi(a.id, gecici) : null;
      var kilitli = !!zincir;

      var vitrinde = _spVitrin.indexOf(a.id) >= 0;

      html += '<div class="sp-satir' + (açık ? ' acik' : '') + (varMi ? '' : ' yok') + '">';

      /* Sol: ad + değer */
      html += '<div class="sp-sol">';
      html +=   '<div class="sp-ad">' + a.ad +
                (kilitli ? ' <span class="sp-kilit" title="' + zincir.aciklama + '">🔒</span>' : '') +
                '</div>';
      html +=   '<div class="sp-deger">' + (varMi ? deger : 'ölçüm yok') + '</div>';
      html += '</div>';

      /* Sağ: vitrin yıldızı + anahtar */
      html += '<div class="sp-sag">';
      if(açık && varMi){
        html += '<button class="sp-vitrin' + (vitrinde ? ' on' : '') + '" ' +
                'onclick="spVitrinToggle(\'' + a.id + '\')" ' +
                'title="Vitrine ekle/çıkar" aria-label="Vitrine ekle">' +
                (vitrinde ? '★' : '☆') + '</button>';
      }
      html += '<button class="sp-anahtar' + (açık ? ' on' : '') + (kilitli ? ' kilitli' : '') + '" ' +
              (varMi ? 'onclick="spToggle(\'' + a.id + '\')"' : 'disabled') +
              ' aria-label="' + a.ad + ' paylaşımı"><span></span></button>';
      html += '</div>';

      html += '</div>';
    });
  });

  govde.innerHTML = html;
}

function spKaydet(){
  savePaylasimAyarlari(_spAyarlar);
  saveVitrinAlanlari(_spVitrin);
  if(typeof saveData === 'function') saveData();
  closeStatsPanel();
  showToast('✅ Paylaşım ayarların kaydedildi.');
  if(typeof renderProfil === 'function') renderProfil();
}

/* Hepsini kapat — hızlı gizlilik */
function spHepsiniKapat(){
  showConfirm('Tümünü Gizle',
    'Tüm istatistiklerin profilinden kaldırılacak. Emin misin?',
    function(){
      _spAyarlar = {}; _spVitrin = [];
      _spRender();
    }, 'Evet, Gizle');
}
