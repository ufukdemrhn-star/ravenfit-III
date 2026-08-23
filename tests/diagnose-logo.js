/* ══════════════════════════════════════════════════════════════
   RavenFit — LOGO TANI ARACI
   PR ekranındaki arka plan logosu neden görünmüyor, kesin tespit eder.

   KULLANIM — konsola yapıştır:
     fetch('tests/diagnose-logo.js?v='+Date.now()).then(r=>r.text()).then(eval)
   ══════════════════════════════════════════════════════════════ */

(function () {
  var OK = 'color:#2EC4B6;font-weight:bold';
  var NO = 'color:#E63946;font-weight:bold';
  var WR = 'color:#FF9F1C;font-weight:bold';
  var HD = 'color:#9B72FF;font-weight:bold;font-size:13px';
  var DM = 'color:#909090';

  console.log('%c\n╔════════════════════════════════════════════════╗', HD);
  console.log('%c║   LOGO TANI ARACI                              ║', HD);
  console.log('%c╚════════════════════════════════════════════════╝', HD);

  var kok = location.href.replace(/[^/]*$/, '');
  console.log('%c\nSayfa kökü: ' + kok, DM);

  var sonuc = { dosya: null, cssKurali: null, cssYolu: null, cozulen: null };

  /* ── 1. Dosya sunucuda var mı? ─────────────────────────── */
  console.log('%c\n▸ 1. Dosya sunucuda var mı?', HD);

  var adaylar = ['assets/icons/logo.png', 'logo.png', 'css/assets/icons/logo.png'];
  var kalan = adaylar.length;

  adaylar.forEach(function (yol) {
    fetch(yol + '?v=' + Date.now(), { cache: 'no-store' })
      .then(function (r) {
        if (r.ok) {
          console.log('%c  ✅ ' + yol + '  (' + r.status + ')', OK);
          if (yol === 'assets/icons/logo.png') sonuc.dosya = true;
        } else {
          console.log('%c  ❌ ' + yol + '  (' + r.status + ')', NO);
          if (yol === 'assets/icons/logo.png') sonuc.dosya = false;
        }
      })
      .catch(function () {
        console.log('%c  ❌ ' + yol + '  (erişilemedi)', NO);
        if (yol === 'assets/icons/logo.png') sonuc.dosya = false;
      })
      .finally(function () { if (--kalan === 0) setTimeout(asama2, 100); });
  });

  /* ── 2. Tarayıcının yüklediği CSS ne diyor? ────────────── */
  function asama2() {
    console.log('%c\n▸ 2. Tarayıcının ŞU AN yüklü CSS kuralı', HD);

    var bulundu = false;
    try {
      for (var i = 0; i < document.styleSheets.length; i++) {
        var rs;
        try { rs = document.styleSheets[i].cssRules; } catch (e) { continue; }
        if (!rs) continue;
        for (var j = 0; j < rs.length; j++) {
          var txt = rs[j].cssText || '';
          if (txt.indexOf('pr-feel-bg') > -1 && txt.indexOf('logo.png') > -1) {
            bulundu = true;
            sonuc.cssKurali = txt;
            var m = txt.match(/url\((["']?)([^"')]+)\1\)/);
            sonuc.cssYolu = m ? m[2] : '?';
            console.log('%c  Dosya : ' + (document.styleSheets[i].href || '(inline)'), DM);
            console.log('%c  url() : ' + sonuc.cssYolu,
              sonuc.cssYolu.indexOf('../assets/') === 0 ? OK : NO);
            /* Tarayıcı bunu neye çözüyor? */
            try {
              var base = document.styleSheets[i].href || location.href;
              sonuc.cozulen = new URL(sonuc.cssYolu, base).href;
              console.log('%c  Çözülen tam adres:', DM);
              console.log('%c  ' + sonuc.cozulen, DM);
            } catch (e) {}
          }
        }
      }
    } catch (e) { console.log('%c  ⚠️ CSS okunamadı: ' + e.message, WR); }

    if (!bulundu) {
      console.log('%c  ❌ .pr-feel-bg kuralı hiç bulunamadı!', NO);
      console.log('%c     → calculators.css yüklenmemiş olabilir', WR);
    }
    setTimeout(asama3, 100);
  }

  /* ── 3. Çözülen adres gerçekten çalışıyor mu? ──────────── */
  function asama3() {
    console.log('%c\n▸ 3. CSS\'in aradığı adres çalışıyor mu?', HD);
    if (!sonuc.cozulen) { console.log('%c  (atlandı)', DM); return setTimeout(teshis, 100); }

    fetch(sonuc.cozulen, { cache: 'no-store' })
      .then(function (r) {
        console.log('%c  ' + (r.ok ? '✅' : '❌') + ' HTTP ' + r.status, r.ok ? OK : NO);
      })
      .catch(function () { console.log('%c  ❌ erişilemedi', NO); })
      .finally(function () { setTimeout(teshis, 150); });
  }

  /* ── TEŞHİS ────────────────────────────────────────────── */
  function teshis() {
    console.log('%c\n' + '═'.repeat(50), HD);
    console.log('%c TEŞHİS', HD);
    console.log('%c' + '═'.repeat(50), HD);

    var y = sonuc.cssYolu;

    if (sonuc.dosya === false) {
      console.log('%c\n❌ SORUN: assets/icons/logo.png sunucuda YOK', NO);
      console.log('%c\n   ÇÖZÜM: GitHub deponda assets/icons/ klasörünü oluştur', WR);
      console.log('%c   ve logo.png dosyasını oraya yükle.', WR);
      return;
    }

    if (y && y.indexOf('../assets/') === 0) {
      console.log('%c\n✅ CSS doğru — yol ../assets/icons/logo.png', OK);
      console.log('%c\n   Logo hâlâ görünmüyorsa sayfayı sert yenile:', WR);
      console.log('%c   Windows: Ctrl + Shift + R', WR);
      console.log('%c   Mac:     Cmd + Shift + R', WR);
      return;
    }

    if (y && y.indexOf('assets/') === 0) {
      console.log('%c\n❌ SORUN: Tarayıcı ESKİ CSS kullanıyor (önbellek)', NO);
      console.log('%c\n   Yüklü yol : ' + y + '   ← eski', NO);
      console.log('%c   Olması gereken: ../assets/icons/logo.png', OK);
      console.log('%c\n   ÇÖZÜM 1 — Sert yenileme:', WR);
      console.log('%c     Windows: Ctrl + Shift + R', WR);
      console.log('%c     Mac:     Cmd + Shift + R', WR);
      console.log('%c\n   ÇÖZÜM 2 — Önbelleği temizle:', WR);
      console.log('%c     F12 açıkken yenile butonuna SAĞ TIK', WR);
      console.log('%c     → "Önbelleği boşalt ve zorla yenile"', WR);
      console.log('%c\n   ÇÖZÜM 3 — Yeni CSS gerçekten yüklendi mi kontrol et:', WR);
      console.log('%c     fetch(\'css/calculators.css?v=\'+Date.now())', WR);
      console.log('%c       .then(r=>r.text()).then(t=>console.log(t.match(/url\\([^)]*\\)/)[0]))', WR);
      return;
    }

    console.log('%c\n⚠️ Beklenmedik durum. Yukarıdaki çıktıyı paylaş.', WR);
  }
})();
