/* ══════════════════════════════════════════════════════════
   RavenFit — discover.js
   Keşfet: kullanıcı arama ve öneriler
   ══════════════════════════════════════════════════════════ */

var _kesfetSorgu = '';
var _kesfetTimer = null;
var _kesfetKaydirma = 0;      /* son kaydırma konumu */
var _kesfetSonListe = null;   /* son gösterilen sonuçlar */

function openDiscover(){
  var ov = document.getElementById('discover-overlay');
  if(!ov) return;
  ov.classList.add('active');
  document.body.style.overflow = 'hidden';

  var inp = document.getElementById('dsc-input');
  if(inp) inp.value = _kesfetSorgu;

  /* Önceki listeyi ve kaydırma konumunu geri yükle.
     Bir profile girip geri dönünce baştan yüklemek, uzun
     listede kullanıcının yerini kaybetmesine yol açıyordu. */
  if(_kesfetSonListe){
    _dscListele(_kesfetSonListe, null);
    setTimeout(function(){
      var g = document.getElementById('dsc-body');
      if(g) g.scrollTop = _kesfetKaydirma;
    }, 30);
    return;
  }

  /* İlk açılış — odaklan ve yükle */
  if(inp) setTimeout(function(){ inp.focus(); }, 180);
  if(_kesfetSorgu) dscAra();
  else _dscSonKatilanlar();
}

function closeDiscover(){
  /* Kaydırma konumunu sakla — geri dönünce aynı yerden devam */
  var g = document.getElementById('dsc-body');
  if(g) _kesfetKaydirma = g.scrollTop;
  var ov = document.getElementById('discover-overlay');
  if(ov) ov.classList.remove('active');
  document.body.style.overflow = '';
}

/* Aramayı sıfırla — kullanıcı bilerek yeniden başlatmak isterse */
function dscSifirla(){
  _kesfetSonListe = null;
  _kesfetKaydirma = 0;
  _kesfetSorgu = '';
  var inp = document.getElementById('dsc-input');
  if(inp) inp.value = '';
  _dscSonKatilanlar();
}

/* Yazarken arama — her tuşta sorgu atmamak için 300ms beklenir */
function dscYazildi(){
  clearTimeout(_kesfetTimer);
  _kesfetTimer = setTimeout(dscAra, 300);
}

function dscAra(){
  var inp = document.getElementById('dsc-input');
  if(!inp) return;
  _kesfetSorgu = inp.value.trim().toLowerCase();

  if(!_kesfetSorgu){ return _dscSonKatilanlar(); }
  if(_kesfetSorgu.length < 1) return;

  _kesfetKaydirma = 0;   /* yeni arama en baştan */
  _dscYukleniyor();
  profilAra(_kesfetSorgu, 20).then(function(sonuclar){
    _dscListele(sonuclar,
      sonuclar.length ? null :
      '"' + _kesfetSorgu + '" için kullanıcı bulunamadı.');
  });
}

function _dscSonKatilanlar(){
  _dscYukleniyor();
  sonKatilanlar(12).then(function(liste){
    var el = document.getElementById('dsc-baslik');
    if(el) el.textContent = 'Son Katılanlar';
    _dscListele(liste, liste.length ? null : 'Henüz başka kullanıcı yok.');
  });
}

function _dscYukleniyor(){
  var el = document.getElementById('dsc-body');
  if(el) el.innerHTML = '<div class="dsc-durum">Aranıyor...</div>';
}

function _dscListele(liste, bosMesaj){
  var el = document.getElementById('dsc-body');
  if(!el) return;
  _kesfetSonListe = liste;   /* geri dönüşte kullanılacak */

  var baslik = document.getElementById('dsc-baslik');
  if(baslik) baslik.textContent = _kesfetSorgu ? 'Arama Sonuçları' : 'Son Katılanlar';

  if(!liste || !liste.length){
    el.innerHTML = '<div class="dsc-durum">' + (bosMesaj || 'Sonuç yok.') + '</div>';
    return;
  }

  el.innerHTML = liste.map(function(p){
    var bas = (p.isim || p.nickname || '?').charAt(0).toUpperCase();
    var avatar = p.avatar
      ? '<img src="' + p.avatar + '" alt="">'
      : '<span>' + bas + '</span>';
    var onayli = (typeof onayRozeti === 'function') ? onayRozeti(p, 13) : '';
    /* BRANCH_DEFS bir DİZİdir, nesne değil — id ile aranmalı.
       Önceki sürüm BRANCH_DEFS[b] yazıyordu ve hep undefined
       dönüyordu; bu yüzden herkeste '•' görünüyordu. */
    var branslar = (p.branslar || []).slice(0,3).map(function(b){
      var tanim = (typeof BRANCH_DEFS !== 'undefined')
        ? BRANCH_DEFS.find(function(x){ return x.id === b; }) : null;
      return tanim
        ? '<span class="dsc-brans" title="' + tanim.label + '">' + tanim.icon + '</span>'
        : '';
    }).join('');

    return '<button class="dsc-satir" onclick="openUserProfile(\'' + p.uid + '\')">' +
             '<div class="dsc-av">' + avatar + '</div>' +
             '<div class="dsc-bilgi">' +
               '<div class="dsc-nick">@' + (p.nickname || '') + onayli + '</div>' +
               '<div class="dsc-isim">' + (p.isim || '') + '</div>' +
             '</div>' +
             '<div class="dsc-sag">' + branslar + '</div>' +
           '</button>';
  }).join('');
}
