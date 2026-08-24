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
        /* Uzun kenarı hedef boyuta indir, oranı koru */
        var olcek = Math.min(1, p.boyut / Math.max(img.width, img.height));
        var g = Math.round(img.width  * olcek);
        var y = Math.round(img.height * olcek);

        var tuval = document.createElement('canvas');
        tuval.width = g; tuval.height = y;
        var ctx = tuval.getContext('2d');
        /* Küçültmede kalite kaybını azalt */
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, g, y);

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
          kalite: Math.round(kalite * 100)
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
