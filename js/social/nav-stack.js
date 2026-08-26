/* ══════════════════════════════════════════════════════════
   RavenFit — nav-stack.js
   Ekran dönüş yığını

   SORUN
   Keşfet → profil → gönderi zincirinde geri tuşuna basınca
   kullanıcı en alttaki sekmeye düşüyordu. Keşfet kapanıyor,
   geri dönerken kimse onu açmıyordu.

   ÇÖZÜM
   Bir ekran başka bir ekranın üstüne açılırken, altındakini
   yığına kaydeder. Kapanırken yığından çıkarıp geri açar.
   Böylece Keşfet'te 200 satır aşağıdaysan, profile girip
   dönünce yine 200. satırdasın.
   ══════════════════════════════════════════════════════════ */

var _navYigin = [];

/* Bir ekranı yığına kaydet ve kapat.
   ad     : ekran kimliği ('discover', 'feed', 'userProfile')
   kapat  : kapatma fonksiyonu
   ac     : geri dönüşte çağrılacak açma fonksiyonu */
function navGizle(ad, kapat, ac){
  _navYigin.push({ad: ad, ac: ac});
  if(typeof kapat === 'function') kapat();
}

/* Yığından bir üst ekranı geri aç. Yığın boşsa hiçbir şey yapmaz. */
function navGeri(){
  var oge = _navYigin.pop();
  if(oge && typeof oge.ac === 'function'){
    /* Kapanma animasyonu bitmeden açmak titremeye yol açıyor */
    setTimeout(oge.ac, 40);
    return true;
  }
  return false;
}

/* Yığını temizle — sekme değişimi gibi bağlamı kıran durumlarda */
function navSifirla(){
  _navYigin = [];
}

