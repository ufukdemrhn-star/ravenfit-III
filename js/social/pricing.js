/* ══════════════════════════════════════════════════════════
   RavenFit — pricing.js
   Fiyatlandırma hesaplayıcısı

   Antrenör paket fiyatını belirlerken cebine ne kaldığını
   görsün diye. Türkiye'de serbest meslek/ticari kazanç
   vergilendirmesi karmaşıktır; çoğu antrenör brüt fiyatı
   net kazanç sanır ve sonra şaşırır.

   ⚠️ ORANLAR — 2026 (332 Seri No'lu GVGT)
   Vergi mevzuatı her yıl değişir. Bu tablo yıllık olarak
   güncellenmelidir. Hesaplama YAKLAŞIKTIR, mali müşavir
   yerine geçmez — arayüzde de bu açıkça belirtilir.
   ══════════════════════════════════════════════════════════ */

/* Ücret DIŞI gelir tarifesi (serbest meslek, ticari kazanç).
   Ücretlilerden farklıdır: 3. dilim 1.500.000 değil 1.000.000'da biter. */
var GELIR_VERGISI_DILIMLERI_2026 = [
  {ustSinir:  190000, oran:0.15, tabanVergi:       0, tabanTutar:       0},
  {ustSinir:  400000, oran:0.20, tabanVergi:   28500, tabanTutar:  190000},
  {ustSinir: 1000000, oran:0.27, tabanVergi:   70500, tabanTutar:  400000},
  {ustSinir: 5300000, oran:0.35, tabanVergi:  232500, tabanTutar: 1000000},
  {ustSinir: Infinity,oran:0.40, tabanVergi: 1737500, tabanTutar: 5300000}
];

var PLATFORM_KOMISYONU = 0.05;   /* %5 */
var KDV_ORANI          = 0.20;   /* hizmetlerde standart oran */
var VERGI_YILI         = 2026;

/* Yıllık matrah üzerinden gelir vergisi.
   Artan oranlı: yalnızca dilimi aşan kısım üst oranla vergilenir. */
function gelirVergisiHesapla(yillikMatrah){
  if(!yillikMatrah || yillikMatrah <= 0) return 0;
  for(var i=0;i<GELIR_VERGISI_DILIMLERI_2026.length;i++){
    var d = GELIR_VERGISI_DILIMLERI_2026[i];
    if(yillikMatrah <= d.ustSinir){
      return d.tabanVergi + (yillikMatrah - d.tabanTutar) * d.oran;
    }
  }
  return 0;
}

/* Belirli bir matrahta EK gelirin marjinal vergi oranı.
   Antrenör "bir paket daha satarsam ne kalır" diye bakar. */
function marjinalOran(yillikMatrah){
  for(var i=0;i<GELIR_VERGISI_DILIMLERI_2026.length;i++){
    if(yillikMatrah <= GELIR_VERGISI_DILIMLERI_2026[i].ustSinir){
      return GELIR_VERGISI_DILIMLERI_2026[i].oran;
    }
  }
  return 0.40;
}

/* ──────────────────────────────────────────────────────────
   PAKET KAZANÇ HESABI

   girdi:
     fiyat        — pakete yazılan tutar
     kdvDahil     — fiyat KDV içeriyor mu?
     adet         — yıllık tahmini satış adedi
     digerGelir   — yıl içindeki diğer beyan edilecek gelir
     giderOrani   — salon kirası, ekipman, ulaşım vb. (%)

   KDV kullanıcıdan TAHSİL EDİLİR, antrenörün geliri değildir —
   devlete aktarılır. Bu yüzden matrahtan düşülür.
   ────────────────────────────────────────────────────────── */
