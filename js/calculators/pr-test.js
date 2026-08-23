/* ══════════════════════════════════════════════════════════
   RavenFit — pr-test.js
   PR testi: ısınma, plaka, deneme, sonuç
   ══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   🎯 PR DENEMESİ (REKOR DENEMESİ) — Tam Sistem
   ══════════════════════════════════════════════════════════ */

var _pr={
  screen:'setup',     /* setup → warmup → warmup-rest → warmup-feel → attempt → attempt-rest → attempt-feel → result */
  target:0,            /* hedef kg */
  exercise:'squat',    /* squat / bench / deadlift */
  bar:20,              /* 20 = olimpik, 10 = yarı olimpik */
  plates:{},           /* {25:0, 20:0, 15:0, 10:0, 5:0, 2.5:0, 1.25:0} */
  warmupIdx:0,         /* 0..4 (5 ısınma) */
  warmupSets:[],       /* [{kg, reps, rest, variants:[...], variantIdx:0}, ...] */
  warmupFeel:null,     /* son ısınma hissi (kötü/normal/iyi) */
  attemptIdx:0,        /* 0..2 (3 deneme) */
  attempts:[],         /* [{kg, feel, success}] */
  history:[],          /* tümü log için */
  restSeconds:0,       /* dinlenme süresi */
  _restTimer:null,
  _feelValue:0.5       /* slider: 0..1 */
};

/* Plaka renkleri (IPF standard) */

var PLATE_COLORS={
  25:'#d62828',    /* kırmızı */
  20:'#1d4e89',    /* mavi */
  15:'#f4b942',    /* sarı */
  10:'#2f9e44',    /* yeşil */
  5:'#e9ecef',     /* beyaz */
  2.5:'#adb5bd',   /* gri */
  1.25:'#6c757d'   /* koyu gri */
};

/* Plaka preset yükle/kaydet */

function _prLoadPlates(){
  var saved=_lsGet('rf_pr_plates');
  if(saved){try{return JSON.parse(saved);}catch(e){}}
  return {25:0,20:0,15:0,10:0,5:0,2.5:0,1.25:0};
}

function _prSavePlates(){
  try{_lsSet('rf_pr_plates',JSON.stringify(_pr.plates));}catch(e){}
}

/* Egzersiz adı */

function _prExerciseName(e){
  return {squat:'🦵 Squat',bench:'💪 Bench Press',deadlift:'🏋️ Deadlift'}[e]||e;
}

/* Ana render — her ekranı yönlendirir */

function _renderPR(){
  var body=document.getElementById('calc-body');
  if(!body) return;
  if(_pr.screen==='setup') body.innerHTML=_prSetup();
  else if(_pr.screen==='warmup') body.innerHTML=_prWarmupSet();
  else if(_pr.screen==='warmup-active') body.innerHTML=_prWarmupActive();
  else if(_pr.screen==='warmup-rest') body.innerHTML=_prWarmupRest();
  else if(_pr.screen==='warmup-feel') body.innerHTML=_prFeelSlider('warmup');
  else if(_pr.screen==='attempt') body.innerHTML=_prAttempt();
  else if(_pr.screen==='attempt-active') body.innerHTML=_prAttemptActive();
  else if(_pr.screen==='attempt-rest') body.innerHTML=_prAttemptRest();
  else if(_pr.screen==='attempt-feel') body.innerHTML=_prFeelSlider('attempt');
  else if(_pr.screen==='result') body.innerHTML=_prResult();
}

/* ══ SETUP EKRANI ═══════════════════════════════════════════ */

function _prSetup(){
  if(!_pr.plates||Object.keys(_pr.plates).length===0){
    _pr.plates=_prLoadPlates();
  }
  var html='';

  /* Hedef kg */
  html+='<div class="calc-grid-card">';
  html+='<div class="calc-label">İstenen Maksimum ('+unitLabel()+')</div>';
  html+='<input class="calc-input" type="number" inputmode="decimal" step="2.5" placeholder="—" value="'+(_pr.target||'')+'" oninput="_pr.target=parseFloat(this.value)||0" id="pr-target">';
  html+='</div>';

  /* Egzersiz seç */
  html+='<div class="calc-grid-card">';
  html+='<div class="calc-label">Egzersiz</div>';
  html+='<div class="calc-btn-grid three">';
  var exs=[{id:'squat',lbl:'🦵 Squat'},{id:'bench',lbl:'💪 Bench'},{id:'deadlift',lbl:'🏋️ Deadlift'}];
  exs.forEach(function(e){
    html+='<div class="calc-btn'+(_pr.exercise===e.id?' sel':'')+'" onclick="_pr.exercise=\''+e.id+'\';_renderPR()">'+e.lbl+'</div>';
  });
  html+='</div></div>';

  /* Bar seç */
  html+='<div class="calc-grid-card">';
  html+='<div class="calc-label">Mevcut Bar</div>';
  html+='<div class="calc-btn-grid two">';
  html+='<div class="calc-btn'+(_pr.bar===20?' sel':'')+'" onclick="_pr.bar=20;_renderPR()">Olimpik (20 '+unitLabel()+')</div>';
  html+='<div class="calc-btn'+(_pr.bar===10?' sel':'')+'" onclick="_pr.bar=10;_renderPR()">Yarı Olimpik (10 '+unitLabel()+')</div>';
  html+='</div></div>';

  /* Plakalar */
  html+='<div class="calc-grid-card">';
  html+='<div class="calc-label">Mevcut Plakalar (çift olarak)</div>';
  var plateRows=[25,20,15,10,5,2.5,1.25];
  plateRows.forEach(function(p){
    var max=(p>=20)?10:1;   /* 20 ve 25 max 10 çift, diğerleri max 1 çift */
    var count=_pr.plates[p]||0;
    html+='<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">';
    /* Renkli plaka ikonu */
    html+='<div style="width:34px;height:34px;border-radius:50%;background:'+PLATE_COLORS[p]+';flex-shrink:0;border:2px solid rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center"><div style="width:8px;height:8px;border-radius:50%;background:#000"></div></div>';
    html+='<div style="flex:1;font-family:\'Bebas Neue\',cursive;font-size:18px;letter-spacing:1px">'+p+' '+unitLabel()+'</div>';
    /* -/+ kontroller */
    html+='<div style="display:flex;align-items:center;gap:10px">';
    html+='<button class="calc-btn" style="padding:6px 12px;min-width:36px" onclick="_prAdjustPlate('+p+',-1)" '+(count<=0?'disabled style="opacity:.3"':'')+'>−</button>';
    html+='<div style="font-family:\'Bebas Neue\',cursive;font-size:22px;min-width:28px;text-align:center">'+count+'</div>';
    html+='<button class="calc-btn" style="padding:6px 12px;min-width:36px" onclick="_prAdjustPlate('+p+',1)" '+(count>=max?'disabled style="opacity:.3"':'')+'>+</button>';
    html+='</div></div>';
  });
  html+='</div>';

  /* Başla butonu */
  var canStart=_pr.target>0 && _prTotalPlatesKg() >= (_pr.target-_pr.bar)/2;
  html+='<button class="btn btn-full" onclick="_prStart()" style="margin-top:10px;'+(canStart?'':'opacity:.5;pointer-events:none')+'">Başla</button>';
  if(!canStart && _pr.target>0){
    html+='<div style="text-align:center;font-size:11px;color:var(--warn);margin-top:8px">⚠️ Yeterli plaka yok. Hedefe ulaşmak için daha fazla plaka ekle.</div>';
  }

  return html;
}

