/* ══════════════════════════════════════════════════════════
   RavenFit — sleep.js
   Uyku hesaplayıcı
   ══════════════════════════════════════════════════════════ */

/* ══ 3. UYKU HESAPLAYICI ════════════════════════════════ */

function _calcSleep(){
  var mode=_calcState.sleepMode||'wake';
  var wakeHour=_calcState.wakeHour||'07:00';
  var bedHour=_calcState.bedHour||'23:00';
  var fmt24=_calcState.sleep24==='0'?false:(_calcState.sleep24!==false);
  if(typeof _calcState.sleep24==='undefined') fmt24=true;
  var includeFall=_calcState.sleepFall!==false; /* default true */
  var isWorkoutDay=_calcState.sleepWorkout===true;
  var html='';

  /* Mod seçimi — başlıkla */
  html+='<div class="calc-grid-card">';
  html+='<div class="calc-label">Hangisine göre hesaplanacak?</div>';
  html+='<div class="calc-btn-grid two">';
  html+='<div class="calc-btn'+(mode==='wake'?' sel':'')+'" onclick="_calcState.sleepMode=\'wake\';_calcSleepRerender()">⏰ Kalkış Saatime Göre</div>';
  html+='<div class="calc-btn'+(mode==='bed'?' sel':'')+'" onclick="_calcState.sleepMode=\'bed\';_calcSleepRerender()">🛏️ Yatış Saatime Göre</div>';
  html+='</div>';
  html+='</div>';

  /* Saat input */
  html+='<div class="calc-grid-card">';
  if(mode==='wake'){
    html+='<div class="calc-label">Saat kaçta kalkmak istiyorsun?</div>';
    html+='<input class="calc-input" type="time" value="'+wakeHour+'" oninput="_calcState.wakeHour=this.value;_calcSleepUpdate()" id="calc-sleep-time">';
  } else {
    html+='<div class="calc-label">Saat kaçta yatacaksın?</div>';
    html+='<input class="calc-input" type="time" value="'+bedHour+'" oninput="_calcState.bedHour=this.value;_calcSleepUpdate()" id="calc-sleep-time">';
  }
  html+='</div>';

  /* 3 Toggle seçeneği */
  html+='<div class="calc-grid-card"><div class="calc-label">Ayarlar</div>';

  /* Toggle 1: 24h format */
  html+=_sleepToggle('sleep24',fmt24,'🕐 24 Saat Biçimi','Kapalı: 12 saat AM/PM biçimi');
  /* Toggle 2: Fall asleep */
  html+=_sleepToggle('sleepFall',includeFall,'⏱️ Uykuya Dalma Süresi','Uykuya dalma için +15 dk ekler');
  /* Toggle 3: Workout day */
  html+=_sleepToggle('sleepWorkout',isWorkoutDay,'💪 Bugün Antrenman Yaptın mı?','Açık: +0.5 saat önerilir');

  html+='</div>';

  html+='<div id="calc-sleep-result"></div>';

  html+='<div class="calc-grid-card" style="background:var(--card2)">';
  html+='<div style="font-size:11px;color:var(--text2);line-height:1.55">';
  html+='💡 <strong>REM döngüsü:</strong> Uyku ~90 dakikalık döngüler halinde gelir. Derin uyku ve REM evreleri bu döngü sonunda olur.<br><br>';
  html+='<strong>✅ Bir döngünün sonunda uyanırsan</strong> kendini zinde hissedersin.<br>';
  html+='<strong>❌ Döngünün ortasında uyanırsan</strong> yorgun uyanırsın.<br><br>';
  html+='Önerilen uyku süreleri: <strong>6h</strong> (4 döngü), <strong>7.5h</strong> (5 döngü), <strong>9h</strong> (6 döngü), <strong>10.5h</strong> (7 döngü)';
  html+='</div></div>';

  setTimeout(_calcSleepUpdate,30);
  return html;
}

function _sleepToggle(key,val,title,sub){
  return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;margin-bottom:8px;background:var(--card2);border-radius:10px;cursor:pointer" onclick="_calcState.'+key+'='+(!val)+';_calcSleepRerender()">'+
    '<div>'+
    '<div style="font-size:12px;font-weight:700;color:var(--text)">'+title+'</div>'+
    '<div style="font-size:10px;color:var(--text2);margin-top:2px">'+sub+'</div>'+
    '</div>'+
    '<div style="width:46px;height:26px;border-radius:13px;background:'+(val?'var(--accent)':'var(--border)')+';position:relative;flex-shrink:0;transition:background .2s">'+
    '<div style="position:absolute;top:3px;left:'+(val?'23px':'3px')+';width:20px;height:20px;border-radius:50%;background:var(--on-accent);transition:left .2s"></div>'+
    '</div></div>';
}

function _calcSleepRerender(){
  document.getElementById('calc-body').innerHTML=_calcSleep();
}

