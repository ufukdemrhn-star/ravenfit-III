/* ══════════════════════════════════════════════════════════
   RavenFit — working-set.js
   Çalışma seti hesaplayıcı
   ══════════════════════════════════════════════════════════ */

/* ══ 2. ÇALIŞMA SETİ HESAPLAYICI ══════════════════════════ */

function _calcWorkingSet(){
  var targetKg=_calcState.wsTarget||'';
  var sets=_calcState.wsSets||3;
  var reps=_calcState.wsReps||'';
  var diff=_calcState.wsDiff||'medium';
  var fixed=_calcState.wsFixed===true;
  var html='';

  /* Input kartı — Hedef, set, rep */
  html+='<div class="calc-grid-card">';
  html+='<div class="calc-label">Hedef Ağırlık ('+unitLabel()+')</div>';
  html+='<input class="calc-input" type="number" inputmode="decimal" step="0.5" placeholder="—" value="'+targetKg+'" oninput="_calcState.wsTarget=this.value;_calcWorkingSetUpdate()" id="calc-ws-target">';
  html+='<button class="btn btn-s btn-full" onclick="_calcWSFromBest()" style="margin-top:10px;font-size:12px">📊 Son Antrenmandan Al</button>';
  html+='</div>';

  /* Set + Rep */
  html+='<div class="calc-grid-card">';
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
  html+='<div><div class="calc-label">Set Sayısı (1-5)</div>';
  html+='<input class="calc-input" type="number" inputmode="numeric" min="1" max="5" value="'+sets+'" oninput="_calcState.wsSets=this.value;_calcWorkingSetUpdate()" style="font-size:24px;padding:10px"></div>';
  html+='<div><div class="calc-label">Tekrar Sayısı (1-10)</div>';
  html+='<input class="calc-input" type="number" inputmode="numeric" min="1" max="10" value="'+reps+'" placeholder="—" oninput="_calcState.wsReps=this.value;_calcWorkingSetUpdate()" style="font-size:24px;padding:10px"></div>';
  html+='</div></div>';

  /* Zorluk seçimi */
  html+='<div class="calc-grid-card">';
  html+='<div class="calc-label">Zorluk</div>';
  html+='<div class="calc-btn-grid three">';
  var diffs=[
    {id:'easy',lbl:'😌 Kolay',desc:'%70-75'},
    {id:'medium',lbl:'💪 Orta',desc:'%75-80'},
    {id:'hard',lbl:'🔥 Zor',desc:'%80-85'}
  ];
  diffs.forEach(function(d){
    var sel=diff===d.id?' sel':'';
    html+='<div class="calc-btn'+sel+'" onclick="_calcState.wsDiff=\''+d.id+'\';_calcWorkingSetRerender()"><div>'+d.lbl+'</div><div style="font-size:8px;margin-top:2px">'+d.desc+'</div></div>';
  });
  html+='</div>';
  /* Sabit ağırlık toggle */
  html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding:10px 12px;background:var(--card2);border-radius:10px;cursor:pointer" onclick="_calcState.wsFixed=!_calcState.wsFixed;_calcWorkingSetRerender()">';
  html+='<div>';
  html+='<div style="font-size:12px;font-weight:700;color:var(--text)">Sabit Ağırlık</div>';
  html+='<div style="font-size:10px;color:var(--text2);margin-top:2px">Açık: tüm setler aynı kg · Kapalı: piramit artış</div>';
  html+='</div>';
  html+='<div style="width:46px;height:26px;border-radius:13px;background:'+(fixed?'var(--accent)':'var(--border)')+';position:relative;flex-shrink:0;transition:background .2s">';
  html+='<div style="position:absolute;top:3px;left:'+(fixed?'23px':'3px')+';width:20px;height:20px;border-radius:50%;background:var(--on-accent);transition:left .2s"></div>';
  html+='</div></div>';
  html+='</div>';

  /* Sonuç */
  html+='<div id="calc-ws-result"></div>';

  html+='<div class="calc-grid-card" style="background:var(--card2)">';
  html+='<div style="font-size:11px;color:var(--text2);line-height:1.55">';
  html+='💡 <strong>Çalışma seti hesaplayıcı:</strong> Hedeflediğin ağırlık için zorluğa göre gerçek çalışma ağırlığını hesaplar.<br><br>';
  html+='<strong>Sabit:</strong> Tüm setler tek ağırlıkta — güç/kütle için klasik yöntem.<br>';
  html+='<strong>Piramit:</strong> Her sette +2.5 '+unitLabel()+' artış — warm-up içeren doğal progresyon.<br><br>';
  html+='<strong>Çalışma hacmi</strong> = toplam kg × rep (kas gelişimi için anahtar metrik).';
  html+='</div></div>';

  setTimeout(_calcWorkingSetUpdate,30);
  return html;
}