function _prAdjustPlate(p,delta){
  var max=(p>=20)?10:1;
  var c=(_pr.plates[p]||0)+delta;
  if(c<0) c=0;
  if(c>max) c=max;
  _pr.plates[p]=c;
  _prSavePlates();
  _renderPR();
}

/* Plakalardan toplam mümkün olan kg (her taraf için) */

function _prTotalPlatesKg(){
  var total=0;
  Object.keys(_pr.plates).forEach(function(p){
    total+=parseFloat(p)*(_pr.plates[p]||0);
  });
  return total;
}

function _prStart(){
  if(!_pr.target){showToast('⚠️ Hedef ağırlık gir','warn');return;}
  /* Isınma setlerini hesapla */
  _pr.warmupSets=_prCalcWarmups(_pr.target,_pr.bar);
  _pr.warmupIdx=0;
  _pr.attemptIdx=0;
  _pr.attempts=[];
  _pr.history=[];
  _pr.screen='warmup';
  _renderPR();
}

/* ══ ISINMA HESABI ══════════════════════════════════════════ */

function _prCalcWarmups(target,bar){
  function round25(x){return Math.round(x/2.5)*2.5;}
  /* 5 ısınma: %25, %40, %65, %75, %85 */
  var pcts=[0.25, 0.40, 0.65, 0.75, 0.85];
  var repsList=[10, 5, 3, 2, 1];
  var restList=[2, 2, 3, 3, 3];  /* dk */
  var sets=[];
  for(var i=0;i<5;i++){
    var kg=round25(target*pcts[i]);
    if(kg<bar) kg=bar; /* en azından bar kadar */
    var variants=_prCalcPlateVariants(kg,bar);
    sets.push({kg:kg, reps:repsList[i], rest:restList[i], variants:variants, variantIdx:0, skipped:false});
  }
  return sets;
}

/* ══ PLAKA VARYANTLARI ══════════════════════════════════════
   Hedef kg için farklı plaka kombinasyonları üret.
   Her varyant: {25:x, 20:x, 15:x, 10:x, 5:x, 2.5:x, 1.25:x}
   Her bir değer "tek tarafa kaç adet" */

function _prCalcPlateVariants(targetKg,bar){
  var perSide=(targetKg-bar)/2;
  if(perSide<=0) return [{25:0,20:0,15:0,10:0,5:0,2.5:0,1.25:0,total:targetKg}];
  if(perSide%1.25!==0) return []; /* tam sayı değil, yüklenemez */

  var plates=[25,20,15,10,5,2.5,1.25];
  var results=[];
  var seen={};

  /* Rekürsif DFS ile tüm kombinasyonları üret */
  function search(idx, remaining, current){
    if(results.length>=8) return; /* max 8 varyant */
    if(remaining===0){
      var key=plates.map(function(p){return current[p]||0}).join(',');
      if(seen[key]) return;
      seen[key]=true;
      var copy={};
      plates.forEach(function(p){copy[p]=current[p]||0;});
      copy.total=targetKg;
      results.push(copy);
      return;
    }
    if(idx>=plates.length || remaining<0) return;

    var p=plates[idx];
    var maxAvail=_pr.plates[p]||0; /* kullanıcının her taraf için kullanabileceği miktar */
    var maxFit=Math.floor(remaining/p);
    var maxUse=Math.min(maxAvail,maxFit);

    /* Büyükten küçüğe dene */
    for(var count=maxUse;count>=0;count--){
      if(count>0) current[p]=count;
      else delete current[p];
      search(idx+1, remaining-count*p, current);
    }
    delete current[p];
  }

  search(0, perSide, {});

  /* Varyantları sırala: daha az plaka kullananı üstte */
  results.sort(function(a,b){
    var aCount=plates.reduce(function(s,p){return s+(a[p]||0);},0);
    var bCount=plates.reduce(function(s,p){return s+(b[p]||0);},0);
    return aCount-bCount;
  });

  return results;
}

/* Varyantı metin olarak formatla: "2×25 + 1×15" gibi */

function _prFormatVariant(v){
  var plates=[25,20,15,10,5,2.5,1.25];
  var parts=[];
  plates.forEach(function(p){
    var c=v[p]||0;
    if(c>0) parts.push(c+'×'+p+unitLabel());
  });
  return parts.length?parts.join(' + '):'(sadece bar)';
}

/* ══ ISINMA EKRANLARI ═══════════════════════════════════════ */