function _calcSleepUpdate(){
  var mode=_calcState.sleepMode||'wake';
  var el=document.getElementById('calc-sleep-result');
  if(!el) return;
  var fmt24=_calcState.sleep24!==false;
  if(typeof _calcState.sleep24==='undefined') fmt24=true;
  var includeFall=_calcState.sleepFall!==false;
  var isWorkoutDay=_calcState.sleepWorkout===true;

  var FALL_ASLEEP_MIN=includeFall?15:0;
  var CYCLE_MIN=90;

  function parseTime(s){
    var p=(s||'').split(':');
    if(p.length!==2)return null;
    return {h:parseInt(p[0])||0,m:parseInt(p[1])||0};
  }
  function addMin(t,delta){
    var total=t.h*60+t.m+delta;
    while(total<0) total+=1440;
    total=total%1440;
    return {h:Math.floor(total/60),m:total%60};
  }
  function fmtTime(t){
    if(fmt24){
      return (t.h<10?'0':'')+t.h+':'+(t.m<10?'0':'')+t.m;
    } else {
      var h12=t.h%12; if(h12===0)h12=12;
      var suffix=t.h<12?'AM':'PM';
      return h12+':'+(t.m<10?'0':'')+t.m+' '+suffix;
    }
  }

  /* 4 uyku süresi: 6h, 7.5h, 9h, 10.5h = 4, 5, 6, 7 döngü */
  /* Antrenman günüyse +0.5h = 7, 8, 9.5, 11 saat — döngü mantığıyla devam edelim ama +0.5 ekle */
  var sleepOptions=[
    {cycles:4,hours:6},
    {cycles:5,hours:7.5},
    {cycles:6,hours:9},
    {cycles:7,hours:10.5}
  ];

  var times=[];
  var targetLabel='';

  if(mode==='wake'){
    var wake=parseTime(_calcState.wakeHour||'07:00');
    if(!wake){el.innerHTML='';return;}
    targetLabel='Saat '+fmtTime(wake)+' kalkacaksın → şu saatlerde YAT:';
    sleepOptions.forEach(function(opt){
      var totalMin=opt.cycles*CYCLE_MIN+FALL_ASLEEP_MIN;
      if(isWorkoutDay) totalMin+=30;
      var t=addMin(wake,-totalMin);
      times.push({time:t,cycles:opt.cycles,sleep:opt.hours+(isWorkoutDay?0.5:0)});
    });
  } else {
    var bed=parseTime(_calcState.bedHour||'23:00');
    if(!bed){el.innerHTML='';return;}
    targetLabel='Saat '+fmtTime(bed)+' yatacaksın → şu saatlerde UYAN:';
    sleepOptions.forEach(function(opt){
      var totalMin=opt.cycles*CYCLE_MIN+FALL_ASLEEP_MIN;
      if(isWorkoutDay) totalMin+=30;
      var t=addMin(bed,totalMin);
      times.push({time:t,cycles:opt.cycles,sleep:opt.hours+(isWorkoutDay?0.5:0)});
    });
  }

  /* Tag'ler: 4 döngü = minimum, 5 = iyi, 6 = optimal (antrenman günüyse 7 = optimal) */
  var optimalIdx=isWorkoutDay?2:1; /* 7.5h veya 9h */
  var tags=['⚠️ Minimum','👍 İyi','✨ Optimal','💤 Uzun'];
  var colors=['var(--warn)','var(--info)','var(--success)','var(--text2)'];
  if(isWorkoutDay){
    tags=['⚠️ Minimum','👍 İyi','💪 Optimal','💤 Uzun'];
  }

  var html='<div class="calc-result" style="padding:14px 16px">';
  html+='<div style="font-size:11px;color:var(--text2);margin-bottom:8px">'+targetLabel+'</div>';
  times.forEach(function(tt,i){
    var isLast=i===times.length-1;
    html+='<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:'+(isLast?'none':'1px solid var(--border)')+'">';
    html+='<div style="flex:1;text-align:left">';
    html+='<div style="font-family:\'Bebas Neue\',cursive;font-size:30px;letter-spacing:2px;color:'+colors[i]+';line-height:1">'+fmtTime(tt.time)+'</div>';
    html+='<div style="font-size:9px;color:var(--text3);margin-top:2px">'+tt.cycles+' döngü · '+tt.sleep+' saat uyku</div>';
    html+='</div>';
    html+='<div style="font-size:10px;color:'+colors[i]+';font-weight:700">'+tags[i]+'</div>';
    html+='</div>';
  });
  html+='</div>';

  /* Bilgi kutusu */
  var age=U.age||25;
  var recHours='7-9';
  if(age<18) recHours='8-10';
  else if(age>=65) recHours='7-8';
  html+='<div class="calc-grid-card" style="background:color-mix(in srgb, var(--success) 6%, transparent);border-color:color-mix(in srgb, var(--success) 20%, transparent)">';
  html+='<div style="font-size:11px;color:var(--text2);line-height:1.5">';
  html+='<strong style="color:var(--success)">📊 Sana özel:</strong> '+age+' yaşında için önerilen uyku <strong>'+recHours+' saat</strong>.<br>';
  if(isWorkoutDay){
    html+='💪 <strong>Antrenman günü</strong> aktif — her seçenek +30 dk uzatıldı.';
  } else {
    html+='💤 Antrenman yaptığın gün için "💪 Bugün Antrenman Yaptın mı?" toggle\'ını aç, +30 dk ekleyelim.';
  }
  html+='</div></div>';

  el.innerHTML=html;
}

