// ════════════════════════════════════════════════════════════
//  ui.js — EKRAN NAVİGASYONU (SPA çatısı)
//  RavenFit2'deki showScreen mantığı, modüler hali. İleride
//  ayar çekmecesi, modal, sekmeler de buraya eklenecek.
// ════════════════════════════════════════════════════════════

// Verilen id'li ekranı göster, diğerlerini gizle
export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s =>
    s.classList.toggle('active', s.id === id));
  window.scrollTo(0, 0);
}
