/* ══════════════════════════════════════════════════════════
   RavenFit — menu.js
   Antrenman ana ekranı ve branş detayı
   ══════════════════════════════════════════════════════════ */

/* ── ANTRENMAN MENÜSÜ ─────────────────────────────────── */

/* Antrenman menüsü görünümü: 'home' | 'browse' | 'detail' | 'active' */



 /* Aktif program id */


/* ══════════════════════════════════════════════════════════
   KATMAN 1 — ANA EKRAN
   ══════════════════════════════════════════════════════════ */

function renderWorkoutHome(){
  var el=document.getElementById('workout-main');
  if(!el) return;
  var logs=getWorkoutLogs();
  var streak=_calcStreak(logs);
  var branches=getUserBranches();

  var html='<div class="wh-grid">';

  /* ── Araçlar kartı (tam genişlik) ── */
  html+='<div class="wh-card tools wh-full" onclick="renderWorkoutTools()" style="cursor:pointer;padding:18px 16px;border-width:2px;border-color:var(--border)">';
  html+='<div style="display:flex;align-items:center;gap:12px">';
  html+='<div style="font-size:30px">🛠️</div>';
  html+='<div style="flex:1">';
  html+='<div class="wh-card-label" style="font-size:18px">ARAÇLAR</div>';
  html+='<div class="wh-card-sub" style="font-size:11px;margin-top:2px">Egzersiz havuzu, geçmiş, kronometre, set sayacı, hesaplayıcılar</div>';
  html+='</div>';
  html+='<span style="color:var(--text3);font-size:22px">›</span>';
  html+='</div></div>';

  /* ── Streak banner ── */
  if(streak>0){
    var sc=streak>=7?'var(--warn)':'var(--success)';
    var sb=streak>=7?'color-mix(in srgb, var(--warn) 10%, transparent)':'color-mix(in srgb, var(--success) 8%, transparent)';
    html+='<div class="wh-full" style="background:'+sb+';border:1px solid '+sc+';border-radius:12px;padding:10px 14px;display:flex;align-items:center;gap:10px">';
    html+='<div style="font-size:22px">'+(streak>=7?'🔥':'⚡')+'</div>';
    html+='<div style="flex:1"><div style="font-size:13px;font-weight:700;color:'+sc+'">'+streak+' Günlük Seri!</div>';
    html+='<div style="font-size:11px;color:var(--text2)">Harika gidiyorsun!</div></div></div>';
  }

  /* ── Branş kartları (2 sütun grid) ── */
  branches.forEach(function(bId){
    var bDef=BRANCH_DEFS.find(function(b){return b.id===bId;})||{id:bId,label:bId,icon:'💪'};
    var activeKey='active_workout_'+bId;
    var activeId=U[activeKey]||null;
    var prog=null;
    if(activeId){
      prog=_findProgram(activeId);
    }

    var nextInfo='';
    if(prog){
      var bLogs=logs.filter(function(l){return l.programId===prog.id;});
      var lastDayIdx=bLogs.length>0?bLogs[bLogs.length-1].dayIndex:-1;
      var nextDayIdx=(lastDayIdx+1)%prog.days.length;
      var nd=prog.days[nextDayIdx];
      if(nd) nextInfo='Gün '+(nextDayIdx+1)+': '+nd.name;
    }

    html+='<div class="wh-card'+(prog?' accent':'')+'" onclick="renderBranchDetail(\''+bId+'\')">';
    html+='<div class="wh-card-icon">'+bDef.icon+'</div>';
    html+='<div class="wh-card-label">'+bDef.label+'</div>';
    if(prog){
      html+='<div class="wh-card-sub" style="color:var(--success)">'+nextInfo+'</div>';
      /* İnline butonlar — event bubbling'i durdur */
      html+='<button class="btn btn-p" onclick="event.stopPropagation();_startBranchWorkout(\''+bId+'\')" style="margin-top:6px;font-size:11px;padding:7px 0;border-radius:8px;width:100%">▶ Başlat</button>';
    } else {
      html+='<div class="wh-card-sub">Program seçilmedi</div>';
      html+='<button class="btn btn-s" onclick="event.stopPropagation();window._browseBranch=\''+bId+'\';window._browseTab=\'ready\';renderWorkoutBrowse()" style="margin-top:6px;font-size:11px;padding:7px 0;border-radius:8px;width:100%">📋 Program Seç</button>';
    }
    html+='</div>';
  });

  /* ── Branş Ekle (tam genişlik) ── */
  html+='<div class="wh-card wh-full" onclick="renderBranchManager()" style="text-align:center;padding:12px;cursor:pointer">';
  html+='<div style="font-size:14px;font-weight:700;color:var(--text2)">➕ Branş Ekle</div>';
  html+='</div>';

  html+='</div>'; /* wh-grid end */
  el.innerHTML=html;
}

