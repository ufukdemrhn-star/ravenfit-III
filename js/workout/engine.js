/* ══════════════════════════════════════════════════════════
   RavenFit — engine.js
   Aktif antrenman motoru
   ══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   🔥 ISINMA / SOĞUMA OVERLAY
   ══════════════════════════════════════════════════════════ */

var WARMUP_MOVES=[
  {icon:'🏃',text:'5 dk hafif tempolu yürüyüş veya koşu'},
  {icon:'🔄',text:'Eklem ısıtma: bilek, diz, kalça, omuz döndürme (30sn her biri)'},
  {icon:'🦵',text:'Dinamik germe: bacak sallama, kalça açma (10 tekrar her yön)'},
  {icon:'💪',text:'Hafif ağırlıkla ısınma seti (hedef ağırlığın %40\'ı ile 15 tekrar)'}
];

var COOLDOWN_MOVES=[
  {icon:'🧘',text:'Göğüs ve omuz germe (her biri 30sn)'},
  {icon:'🦵',text:'Quadriseps ve hamstring germe (her bacak 30sn)'},
  {icon:'🔄',text:'Köpük silindir veya masaj (varsa)'},
  {icon:'💧',text:'Protein alımı — antrenman sonrası 30 dk içinde'}
];

var _warmupCallback=null;

function showWarmup(type,callback){
  _warmupCallback=callback||null;
  var isWarmup=type!=='cooldown';
  var overlay=document.getElementById('warmup-overlay');
  document.getElementById('warmup-icon').textContent=isWarmup?'🔥':'🧊';
  document.getElementById('warmup-title').textContent=isWarmup?'ISINMA ÖNERİLİR':'SOĞUMA ÖNERİLİR';
  document.getElementById('warmup-desc').textContent=isWarmup
    ?'Antrenman öncesi 5-10 dk ısınma kasları hazırlar, sakatlık riskini azaltır.'
    :'Antrenman sonrası soğuma kasların toparlanmasını hızlandırır.';
  var btn=document.getElementById('warmup-ok-btn');
  if(btn)btn.textContent=isWarmup?'Anladım, Başlat ▶':'Anladım, Bitir ✓';
  var moves=isWarmup?WARMUP_MOVES:COOLDOWN_MOVES;
  var listEl=document.getElementById('warmup-list');
  if(listEl)listEl.innerHTML=moves.map(function(m){
    return'<div class="warmup-item"><span>'+m.icon+'</span><span>'+m.text+'</span></div>';
  }).join('');
  overlay.classList.add('active');
}

/* Isınma/soğuma ekranını kapatır.
   'Geç' ve 'Başlat' butonlarının ikisi de akışı devam ettirir —
   fark yalnızca kullanıcının hareketleri yapıp yapmamasıdır. */
function closeWarmup(skip){
  document.getElementById('warmup-overlay').classList.remove('active');
  if(typeof _warmupCallback==='function') _warmupCallback();
  _warmupCallback=null;
}

