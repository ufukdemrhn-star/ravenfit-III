/* ══════════════════════════════════════════════════════════
   RavenFit — utils.js
   Genel yardımcılar ve güvenli matematik
   ══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   🛡️ GÜVENLİK KATMANI
   Modülerleşmede → js/core/utils.js
   ══════════════════════════════════════════════════════════ */

/* _safeRound: IEEE 754 hassasiyet sorununu önler (1.005 → 1.00 hatası)
   Banker's rounding değil, half-away-from-zero kullanır. */

function _safeRound(value, decimals){
  if(value == null || isNaN(value) || !isFinite(value)) return 0;
  decimals = decimals || 0;
  var m = Math.pow(10, decimals);
  /* IEEE 754 hassasiyet için epsilon ekle */
  return Math.round((value + Number.EPSILON) * m) / m;
}

/* _safeDiv: 0'a bölme korumalı bölme */

function _safeDiv(a, b, fallback){
  if(b == null || b === 0 || isNaN(b) || !isFinite(b)) return fallback != null ? fallback : 0;
  if(a == null || isNaN(a)) return fallback != null ? fallback : 0;
  return a / b;
}

/* ── ANTRENMAN ARAÇLARI ───────────────────────────────── */

function pad2(n){return(n<10?'0':'')+n;}

/* ── SU TAKİBİ ────────────────────────────────────────── */

function todayStr(){var d=new Date();return d.toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric'});}

/* ── Geliştirici ipuçları — konsolda görünür ────────────── */
console.log('%c💡 RavenFit Sağlık Testi: konsola  fetch(\'tests/browser-test.js\').then(r=>r.text()).then(eval)  yaz',
  'color:var(--success);font-style:italic;font-size:11px');
console.log('%c💡 RavenFit Self-Test: konsola  _ravenfitSelfTest()  yaz',
  'color:var(--purple);font-style:italic;font-size:11px');

/* ── UTILS ────────────────────────────────────────────── */

function clamp(v,lo,hi){return Math.min(hi,Math.max(lo,v));}

/* Sayı animasyonu — değer sıfırdan hedef değere sayarak gelir */

function animateNum(el,from,to,duration,decimals,suffix){
  if(!el)return;
  decimals=decimals||0;suffix=suffix||'';
  var start=null,range=to-from;
  function step(ts){
    if(!start)start=ts;
    var progress=Math.min((ts-start)/duration,1);
    var ease=1-Math.pow(1-progress,3);/* easeOutCubic */
    el.textContent=(from+range*ease).toFixed(decimals)+suffix;
    if(progress<1)requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function animateResults(){
  if(!R.bf)return;
  var bfEl=document.getElementById('bf-v');
  var ffmiEl=document.getElementById('ffmi-v');
  var bmiEl=document.getElementById('bmi-v');
  var calEl=document.getElementById('cal-v');
  var rBfEl=document.getElementById('r-bf');
  var rCalEl=document.getElementById('r-cal');
  animateNum(bfEl,0,R.bf,1200,2);
  animateNum(ffmiEl,0,R.ffmi,1200,2);
  animateNum(bmiEl,0,R.bmi,1000,1);
  animateNum(calEl,0,R.goalCal,1000,0);
  if(rBfEl)animateNum(rBfEl,0,R.bf,1000,2,'%');
  if(rCalEl)animateNum(rCalEl,0,R.goalCal,1000,0,' kcal');
}