function paketKazancHesapla(girdi){
  var fiyat      = Number(girdi.fiyat) || 0;
  var kdvDahil   = girdi.kdvDahil !== false;
  var adet       = Math.max(1, Number(girdi.adet) || 1);
  var digerGelir = Number(girdi.digerGelir) || 0;
  var giderOrani = Math.min(0.9, Math.max(0, Number(girdi.giderOrani) || 0));

  /* 1) KDV ayrıştırması */
  var kdvsizFiyat, kdvTutari, musteriOdemesi;
  if(kdvDahil){
    kdvsizFiyat    = fiyat / (1 + KDV_ORANI);
    kdvTutari      = fiyat - kdvsizFiyat;
    musteriOdemesi = fiyat;
  } else {
    kdvsizFiyat    = fiyat;
    kdvTutari      = fiyat * KDV_ORANI;
    musteriOdemesi = fiyat + kdvTutari;
  }

  /* 2) Platform komisyonu — KDV'siz tutar üzerinden */
  var komisyon = kdvsizFiyat * PLATFORM_KOMISYONU;
  var brutKazanc = kdvsizFiyat - komisyon;

  /* 3) İşletme giderleri */
  var giderler = brutKazanc * giderOrani;
  var matrahTekPaket = brutKazanc - giderler;

  /* 4) Yıllık matrah — vergi dilimi buna göre belirlenir */
  var yillikMatrah = matrahTekPaket * adet + digerGelir;
  var yillikVergi  = gelirVergisiHesapla(yillikMatrah);
  var digerVergi   = gelirVergisiHesapla(digerGelir);

  /* Bu paketlerin yol açtığı EK vergi */
  var paketlerinVergisi = yillikVergi - digerVergi;
  var paketBasinaVergi  = paketlerinVergisi / adet;

  var netKazanc = matrahTekPaket - paketBasinaVergi;

  return {
    musteriOdemesi: musteriOdemesi,
    kdvsizFiyat:    kdvsizFiyat,
    kdvTutari:      kdvTutari,
    komisyon:       komisyon,
    giderler:       giderler,
    vergi:          paketBasinaVergi,
    netKazanc:      netKazanc,
    /* Yüzdeler — çubuk grafik için */
    netOran:        musteriOdemesi > 0 ? netKazanc / musteriOdemesi : 0,
    marjinal:       marjinalOran(yillikMatrah),
    yillikMatrah:   yillikMatrah,
    yillikNet:      netKazanc * adet,
    beyanGerekli:   yillikMatrah > 190000
  };
}

/* Hedef net kazanca ulaşmak için fiyat ne olmalı?
   Vergi artan oranlı olduğu için tersine formül yok —
   ikili aramayla yaklaşılır. */
function hedefNettenFiyat(hedefNet, girdi){
  var alt = 0, ust = hedefNet * 5, fiyat = hedefNet;
  for(var i=0;i<50;i++){
    fiyat = (alt + ust) / 2;
    var g = Object.assign({}, girdi, {fiyat: fiyat});
    var net = paketKazancHesapla(g).netKazanc;
    if(Math.abs(net - hedefNet) < 1) break;
    if(net < hedefNet) alt = fiyat; else ust = fiyat;
  }
  return Math.round(fiyat);
}

/* Para biçimlendirme — "1.500 ₺" */
function paraFormat(n){
  n = Math.round(Number(n) || 0);
  return n.toLocaleString('tr-TR') + ' ₺';
}

/* ══════════════════════════════════════════════════════════
   HESAPLAYICI EKRANI
   ══════════════════════════════════════════════════════════ */

function openPricingCalc(){
  var ov = document.getElementById('pricing-overlay');
  if(!ov) return;
  ov.classList.add('active');
  _pcCiz();
}

function closePricingCalc(){
  var ov = document.getElementById('pricing-overlay');
  if(ov) ov.classList.remove('active');
  /* Paket düzenleyicideki özet güncellensin */
  if(typeof pkFiyatDegisti === 'function') pkFiyatDegisti();
}

function _pcDeger(id, varsayilan){
  var el = document.getElementById(id);
  return el ? (Number(el.value) || varsayilan) : varsayilan;
}