function _prWarmupSet(){
  var set=_pr.warmupSets[_pr.warmupIdx];
  if(!set) return '<div style="padding:40px;text-align:center">Hata</div>';
  var variant=set.variants[set.variantIdx]||{};
  var html='';

  html+='<div style="padding:20px 0;min-height:200px">';
  html+='<div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:1px">'+(_pr.warmupIdx+1)+'. Isınma · '+_prExerciseName(_pr.exercise)+'</div>';
  html+='<div style="font-family:\'Bebas Neue\',cursive;font-size:56px;letter-spacing:2px;line-height:1;margin-top:8px">'+set.kg+' '+unitLabel()+' × '+set.reps+'</div>';
  html+='</div>';

  /* Plaka görseli + varyant */
  html+=_prRenderBarbell(set.kg, variant, set.variants.length>1, function(){return '_prChangeVariant';});

  /* Butonlar */
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:20px">';
  html+='<button class="btn btn-s" style="background:var(--card2);color:var(--text)" onclick="_prWarmupBack()">← Geri Dön</button>';
  html+='<button class="btn btn-s" style="background:var(--card2);color:var(--text)" onclick="_prWarmupSkip()">Seti Atla →</button>';
  html+='</div>';
  html+='<button class="btn btn-full" onclick="_prWarmupBeginSet()" style="margin-top:10px">Sete Başla</button>';

  return html;
}

/* Plaka görseli render — SVG ile */

function _prRenderBarbell(kg, variant, showVariantBtn){
  var plates=[25,20,15,10,5,2.5,1.25];
  var leftPlates=[];
  plates.forEach(function(p){
    var c=variant[p]||0;
    for(var i=0;i<c;i++) leftPlates.push(p);
  });
  /* sağ taraf ters sırada */
  var rightPlates=leftPlates.slice().reverse();

  var html='<div style="position:relative;padding:20px 0">';
  html+='<div style="display:flex;align-items:center;justify-content:center;gap:0;min-height:80px">';
  html+='<div style="font-size:10px;color:var(--text3);margin-right:4px">'+_pr.bar+'kg</div>';
  /* Sol plakalar */
  leftPlates.forEach(function(p){
    var size=Math.min(60, 30+p*1.2);
    html+='<div style="width:14px;height:'+size+'px;background:'+PLATE_COLORS[p]+';border-radius:2px;border:1px solid rgba(255,255,255,.1);margin-right:1px"></div>';
  });
  /* Bar */
  html+='<div style="width:60px;height:8px;background:linear-gradient(to bottom, var(--text2), var(--text3), var(--text2));border-radius:2px;margin:0 4px"></div>';
  /* Sağ plakalar */
  rightPlates.forEach(function(p){
    var size=Math.min(60, 30+p*1.2);
    html+='<div style="width:14px;height:'+size+'px;background:'+PLATE_COLORS[p]+';border-radius:2px;border:1px solid rgba(255,255,255,.1);margin-left:1px"></div>';
  });
  html+='</div>';

  /* Plaka listesi (yazılı) */
  html+='<div style="text-align:center;margin-top:10px;font-size:11px;color:var(--text2)">Her tarafa: <strong style="color:var(--text)">'+_prFormatVariant(variant)+'</strong></div>';

  /* Varyant navigasyonu */
  if(showVariantBtn){
    html+='<div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-top:12px">';
    html+='<button class="calc-btn" style="padding:6px 12px;min-width:40px" onclick="_prChangeVariant(-1)">‹</button>';
    html+='<span style="font-size:11px;color:var(--text2)">Varyant '+(_pr.warmupSets[_pr.warmupIdx]?(_pr.warmupSets[_pr.warmupIdx].variantIdx+1):(_pr.attempts[_pr.attemptIdx]?(_pr.attempts[_pr.attemptIdx].variantIdx+1):1))+' / '+(_pr.warmupSets[_pr.warmupIdx]?_pr.warmupSets[_pr.warmupIdx].variants.length:1)+'</span>';
    html+='<button class="calc-btn" style="padding:6px 12px;min-width:40px" onclick="_prChangeVariant(1)">›</button>';
    html+='</div>';
  }
  html+='</div>';
  return html;
}

function _prChangeVariant(delta){
  var set=_pr.warmupSets[_pr.warmupIdx];
  if(!set) return;
  var len=set.variants.length;
  var newIdx=(set.variantIdx+delta+len)%len;
  set.variantIdx=newIdx;
  _renderPR();
}

function _prWarmupBack(){
  if(_pr.warmupIdx>0){
    _pr.warmupIdx--;
    _renderPR();
  } else {
    _pr.screen='setup';
    _renderPR();
  }
}

function _prWarmupSkip(){
  _pr.warmupSets[_pr.warmupIdx].skipped=true;
  _prWarmupNext();
}

function _prWarmupBeginSet(){
  /* Set aktif ekranı - kullanıcı set yaparken */
  _pr.screen='warmup-active';
  _renderPR();
}

/* Bu ekranı ekleyelim — set yapma ekranı */

function _prWarmupActive(){
  var set=_pr.warmupSets[_pr.warmupIdx];
  var html='';
  html+='<div style="text-align:center;padding:60px 20px">';
  html+='<div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:2px">'+(_pr.warmupIdx+1)+'. ISINMA AKTİF</div>';
  html+='<div style="font-family:\'Bebas Neue\',cursive;font-size:72px;letter-spacing:3px;margin-top:20px;color:var(--accent)">'+set.kg+' '+unitLabel()+'</div>';
  html+='<div style="font-family:\'Bebas Neue\',cursive;font-size:32px;letter-spacing:2px;color:var(--text2)">× '+set.reps+' TEKRAR</div>';
  html+='</div>';
  html+='<button class="btn btn-full" onclick="_prWarmupFinishSet()">Seti Bitir</button>';
  html+='<button class="btn btn-full" style="margin-top:10px;background:var(--card2);color:var(--text2)" onclick="_prWarmupCancel()">Geri Dön</button>';
  return html;
}

function _prWarmupCancel(){
  _pr.screen='warmup';
  _renderPR();
}

