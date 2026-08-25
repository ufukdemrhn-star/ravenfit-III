/* ══════════════════════════════════════════════════════════
   RavenFit — media.js
   Görsel sıkıştırma ve depolama

   NEDEN FIREBASE STORAGE DEĞİL?
   Firebase Storage artık ücretli plan (Blaze) gerektiriyor.
   Bunun yerine Firestore kullanılıyor. Firestore'da belge başına
   1 MB sınırı var — ama her belge KENDİ sınırına sahip. Bu yüzden
   her fotoğraf ayrı belgeye yazılır:

     posts/{postId}            → metin + küçük önizlemeler
     posts/{postId}/media/{n}  → her fotoğraf ayrı belge

   ÜRETİM NOTU: Gerçek uygulamada burası nesne depolamaya
   (S3, Cloudinary, Firebase Storage) taşınmalıdır. Arayüz
   değişmez — yalnızca bu dosyadaki fonksiyonlar değişir.
   ══════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────────────────
   EN-BOY ORANI SINIRI

   Sınırsız oran arayüzü bozar: 6:1 bir panorama ızgarada
   ezilir, 1:5 bir dikey fotoğraf ekranı doldurur.

   Sınır her iki yönde 4:3:
     yatay  → en fazla 4:3  (1.333)
     dikey  → en fazla 3:4  (0.750)
   Daha uç oranlar ORTADAN kırpılır — konu genelde ortadadır.
   Kare ve arası oranlar dokunulmadan geçer.
   ────────────────────────────────────────────────────────── */
var ORAN_MAX_YATAY = 4/3;   /* 1.333 */
var ORAN_MAX_DIKEY = 3/4;   /* 0.750 */

/* Kırpma penceresini hesaplar. Kırpma gerekmiyorsa null döner. */
function _kirpmaHesapla(g, y){
  var oran = g / y;
  if(oran > ORAN_MAX_YATAY){
    /* Çok geniş — yanlardan kırp */
    var yeniG = Math.round(y * ORAN_MAX_YATAY);
    return {sx: Math.round((g - yeniG)/2), sy: 0, sw: yeniG, sh: y, yon:'yatay'};
  }
  if(oran < ORAN_MAX_DIKEY){
    /* Çok uzun — üstten ve alttan kırp */
    var yeniY = Math.round(g / ORAN_MAX_DIKEY);
    return {sx: 0, sy: Math.round((y - yeniY)/2), sw: g, sh: yeniY, yon:'dikey'};
  }
  return null;
}

/* Sıkıştırma profilleri — boyut ve kalite dengesi ölçülerek seçildi */
var GORSEL_PROFIL = {
  avatar:  { boyut: 400,  kalite: 0.80, adi: 'avatar'    },  /* ~50 KB  */
  onizleme:{ boyut: 320,  kalite: 0.60, adi: 'önizleme'  },  /* ~20 KB  */
  tam:     { boyut: 1080, kalite: 0.72, adi: 'fotoğraf'  }   /* ~200 KB */
};

/* Firestore belge sınırı 1 MB. base64 veriyi ~%33 şişirdiği için
   güvenli üst sınırı 700 KB tutuyoruz. */
var MEDYA_BAYT_SINIRI = 700 * 1024;

/* ──────────────────────────────────────────────────────────
   Bir dosyayı (File/Blob) verilen profile göre sıkıştırıp
   base64 data-URI döndürür.

   Hedef boyutu aşarsa kaliteyi kademeli düşürerek tekrar dener —
   büyük fotoğraflarda tek geçiş yeterli olmuyor.
   ────────────────────────────────────────────────────────── */
function gorselSikistir(dosya, profilAdi){
  var p = GORSEL_PROFIL[profilAdi] || GORSEL_PROFIL.tam;

  return new Promise(function(cozumle, reddet){
    if(!dosya || !dosya.type || dosya.type.indexOf('image/') !== 0){
      return reddet(new Error('Geçersiz görsel dosyası'));
    }

    var okuyucu = new FileReader();
    okuyucu.onerror = function(){ reddet(new Error('Dosya okunamadı')); };
    okuyucu.onload = function(e){
      var img = new Image();
      img.onerror = function(){ reddet(new Error('Görsel çözümlenemedi')); };
      img.onload = function(){
        /* 1) Oran sınırı — gerekirse ortadan kırp */
        var kirp = (profilAdi === 'avatar')
          ? _avatarKareKirp(img.width, img.height)
          : _kirpmaHesapla(img.width, img.height);
        var kaynakG = kirp ? kirp.sw : img.width;
        var kaynakY = kirp ? kirp.sh : img.height;
        var kaynakX = kirp ? kirp.sx : 0;
        var kaynakYk = kirp ? kirp.sy : 0;

        /* 2) Uzun kenarı hedef boyuta indir, oranı koru */
        var olcek = Math.min(1, p.boyut / Math.max(kaynakG, kaynakY));
        var g = Math.round(kaynakG * olcek);
        var y = Math.round(kaynakY * olcek);

        var tuval = document.createElement('canvas');
        tuval.width = g; tuval.height = y;
        var ctx = tuval.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        /* 9 parametreli çizim: kaynak penceresi → hedef tuval */
        ctx.drawImage(img, kaynakX, kaynakYk, kaynakG, kaynakY, 0, 0, g, y);

        /* Kaliteyi kademeli düşürerek sınırın altına in */
        var kalite = p.kalite;
        var veri = tuval.toDataURL('image/jpeg', kalite);
        var deneme = 0;
        while(veri.length > MEDYA_BAYT_SINIRI && kalite > 0.35 && deneme < 6){
          kalite -= 0.10;
          veri = tuval.toDataURL('image/jpeg', kalite);
          deneme++;
        }

        if(veri.length > MEDYA_BAYT_SINIRI){
          return reddet(new Error(p.adi + ' çok büyük — daha küçük bir görsel seç'));
        }
        cozumle({
          veri: veri,
          genislik: g, yukseklik: y,
          bayt: veri.length,
          kalite: Math.round(kalite * 100),
          kirpildi: !!kirp,
          kirpYon: kirp ? kirp.yon : null
        });
      };
      img.src = e.target.result;
    };
    okuyucu.readAsDataURL(dosya);
  });
}

/* Bir dosyadan hem tam görsel hem önizleme üretir.
   Önizleme ızgarada gösterilir — tam görsel sadece gönderi
   açıldığında yüklenir, böylece akış hızlı kalır. */
/* Avatar kare olmalı — profil dairesi içinde bozulmasın */
function _avatarKareKirp(g, y){
  var k = Math.min(g, y);
  return {sx: Math.round((g-k)/2), sy: Math.round((y-k)/2), sw: k, sh: k, yon:'kare'};
}

function gorselCiftiUret(dosya){
  return Promise.all([
    gorselSikistir(dosya, 'tam'),
    gorselSikistir(dosya, 'onizleme')
  ]).then(function(sonuc){
    return { tam: sonuc[0], onizleme: sonuc[1] };
  });
}

/* Okunabilir boyut — "182 KB" gibi */
function baytMetni(bayt){
  if(bayt < 1024) return bayt + ' B';
  if(bayt < 1024*1024) return Math.round(bayt/1024) + ' KB';
  return (bayt/(1024*1024)).toFixed(1) + ' MB';
}
