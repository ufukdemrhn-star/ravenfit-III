/* ══════════════════════════════════════════════════════════
   RavenFit — cropper.js
   Etkileşimli fotoğraf kırpıcı

   Kullanıcı iki şeyi kendisi seçer:
     1. Oran — 4:3 (yatay) · 1:1 (kare) · 3:4 (dikey)
     2. Konum — fotoğrafı sürükleyerek çerçeveyi konumlandırır

   ÇALIŞMA BİÇİMİ
   Çerçeve sabittir, ARKASINDAKİ FOTOĞRAF hareket eder.
   Instagram'daki gibi. Fotoğraf her zaman çerçeveyi tamamen
   kaplar — boşluk oluşamaz, sınırlar buna göre kısıtlanır.

   Birden fazla fotoğraf seçilirse sırayla kırpılır.
   ══════════════════════════════════════════════════════════ */

var KIRP_ORANLARI = [
  {id:'4:3', ad:'Yatay',  deger: 4/3, ikon:'▭'},
  {id:'1:1', ad:'Kare',   deger: 1,   ikon:'◻'},
  {id:'3:4', ad:'Dikey',  deger: 3/4, ikon:'▯'}
];

/* Kırpıcının o anki durumu */
var _kirp = {
  kuyruk: [],        /* işlenecek dosyalar */
  sonuclar: [],      /* kırpılmış görseller */
  index: 0,
  img: null,         /* yüklenen Image nesnesi */
  oran: 1,           /* seçili oran değeri */
  oranId: '1:1',
  olcek: 1,          /* taban ölçek (çerçeveyi kaplayan) */
  yakinlik: 1,       /* kullanıcı yakınlaştırması, >= 1 */
  x: 0, y: 0,        /* fotoğrafın çerçeveye göre sol-üst konumu */
  cerceveG: 0, cerceveY: 0,
  suruklyor: false,
  baslangic: null,
  bitince: null      /* tamamlanınca çağrılacak geri bildirim */
};

/* ──────────────────────────────────────────────────────────
   Kırpıcıyı başlat.
   dosyalar : File dizisi
   bitince  : kırpılmış {tam, onizleme} dizisiyle çağrılır
   ────────────────────────────────────────────────────────── */
function kirpiciAc(dosyalar, bitince){
  if(!dosyalar || !dosyalar.length) return;
  _kirp.kuyruk = Array.prototype.slice.call(dosyalar);
  _kirp.sonuclar = [];
  _kirp.index = 0;
  _kirp.bitince = bitince;

  var ov = document.getElementById('cropper-overlay');
  if(!ov) return;
  ov.classList.add('active');
  document.body.style.overflow = 'hidden';

  _kirpDosyaYukle();
}

function kirpiciKapat(){
  var ov = document.getElementById('cropper-overlay');
  if(ov) ov.classList.remove('active');
  document.body.style.overflow = '';
  _kirp.kuyruk = [];
  _kirp.sonuclar = [];
  _kirp.img = null;
  _kirp.bitince = null;
}

function _kirpDosyaYukle(){
  var dosya = _kirp.kuyruk[_kirp.index];
  if(!dosya) return _kirpTamamla();

  var sayacEl = document.getElementById('cr-sayac');
  if(sayacEl){
    sayacEl.textContent = _kirp.kuyruk.length > 1
      ? (_kirp.index + 1) + ' / ' + _kirp.kuyruk.length
      : '';
  }

  var okuyucu = new FileReader();
  okuyucu.onerror = function(){
    showToast('❌ Fotoğraf okunamadı.','error');
    _kirpSonraki();
  };
  okuyucu.onload = function(e){
    var img = new Image();
    img.onerror = function(){
      showToast('❌ Fotoğraf çözümlenemedi.','error');
      _kirpSonraki();
    };
    img.onload = function(){
      _kirp.img = img;
      /* Fotoğrafın kendi oranına en yakın seçeneği varsayılan yap —
         böylece çoğu durumda kullanıcı hiçbir şey seçmeden geçebilir */
      var kendiOran = img.width / img.height;
      var enYakin = KIRP_ORANLARI[0];
      var enKucukFark = Infinity;
      KIRP_ORANLARI.forEach(function(o){
        var fark = Math.abs(Math.log(kendiOran / o.deger));
        if(fark < enKucukFark){ enKucukFark = fark; enYakin = o; }
      });
      _kirpOranSec(enYakin.id, true);
    };
    img.src = e.target.result;
  };
  okuyucu.readAsDataURL(dosya);
}