function _doStartSession(prog){
  /* Önceki oturumdan kalan timer'ları temizle.
     Aksi halde antrenman iki kez başlatılırsa eski setInterval
     arka planda çalışmaya devam eder ve süre yanlış sayılır. */
  clearInterval(_ws.elapsedInterval);
  clearInterval(_ws.restInterval);
  _ws.elapsedInterval=null;
  _ws.restInterval=null;

  var logs=getWorkoutLogs();
  var progLogs=logs.filter(function(l){return l.programId===prog.id;});
  var lastDayIdx=progLogs.length>0?progLogs[progLogs.length-1].dayIndex:-1;
  var nextDayIdx=(lastDayIdx+1)%prog.days.length;

  _ws.programId=prog.id;
  _ws.program=prog;
  _ws.dayIndex=nextDayIdx;
  _ws.exIndex=0;
  _ws.setIndex=0;
  _ws.finished=false;
  _ws.startTime=Date.now();
  /* Branş bilgisini sakla */
  _ws.branch=window._wsBranch||_getBranchForProgram(prog.id);

  var day=prog.days[nextDayIdx];
  _ws.sets=day.exercises.map(function(ex){
    var prevSet=_getPrevSetData(prog.id,nextDayIdx,ex.exercise_id);
    var exData=_findExercise(ex.exercise_id);
    var rows=[];
    var isSwim=(_ws.branch==='swimming');
    var isPost=(_ws.branch==='posture');
    for(var s=0;s<ex.sets;s++){
      if(isSwim){
        /* Yüzme: distance default'u egzersiz verisi veya reps string'inden al */
        var defDist=prevSet?prevSet.distance:'';
        if(!defDist&&exData&&exData.distance_m) defDist=exData.distance_m;
        if(!defDist&&ex.reps&&/^\d+m?$/.test(String(ex.reps).replace('m',''))) defDist=String(ex.reps).replace('m','');
        rows.push({
          distance:defDist,
          time:prevSet?prevSet.time:'',
          done:false
        });
      } else if(isPost){
        /* Postür: süre bazlı — duration_sec + tekrar */
        var defDur=ex.duration_sec||exData.duration_sec||30;
        rows.push({
          duration_sec:defDur,
          reps:prevSet?prevSet.reps:(ex.reps||''),
          done:false
        });
      } else {
        rows.push({
          kg:prevSet?prevSet.kg:'',
          reps:prevSet?prevSet.reps:(typeof ex.reps==='string'?ex.reps.split('-')[0]:ex.reps),
          done:false
        });
      }
    }
    return rows;
  });

  document.getElementById('ws-prog-name').textContent=prog.name_tr;
  document.getElementById('ws-day-name').textContent=day.name;
  document.getElementById('ws-screen').classList.add('active');
  /* Footer gizle — navigasyon artık body içinde */
  var footer=document.querySelector('.ws-footer');
  if(footer) footer.style.display='none';
  _ws.elapsedInterval=setInterval(_ws_updateElapsed,1000);
  _ws_updateElapsed();
  _ws_renderBody();
  _ws_updateProgress();
  window.scrollTo(0,0);
}

/* ══════════════════════════════════════════════════════════
   🏋️ AKTİF ANTRENMAN MOTORU
   ══════════════════════════════════════════════════════════ */

var _ws = {
  programId: null,
  program: null,
  dayIndex: 0,
  exIndex: 0,
  setIndex: 0,     /* Aktif set indeksi (tek hareket görünümü için) */
  sets: [],
  startTime: 0,
  elapsedInterval: null,
  restInterval: null,
  restTotal: 0,
  restRemain: 0,
  finished: false,
  branch: 'fitness'
};

/* ── Önceki set verisi ────────────────────────────────────── */

function _getPrevSetData(progId,dayIdx,exId){
  var logs=getWorkoutLogs();
  for(var i=logs.length-1;i>=0;i--){
    var l=logs[i];
    if(l.programId!==progId||l.dayIndex!==dayIdx)continue;
    if(!l.sets)continue;
    var found=l.sets.find(function(s){return s.exId===exId&&(s.kg||s.distance||s.duration_sec);});
    if(found)return found;
  }
  return null;
}

/* ── Ekranı render et — tek hareket görünümü (game-like) ── */

