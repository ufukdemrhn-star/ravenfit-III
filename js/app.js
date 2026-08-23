/* ══════════════════════════════════════════════════════════
   RavenFit — app.js
   Uygulama başlatıcı. Tüm modüller yüklendikten sonra çalışır.
   ══════════════════════════════════════════════════════════ */

window.addEventListener('load', function(){
  /* 1. Kayıtlı temayı uygula */
  var th = _lsGet('rf_theme') || 'dark';
  applyTheme(th);

  /* 2. JSON veri dosyalarını yükle (egzersiz, program, rozet...) */
  loadDataFiles();

  /* 3. Giriş ekranını göster — Firebase onAuthStateChanged devralır */
  showAuthScreen();
});

/* Firebase SDK yüklendikten sonra başlatılır (index.html sonunda çağrılır) */