/* Oran seçimi — çerçeve yeniden boyutlanır, fotoğraf ortalanır */
function _kirpOranSec(oranId, ilkYukleme){
  var o = KIRP_ORANLARI.find(function(x){ return x.id === oranId; });
  if(!o) return;
  _kirp.oranId = oranId;
  _kirp.oran = o.deger;
  _kirp.yakinlik = 1;
  _kirpCerceveHesapla();
  _kirpOrtala();
  _kirpCiz();
  if(!ilkYukleme) _kirpUygula();
}

function kirpOranSec(oranId){ _kirpOranSec(oranId, false); }

/* Çerçeve boyutu — kullanılabilir alana sığdırılır */
function _kirpCerceveHesapla(){
  var alan = document.getElementById('cr-alan');
  if(!alan) return;
  var maxG = alan.clientWidth  - 24;
  var maxY = alan.clientHeight - 24;
  if(maxG <= 0 || maxY <= 0){ maxG = 300; maxY = 300; }

  var g = maxG, y = g / _kirp.oran;
  if(y > maxY){ y = maxY; g = y * _kirp.oran; }
  _kirp.cerceveG = Math.round(g);
  _kirp.cerceveY = Math.round(y);
}

/* Fotoğrafı çerçeveyi kaplayacak şekilde ortala */
function _kirpOrtala(){
  var img = _kirp.img;
  if(!img) return;
  /* Taban ölçek: çerçeveyi tamamen kaplayan en küçük ölçek */
  _kirp.olcek = Math.max(_kirp.cerceveG / img.width, _kirp.cerceveY / img.height);
  var dg = img.width  * _kirp.olcek * _kirp.yakinlik;
  var dy = img.height * _kirp.olcek * _kirp.yakinlik;
  _kirp.x = (_kirp.cerceveG - dg) / 2;
  _kirp.y = (_kirp.cerceveY - dy) / 2;
}

/* Fotoğraf çerçeveden kopmasın — sınırları uygula */
function _kirpSinirla(){
  var img = _kirp.img;
  if(!img) return;
  var dg = img.width  * _kirp.olcek * _kirp.yakinlik;
  var dy = img.height * _kirp.olcek * _kirp.yakinlik;
  /* Sol/üst en fazla 0, sağ/alt en az çerçeve kenarı */
  _kirp.x = Math.min(0, Math.max(_kirp.cerceveG - dg, _kirp.x));
  _kirp.y = Math.min(0, Math.max(_kirp.cerceveY - dy, _kirp.y));
}

function _kirpCiz(){
  var cerceve = document.getElementById('cr-cerceve');
  var resim   = document.getElementById('cr-img');
  if(!cerceve || !resim || !_kirp.img) return;

  cerceve.style.width  = _kirp.cerceveG + 'px';
  cerceve.style.height = _kirp.cerceveY + 'px';

  var dg = _kirp.img.width  * _kirp.olcek * _kirp.yakinlik;
  var dy = _kirp.img.height * _kirp.olcek * _kirp.yakinlik;
  resim.src = _kirp.img.src;
  resim.style.width  = dg + 'px';
  resim.style.height = dy + 'px';
  resim.style.left   = _kirp.x + 'px';
  resim.style.top    = _kirp.y + 'px';

  /* Oran butonları */
  document.querySelectorAll('.cr-oran').forEach(function(b){
    b.classList.toggle('sec', b.dataset.oran === _kirp.oranId);
  });
  /* Yakınlaştırma kaydırıcısı */
  var slider = document.getElementById('cr-zoom');
  if(slider) slider.value = _kirp.yakinlik;
}

/* ── Sürükleme (fare + dokunmatik) ───────────────────────── */
function _kirpNokta(e){
  if(e.touches && e.touches.length) return {x:e.touches[0].clientX, y:e.touches[0].clientY};
  return {x:e.clientX, y:e.clientY};
}

