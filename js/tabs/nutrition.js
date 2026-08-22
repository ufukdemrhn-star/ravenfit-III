/* ══════════════════════════════════════════════════════════
   RavenFit — nutrition.js
   Beslenme sekmesi
   ══════════════════════════════════════════════════════════ */

/* ── TAB: BESLENME ────────────────────────────────────── */

function renderBeslenme(){
  /* Eski hedef isimlerini yeni'ye mapla */
  var glMap={yag:'cut', idame:'maintain', kutle:'bulk'};
  var gl=selGL||R.recGoal;
  if(glMap[gl]) gl=glMap[gl];
  var st=selST||'hybrid';
  var gN={cut:'🔥 Cut (Yağ Kaybı)', recomp:'♻️ Recomp', maintain:'⚖️ Maintain (Koruma)', bulk:'💪 Bulk (Kütle)'};
  var gC={cut:'br', recomp:'bi', maintain:'by', bulk:'bb'};
  var stN={bb:'Vücut Geliştirme',cardio:'Kardiyo',hybrid:'Hibrit'};
  document.getElementById('cal-v').textContent=R.goalCal;
  document.getElementById('goal-badge').innerHTML=
    '<div class="badge '+(gC[gl]||'bb')+'">● '+(gN[gl]||gl)+'</div>'+
    '<div class="badge bb" style="margin-left:5px">🏃 '+(stN[st]||st)+'</div>';
  document.getElementById('tdee-info').textContent=R.tdee;
  document.getElementById('bmr-info').textContent=R.bmr;
  document.getElementById('act-lbl').textContent=R.actLbl;
  var m=R.macros;
  document.getElementById('mp-v').textContent=m.pg;document.getElementById('mc-v').textContent=m.cg;document.getElementById('mf-v').textContent=m.fg;
  document.getElementById('mp-c').textContent=m.pc+' kcal';document.getElementById('mc-c').textContent=m.cc+' kcal';document.getElementById('mf-c').textContent=m.fc+' kcal';
  document.getElementById('water-v').innerHTML=R.water.toFixed(1)+'<span class="water-u"> lt</span>';
  document.getElementById('water-cups').textContent='≈ '+Math.round(R.water/0.25)+' bardak su';
  /* ── Kalori tabanı uyarısı ── */
  var cfEl=document.getElementById('cal-floor-warn');
  if(cfEl){
    if(R.calorieFloorApplied){
      var kindTxt = (R.calorieFloorKind==='bmr')
        ? 'bazal metabolizma hızının (BMR '+R.bmr+' kcal) altına indiği'
        : 'güvenli klinik minimumun ('+(U.gender==='male'?1500:1200)+' kcal) altına indiği';
      cfEl.innerHTML='⚠️ <strong style="color:var(--warn)">Kalori tabanı devrede.</strong> '+
        'Hedefine göre hesaplanan açık, '+kindTxt+' için kalori <strong>'+R.goalCal+' kcal</strong>\'e yükseltildi. '+
        'Daha agresif bir açık bu vücut ölçülerinde kas kaybı, hormonal bozulma ve besin eksikliği riski taşır. '+
        'Daha hızlı ilerlemek istiyorsan kaloriyi düşürmek yerine <strong>aktiviteni artırmayı</strong> değerlendir.';
      cfEl.style.display='block';
    } else {
      cfEl.style.display='none';
    }
  }

  document.getElementById('prot-v').textContent=R.minProt;
  /* ── Protein bilgisi — LM bazlı hesaplandıysa açıkla ── */
  var piEl=document.getElementById('prot-info');
  if(piEl){
    if(R.macros && R.macros.proteinSource==='lm'){
      piEl.innerHTML='💡 <strong>Yağ oranın yüksek olduğu için</strong> (%'+R.bf.toFixed(1)+'), protein ihtiyacın '+
        'toplam kilodan değil <strong>yağsız kütleden</strong> hesaplandı: <strong>'+R.lm.toFixed(1)+' kg × 2.4 g = '+R.macros.pg+' g/gün</strong>. '+
        'Yağ dokusu protein talep etmez — toplam kilodan hesaplamak gereksiz yüksek bir hedef çıkarır ve diyeti sürdürülemez kılar.';
    } else {
      piEl.textContent='Yağsız kütlene ('+R.lm.toFixed(2)+' kg) göre minimum '+R.minProt+'g – maksimum '+R.maxProt+'g/gün protein hedeflemelisin.';
    }
  }
  renderWaterTracker();
  renderBeslenmeToolsGrid();
  // Antrenman tavsiyesi
  var advice = getSmartWorkoutAdvice();
  var advEl = document.getElementById('workout-advice');
  if (advEl) {
    if (advice) {
      advEl.innerHTML = '<span>💡</span><span>' + advice + '</span>';
      advEl.style.display = 'flex';
    } else {
      advEl.style.display = 'none';
    }
  }
}
