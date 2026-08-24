/* ══════════════════════════════════════════════════════════
   RavenFit — render-all.js
   Tüm sekmeleri yeniden çizer
   ══════════════════════════════════════════════════════════ */

/* ── RENDER ALL ───────────────────────────────────────── */

function renderAll(){
  if(!R.bf)return;
  try {
  } catch(err){ console.warn('renderAll header:',err); }
  try { renderVucudum(); } catch(err){ console.error('renderVucudum hatası:',err); }
  try { renderBeslenme(); } catch(err){ console.error('renderBeslenme hatası:',err); }
  try { renderOlculerim(); } catch(err){ console.error('renderOlculerim hatası:',err); }
  try { renderIlerleme(); } catch(err){ console.error('renderIlerleme hatası:',err); }
  try { renderProfilMlist(); } catch(err){ console.error('renderProfilMlist hatası:',err); }
  setTimeout(animateResults,120);
}