function _prWarmupFinishSet(){
  /* Son ısınma mı? (5. ısınma) → hissettirme sorusu */
  if(_pr.warmupIdx===4){
    /* 5. ısınma bitti → feeling slider */
    _pr.screen='warmup-feel';
    _pr._feelValue=0.5; /* default: normal */
    _renderPR();
  } else {
    /* Ara ısınma → dinlenme */
    _pr.history.push({type:'warmup',idx:_pr.warmupIdx,kg:_pr.warmupSets[_pr.warmupIdx].kg,reps:_pr.warmupSets[_pr.warmupIdx].reps});
    _pr.screen='warmup-rest';
    _prStartRest(_pr.warmupSets[_pr.warmupIdx].rest*60);
    _renderPR();
  }
}

function _prWarmupNext(){
  _pr.warmupIdx++;
  if(_pr.warmupIdx>=5){
    _pr.screen='attempt';
    _pr.attempts=[{idx:0,kg:_prCalcAttemptKg(0,null)}];
    _pr.attemptIdx=0;
  } else {
    _pr.screen='warmup';
  }
  _renderPR();
}

/* ══ DİNLENME EKRANI (Bekleme) ══════════════════════════════ */

function _prStartRest(seconds){
  _pr.restSeconds=seconds;
  if(_pr._restTimer) clearInterval(_pr._restTimer);
  _pr._restTimer=setInterval(function(){
    _pr.restSeconds--;
    if(_pr.restSeconds<=0){
      clearInterval(_pr._restTimer);
      _pr._restTimer=null;
      _prRestEnd();
      return;
    }
    var el=document.getElementById('pr-rest-clock');
    if(el){
      var m=Math.floor(_pr.restSeconds/60);
      var s=_pr.restSeconds%60;
      el.textContent=(m<10?'0':'')+m+':'+(s<10?'0':'')+s;
    }
    /* Ring */
    var ring=document.getElementById('pr-rest-ring');
    if(ring){
      var totalSec=(_pr.screen==='warmup-rest'?_pr.warmupSets[_pr.warmupIdx].rest:5)*60;
      var pct=(_pr.restSeconds/totalSec)*100;
      ring.style.background='conic-gradient(var(--accent) '+pct+'%, rgba(255,255,255,.1) '+pct+'%)';
    }
  },1000);
}

function _prRestEnd(){
  if(_pr.screen==='warmup-rest'){
    _prWarmupNext();
  } else if(_pr.screen==='attempt-rest'){
    _pr.screen='attempt';
    _renderPR();
  }
}

function _prSkipRest(){
  if(_pr._restTimer) clearInterval(_pr._restTimer);
  _pr._restTimer=null;
  _prRestEnd();
}

function _prWarmupRest(){
  var set=_pr.warmupSets[_pr.warmupIdx];
  var rest=set.rest*60;
  if(!_pr.restSeconds) _pr.restSeconds=rest;
  var next=_pr.warmupSets[_pr.warmupIdx+1];
  var nextVariant=next?next.variants[next.variantIdx]:null;
  var m=Math.floor(_pr.restSeconds/60), s=_pr.restSeconds%60;
  var pct=(_pr.restSeconds/rest)*100;

  var html='<div style="text-align:center;padding:20px 0">';
  /* Ring timer */
  html+='<div style="display:flex;justify-content:center;margin-bottom:30px">';
  html+='<div id="pr-rest-ring" style="width:220px;height:220px;border-radius:50%;background:conic-gradient(var(--accent) '+pct+'%, rgba(255,255,255,.1) '+pct+'%);display:flex;align-items:center;justify-content:center">';
  html+='<div style="width:180px;height:180px;border-radius:50%;background:var(--bg);display:flex;align-items:center;justify-content:center">';
  html+='<div id="pr-rest-clock" style="font-family:\'Bebas Neue\',cursive;font-size:48px;letter-spacing:3px;color:var(--text2)">'+(m<10?'0':'')+m+':'+(s<10?'0':'')+s+'</div>';
  html+='</div></div></div>';

  /* Sonraki set önizleme */
  if(next){
    html+='<div style="text-align:left;padding:0 4px">';
    html+='<div style="font-size:11px;color:var(--text2);font-weight:700;text-transform:uppercase;letter-spacing:1px">Sonraki: '+(_pr.warmupIdx+2)+'. Isınma</div>';
    html+='<div style="font-family:\'Bebas Neue\',cursive;font-size:32px;letter-spacing:1px;margin-top:4px">'+next.kg+' '+unitLabel()+' × '+next.reps+'</div>';
    html+='</div>';
    html+=_prRenderBarbell(next.kg, nextVariant, next.variants.length>1);
  }

  html+='</div>';
  html+='<button class="btn btn-full" onclick="_prSkipRest()">Dinlenmeyi Bitir</button>';
  return html;
}

/* ══ HISSETTIRME SLIDER ═════════════════════════════════════ */