function _ws_renderBody(){
  var day=_ws.program.days[_ws.dayIndex];
  var exList=day.exercises;
  var isSwim=(_ws.branch==='swimming');
  var isPost=(_ws.branch==='posture');
  var ei=_ws.exIndex;
  var ex=exList[ei];
  var exData=_findExercise(ex.exercise_id);
  var sets=_ws.sets[ei];
  var totalExercises=exList.length;

  /* Mevcut setin sınırlarını kontrol et */
  if(_ws.setIndex>=sets.length) _ws.setIndex=sets.length-1;
  if(_ws.setIndex<0) _ws.setIndex=0;
  var si=_ws.setIndex;
  var set=sets[si];

  var html='';

  /* ── Egzersiz ilerleme göstergesi ── */
  html+='<div style="display:flex;align-items:center;justify-content:center;gap:4px;margin-bottom:8px">';
  for(var xi=0;xi<totalExercises;xi++){
    var exDone=_ws.sets[xi].every(function(s){return s.done;});
    var exCur=xi===ei;
    html+='<div style="width:'+(exCur?'20px':'8px')+';height:4px;border-radius:2px;background:'+(exDone?'var(--success)':exCur?'var(--accent)':'var(--border)')+';transition:all .2s"></div>';
  }
  html+='</div>';

  /* ── Büyük egzersiz adı ── */
  html+='<div class="ws-hero-name">'+(exData.name_tr||ex.exercise_id)+'</div>';

  /* ── Meta bilgi ── */
  var metaParts=[];
  metaParts.push('Egzersiz '+(ei+1)+'/'+totalExercises);
  if(isSwim&&exData.stroke) metaParts.push(STROKE_TR[exData.stroke]||exData.stroke);
  if(ex.rest_sec) metaParts.push('Dinlenme: '+ex.rest_sec+'s');
  if(exData.equipment&&exData.equipment.length) metaParts.push(EQUIPMENT_TR[exData.equipment[0]]||exData.equipment[0]);
  html+='<div class="ws-hero-meta">'+metaParts.join(' · ')+'</div>';

  /* ── Video / GIF alanı ── */
  if(exData.gif){
    html+='<div class="ws-video-area"><img src="'+exData.gif+'" alt="'+exData.name_tr+'"></div>';
  } else {
    html+='<div class="ws-video-area">';
    html+='<div style="font-size:32px;opacity:.4">🎬</div>';
    html+='<div style="font-size:11px;color:var(--text3)">Hareket videosu yakında eklenecek</div>';
    html+='</div>';
  }

  /* ── Önceki antrenman PO bilgisi ── */
  var poHint=null;
  if(!isSwim&&!isPost){
    poHint=_ws_getPoHint(_ws.programId,_ws.dayIndex,ex.exercise_id,si,set.kg,set.reps);
  }
  if(poHint&&(poHint._prevKg||poHint._prevReps)){
    html+='<div class="ws-po-info">';
    html+='<div style="font-size:16px">📊</div>';
    html+='<div style="flex:1">';
    html+='<div style="font-size:10px;color:var(--text3);margin-bottom:1px">Önceki Antrenman</div>';
    html+='<div style="font-size:13px;font-weight:700;color:var(--success)">'+(poHint._prevKg||'—')+' kg × '+(poHint._prevReps||'—')+' tekrar</div>';
    html+='</div>';
    if(set.done&&poHint.msg){
      html+='<span class="po-badge po-'+poHint.type+'" style="font-size:11px">'+(poHint.type==='up'?'↑ ':'')+poHint.msg+'</span>';
    }
    html+='</div>';
  }

  /* ── Set noktaları ── */
  html+='<div class="ws-set-dots">';
  sets.forEach(function(s,di){
    var cls='ws-set-dot';
    if(s.done) cls+=' done';
    else if(di===si) cls+=' active';
    html+='<div class="'+cls+'" onclick="_ws_goToSet('+di+')"></div>';
  });
  html+='</div>';

  /* ── Aktif set kartı ── */
  html+='<div class="ws-set-current">';
  html+='<div class="ws-set-label">SET '+(si+1)+' / '+sets.length+'</div>';

  if(isSwim){
    /* Yüzme: mesafe + pace */
    var distPh=exData.distance_m||'m';
    html+='<div class="ws-input-row">';
    html+='<div class="ws-input-group"><div class="ws-input-label">Mesafe (m)</div>';
    html+='<input class="ws-input-big" type="number" inputmode="numeric" placeholder="'+distPh+'" value="'+(set.distance||'')+'"'+(set.done?' disabled':'')+' onchange="_ws_setVal('+ei+','+si+',\'distance\',this.value)"></div>';
    html+='<div class="ws-input-group"><div class="ws-input-label">Pace (dk:sn)</div>';
    html+='<input class="ws-input-big" type="text" inputmode="text" placeholder="0:00" value="'+(set.time||'')+'"'+(set.done?' disabled':'')+' onchange="_ws_setVal('+ei+','+si+',\'time\',this.value)" style="font-size:24px"></div>';
    html+='</div>';
  } else if(isPost){
    /* Postür: süre + tekrar */
    var durDef=set.duration_sec||ex.duration_sec||exData.duration_sec||30;
    html+='<div class="ws-input-row">';
    html+='<div class="ws-input-group"><div class="ws-input-label">Süre</div>';
    html+='<div class="ws-input-big" style="cursor:'+(set.done?'default':'pointer')+';color:var(--accent);background:'+(set.done?'var(--card2)':'color-mix(in srgb, var(--success) 8%, transparent)')+'" '+(set.done?'':'onclick="_wsPostureTimer('+ei+','+si+','+durDef+')"')+'>'+durDef+'s</div></div>';
    html+='<div class="ws-input-group"><div class="ws-input-label">Tekrar</div>';
    html+='<input class="ws-input-big" type="number" inputmode="numeric" placeholder="'+(ex.reps||'')+'" value="'+(set.reps||'')+'"'+(set.done?' disabled':'')+' onchange="_ws_setVal('+ei+','+si+',\'reps\',this.value)"></div>';
    html+='</div>';
  } else {
    /* GYM: kg + tekrar */
    var kgPh=poHint&&poHint._prevKg?poHint._prevKg:'kg';
    var repPh=poHint&&poHint._prevReps?poHint._prevReps:'tekrar';
    html+='<div class="ws-input-row">';
    html+='<div class="ws-input-group"><div class="ws-input-label">Ağırlık (KG)</div>';
    html+='<input class="ws-input-big" type="number" inputmode="decimal" placeholder="'+kgPh+'" value="'+(set.kg||'')+'"'+(set.done?' disabled':'')+' onchange="_ws_setVal('+ei+','+si+',\'kg\',this.value)"></div>';
    html+='<div class="ws-input-group"><div class="ws-input-label">Tekrar</div>';
    html+='<input class="ws-input-big" type="number" inputmode="numeric" placeholder="'+repPh+'" value="'+(set.reps||'')+'"'+(set.done?' disabled':'')+' onchange="_ws_setVal('+ei+','+si+',\'reps\',this.value)"></div>';
    html+='</div>';
  }

  /* Set tamamla butonu */
  if(set.done){
    html+='<button class="ws-complete-btn" style="background:var(--success);color:#fff" onclick="_ws_toggleSet('+ei+','+si+')">✓ Tamamlandı — Geri Al</button>';
  } else {
    html+='<button class="ws-complete-btn" style="background:var(--accent);color:var(--on-accent)" onclick="_ws_toggleSet('+ei+','+si+')">✅ Seti Tamamla</button>';
  }
  html+='</div>';

  /* ── Alt navigasyon (oyun benzeri) ── */
  html+='<div class="ws-nav-footer">';
  var allExDone=sets.every(function(s){return s.done;});
  var isLastEx=(ei>=totalExercises-1);
  html+='<button class="ws-nav-btn" onclick="ws_prevExercise()" '+(ei===0?'disabled':'')+'>← Önceki</button>';
  if(isLastEx&&allExDone){
    html+='<button class="ws-nav-btn primary" onclick="ws_nextExercise()">✅ Bitir</button>';
  } else {
    html+='<button class="ws-nav-btn primary" onclick="ws_nextExercise()" '+(isLastEx?'':'')+'>'+(isLastEx?'Bitir →':'Sonraki →')+'</button>';
  }
  html+='</div>';

  document.getElementById('ws-body').innerHTML=html;
  window.scrollTo(0,0);
}

