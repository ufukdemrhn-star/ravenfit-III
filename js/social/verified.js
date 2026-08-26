/* ══════════════════════════════════════════════════════════
   RavenFit — verified.js
   Onaylı profesyonel işareti

   Instagram'ın mavi tikinden kasten farklı bir simge kullanılır:
   düdük + onay çentiği. Sebep:
     • Mavi tik "ünlü/tanınmış" anlamına gelir — bizimki MESLEKİ
       yeterlilik doğrulaması, farklı bir şey
     • Rol ayrımı görünür olmalı: antrenör ve diyetisyen ayrı simge

   Tek yerden üretilir; profil, keşfet, akış, yorum — hepsi
   bu fonksiyonu çağırır.
   ══════════════════════════════════════════════════════════ */

var ONAY_ROLLERI = {
  antrenor: {
    ad: 'Onaylı Antrenör',
    renk: 'var(--accent)',
    /* Düdük — antrenörlüğün evrensel simgesi */
    svg: '<path d="M15.5 8.5a5.5 5.5 0 1 0 0 7h4.2a1.3 1.3 0 0 0 1.3-1.3v-4.4a1.3 1.3 0 0 0-1.3-1.3z"/>' +
         '<circle cx="10" cy="12" r="2.1"/>' +
         '<path d="M15.5 8.5V6.2a1 1 0 0 0-1.4-.92L9.6 7.1"/>'
  },
  diyetisyen: {
    ad: 'Onaylı Diyetisyen',
    renk: 'var(--success)',
    /* Yaprak + onay — beslenme uzmanlığı */
    svg: '<path d="M20 4c-8 0-13 4-13 10a7 7 0 0 0 1.3 4.1"/>' +
         '<path d="M20 4c0 8-4.5 12-10.5 13"/>' +
         '<path d="M4 20c1.5-3 4-5.5 7-7"/>'
  }
};

/* Onaylı rozeti HTML'i. Onaylı değilse boş dize döner. */
function onayRozeti(profil, boyut){
  if(!profil || profil.onay !== 'onayli') return '';
  var rol = ONAY_ROLLERI[profil.rol];
  if(!rol) return '';
  var b = boyut || 14;
  return '<span class="onay-rozet" title="' + rol.ad + '" aria-label="' + rol.ad + '">' +
           '<svg viewBox="0 0 24 24" width="' + b + '" height="' + b + '" ' +
             'fill="none" stroke="' + rol.renk + '" stroke-width="1.9" ' +
             'stroke-linecap="round" stroke-linejoin="round">' + rol.svg + '</svg>' +
         '</span>';
}

/* Rol etiketi — profilde isim altında gösterilir */
function onayEtiketi(profil){
  if(!profil || profil.onay !== 'onayli') return '';
  var rol = ONAY_ROLLERI[profil.rol];
  if(!rol) return '';
  return '<span class="onay-etiket" style="color:' + rol.renk + ';' +
         'background:color-mix(in srgb,' + rol.renk + ' 14%,transparent)">' +
         onayRozeti(profil, 12) + rol.ad + '</span>';
}