function _prFeelSlider(context){
  /* context: 'warmup' (3-kademe) veya 'attempt' (4-kademe) */
  var levels, labels, colors, emojis;
  if(context==='warmup'){
    levels=3;
    labels=['Kötü hissettirdi','Normaldi','İyi hissettirdi'];
    colors=['var(--warn)','var(--info)','var(--success)'];
    emojis=['😣','😐','💪'];
  } else {
    levels=4;
    labels=['Başarısız','Kötü hissettirdi','Normaldi','İyi hissettirdi'];
    colors=['var(--accent)','var(--warn)','var(--info)','var(--success)'];
    emojis=['❌','😣','😐','💪'];
  }

  var v=_pr._feelValue;
  var selIdx=Math.min(levels-1, Math.floor(v*levels));
  if(selIdx<0) selIdx=0;

  /* Stil kuralları css/calculators.css içinde (.pr-feel-*) */
  var html='';

  html+='<div class="pr-feel-wrap">';
  html+='<div class="pr-feel-bg"></div>';

  html+='<div class="pr-feel-title">BU SET NASIL HİSSETTİRDİ?</div>';
  html+='<div class="pr-feel-sub">Seçiminize göre hesaplayacağız</div>';

  /* Büyük emoji + label */
  html+='<div class="pr-feel-emoji" id="pr-feel-emoji">'+emojis[selIdx]+'</div>';
  html+='<div class="pr-feel-label" id="pr-feel-label" style="color:'+colors[selIdx]+'">'+labels[selIdx]+'</div>';

  /* Kavisli SVG arc — kalın, parlak gradient */
  html+='<div class="pr-feel-arc">';
  /* SVG ark: 340x100, yay yarı çap 200 */
  var w=340, h=120;
  var cx=w/2, cy=h+60, r=180; /* merkez aşağıda, yay yukarıda */
  /* Her seviye için x,y koordinatı (yay üzerinde) */
  function posOnArc(i, total){
    /* yay açı aralığı: -160° ile -20° (saat 7 → saat 5 arası) */
    var startAngle=-160, endAngle=-20;
    var t=total===1?0.5:i/(total-1);
    var ang=(startAngle+(endAngle-startAngle)*t)*Math.PI/180;
    return {x:cx+r*Math.cos(ang), y:cy+r*Math.sin(ang)};
  }
  var startP=posOnArc(0, levels), endP=posOnArc(levels-1, levels);
  /* Tam yay path */
  var startA=-160*Math.PI/180, endA=-20*Math.PI/180;
  var pathSx=cx+r*Math.cos(startA), pathSy=cy+r*Math.sin(startA);
  var pathEx=cx+r*Math.cos(endA), pathEy=cy+r*Math.sin(endA);
  /* Aktif renge göre yay rengi */
  var arcCol=colors[selIdx];

  html+='<svg viewBox="0 0 '+w+' '+h+'" xmlns="http://www.w3.org/2000/svg">';
  /* Glow filtresi */
  html+='<defs>';
  html+='<filter id="prGlow" x="-50%" y="-50%" width="200%" height="200%">';
  html+='<feGaussianBlur stdDeviation="4" result="blur"/>';
  html+='<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>';
  html+='</filter>';
  /* Gradient yay için */
  html+='<linearGradient id="prArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">';
  colors.forEach(function(c,i){
    var pct=(i/(colors.length-1))*100;
    html+='<stop offset="'+pct+'%" stop-color="'+c+'"/>';
  });
  html+='</linearGradient>';
  html+='</defs>';

  /* Arka plan yay (kalın, soluk) */
  html+='<path d="M '+pathSx+' '+pathSy+' A '+r+' '+r+' 0 0 1 '+pathEx+' '+pathEy+'" stroke="rgba(255,255,255,0.08)" stroke-width="14" fill="none" stroke-linecap="round"/>';
  /* Aktif yay (gradient, parlak) */
  html+='<path d="M '+pathSx+' '+pathSy+' A '+r+' '+r+' 0 0 1 '+pathEx+' '+pathEy+'" stroke="url(#prArcGrad)" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.9"/>';

  /* Her seviye için işaret nokta */
  for(var i=0;i<levels;i++){
    var p=posOnArc(i, levels);
    var isSelected=i===selIdx;
    var dotR=isSelected?16:7;
    var dotCol=isSelected?colors[i]:'rgba(255,255,255,0.3)';
    html+='<circle cx="'+p.x+'" cy="'+p.y+'" r="'+dotR+'" fill="'+dotCol+'" stroke="rgba(0,0,0,0.6)" stroke-width="2" class="pr-feel-thumb" id="pr-feel-dot-'+i+'" '+(isSelected?'filter="url(#prGlow)"':'')+' onclick="_prFeelSliderSet('+i+','+levels+')" style="cursor:pointer"/>';
  }
  html+='</svg>';
  html+='</div>';

  /* Alternatif olarak liste butonları (mobilde daha kullanılabilir) */
  html+='<div class="pr-feel-btns">';
  for(var i=0;i<levels;i++){
    var sel=(i===selIdx)?' sel':'';
    var bcol=(i===selIdx)?(' style="border-color:'+colors[i]+';background:linear-gradient(135deg, '+colors[i]+'22, transparent)"'):'';
    html+='<button class="pr-feel-btn'+sel+'"'+bcol+' onclick="_prFeelSliderSet('+i+','+levels+')">';
    html+='<div class="icn">'+emojis[i]+'</div>';
    html+='<div style="flex:1;text-align:left">'+labels[i]+'</div>';
    if(i===selIdx) html+='<div style="color:'+colors[i]+';font-size:20px">✓</div>';
    html+='</button>';
  }
  html+='</div>';

  /* Onay butonu */
  html+='<button class="pr-feel-confirm" style="background:linear-gradient(135deg, '+colors[selIdx]+', '+colors[selIdx]+'cc)" onclick="_prFeelSelect(\''+context+'\')">DEVAM ET →</button>';

  html+='</div>';

  return html;
}

/* Seviye direkt tıklamayla seç */

function _prFeelSliderSet(idx, levels){
  _pr._feelValue=idx/(levels-1);
  /* Tüm ekranı yeniden render et (daha güvenilir, küçük overhead) */
  _renderPR();
}

function _prFeelSelect(context){
  var levels=context==='warmup'?3:4;
  var idx=Math.round(_pr._feelValue*(levels-1));
  var feels=context==='warmup'?['bad','normal','good']:['fail','bad','normal','good'];
  var feel=feels[idx];

  if(context==='warmup'){
    _pr.warmupFeel=feel;
    _pr.history.push({type:'warmup',idx:4,kg:_pr.warmupSets[4].kg,reps:_pr.warmupSets[4].reps,feel:feel});
    /* 5. ısınma sonrası her zaman denemelere geç */
    _pr.screen='warmup-rest';
    _pr.restSeconds=0;
    _prStartRest(3*60); /* 3 dk dinlenme */
    /* Dinlenme bitince attempt'a geçecek */
    /* Next attempt hazırla */
    _pr.attempts=[{idx:0,kg:_prCalcAttemptKg(0,null)}];
    _pr.attemptIdx=0;
    /* rest ekranında next=attempt olsun */
    _renderPR();
  } else {
    /* Attempt feel */
    var att=_pr.attempts[_pr.attemptIdx];
    att.feel=feel;
    att.success=(feel!=='fail');
    _pr.history.push({type:'attempt',idx:_pr.attemptIdx,kg:att.kg,feel:feel,success:att.success});

    if(_pr.attemptIdx>=2){
      /* 3. deneme bitti → sonuç */
      _pr.screen='result';
      _renderPR();
      return;
    }

    /* Sonraki deneme hazırla */
    _pr.attemptIdx++;
    var nextKg=_prCalcAttemptKg(_pr.attemptIdx, feel);
    _pr.attempts.push({idx:_pr.attemptIdx,kg:nextKg});
    _pr.screen='attempt-rest';
    _pr.restSeconds=0;
    _prStartRest(5*60); /* 5 dk dinlenme */
    _renderPR();
  }
}