function kirpBasla(e){
  if(!_kirp.img) return;
  var n = _kirpNokta(e);
  _kirp.suruklyor = true;
  _kirp.baslangic = {x:n.x, y:n.y, ox:_kirp.x, oy:_kirp.y};
  e.preventDefault();
}

function kirpHareket(e){
  if(!_kirp.suruklyor || !_kirp.baslangic) return;
  var n = _kirpNokta(e);
  _kirp.x = _kirp.baslangic.ox + (n.x - _kirp.baslangic.x);
  _kirp.y = _kirp.baslangic.oy + (n.y - _kirp.baslangic.y);
  _kirpSinirla();
  _kirpCiz();
  e.preventDefault();
}

function kirpBitir(){
  _kirp.suruklyor = false;
  _kirp.baslangic = null;
}

function kirpYakinlik(deger){
  _kirp.yakinlik = Math.max(1, Math.min(3, parseFloat(deger) || 1));
  _kirpSinirla();
  _kirpCiz();
}

/* Fare tekerleği ile yakınlaştırma — masaüstü kolaylığı */
function kirpTekerlek(e){
  if(!_kirp.img) return;
  e.preventDefault();
  var adim = e.deltaY > 0 ? -0.08 : 0.08;
  kirpYakinlik(_kirp.yakinlik + adim);
}

/* Ekran döndüğünde/yeniden boyutlandığında çerçeveyi güncelle */
function _kirpUygula(){
  _kirpCerceveHesapla();
  _kirpSinirla();
  _kirpCiz();
}

/* ── Onayla: seçilen alanı kırp ──────────────────────────── */
function kirpOnayla(){
  var img = _kirp.img;
  if(!img) return;

  var btn = document.getElementById('cr-onay-btn');
  if(btn){ btn.disabled = true; btn.textContent = 'İşleniyor...'; }

  /* Ekrandaki konumu kaynak piksellere çevir */
  var toplamOlcek = _kirp.olcek * _kirp.yakinlik;
  var sx = -_kirp.x / toplamOlcek;
  var sy = -_kirp.y / toplamOlcek;
  var sw = _kirp.cerceveG / toplamOlcek;
  var sh = _kirp.cerceveY / toplamOlcek;

  /* Taşmayı önle */
  sx = Math.max(0, Math.min(img.width  - 1, sx));
  sy = Math.max(0, Math.min(img.height - 1, sy));
  sw = Math.min(sw, img.width  - sx);
  sh = Math.min(sh, img.height - sy);

  try {
    var tam       = _kirpTuvalUret(img, sx, sy, sw, sh, 1080, 0.72);
    var onizleme  = _kirpTuvalUret(img, sx, sy, sw, sh, 320,  0.60);
    _kirp.sonuclar.push({tam: tam, onizleme: onizleme});
  } catch(e){
    showToast('❌ Fotoğraf işlenemedi.','error');
  }

  if(btn){ btn.disabled = false; btn.textContent = 'Onayla'; }
  _kirpSonraki();
}

function _kirpTuvalUret(img, sx, sy, sw, sh, hedefBoyut, kalite){
  var olcek = Math.min(1, hedefBoyut / Math.max(sw, sh));
  var g = Math.max(1, Math.round(sw * olcek));
  var y = Math.max(1, Math.round(sh * olcek));

  var tuval = document.createElement('canvas');
  tuval.width = g; tuval.height = y;
  var ctx = tuval.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, g, y);

  /* Boyut sınırına inene kadar kaliteyi düşür */
  var k = kalite;
  var veri = tuval.toDataURL('image/jpeg', k);
  var deneme = 0;
  while(veri.length > MEDYA_BAYT_SINIRI && k > 0.35 && deneme < 6){
    k -= 0.10;
    veri = tuval.toDataURL('image/jpeg', k);
    deneme++;
  }
  return {veri: veri, genislik: g, yukseklik: y, bayt: veri.length, kalite: Math.round(k*100)};
}

function kirpAtla(){
  _kirpSonraki();
}

function _kirpSonraki(){
  _kirp.index++;
  if(_kirp.index >= _kirp.kuyruk.length) return _kirpTamamla();
  _kirpDosyaYukle();
}

function _kirpTamamla(){
  var sonuclar = _kirp.sonuclar.slice();
  var geri = _kirp.bitince;
  kirpiciKapat();
  if(geri) geri(sonuclar);
}
