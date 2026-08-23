/* ══════════════════════════════════════════════════════════
   RavenFit — water.js
   Su takibi
   ══════════════════════════════════════════════════════════ */

/* ── Su takibi — supplement entegrasyonu ── */

function _calcWaterTarget(){
  /* ── Temel su: 35 ml/kg (ACSM 2024 hidrasyon rehberi) ── */
  var baseLt=(U.weight||70)*0.035;
  var baseCups=Math.round(baseLt/0.25);

  /* ── Aktivite eki: wizard'daki gerçek aktivite düzeyine göre ──
     R.actMult güvenilir kaynaktır (supplement testi yapılmamış olabilir).
     ≥1.725 (çok aktif)  → +2 bardak (~500 ml)
     ≥1.55  (aktif)      → +2 bardak (~500 ml, ACSM antrenman bonusu)
     ≥1.375 (hafif aktif)→ +1 bardak
     altı                → +0 */
  var actExtra=0;
  var am=R.actMult||1.2;
  if(am>=1.55) actExtra=2;
  else if(am>=1.375) actExtra=1;

  /* Supplement eki */
  var suppExtra=0;
  var suppReasons=[];
  var used=getUserSupplements();
  SUPP_USED_LIST.forEach(function(s){
    if(s.waterExtra>0&&used.indexOf(s.id)>=0){
      suppExtra+=s.waterExtra;
      suppReasons.push(s.label+' (+'+s.waterExtra+')');
    }
  });

  var totalCups=baseCups+actExtra+suppExtra;
  var totalLt=totalCups*0.25;
  return {lt:totalLt, cups:totalCups, baseCups:baseCups, actExtra:actExtra, suppExtra:suppExtra, suppReasons:suppReasons};
}

function getWaterState(){
  try{var raw=_lsGet('rf_water_today');if(raw){var s=JSON.parse(raw);if(s.date===todayStr())return s;}}catch(e){}
  return{date:todayStr(),count:0};
}

function saveWaterState(s){_lsSet('rf_water_today',JSON.stringify(s));}

function toggleWaterCup(idx){
  if(!R.water)return;
  var total=Math.round(R.water/0.25);
  var s=getWaterState();
  if(s.count===idx+1){s.count=idx;}else{s.count=idx+1;}
  s.count=Math.max(0,Math.min(s.count,total));
  saveWaterState(s);
  renderWaterTracker();
  if(s.count>=total){showToast('🎉 Günlük su hedefini tamamladın!','success');setTimeout(checkAndAwardBadges,600);}
}

function renderWaterTracker(){
  if(!R.water)return;
  /* Supplement entegreli su hesabı */
  var wt=_calcWaterTarget();
  /* R.water'ı güncelle (diğer fonksiyonlar da kullanıyor) */
  R.water=wt.lt;
  var total=wt.cups;

  /* Üst bilgi güncelle */
  var wvEl=document.getElementById('water-v');
  if(wvEl) wvEl.innerHTML=R.water.toFixed(1)+'<span class="water-u"> lt</span>';
  var wcEl=document.getElementById('water-cups');
  if(wcEl) wcEl.textContent='≈ '+total+' bardak su';

  /* Bardak grid */
  var s=getWaterState();
  var grid=document.getElementById('water-cups-grid');
  if(!grid)return;
  var html='';
  for(var i=0;i<total;i++){
    html+='<div class="water-cup'+(i<s.count?' filled':'')+'" onclick="toggleWaterCup('+i+')">'+(i<s.count?'💧':'🫗')+'</div>';
  }
  grid.innerHTML=html;
  var pct=total>0?Math.min(100,Math.round(s.count/total*100)):0;
  var fill=document.getElementById('water-prog-fill');
  if(fill)fill.style.width=pct+'%';
  var drunk=(s.count*0.25).toFixed(2);
  var statusEl=document.getElementById('water-status-txt');
  if(statusEl)statusEl.textContent='İçilen: '+drunk+' lt / Hedef: '+R.water.toFixed(2)+' lt ('+pct+'%)';

  /* ── Hiponatremi uyarısı — günde >5 L su tehlikeli olabilir ──
     Referans: ACSM / egzersiz kaynaklı hiponatremi (EAH) rehberleri */
  var hypoEl=document.getElementById('water-hypo-warn');
  if(hypoEl){
    if(R.water>5){
      hypoEl.innerHTML='⚠️ <strong style="color:var(--accent)">Dikkat:</strong> Günde 5 litre üzerinde su tüketimi '+
        '<strong>hiponatremi</strong> (kan sodyum düşüklüğü) riskini artırır. Yoğun terlemede su ile birlikte '+
        '<strong>elektrolit</strong> (sodyum, potasyum, magnezyum) almayı ihmal etme.';
      hypoEl.style.display='block';
    } else {
      hypoEl.style.display='none';
    }
  }

  /* Supplement notu */
  var noteEl=document.getElementById('water-supp-note');
  if(noteEl){
    if(wt.suppExtra>0){
      noteEl.innerHTML='<div style="margin-top:8px;padding:8px 10px;background:color-mix(in srgb, var(--success) 8%, transparent);border:1px solid color-mix(in srgb, var(--success) 25%, transparent);border-radius:8px;font-size:11px;color:var(--text2);line-height:1.5">'+
        '💊 '+wt.suppReasons.join(', ')+' kullandığın için günlük su hedefin <strong style="color:var(--success)">+'+wt.suppExtra+' bardak</strong> artırıldı.'+
        '<br><span style="font-size:10px;color:var(--text3)">Temel: '+wt.baseCups+' · Aktivite: +'+wt.actExtra+' · Supplement: +'+wt.suppExtra+' = <strong>'+total+' bardak</strong></span>'+
      '</div>';
    } else {
      noteEl.innerHTML='';
    }
  }
}

function resetWaterToday(){
  showConfirm('Su Takibini Sıfırla','Bugünkü su takibin sıfırlanacak. Emin misin?',function(){
    var s={date:todayStr(),count:0};saveWaterState(s);renderWaterTracker();
    showToast('Su takibi sıfırlandı.','success');
  },'Evet');
}