function _ws_setVal(ei,si,field,val){
  if(_ws.sets[ei]&&_ws.sets[ei][si])_ws.sets[ei][si][field]=val;
}

/* ── Set navigasyonu ── */

function _ws_goToSet(si){
  _ws.setIndex=si;
  _ws_renderBody();
}

/* ── Postür countdown timer ── */

var _postureTimerInterval=null;

function _wsPostureTimer(ei,si,durSec){
  var set=_ws.sets[ei]&&_ws.sets[ei][si];
  if(!set||set.done) return;
  /* Zaten çalışıyorsa durdur */
  if(set._timerActive){
    clearInterval(_postureTimerInterval);
    set._timerActive=false;
    _ws_renderBody();
    return;
  }
  /* Timer başlat — rest overlay mekanizmasını kullan */
  set._timerActive=true;
  _ws_renderBody();
  var remain=durSec;
  var overlay=document.getElementById('ws-rest-overlay');
  var numEl=document.getElementById('ws-rest-num');
  var nextEl=document.getElementById('ws-rest-next-info');
  var circle=document.getElementById('ws-rest-circle');
  var circumference=534;
  if(overlay) overlay.classList.add('active');
  if(numEl) numEl.textContent=remain;
  if(nextEl) nextEl.textContent='Pozisyonu tut!';
  if(circle) circle.style.strokeDashoffset='0';
  clearInterval(_postureTimerInterval);
  _postureTimerInterval=setInterval(function(){
    remain--;
    if(numEl) numEl.textContent=remain;
    if(circle){
      var progress=1-(remain/durSec);
      circle.style.strokeDashoffset=(circumference*progress).toFixed(1);
    }
    if(remain<=0){
      clearInterval(_postureTimerInterval);
      if(overlay) overlay.classList.remove('active');
      set._timerActive=false;
      if(navigator.vibrate) navigator.vibrate([100,50,100]);
      showToast('⏱ Süre doldu! Seti tamamla.','success');
      _ws_renderBody();
    }
  },1000);
}