/* Yeni screen: warmup-active ve attempt-active */
/* renderPR'a bunu eklemem lazım */

/* ══════════════════════════════════════════════════════════
   KATMAN 2B — BRANŞ DETAY SAYFASI
   ══════════════════════════════════════════════════════════ */

function renderBranchDetail(branchId){
  var el=document.getElementById('workout-main');
  if(!el) return;
  var bDef=BRANCH_DEFS.find(function(b){return b.id===branchId;})||{id:branchId,label:branchId,icon:'💪'};
  var logs=getWorkoutLogs();
  var activeKey='active_workout_'+branchId;
  var activeId=U[activeKey]||null;
  var prog=activeId?_findProgram(activeId):null;

  var html='<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">';
  html+='<button class="btn btn-s" onclick="renderWorkoutHome()" style="padding:8px 12px;font-size:12px">← Geri</button>';
  html+='<div style="font-size:22px">'+bDef.icon+'</div>';
  html+='<div style="font-size:16px;font-weight:700">'+bDef.label+'</div></div>';

  /* ── Aktif program kartı ── */
  if(prog){
    var progLogs=logs.filter(function(l){return l.programId===prog.id;});
    var lastDayIdx=progLogs.length>0?progLogs[progLogs.length-1].dayIndex:-1;
    var nextDayIdx=(lastDayIdx+1)%prog.days.length;
    var nextDay=prog.days[nextDayIdx];
    var totalSetsDay=nextDay?nextDay.exercises.reduce(function(a,e){return a+(e.sets||1);},0):0;

    html+='<div class="rc" style="border-color:var(--accent);border-width:2px">';
    html+='<div class="rct" style="color:var(--accent)">🎯 Aktif Program</div>';
    html+='<div style="font-size:16px;font-weight:700;margin-bottom:2px">'+prog.name_tr+'</div>';
    if(nextDay){
      html+='<div style="font-size:11px;color:var(--success);margin-bottom:4px">Sıradaki: Gün '+(nextDayIdx+1)+'/'+prog.days.length+' — '+nextDay.name+'</div>';
      html+='<div style="font-size:11px;color:var(--text2);margin-bottom:12px">'+nextDay.exercises.length+' egzersiz · '+totalSetsDay+' toplam set</div>';
    }
    html+='<div style="display:flex;gap:8px">';
    html+='<button class="btn btn-p btn-full" onclick="_startBranchWorkout(\''+branchId+'\')">▶ Antrenmanı Başlat</button>';
    html+='<button class="btn btn-s" onclick="window._browseBranch=\''+branchId+'\';renderWorkoutBrowse()" style="flex-shrink:0;padding:0 14px">Değiştir</button>';
    html+='</div></div>';
  } else {
    html+='<div class="rc">';
    html+='<div class="rct">🎯 Antrenman Programı</div>';
    html+='<div style="font-size:13px;color:var(--text2);margin-bottom:12px">Henüz bir program seçmedin. Sana uygun programı bul ve başla!</div>';
    html+='<button class="btn btn-p btn-full" onclick="window._browseBranch=\''+branchId+'\';window._browseTab=\'ready\';renderWorkoutBrowse()">📋 Program Seç</button>';
    html+='</div>';
  }

  /* ── Postür: Özel durum bazlı öneri ── */
  if(branchId==='posture'&&!prog){
    var userConds=U.conditions||[];
    var postRecs=[];
    if(userConds.indexOf('lower-back')>=0) postRecs.push({prog:'posture-lower-back',label:'Bel Ağrısı Programı',icon:'🔧',reason:'Bel rahatsızlığın var'});
    if(userConds.indexOf('shoulder-injury')>=0) postRecs.push({prog:'posture-neck-upper',label:'Boyun & Üst Sırt Düzeltme',icon:'🦴',reason:'Omuz rahatsızlığın var'});
    if(userConds.indexOf('knee-injury')>=0) postRecs.push({prog:'posture-general-mobility',label:'Genel Mobilite',icon:'🔄',reason:'Diz rahatsızlığın için mobilite önemli'});
    if(!postRecs.length&&userConds.length>0) postRecs.push({prog:'posture-general-mobility',label:'Genel Mobilite',icon:'🔄',reason:'Fiziksel sağlığın için önerilir'});
    if(postRecs.length){
      html+='<div style="background:color-mix(in srgb, var(--success) 6%, transparent);border:1px solid color-mix(in srgb, var(--success) 20%, transparent);border-radius:12px;padding:12px 14px;margin-bottom:8px">';
      html+='<div style="font-size:12px;font-weight:700;color:var(--success);margin-bottom:8px">💡 Sana Özel Öneriler</div>';
      postRecs.forEach(function(r){
        html+='<div style="display:flex;align-items:center;gap:10px;padding:6px 0;cursor:pointer" onclick="selectWorkoutProgram(\''+r.prog+'\',\'posture\')">';
        html+='<div style="font-size:20px">'+r.icon+'</div>';
        html+='<div style="flex:1"><div style="font-size:13px;font-weight:600">'+r.label+'</div>';
        html+='<div style="font-size:10px;color:var(--text2)">'+r.reason+'</div></div>';
        html+='<span style="color:var(--text3);font-size:16px">›</span></div>';
      });
      html+='</div>';
    }
  }

  /* ── Son antrenman özeti (3'lü stat grid) ── */
  var branchLogs=logs.filter(function(l){
    var lb=_getBranchForProgram(l.programId);
    return lb===branchId;
  });
  var lastLog=branchLogs.length>0?branchLogs[branchLogs.length-1]:null;
  if(lastLog){
    var durMin=Math.floor((lastLog.elapsedSec||0)/60);
    html+='<div class="rc">';
    html+='<div class="rct">📊 Son Antrenman</div>';
    html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">';
    html+='<div style="background:var(--card2);border-radius:9px;padding:9px;text-align:center">';
    html+='<div style="font-size:15px;font-weight:700;color:var(--accent)">'+durMin+'dk</div>';
    html+='<div style="font-size:9px;color:var(--text2)">SÜRE</div></div>';
    html+='<div style="background:var(--card2);border-radius:9px;padding:9px;text-align:center">';
    html+='<div style="font-size:15px;font-weight:700;color:var(--warn)">'+(lastLog.kcal||0)+'</div>';
    html+='<div style="font-size:9px;color:var(--text2)">KCAL</div></div>';
    html+='<div style="background:var(--card2);border-radius:9px;padding:9px;text-align:center">';
    html+='<div style="font-size:15px;font-weight:700;color:var(--success)">'+(lastLog.doneSets||0)+'</div>';
    html+='<div style="font-size:9px;color:var(--text2)">SET</div></div>';
    html+='</div>';
    html+='<div style="font-size:10px;color:var(--text3);margin-top:6px">📅 '+lastLog.date+'</div>';
    html+='</div>';
  }

  /* ── Alt menü satırları ── */
  /* Tüm Programlar */
  html+='<div class="rc" style="cursor:pointer;padding:14px" onclick="window._browseBranch=\''+branchId+'\';window._browseTab=\'ready\';renderWorkoutBrowse()">';
  html+='<div style="display:flex;align-items:center;gap:12px">';
  html+='<div style="font-size:18px">📂</div>';
  html+='<div style="flex:1;font-size:13px;font-weight:700">Tüm Programlar</div>';
  html+='<span style="color:var(--text3);font-size:18px">›</span>';
  html+='</div></div>';

  /* Egzersizleri Gör */
  html+='<div class="rc" style="cursor:pointer;padding:14px" onclick="openExerciseLibraryFrom(\''+branchId+'\',\'branch\')">';
  html+='<div style="display:flex;align-items:center;gap:12px">';
  html+='<div style="font-size:18px">📚</div>';
  html+='<div style="flex:1;font-size:13px;font-weight:700">Egzersizleri Gör</div>';
  html+='<span style="color:var(--text3);font-size:18px">›</span>';
  html+='</div></div>';

  /* Geçmiş Antrenmanlar */
  html+='<div class="rc" style="cursor:pointer;padding:14px" onclick="window._historyBranch=\''+branchId+'\';renderWorkoutHistory()">';
  html+='<div style="display:flex;align-items:center;gap:12px">';
  html+='<div style="font-size:18px">📋</div>';
  html+='<div style="flex:1;font-size:13px;font-weight:700">Geçmiş Antrenmanlar</div>';
  html+='<div style="font-size:11px;color:var(--text2)">'+branchLogs.length+' kayıt</div>';
  html+='<span style="color:var(--text3);font-size:18px">›</span>';
  html+='</div></div>';

  el.innerHTML=html;
}

/* ══════════════════════════════════════════════════════════
   ANTRENMAN BAŞLAT — branş bazlı
   ══════════════════════════════════════════════════════════ */

function _startBranchWorkout(branchId){
  var activeKey='active_workout_'+branchId;
  var activeId=U[activeKey]||null;
  if(!activeId){ showToast('Önce bir program seç.','warn'); return; }

  /* Programı bul */
  var prog=_findProgram(activeId);
  if(!prog){ showToast('Program bulunamadı.','error'); return; }

  /* Branşa uygun egzersiz verisinin yüklü olduğunu kontrol et */
  var exData=_getBranchExercises(branchId);
  if(!exData&&!prog._isCustom){
    showToast('❌ Egzersiz verileri yüklenemedi.','error'); return;
  }

  /* Branş bilgisini _ws state'ine kaydet (motor kullanacak) */
  window._wsBranch=branchId;

  /* Isınma göster, sonra başlat */
  showWarmup('warmup',function(){ _doStartSession(prog); });
}

