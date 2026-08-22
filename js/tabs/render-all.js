/* ══════════════════════════════════════════════════════════
   RavenFit — render-all.js
   Tüm sekmeleri yeniden çizer
   ══════════════════════════════════════════════════════════ */

/* ── RENDER ALL ───────────────────────────────────────── */

function renderAll(){
  if(!R.bf)return;
  try {
    document.getElementById('r-name').textContent=U.name?'Merhaba, '+U.name+'!':'Analiz Tamamlandı!';
    document.getElementById('r-lm').textContent=R.lm.toFixed(2)+' kg';
    document.getElementById('r-bf').textContent=R.bf.toFixed(2)+'%';
    document.getElementById('r-ffmi').textContent=R.ffmi.toFixed(2);
    document.getElementById('r-cal').textContent=R.goalCal+' kcal';
  } catch(err){ console.warn('renderAll header:',err); }
  try { renderVucudum(); } catch(err){ console.error('renderVucudum hatası:',err); }
  try { renderBeslenme(); } catch(err){ console.error('renderBeslenme hatası:',err); }
  try { renderOlculerim(); } catch(err){ console.error('renderOlculerim hatası:',err); }
  try { renderIlerleme(); } catch(err){ console.error('renderIlerleme hatası:',err); }
  try { renderProfilMlist(); } catch(err){ console.error('renderProfilMlist hatası:',err); }
  setTimeout(animateResults,120);
}