function _ws_toggleSet(ei,si){
  var set=_ws.sets[ei][si];
  if(!set)return;
  set.done=!set.done;

  if(set.done){
    var ex=_ws.program.days[_ws.dayIndex].exercises[ei];
    var restSec=ex.rest_sec||60;
    var allDone=_ws.sets[ei].every(function(s){return s.done;});
    if(!allDone){
      /* Sonraki tamamlanmamış sete git */
      var nextSi=si+1;
      while(nextSi<_ws.sets[ei].length&&_ws.sets[ei][nextSi].done) nextSi++;
      if(nextSi<_ws.sets[ei].length) _ws.setIndex=nextSi;
      var nextInfo='Set '+(nextSi+1)+' / '+_ws.sets[ei].length;
      _ws_startRest(restSec,nextInfo);
    } else {
      /* Tüm setler bitti */
      var nextEx=_ws.program.days[_ws.dayIndex].exercises[ei+1];
      if(nextEx){
        var nextExData=_findExercise(nextEx.exercise_id);
        _ws_startRest(restSec,'Sıradaki: '+(nextExData.name_tr||nextEx.exercise_id));
      }
    }
  }
  _ws_renderBody();
  _ws_updateProgress();
}

/* ── İleri / Geri ────────────────────────────────────────── */

function ws_nextExercise(){
  var total=_ws.program.days[_ws.dayIndex].exercises.length;
  if(_ws.exIndex>=total-1){
    _ws_showReport();
    return;
  }
  _ws.exIndex++;
  _ws.setIndex=0;
  _ws_renderBody();
  _ws_updateProgress();
}

function ws_prevExercise(){
  if(_ws.exIndex<=0)return;
  _ws.exIndex--;
  _ws.setIndex=0;
  _ws_renderBody();
  _ws_updateProgress();
}

/* ── Progress ────────────────────────────────────────────── */