/* ══ DENEME KG HESABI ════════════════════════════════════════
   Senin örneklerden çözüldü:
   target=200 squat:
     1. deneme = 185 (%92.5)
     2. deneme (ilk kötü)      = 190 (ilk + 2.5)
     2. deneme (ilk normal)    = 192.5 (ilk + 2.5*?)  ama örnek yok
     2. deneme (ilk iyi)       = 195 (ilk + 10, daha agresif)
     3. deneme (2. iyi)        = 200 (hedef)
     3. deneme (2. başarısız)  = 195 (aynı)
     3. deneme (2. kötü)       = 197.5 (+2.5)
*/

function _prCalcAttemptKg(idx, prevFeel){
  function round25(x){return Math.round(x/2.5)*2.5;}
  var t=_pr.target;

  if(idx===0){
    /* İlk deneme = %92.5 */
    return round25(t*0.925);
  }

  var prevKg=_pr.attempts[idx-1].kg;

  if(idx===1){
    /* 2. deneme */
    if(prevFeel==='good') return round25(prevKg+10);       /* iyi → +10 */
    if(prevFeel==='normal') return round25(prevKg+5);      /* normal → +5 */
    if(prevFeel==='bad') return round25(prevKg+5);         /* kötü → +5 (zorla) */
    return prevKg; /* fail → aynı — ama aslında attempt-feel'de fail ise bitti demiştik */
  }

  if(idx===2){
    /* 3. deneme */
    if(prevFeel==='good') return t;                        /* iyi → hedef */
    if(prevFeel==='normal') return round25(prevKg+5);      /* normal → +5 */
    if(prevFeel==='bad') return round25(prevKg+2.5);       /* kötü → +2.5 */
    if(prevFeel==='fail') return prevKg;                   /* başarısız → aynı */
  }

  return prevKg;
}

/* ══ DENEME EKRANLARI ═══════════════════════════════════════ */

function _prAttempt(){
  var att=_pr.attempts[_pr.attemptIdx];
  if(!att) return '<div>Hata</div>';
  /* Varyant hesapla */
  if(!att.variants){
    att.variants=_prCalcPlateVariants(att.kg,_pr.bar);
    att.variantIdx=0;
  }
  var variant=att.variants[att.variantIdx]||{};

  var html='';
  html+='<div style="padding:20px 0">';
  html+='<div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:1px">'+(_pr.attemptIdx+1)+'. Deneme · '+_prExerciseName(_pr.exercise)+'</div>';
  html+='<div style="font-family:\'Bebas Neue\',cursive;font-size:56px;letter-spacing:2px;line-height:1;margin-top:8px;color:var(--accent)">'+att.kg+' '+unitLabel()+' × 1</div>';
  html+='</div>';

  html+=_prRenderBarbellAttempt(att.kg, variant, att.variants.length>1);

  html+='<div style="background:var(--card2);border-radius:12px;padding:14px;margin-top:20px;font-size:12px;color:var(--text2);line-height:1.5">';
  html+='💡 Dikkatlice ısın, nefes kontrolü sağla. Bu seti 1 tekrar çıkarabileceksen sete başla.';
  html+='</div>';

  html+='<button class="btn btn-full" onclick="_prAttemptBeginSet()" style="margin-top:16px">Denemeye Başla</button>';
  html+='<button class="btn btn-full" style="margin-top:10px;background:var(--card2);color:var(--text2)" onclick="_prAttemptBack()">← Geri Dön</button>';

  return html;
}

function _prRenderBarbellAttempt(kg, variant, showVariantBtn){
  /* Benzer ama attempt için */
  var plates=[25,20,15,10,5,2.5,1.25];
  var leftPlates=[];
  plates.forEach(function(p){
    var c=variant[p]||0;
    for(var i=0;i<c;i++) leftPlates.push(p);
  });
  var rightPlates=leftPlates.slice().reverse();

  var html='<div style="position:relative;padding:10px 0">';
  html+='<div style="display:flex;align-items:center;justify-content:center;gap:0;min-height:80px">';
  html+='<div style="font-size:10px;color:var(--text3);margin-right:4px">'+_pr.bar+'kg</div>';
  leftPlates.forEach(function(p){
    var size=Math.min(60, 30+p*1.2);
    html+='<div style="width:14px;height:'+size+'px;background:'+PLATE_COLORS[p]+';border-radius:2px;border:1px solid rgba(255,255,255,.1);margin-right:1px"></div>';
  });
  html+='<div style="width:60px;height:8px;background:linear-gradient(to bottom, var(--text2), var(--text3), var(--text2));border-radius:2px;margin:0 4px"></div>';
  rightPlates.forEach(function(p){
    var size=Math.min(60, 30+p*1.2);
    html+='<div style="width:14px;height:'+size+'px;background:'+PLATE_COLORS[p]+';border-radius:2px;border:1px solid rgba(255,255,255,.1);margin-left:1px"></div>';
  });
  html+='</div>';
  html+='<div style="text-align:center;margin-top:10px;font-size:11px;color:var(--text2)">Her tarafa: <strong style="color:var(--text)">'+_prFormatVariant(variant)+'</strong></div>';

  if(showVariantBtn){
    var att=_pr.attempts[_pr.attemptIdx];
    html+='<div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-top:12px">';
    html+='<button class="calc-btn" style="padding:6px 12px;min-width:40px" onclick="_prChangeVariantAttempt(-1)">‹</button>';
    html+='<span style="font-size:11px;color:var(--text2)">Varyant '+(att.variantIdx+1)+' / '+att.variants.length+'</span>';
    html+='<button class="calc-btn" style="padding:6px 12px;min-width:40px" onclick="_prChangeVariantAttempt(1)">›</button>';
    html+='</div>';
  }
  html+='</div>';
  return html;
}

