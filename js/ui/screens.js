/* ══════════════════════════════════════════════════════════
   RavenFit — screens.js
   Ekran ve sekme geçişleri
   ══════════════════════════════════════════════════════════ */

/* ── SCREENS ──────────────────────────────────────────── */

/* Ekran geçişinden önce açık kalan tüm overlay/modal'ları kapat.
   Yeni kayıt akışında splash üzerinde takılı kalan katmanları önler. */

function closeAllOverlays(){
  try{
    document.querySelectorAll('.calc-overlay.active').forEach(function(o){
      o.classList.remove('active'); o.style.removeProperty('z-index');
    });
    document.querySelectorAll('.modal-overlay.active').forEach(function(o){
      o.classList.remove('active');
    });
    ['reds-warning-overlay','bulk-warning-overlay','warmup-overlay'].forEach(function(id){
      var el=document.getElementById(id);
      if(el) el.style.display='none';
    });
    document.body.style.overflow='';
  }catch(e){ console.warn('closeAllOverlays:',e); }
}

function showScreen(id){
  document.querySelectorAll('.screen').forEach(function(s){
    s.classList.remove('active');
    /* Eski sürümlerden kalan inline display stilini temizle —
       aksi halde .screen.active kuralı ezilir ve ekran gizlenmez */
    if(s.style.display) s.style.removeProperty('display');
  });
  var el=document.getElementById(id);
  if(el){ el.style.removeProperty('display'); el.classList.add('active'); }
  /* Wizard'da başlık ortalanır (madde 4) */
  document.body.classList.toggle('wizard-mode', id==='wizard');
  /* Misafir arayüzü ekrana göre ayarlanır (madde 6 & 7):
     banner sadece sonuçta, giriş/kayıt butonları sadece splash'te */
  if(typeof _syncGuestUI==='function') _syncGuestUI();
  window.scrollTo(0,0);
}

function goHome(){
  showScreen('splash');
  document.getElementById('bottom-nav').classList.remove('visible');
  _syncSplashHomeBtn();
}

/* Splash'teki ev butonunu duruma göre göster/gizle.
   Analiz tamamlanmamış yeni kullanıcıda görünmez. */

function _syncSplashHomeBtn(){
  var hb=document.getElementById('splash-home-btn');
  if(!hb) return;
  var hasAnalysis = !!(R && R.tdee);
  hb.style.display = hasAnalysis ? 'flex' : 'none';
}

/* Splash → Ana menü (Vücudum > Analiz) */

function goToMainMenu(){
  if(!R || !R.tdee){
    /* Analiz yoksa wizard'a yönlendir */
    if(typeof startWizard==='function') startWizard();
    return;
  }
  showScreen('results');
  document.getElementById('bottom-nav').classList.add('visible');
  switchMain('vucudum');
  /* Vücudum içinde 'Analiz' alt sekmesini aç (id='vc') */
  try {
    var analizBtn=document.querySelector('button.tb[onclick*="switchTab(\'vc\'"]');
    if(analizBtn && typeof switchTab==='function') switchTab('vc', analizBtn);
  } catch(e){ console.warn('Analiz tab geçiş hatası:',e); }
}

/* switchMain tanımı aşağıda (FAZ 3 bölümünde) */

function showResults(){showScreen('results');document.getElementById('bottom-nav').classList.add('visible');switchMain('vucudum');renderAll();if(_isGuest){var nickEl=document.getElementById('user-email-display');if(nickEl)nickEl.textContent='Misafir';var note=document.getElementById('guest-mode-note');if(note)note.style.display='block';setAvatarInitials('MI');}setTimeout(checkAndAwardBadges,1000);_syncSplashHomeBtn();}

/* ── TABS ─────────────────────────────────────────────── */

function switchTab(id,btn){
  document.querySelectorAll('.tc').forEach(function(t){t.classList.remove('act');});
  document.querySelectorAll('.tb').forEach(function(b){b.classList.remove('act');});
  document.getElementById('tc-'+id).classList.add('act');btn.classList.add('act');
}

   /* Aktif antrenman oturumu */

function switchMain(id){
  document.querySelectorAll('.main-section').forEach(function(s){s.classList.remove('active');});
  document.querySelectorAll('.bnav-btn').forEach(function(b){b.classList.remove('active');});
  document.getElementById('ms-'+id).classList.add('active');
  document.getElementById('bnav-'+id).classList.add('active');
  if(id==='profil'){renderProfilMlist();renderProfileBadges();renderConditionsSummary();}
  if(id==='vucudum')setTimeout(drawCharts,100);
  if(id==='antrenman')renderWorkoutHome();
  window.scrollTo(0,0);
}