function _ws_updateProgress(){
  var doneSets=0,totalSets=0;
  _ws.sets.forEach(function(ex){ex.forEach(function(s){totalSets++;if(s.done)doneSets++;});});
  var pct=totalSets>0?Math.round(doneSets/totalSets*100):0;
  var fill=document.getElementById('ws-prog-fill');
  if(fill)fill.style.width=pct+'%';
}

/* ── Elapsed timer ───────────────────────────────────────── */

function _ws_updateElapsed(){
  var sec=Math.floor((Date.now()-_ws.startTime)/1000);
  var m=Math.floor(sec/60),s=sec%60;
  var el=document.getElementById('ws-elapsed');
  if(el)el.textContent=(m<10?'0':'')+m+':'+(s<10?'0':'')+s;
}

/* ── Dinlenme sayacı ─────────────────────────────────────── */

function _ws_startRest(sec,nextInfo){
  _ws.restTotal=sec;
  _ws.restRemain=sec;
  var overlay=document.getElementById('ws-rest-overlay');
  if(!overlay)return;
  overlay.classList.add('active');
  var numEl=document.getElementById('ws-rest-num');
  var nextEl=document.getElementById('ws-rest-next-info');
  var circle=document.getElementById('ws-rest-circle');
  var circumference=534;
  if(nextEl)nextEl.textContent=nextInfo||'';
  if(numEl)numEl.textContent=_ws.restRemain;
  if(circle)circle.style.strokeDashoffset='0';

  clearInterval(_ws.restInterval);
  _ws.restInterval=setInterval(function(){
    _ws.restRemain--;
    if(numEl)numEl.textContent=_ws.restRemain;
    if(circle){
      var progress=1-(_ws.restRemain/_ws.restTotal);
      circle.style.strokeDashoffset=(circumference*progress).toFixed(1);
    }
    if(_ws.restRemain<=0){
      clearInterval(_ws.restInterval);
      overlay.classList.remove('active');
      if(navigator.vibrate)navigator.vibrate([100,50,100]);
    }
  },1000);
}

function ws_skipRest(){
  clearInterval(_ws.restInterval);
  var overlay=document.getElementById('ws-rest-overlay');
  if(overlay)overlay.classList.remove('active');
}

function ws_addRest(extra){
  _ws.restRemain+=extra;
  _ws.restTotal+=extra;
  var numEl=document.getElementById('ws-rest-num');
  if(numEl)numEl.textContent=_ws.restRemain;
}

/* ── Antrenmanı bitir ────────────────────────────────────── */

function confirmEndWorkout(){
  var doneSets=0,totalSets=0;
  _ws.sets.forEach(function(ex){ex.forEach(function(s){totalSets++;if(s.done)doneSets++;});});
  var progress=totalSets>0?Math.round(doneSets/totalSets*100):0;
  if(progress<30){
    showConfirm('Antrenmanı Bitir','Antrenmanın %'+progress+'\'ini tamamladın. Çıkmak emin misin?',function(){
      _ws_closeSession();
    },'Evet, Çık');
  } else {
    _ws_showReport();
  }
}

function _ws_showReport(){
  showWarmup('cooldown', _ws_renderReport);
}