function _prChangeVariantAttempt(delta){
  var att=_pr.attempts[_pr.attemptIdx];
  if(!att||!att.variants) return;
  var len=att.variants.length;
  att.variantIdx=(att.variantIdx+delta+len)%len;
  _renderPR();
}

function _prAttemptBack(){
  if(_pr.attemptIdx>0){
    _pr.attemptIdx--;
    _pr.attempts.pop(); /* son denemeyi sil */
  }
  _renderPR();
}

function _prAttemptBeginSet(){
  _pr.screen='attempt-active';
  _renderPR();
}

function _prAttemptActive(){
  var att=_pr.attempts[_pr.attemptIdx];
  var html='';
  html+='<div style="text-align:center;padding:60px 20px">';
  html+='<div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:2px">'+(_pr.attemptIdx+1)+'. DENEME AKTİF</div>';
  html+='<div style="font-family:\'Bebas Neue\',cursive;font-size:80px;letter-spacing:3px;margin-top:20px;color:var(--accent)">'+att.kg+' '+unitLabel()+'</div>';
  html+='<div style="font-family:\'Bebas Neue\',cursive;font-size:28px;letter-spacing:2px;color:var(--text2)">× 1 TEKRAR</div>';
  html+='</div>';
  html+='<button class="btn btn-full" onclick="_prAttemptFinish()">Denemeyi Bitir</button>';
  html+='<button class="btn btn-full" style="margin-top:10px;background:var(--card2);color:var(--text2)" onclick="_prAttemptCancel()">Geri Dön</button>';
  return html;
}

function _prAttemptCancel(){
  _pr.screen='attempt';
  _renderPR();
}

function _prAttemptFinish(){
  _pr.screen='attempt-feel';
  _pr._feelValue=0.66; /* default: normal */
  _renderPR();
}

function _prAttemptRest(){
  if(!_pr.restSeconds) _pr.restSeconds=5*60;
  var next=_pr.attempts[_pr.attemptIdx];
  var nextVariant=next&&next.variants?next.variants[next.variantIdx]:null;
  var m=Math.floor(_pr.restSeconds/60), s=_pr.restSeconds%60;
  var pct=(_pr.restSeconds/(5*60))*100;

  var html='<div style="text-align:center;padding:20px 0">';
  html+='<div style="display:flex;justify-content:center;margin-bottom:30px">';
  html+='<div id="pr-rest-ring" style="width:220px;height:220px;border-radius:50%;background:conic-gradient(var(--accent) '+pct+'%, rgba(255,255,255,.1) '+pct+'%);display:flex;align-items:center;justify-content:center">';
  html+='<div style="width:180px;height:180px;border-radius:50%;background:var(--bg);display:flex;align-items:center;justify-content:center">';
  html+='<div id="pr-rest-clock" style="font-family:\'Bebas Neue\',cursive;font-size:48px;letter-spacing:3px;color:var(--text2)">'+(m<10?'0':'')+m+':'+(s<10?'0':'')+s+'</div>';
  html+='</div></div></div>';

  if(next){
    /* Attempt için variants hazırla */
    if(!next.variants){
      next.variants=_prCalcPlateVariants(next.kg,_pr.bar);
      next.variantIdx=0;
      nextVariant=next.variants[0];
    }
    html+='<div style="text-align:left;padding:0 4px">';
    html+='<div style="font-size:11px;color:var(--text2);font-weight:700;text-transform:uppercase;letter-spacing:1px">Sonraki: '+(_pr.attemptIdx+1)+'. Deneme</div>';
    html+='<div style="font-family:\'Bebas Neue\',cursive;font-size:32px;letter-spacing:1px;margin-top:4px">'+next.kg+' '+unitLabel()+' × 1</div>';
    html+='</div>';
    if(nextVariant) html+=_prRenderBarbellAttempt(next.kg, nextVariant, next.variants.length>1);
  }

  html+='</div>';
  html+='<button class="btn btn-full" onclick="_prSkipRest()">Dinlenmeyi Bitir</button>';
  return html;
}

/* ══ SONUÇ EKRANI ═══════════════════════════════════════════ */