function _calcWorkingSetRerender(){
  document.getElementById('calc-body').innerHTML=_calcWorkingSet();
}

function _calcWorkingSetUpdate(){
  var target=parseFloat(_calcState.wsTarget)||0;
  var sets=parseInt(_calcState.wsSets)||3;
  var reps=parseInt(_calcState.wsReps)||0;
  var diff=_calcState.wsDiff||'medium';
  var fixed=_calcState.wsFixed===true;
  var el=document.getElementById('calc-ws-result');
  if(!el) return;

  /* Sınırlar: Ağırsağlam ile aynı */
  if(sets<1||sets>5){
    el.innerHTML='<div class="calc-result" style="opacity:.5"><div class="calc-result-val">—</div><div class="calc-result-unit">Set sayısı 1-5 arası olmalı</div></div>';
    return;
  }
  if(reps<1||reps>10){
    el.innerHTML='<div class="calc-result" style="opacity:.5"><div class="calc-result-val">—</div><div class="calc-result-unit">Tekrar sayısı 1-10 arası olmalı</div></div>';
    return;
  }
  if(!target||!reps){
    el.innerHTML='<div class="calc-result" style="opacity:.5"><div class="calc-result-val">—</div><div class="calc-result-unit">Hedef + set + rep gir</div></div>';
    return;
  }

  function round25(x){return Math.round(x/2.5)*2.5;}

  /* ══ BAŞLANGIÇ % TABLOSU ══════════════════════════════
     30 test verisinden çıkarıldı — zorluk × rep × set kombinasyonu */
  var base;
  if(diff==='easy'){
    if(reps===2) base=77.5;
    else if(reps===3||reps===4) base=75;
    else if(reps===5) base=72.5;
    else if(reps===6) base=70;
    else if(reps===7||reps===8) base=67.5;
    else base=65;
  } else if(diff==='medium'){
    if(reps===2) base=80;
    else if(reps===3) base=77.5;
    else if(reps===4) base=75;
    else if(reps===5){
      if(sets===2) base=77.5;
      else if(sets===3) base=75;
      else if(sets>=5) base=70;
      else base=72.5;
    }
    else if(reps===6) base=70;
    else if(reps===7||reps===8) base=70;
    else if(reps===9||reps===10) base=65;
    else base=60;
  } else { /* hard */
    if(reps===2) base=82.5;
    else if(reps===3) base=80;
    else if(reps===4) base=77.5;
    else if(reps===5) base=75;
    else if(reps===6) base=72.5;
    else if(reps===7||reps===8) base=70;
    else base=65;
  }

  var start=round25(target*base/100);

  /* ══ ARTIŞ PATTERN ══════════════════════════════════════ */
  var weights=[];

  /* Düşük rep (2-4) → genelde LINEAR */
  if(reps<=4){
    if(diff==='easy' && reps===4 && sets===3){
      /* Test 22 istisnası: easy 3×4 */
      weights=[start, start, start+2.5];
    } else {
      for(var i=0;i<sets;i++) weights.push(start+i*2.5);
    }
  }
  /* Hard zorluk (rep 5+) → LINEAR */
  else if(diff==='hard'){
    for(var i=0;i<sets;i++) weights.push(start+i*2.5);
  }
  /* Medium 3×5 — 1RM'e göre */
  else if(diff==='medium' && sets===3 && reps===5){
    if(target>=120){
      for(var i=0;i<sets;i++) weights.push(start+i*2.5); /* linear */
    } else {
      weights=[start, start, start+2.5]; /* stair */
    }
  }
  /* Easy 3×5 — 1RM'e göre */
  else if(diff==='easy' && sets===3 && reps===5){
    if(target>=150){
      for(var i=0;i<sets;i++) weights.push(start+i*2.5); /* linear */
    } else {
      weights=[start, start+2.5, start+2.5]; /* modified stair */
    }
  }
  /* Medium 5×5 özel pattern */
  else if(diff==='medium' && sets===5 && reps===5){
    weights=[start, start, start+2.5, start+5, start+5];
  }
  /* Medium 4×6 özel pattern */
  else if(diff==='medium' && sets===4 && reps===6){
    weights=[start, start+2.5, start+2.5, start+5];
  }
  /* Medium 4×10 özel pattern */
  else if(diff==='medium' && sets===4 && reps===10){
    weights=[start, start, start+2.5, start+2.5];
  }
  /* Medium 2×5 */
  else if(diff==='medium' && sets===2 && reps===5){
    weights=[start, start+2.5];
  }
  /* Default: her 2 sette +2.5kg (stair-step) */
  else {
    for(var i=0;i<sets;i++) weights.push(start+Math.floor(i/2)*2.5);
  }

  /* ══ SABİT MOD ══ Piramit max'ını tüm setlere */
  if(fixed){
    var maxW=Math.max.apply(null,weights);
    weights=[];
    for(var i=0;i<sets;i++) weights.push(maxW);
  }

  /* ══ DİNLENME ══════════════════════════════════════════
     Rep ≤4 (güç odaklı) → uzun dinlenme
     Rep 5+ (kas odaklı) → kısa dinlenme */
  var rest;
  if(reps<=4){
    if(diff==='easy') rest=5;
    else if(diff==='medium') rest=8;
    else rest=10;
  } else {
    if(diff==='easy') rest=2;
    else if(diff==='medium') rest=3;
    else rest=5;
  }

  /* Hacim */
  var volume=weights.reduce(function(a,w){return a+w*reps;},0);

  var diffLabel={easy:'😌 Kolay',medium:'💪 Orta',hard:'🔥 Zor'}[diff];
  var html='<div class="calc-result">';
  html+='<div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">'+diffLabel+' · '+(fixed?'SABİT':'PİRAMİT')+'</div>';
  html+='<div class="calc-result-val">'+volume+'</div>';
  html+='<div class="calc-result-unit">birim toplam hacim</div>';
  html+='<div class="calc-result-sub">💤 '+rest+' dk dinlenme</div>';
  html+='</div>';

  /* Set listesi */
  html+='<div class="calc-grid-card"><div class="calc-label">Set Planı</div>';
  weights.forEach(function(w,i){
    var pct=Math.round(w/target*100);
    html+='<div class="calc-percentage-row">';
    html+='<span class="calc-pct-pct">Set '+(i+1)+'</span>';
    html+='<span class="calc-pct-val">'+w+' '+unitLabel()+' × '+reps+'</span>';
    html+='<span class="calc-pct-range">%'+pct+'</span>';
    html+='</div>';
  });
  html+='<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0 2px;border-top:1px solid var(--border);margin-top:4px">';
  html+='<span style="font-size:11px;font-weight:700;color:var(--text)">Toplam Hacim</span>';
  html+='<span style="font-family:\'Bebas Neue\',cursive;font-size:22px;color:var(--accent)">'+volume+'</span>';
  html+='</div>';
  html+='</div>';

  el.innerHTML=html;
}

function _calcWSFromBest(){
  var best=_findBestSet();
  if(!best){
    showToast('📭 Henüz antrenman kaydın yok','warn');
    return;
  }
  var rmKg=_formulaWathen(best.kg,best.reps);
  var displayRM=getUnit()==='lb'?(rmKg*2.20462).toFixed(1):rmKg.toFixed(1);
  _calcState.wsTarget=displayRM;
  var inp=document.getElementById('calc-ws-target');
  if(inp) inp.value=displayRM;
  showToast('✅ 1RM tahminin: '+displayRM+' '+unitLabel()+' ('+best.exName+')','success');
  _calcWorkingSetUpdate();
}