function _ws_renderReport(){
  _ws.finished=true;
  clearInterval(_ws.elapsedInterval);
  clearInterval(_ws.restInterval);
  ws_skipRest();

  var isSwim=(_ws.branch==='swimming');
  var isPost=(_ws.branch==='posture');
  var elapsedSec=Math.floor((Date.now()-_ws.startTime)/1000);
  var totalSets=0,doneSets=0,totalReps=0,totalKg=0,totalDistance=0,totalDurSec=0;
  var muscleHits={};

  _ws.sets.forEach(function(exSets,ei){
    var ex=_ws.program.days[_ws.dayIndex].exercises[ei];
    var exData=_findExercise(ex.exercise_id);
    exSets.forEach(function(s){
      totalSets++;
      if(s.done){
        doneSets++;
        if(isSwim){
          totalDistance+=parseInt(s.distance)||0;
        } else if(isPost){
          totalDurSec+=parseInt(s.duration_sec)||0;
          totalReps+=parseInt(s.reps)||0;
        } else {
          var reps=parseInt(s.reps)||0;
          var kg=parseFloat(s.kg)||0;
          totalReps+=reps;
          totalKg+=reps*kg;
        }
      }
    });
    if(exData.muscles){
      Object.keys(exData.muscles).forEach(function(m){
        if(!muscleHits[m])muscleHits[m]=0;
        muscleHits[m]+=exData.muscles[m];
      });
    }
  });

  var met=_ws.program.difficulty===3?8:_ws.program.difficulty===2?6:4;
  if(isSwim) met=met+2;
  if(isPost) met=Math.max(3,met-1); /* postür düşük yoğunluklu */
  var weightKg=U.weight||75;
  var hours=elapsedSec/3600;
  var kcal=Math.round(met*weightKg*hours);

  var muscleTr={
    'chest':'Göğüs','upper-chest':'Üst Göğüs','lower-chest':'Alt Göğüs',
    'front-shoulder':'Ön Omuz','mid-shoulder':'Orta Omuz','rear-shoulder':'Arka Omuz',
    'biceps':'Biceps','triceps-long':'Triceps (Uzun)','triceps-medial':'Triceps',
    'triceps-lateral':'Triceps (Yan)','lats':'Lat','mid-traps':'Trapez',
    'rhomboids':'Rhomboid','erector-spinae':'Bel (Erektör)',
    'quads':'Quadriceps','hamstrings':'Hamstring','glutes':'Gluteus',
    'abs-upper':'Karın (Üst)','abs-lower':'Karın (Alt)','obliques':'Oblik',
    'calf-raise':'Kalf','gastrocnemius':'Kalf',
    'full-body':'Tüm Vücut','cardio':'Kardiyo','shoulders':'Omuz'
  };
  var topMuscles=Object.keys(muscleHits).sort(function(a,b){return muscleHits[b]-muscleHits[a];}).slice(0,4);

  var logs=getWorkoutLogs();
  var streak=_calcStreak(logs);

  var elM=Math.floor(elapsedSec/60),elS=elapsedSec%60;
  var elapsedStr=(elM<10?'0':'')+elM+':'+(elS<10?'0':'')+elS;

  var html='<div style="text-align:center;padding:10px 0 16px">';
  html+='<div style="font-size:40px;margin-bottom:6px">🎉</div>';
  html+='<div style="font-family:\'Bebas Neue\',cursive;font-size:28px;letter-spacing:2px">ANTRENMAN BİTTİ!</div>';
  if(streak>1)html+='<div style="font-size:12px;color:var(--success);margin-top:4px">🔥 '+streak+' gün üst üste antrenman!</div>';
  html+='</div>';

  html+='<div class="ws-report-grid">';
  html+='<div class="ws-report-stat"><div class="ws-report-val">'+elapsedStr+'</div><div class="ws-report-lbl">Süre</div></div>';
  html+='<div class="ws-report-stat"><div class="ws-report-val">'+kcal+'</div><div class="ws-report-lbl">kcal (tahmini)</div></div>';
  html+='<div class="ws-report-stat"><div class="ws-report-val">'+doneSets+'/'+totalSets+'</div><div class="ws-report-lbl">Set Tamamlandı</div></div>';
  if(isSwim){
    html+='<div class="ws-report-stat"><div class="ws-report-val">'+totalDistance+'m</div><div class="ws-report-lbl">Toplam Mesafe</div></div>';
  } else if(isPost){
    var holdMin=Math.floor(totalDurSec/60);
    html+='<div class="ws-report-stat"><div class="ws-report-val">'+(holdMin>0?holdMin+'dk ':'')+totalDurSec%60+'sn</div><div class="ws-report-lbl">Toplam Tutma</div></div>';
  } else {
    html+='<div class="ws-report-stat"><div class="ws-report-val">'+totalReps+'</div><div class="ws-report-lbl">Toplam Tekrar</div></div>';
  }
  html+='</div>';

  if(topMuscles.length){
    html+='<div class="rc" style="margin-bottom:10px">';
    html+='<div class="rct">💪 Çalışan Kas Grupları</div>';
    html+=topMuscles.map(function(m){
      var pct=Math.min(100,Math.round(muscleHits[m]/10*100));
      return '<div style="margin-bottom:8px">'+
        '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">'+
          '<span>'+(muscleTr[m]||m)+'</span><span style="color:var(--text2)">'+muscleHits[m]+'pt</span>'+
        '</div>'+
        '<div style="height:5px;background:var(--border);border-radius:3px">'+
          '<div style="height:100%;width:'+pct+'%;background:var(--accent);border-radius:3px"></div>'+
        '</div></div>';
    }).join('');
    html+='</div>';
  }

  html+='<div style="display:flex;flex-direction:column;gap:8px;padding-bottom:20px">';
  html+='<button class="btn btn-p btn-full" onclick="_ws_saveAndClose()">💾 Kaydet ve Çık</button>';
  html+='<button class="btn btn-s btn-full" onclick="_ws_closeSession()">✕ Kaydetmeden Çık</button>';
  html+='</div>';

  document.getElementById('ws-body').innerHTML=html;
  /* ws-footer bir CLASS, id değil — hemen altındaki querySelector doğru olan.
     Buradaki getElementById('ws-footer') hiçbir zaman eşleşmiyordu. */
  var footer=document.querySelector('.ws-footer');
  if(footer)footer.style.display='none';

  _ws._report={elapsedSec:elapsedSec,kcal:kcal,doneSets:doneSets,totalSets:totalSets,totalReps:totalReps,totalKg:totalKg,totalDistance:totalDistance,totalDurSec:totalDurSec,muscleHits:muscleHits};
}