function pcHesapla(){
  /* Girdileri sakla — paket düzenleyici de kullanıyor */
  _lsSet('rf_paket_adet',  String(_pcDeger('pc-adet', 12)));
  _lsSet('rf_diger_gelir', String(_pcDeger('pc-diger', 0)));
  _lsSet('rf_gider_orani', String(_pcDeger('pc-gider', 15)));

  var fiyat = _pcDeger('pc-fiyat', 0);
  var sonuc = document.getElementById('pc-sonuc');
  if(!sonuc) return;

  if(fiyat <= 0){
    sonuc.innerHTML = '<div class="pk-kazanc-bos">Fiyat gir.</div>';
    return;
  }

  var kdvEl = document.getElementById('pc-kdv-dahil');
  var r = paketKazancHesapla({
    fiyat: fiyat,
    kdvDahil: kdvEl ? kdvEl.checked : true,
    adet: _pcDeger('pc-adet', 12),
    digerGelir: _pcDeger('pc-diger', 0),
    giderOrani: _pcDeger('pc-gider', 15) / 100
  });

  var satir = function(ad, tutar, renk, aciklama){
    return '<div class="pc-satir">' +
             '<div class="pc-satir-sol">' +
               '<span class="pc-nokta" style="background:' + renk + '"></span>' +
               '<span>' + ad + '</span>' +
               (aciklama ? '<span class="pc-aciklama">' + aciklama + '</span>' : '') +
             '</div>' +
             '<div class="pc-tutar">' + paraFormat(tutar) + '</div>' +
           '</div>';
  };

  sonuc.innerHTML =
    '<div class="pc-ozet">' +
      '<div class="pc-ozet-lbl">Paket başına cebine kalan</div>' +
      '<div class="pc-ozet-net">' + paraFormat(r.netKazanc) + '</div>' +
      '<div class="pc-ozet-oran">müşterinin ödediğinin %' + Math.round(r.netOran*100) + '\'i</div>' +
    '</div>' +

    '<div class="pc-bar">' +
      '<span style="flex:' + Math.max(1,r.netKazanc) + ';background:var(--success)"></span>' +
      '<span style="flex:' + Math.max(1,r.vergi)     + ';background:var(--warn)"></span>' +
      '<span style="flex:' + Math.max(1,r.kdvTutari) + ';background:var(--info)"></span>' +
      '<span style="flex:' + Math.max(1,r.giderler)  + ';background:var(--text3)"></span>' +
      '<span style="flex:' + Math.max(1,r.komisyon)  + ';background:var(--accent)"></span>' +
    '</div>' +

    '<div class="pc-dokum">' +
      satir('Müşteri öder', r.musteriOdemesi, 'transparent') +
      satir('KDV', -r.kdvTutari, 'var(--info)', 'devlete aktarılır') +
      satir('Platform komisyonu', -r.komisyon, 'var(--accent)', '%5') +
      satir('İşletme giderleri', -r.giderler, 'var(--text3)',
            '%' + _pcDeger('pc-gider',15)) +
      satir('Gelir vergisi', -r.vergi, 'var(--warn)',
            'marjinal %' + Math.round(r.marjinal*100)) +
      '<div class="pc-cizgi"></div>' +
      satir('<strong>Net kazanç</strong>', r.netKazanc, 'var(--success)') +
    '</div>' +

    '<div class="pc-yillik">' +
      '<div><span>Yıllık matrah</span><b>' + paraFormat(r.yillikMatrah) + '</b></div>' +
      '<div><span>Yıllık net kazanç</span><b>' + paraFormat(r.yillikNet) + '</b></div>' +
    '</div>' +

    (r.beyanGerekli
      ? '<div class="pc-uyari">📋 Yıllık matrahın 190.000 ₺\'yi aşıyor — ' +
        'Mart ayında gelir vergisi beyannamesi vermen gerekir.</div>'
      : '') +

    '<div class="pc-hedef">' +
      '<div class="fl">Belirli bir net kazanç hedefin varsa</div>' +
      '<div class="pc-hedef-satir">' +
        '<input class="fi" id="pc-hedef" type="number" inputmode="numeric" ' +
          'placeholder="Hedef net (₺)">' +
        '<button class="btn btn-s" onclick="pcHedefHesapla()">Fiyat Öner</button>' +
      '</div>' +
      '<div class="pc-hedef-sonuc" id="pc-hedef-sonuc"></div>' +
    '</div>' +

    '<div class="pc-feragat">' +
      '⚠️ Bu hesaplama <strong>yaklaşıktır</strong> ve mali müşavir yerine geçmez. ' +
      'SGK primi (Bağ-Kur), geçici vergi, muhasebe gideri ve kişisel indirimler ' +
      'dahil değildir. Oranlar ' + VERGI_YILI + ' yılı tarifesine göredir.' +
    '</div>';
}

