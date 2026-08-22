/* ══════════════════════════════════════════════════════════
   RavenFit — theme.js
   Tema yönetimi
   ══════════════════════════════════════════════════════════ */

/* ── THEME ────────────────────────────────────────────── */

function setTheme(t){
  applyTheme(t);
  localStorage.setItem('rf_theme',t);
  saveToFirebase();
}

function applyTheme(t){
  document.documentElement.setAttribute('data-theme',t);
  document.querySelectorAll('.tdot').forEach(function(d){d.classList.toggle('act',d.dataset.t===t);});
}