function _ws_saveAndClose(){
  var logs=getWorkoutLogs();
  var now=new Date();
  var isSwim=(_ws.branch==='swimming');
  var isPost=(_ws.branch==='posture');
  var entry={
    id:'log_'+now.getTime(),
    programId:_ws.programId,
    dayIndex:_ws.dayIndex,
    branch:_ws.branch||'fitness',
    date:now.toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric'}),
    timestamp:now.getTime(),
    elapsedSec:_ws._report?_ws._report.elapsedSec:0,
    kcal:_ws._report?_ws._report.kcal:0,
    doneSets:_ws._report?_ws._report.doneSets:0,
    totalSets:_ws._report?_ws._report.totalSets:0,
    totalReps:_ws._report?_ws._report.totalReps:0,
    totalDistance:_ws._report?_ws._report.totalDistance:0,
    sets:[]
  };
  _ws.program.days[_ws.dayIndex].exercises.forEach(function(ex,ei){
    _ws.sets[ei].forEach(function(s){
      if(s.done){
        if(isSwim){
          entry.sets.push({exId:ex.exercise_id,distance:s.distance,time:s.time});
        } else if(isPost){
          entry.sets.push({exId:ex.exercise_id,duration_sec:s.duration_sec,reps:s.reps});
        } else {
          entry.sets.push({exId:ex.exercise_id,kg:s.kg,reps:s.reps});
        }
      }
    });
  });
  logs.push(entry);
  _lsSet('rf_workout_logs',JSON.stringify(logs));
  saveToFirebase();
  showToast('✅ Antrenman kaydedildi!','success');
  setTimeout(checkAndAwardBadges,600);
  _ws_closeSession();
}

function _ws_closeSession(){
  clearInterval(_ws.elapsedInterval);
  clearInterval(_ws.restInterval);
  clearInterval(_postureTimerInterval);
  ws_skipRest();
  var footer=document.querySelector('.ws-footer');
  if(footer)footer.style.display='flex';
  document.getElementById('ws-screen').classList.remove('active');
  _ws.finished=false;
  window._wsBranch=null;
  renderWorkoutHome();
}