function pcHedefHesapla(){
  var hedef = _pcDeger('pc-hedef', 0);
  var el = document.getElementById('pc-hedef-sonuc');
  if(!el) return;
  if(hedef <= 0){ el.innerHTML = ''; return; }

  var kdvEl = document.getElementById('pc-kdv-dahil');
  var fiyat = hedefNettenFiyat(hedef, {
    kdvDahil: kdvEl ? kdvEl.checked : true,
    adet: _pcDeger('pc-adet', 12),
    digerGelir: _pcDeger('pc-diger', 0),
    giderOrani: _pcDeger('pc-gider', 15) / 100
  });

  el.innerHTML = '<div class="pc-hedef-kutu">' +
    'Paket başına <b>' + paraFormat(hedef) + '</b> kalması için fiyat ' +
    '<b class="pc-onerilen">' + paraFormat(fiyat) + '</b> olmalı.' +
    '<button class="pc-uygula" onclick="pcFiyatiUygula(' + fiyat + ')">Uygula</button>' +
    '</div>';
}

function pcFiyatiUygula(fiyat){
  var el = document.getElementById('pc-fiyat');
  if(el){ el.value = fiyat; pcHesapla(); }
  var pk = document.getElementById('pk-fiyat');
  if(pk){ pk.value = fiyat; }
  showToast('✅ Fiyat uygulandı.');
}

function _pcCiz(){
  var el = document.getElementById('pc-body');
  if(!el) return;

  /* Paket düzenleyicideki fiyatı devral */
  var mevcutFiyat = '';
  var pk = document.getElementById('pk-fiyat');
  if(pk && pk.value) mevcutFiyat = pk.value;

  el.innerHTML =
    '<div class="fg"><label class="fl">Paket Fiyatı</label>' +
      '<div class="iw"><input class="fi" id="pc-fiyat" type="number" inputmode="numeric" ' +
      'value="' + mevcutFiyat + '" placeholder="1500" oninput="pcHesapla()">' +
      '<span class="iu">₺</span></div></div>' +

    '<label class="pa-onay" style="margin-top:10px">' +
      '<input type="checkbox" id="pc-kdv-dahil" checked onchange="pcHesapla()">' +
      '<span>Girdiğim fiyat KDV dahil</span>' +
    '</label>' +

    '<div class="frow" style="margin-top:14px">' +
      '<div class="fg"><label class="fl">Yıllık satış (tahmini)</label>' +
        '<input class="fi" id="pc-adet" type="number" inputmode="numeric" ' +
        'value="' + (_lsGet('rf_paket_adet')||12) + '" oninput="pcHesapla()"></div>' +
      '<div class="fg"><label class="fl">Gider oranı</label>' +
        '<div class="iw"><input class="fi" id="pc-gider" type="number" inputmode="numeric" ' +
        'value="' + (_lsGet('rf_gider_orani')||15) + '" oninput="pcHesapla()">' +
        '<span class="iu">%</span></div></div>' +
    '</div>' +

    '<div class="fg" style="margin-top:12px">' +
      '<label class="fl">Diğer yıllık gelirin <span style="color:var(--text3)">(vergi dilimi için)</span></label>' +
      '<div class="iw"><input class="fi" id="pc-diger" type="number" inputmode="numeric" ' +
      'value="' + (_lsGet('rf_diger_gelir')||0) + '" oninput="pcHesapla()">' +
      '<span class="iu">₺</span></div></div>' +

    '<div id="pc-sonuc" style="margin-top:18px"></div>';

  pcHesapla();
}