function _prResult(){
  /* En iyi başarılı deneme */
  var bestAttempt=null;
  _pr.attempts.forEach(function(a){
    if(a.success && (!bestAttempt||a.kg>bestAttempt.kg)) bestAttempt=a;
  });

  /* Başlık mesajı */
  var headerKg=bestAttempt?bestAttempt.kg:_pr.target;
  var achievedTarget=bestAttempt&&bestAttempt.kg>=_pr.target;
  var message;
  if(achievedTarget){
    message='Tebrikler! Bu rekor denemende hedefine ulaştın. Şimdi rekorunu daha da geliştirmen için çalışma zamanı, sana PR alma zamanı geldiğinde hatırlatacağız!';
  } else if(bestAttempt){
    message='Bu denemende hedefine ulaşamadın, ancak yine de iyi iş çıkardın. Şimdi seviyeni artırman için çalışma zamanı, sana PR alma zamanı geldiğinde hatırlatacağız!';
  } else {
    message='Bu denemede tüm deneme hakların başarısız oldu. Daha hafif yüklerle çalışıp tekrar dene.';
  }

  var feelColors={fail:'var(--accent)',bad:'var(--warn)',normal:'var(--info)',good:'var(--success)'};
  var feelLabels={fail:'Başarısız',bad:'Kötü hissettirdi',normal:'Normaldi',good:'İyi hissettirdi'};

  var html='';
  html+='<div style="text-align:center;padding:20px 0">';
  html+='<div style="font-family:\'Bebas Neue\',cursive;font-size:64px;letter-spacing:2px;line-height:1">'+headerKg+'<span style="font-size:28px">'+unitLabel()+'</span></div>';
  html+='</div>';

  html+='<div style="font-size:13px;line-height:1.6;color:var(--text2);margin-bottom:24px">'+message+'</div>';

  /* Denemeler listesi (tersten — 3,2,1) */
  html+='<div style="margin-bottom:20px">';
  html+='<div style="font-family:\'Bebas Neue\',cursive;font-size:20px;color:var(--accent);letter-spacing:2px;margin-bottom:14px">REKOR DENEMESİ</div>';
  var attemptsRev=_pr.attempts.slice().reverse();
  attemptsRev.forEach(function(a){
    var col=feelColors[a.feel]||'var(--accent)';
    html+='<div style="display:flex;align-items:center;gap:16px;margin-bottom:14px">';
    /* Parlak gradient circle + glow halo */
    html+='<div style="width:56px;height:56px;border-radius:50%;background:radial-gradient(circle at 30% 30%, '+col+'ff, '+col+'cc 60%, '+col+'88);color:#fff;display:flex;align-items:center;justify-content:center;font-family:\'Bebas Neue\',cursive;font-size:24px;flex-shrink:0;box-shadow:0 0 24px '+col+'66, 0 6px 16px var(--shadow-sm-c, rgba(0,0,0,.25)), inset 0 1px 2px rgba(255,255,255,.3);text-shadow:0 1px 2px var(--shadow-md-c, rgba(0,0,0,.45));font-weight:700">'+(a.idx+1)+'</div>';
    html+='<div style="flex:1">';
    html+='<div style="font-family:\'Bebas Neue\',cursive;font-size:24px;letter-spacing:1px">'+a.kg+unitLabel()+'</div>';
    html+='<div style="font-size:11px;color:'+col+';font-weight:600">'+feelLabels[a.feel]+'</div>';
    html+='</div></div>';
  });
  html+='</div>';

  /* Isınma listesi */
  html+='<div style="border-top:1px solid var(--border);padding-top:16px">';
  var warmupsRev=_pr.warmupSets.slice().reverse();
  warmupsRev.forEach(function(w,i){
    if(w.skipped) return;
    html+='<div style="padding:10px 0">';
    html+='<div style="font-size:14px;color:var(--text2)">'+w.kg+unitLabel()+' × '+w.reps+'</div>';
    /* Son ısınma için feeling göster */
    if((_pr.warmupSets.length-1-i)===4 && _pr.warmupFeel){
      html+='<div style="font-size:11px;color:var(--text3);margin-top:2px">'+feelLabels[_pr.warmupFeel]+'</div>';
    }
    html+='</div>';
  });
  html+='</div>';

  /* Günlüğe Ekle + Yeni Deneme */
  html+='<button class="btn btn-full" onclick="_prSaveToLog()" style="margin-top:24px">🎯 Günlüğe Ekle</button>';
  html+='<button class="btn btn-full" style="margin-top:10px;background:linear-gradient(135deg, var(--card2), var(--card));color:var(--text)" onclick="_prRestartFromResult()">🔄 Yeni Deneme Yap</button>';
  html+='<button class="btn btn-full" style="margin-top:10px;background:var(--card2);color:var(--text2)" onclick="closeCalculator()">Kapat</button>';

  return html;
}

/* Sonuç ekranından yeni deneme başlat */

function _prRestartFromResult(){
  _resetPRState();
  _renderPR();
}

function _prSaveToLog(){
  try {
    /* Antrenman logu olarak kaydet */
    var logs=getWorkoutLogs();
    var bestAttempt=null;
    _pr.attempts.forEach(function(a){
      if(a.success && (!bestAttempt||a.kg>bestAttempt.kg)) bestAttempt=a;
    });

    var sets=[];
    /* Isınma setleri */
    _pr.warmupSets.forEach(function(w,i){
      if(!w.skipped){
        sets.push({
          exId:_pr.exercise,
          kg:(typeof unitToKg==='function'?unitToKg(w.kg):w.kg)||w.kg,
          reps:w.reps,
          note:'Isınma '+(i+1)
        });
      }
    });
    /* Denemeler */
    _pr.attempts.forEach(function(a,i){
      sets.push({
        exId:_pr.exercise,
        kg:(typeof unitToKg==='function'?unitToKg(a.kg):a.kg)||a.kg,
        reps:a.success?1:0,
        note:(i+1)+'. Deneme — '+(a.feel||'')
      });
    });

    var prBestKg=bestAttempt?bestAttempt.kg:0;
    var log={
      id:'pr_'+Date.now(),
      programName:'🎯 PR Denemesi: '+_prExerciseName(_pr.exercise),
      branch:'fitness',
      date:new Date().toISOString(),
      sets:sets,
      isPR:true,
      prExercise:_pr.exercise,
      prTarget:_pr.target,
      prBest:prBestKg,
      prAttempts:_pr.attempts.map(function(a){return {kg:a.kg,feel:a.feel,success:a.success};}),
      prWarmups:_pr.warmupSets.map(function(w){return {kg:w.kg,reps:w.reps,skipped:!!w.skipped};}),
      prWarmupFeel:_pr.warmupFeel
    };
    logs.unshift(log);
    /* localStorage'a kaydet */
    _lsSet('rf_workout_logs',JSON.stringify(logs));
    /* Firebase'e sync */
    if(typeof saveToFirebase==='function') saveToFirebase();

    showToast('🎯 PR günlüğe eklendi!','success');

    /* PR state'ini tamamen sıfırla → kullanıcı yeniden başlayabilir */
    _resetPRState();

    /* Calculator'ı kapat */
    closeCalculator();
  } catch(err){
    console.error('PR günlüğe ekleme hatası:',err);
    showToast('⚠️ Günlüğe ekleme hatası: '+(err.message||err),'warn');
  }
}

/* PR state'ini temizle — yeni deneme için hazır */

function _resetPRState(){
  if(_pr._restTimer){
    try { clearInterval(_pr._restTimer); } catch(e){}
    _pr._restTimer=null;
  }
  _pr.screen='setup';
  /* target/exercise/bar/plates kayıtlı kalsın (kullanıcı tekrar deneyebilsin) */
  _pr.warmupIdx=0;
  _pr.warmupSets=[];
  _pr.warmupFeel=null;
  _pr.attemptIdx=0;
  _pr.attempts=[];
  _pr.history=[];
  _pr.restSeconds=0;
  _pr._feelValue=0.5;
}
