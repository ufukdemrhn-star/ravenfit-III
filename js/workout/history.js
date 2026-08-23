/* ══════════════════════════════════════════════════════════
   RavenFit — history.js
   Antrenman geçmişi ve seri takibi
   ══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   KATMAN 3 — ANTRENMAN GEÇMİŞİ
   ══════════════════════════════════════════════════════════ */

function renderWorkoutHistory(){
  var el=document.getElementById('workout-main');
  if(!el) return;
  var logs=getWorkoutLogs();
  var branchFilter=window._historyBranch||null;
  var branches=getUserBranches();

  /* Geri butonu */
  var backFn='renderWorkoutTools()';

  var html='<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">';
  html+='<button class="btn btn-s" onclick="'+backFn+'" style="padding:8px 12px;font-size:12px">← Geri</button>';
  html+='<div style="font-size:16px;font-weight:700">Antrenman Geçmişi</div></div>';

  /* ── Branş filtre butonları ── */
  var branchIcons={fitness:'🏋️',swimming:'🏊',posture:'🧘'};
  var branchLabels={fitness:'GYM',swimming:'Yüzme',posture:'Postür'};
  html+='<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">';
  /* Tümü butonu */
  var allSel=!branchFilter;
  html+='<button onclick="window._historyBranch=null;renderWorkoutHistory()" style="padding:6px 12px;border-radius:8px;border:1.5px solid '+(allSel?'var(--accent)':'var(--border)')+';background:'+(allSel?'color-mix(in srgb, var(--accent) 10%, transparent)':'var(--card2)')+';color:'+(allSel?'var(--accent)':'var(--text2)')+';font-size:11px;font-weight:600;cursor:pointer;font-family:\'Outfit\',sans-serif">Tümü</button>';
  branches.forEach(function(bId){
    var isSel=(branchFilter===bId);
    var icon=branchIcons[bId]||'💪';
    var label=branchLabels[bId]||bId;
    html+='<button onclick="window._historyBranch=\''+bId+'\';renderWorkoutHistory()" style="padding:6px 12px;border-radius:8px;border:1.5px solid '+(isSel?'var(--accent)':'var(--border)')+';background:'+(isSel?'color-mix(in srgb, var(--accent) 10%, transparent)':'var(--card2)')+';color:'+(isSel?'var(--accent)':'var(--text2)')+';font-size:11px;font-weight:600;cursor:pointer;font-family:\'Outfit\',sans-serif">'+icon+' '+label+'</button>';
  });
  html+='</div>';

  /* Branş filtresi uygula */
  var filtered=logs;
  if(branchFilter){
    filtered=logs.filter(function(l){
      return _getBranchForProgram(l.programId)===branchFilter||(l.branch===branchFilter);
    });
  }

  if(!filtered.length){
    html+='<div class="rc" style="text-align:center;padding:24px">';
    html+='<div style="font-size:36px;margin-bottom:8px">📭</div>';
    html+='<div style="font-size:13px;color:var(--text2)">Henüz antrenman kaydın yok.</div></div>';
    el.innerHTML=html;
    return;
  }

  /* Özet istatistikler */
  var totalKcal=filtered.reduce(function(a,l){return a+(l.kcal||0);},0);
  var totalMin=filtered.reduce(function(a,l){return a+Math.floor((l.elapsedSec||0)/60);},0);
  var totalSets=filtered.reduce(function(a,l){return a+(l.doneSets||0);},0);
  var prCount=filtered.filter(function(l){return l.isPR;}).length;
  html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-bottom:12px">';
  html+='<div class="ws-report-stat"><div class="ws-report-val">'+filtered.length+'</div><div class="ws-report-lbl">Antrenman</div></div>';
  html+='<div class="ws-report-stat"><div class="ws-report-val">'+totalMin+'dk</div><div class="ws-report-lbl">Toplam Süre</div></div>';
  html+='<div class="ws-report-stat"><div class="ws-report-val">'+totalKcal+'</div><div class="ws-report-lbl">Toplam kcal</div></div>';
  html+='<div class="ws-report-stat" style="background:linear-gradient(135deg, color-mix(in srgb, var(--accent) 15%, transparent), var(--card2));border:1px solid color-mix(in srgb, var(--accent) 30%, transparent)"><div class="ws-report-val" style="color:var(--accent)">🎯 '+prCount+'</div><div class="ws-report-lbl">PR</div></div>';
  html+='</div>';

  /* Log listesi — yeniden eskiye, son 30 */
  var shown=filtered.slice().reverse().slice(0,30);
  shown.forEach(function(log){
    /* Gerçek index'i bul (orijinal logs dizisinde) */
    var realIdx=logs.indexOf(log);

    /* PR kayıtları için özel kart */
    if(log.isPR){
      var prExName={squat:'🦵 Squat',bench:'💪 Bench',deadlift:'🏋️ Deadlift'}[log.prExercise]||log.prExercise;
      var feelEmoji={good:'💪',normal:'😐',bad:'😣',fail:'❌'};
      var feelColor={good:'var(--success)',normal:'var(--info)',bad:'var(--warn)',fail:'var(--accent)'};
      /* En iyi feel'i ve değeri bul */
      var bestKg=log.prBest||0;
      var prDate=(typeof log.date==='string' && log.date.indexOf('T')>0)?new Date(log.date).toLocaleDateString('tr-TR'):log.date;

      html+='<div class="rc" style="padding:12px 14px;background:linear-gradient(135deg, color-mix(in srgb, var(--accent) 5%, transparent), var(--card));border:1.5px solid color-mix(in srgb, var(--accent) 30%, transparent);cursor:pointer" onclick="_prShowDetailFromLog('+realIdx+')">';
      html+='<div style="display:flex;align-items:flex-start;gap:10px">';
      html+='<div style="font-size:30px;line-height:1;flex-shrink:0">🎯</div>';
      html+='<div style="flex:1">';
      html+='<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px">';
      html+='<span style="font-size:14px;font-weight:700;color:var(--accent)">PR Denemesi</span>';
      html+='<span style="font-size:11px;color:var(--text2)">· '+prExName+'</span>';
      html+='</div>';
      html+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:5px">';
      html+='<div><div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px">Hedef</div><div style="font-family:\'Bebas Neue\',cursive;font-size:18px;color:var(--text)">'+log.prTarget+'kg</div></div>';
      html+='<div style="color:var(--text3);font-size:18px">→</div>';
      html+='<div><div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px">En İyi</div><div style="font-family:\'Bebas Neue\',cursive;font-size:18px;color:'+(bestKg>=log.prTarget?'var(--success)':'var(--warn)')+'">'+bestKg+'kg</div></div>';
      html+='</div>';
      html+='<div style="font-size:10px;color:var(--text2)">📅 '+prDate+' · '+(log.prAttempts?log.prAttempts.length:0)+' deneme</div>';
      html+='</div>';
      html+='<div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0">';
      html+='<button onclick="event.stopPropagation();deleteWorkoutLog('+realIdx+')" style="background:none;border:1px solid var(--border);border-radius:7px;padding:4px 8px;font-size:10px;color:var(--accent);cursor:pointer;font-family:\'Outfit\',sans-serif">🗑</button>';
      html+='</div></div></div>';
      return;
    }

    /* Normal antrenman kartı */
    var prog=_findProgram(log.programId);
    var progName=prog?prog.name_tr:(log.programId||'Program');
    var dayName=prog&&prog.days&&prog.days[log.dayIndex]?prog.days[log.dayIndex].name:'Antrenman';
    var dur=Math.floor((log.elapsedSec||0)/60);

    html+='<div class="rc" style="padding:12px 14px">';
    html+='<div style="display:flex;align-items:flex-start;gap:8px">';
    html+='<div style="flex:1">';
    html+='<div style="font-size:13px;font-weight:700;margin-bottom:2px">'+dayName+'</div>';
    html+='<div style="font-size:10px;color:var(--text2);margin-bottom:5px">'+progName+' · 📅 '+log.date+(log.note?'<br>📝 '+log.note:'')+'</div>';
    html+='<div style="display:flex;gap:8px;flex-wrap:wrap">';
    html+='<span style="font-size:11px;color:var(--accent)">⏱ '+dur+'dk</span>';
    html+='<span style="font-size:11px;color:var(--warn)">🔥 '+(log.kcal||0)+' kcal</span>';
    html+='<span style="font-size:11px;color:var(--success)">💪 '+(log.doneSets||0)+' set</span>';
    html+='</div></div>';
    html+='<div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0">';
    html+='<button onclick="editWorkoutLog('+realIdx+')" style="background:var(--card2);border:1px solid var(--border);border-radius:7px;padding:4px 8px;font-size:10px;color:var(--text2);cursor:pointer;font-family:\'Outfit\',sans-serif">✏️</button>';
    html+='<button onclick="deleteWorkoutLog('+realIdx+')" style="background:none;border:1px solid var(--border);border-radius:7px;padding:4px 8px;font-size:10px;color:var(--accent);cursor:pointer;font-family:\'Outfit\',sans-serif">🗑</button>';
    html+='</div></div></div>';
  });

  el.innerHTML=html;
}

/* PR log'unu detay olarak göster — kalori hesaplayıcı overlay üzerinden */

function _prShowDetailFromLog(logIdx){
  var logs=getWorkoutLogs();
  var log=logs[logIdx];
  if(!log||!log.isPR){
    showToast('Kayıt bulunamadı','warn');
    return;
  }
  /* PR state'ini geçici olarak doldur ve sonuç ekranını göster */
  _pr.target=log.prTarget||0;
  _pr.exercise=log.prExercise||'squat';
  _pr.attempts=(log.prAttempts||[]).map(function(a){return {kg:a.kg,feel:a.feel,success:a.success,idx:0};});
  _pr.attempts.forEach(function(a,i){a.idx=i;});
  _pr.warmupSets=(log.prWarmups||[]).map(function(w){return {kg:w.kg,reps:w.reps,skipped:w.skipped};});
  _pr.warmupFeel=log.prWarmupFeel||null;
  _pr.screen='result';

  /* Calculator overlay'i aç PR moduna */
  _activeCalc='pr';
  var nameEl=document.getElementById('calc-header-title');
  var subEl=document.getElementById('calc-header-sub');
  if(nameEl) nameEl.textContent='🎯 PR GEÇMİŞ KAYDI';
  if(subEl) subEl.textContent='REKOR DENEMESİ';
  document.getElementById('calc-overlay').classList.add('active');
  _renderPR();
}

/* ── Silme ── */

function deleteWorkoutLog(idx){
  showConfirm('Kaydı Sil','Bu antrenman kaydı kalıcı olarak silinecek.',function(){
    var logs=getWorkoutLogs();
    logs.splice(idx,1);
    _lsSet('rf_workout_logs',JSON.stringify(logs));
    saveToFirebase();
    showToast('Silindi.');
    renderWorkoutHistory();
  },'Evet, Sil');
}

/* ── Düzenleme sayfası ── */

function editWorkoutLog(idx){
  var logs=getWorkoutLogs();
  var log=logs[idx];
  if(!log) return;
  var el=document.getElementById('workout-main');
  if(!el) return;
  var prog=_findProgram(log.programId);
  var dayName=prog&&prog.days&&prog.days[log.dayIndex]?prog.days[log.dayIndex].name:'Antrenman';
  var progName=prog?prog.name_tr:(log.programId||'Program');

  var html='<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">';
  html+='<button class="btn btn-s" onclick="renderWorkoutHistory()" style="padding:8px 12px;font-size:12px">← Geri</button>';
  html+='<div style="font-size:16px;font-weight:700">Kaydı Düzenle</div></div>';

  html+='<div class="rc">';
  html+='<div style="font-size:14px;font-weight:700;margin-bottom:2px">'+dayName+'</div>';
  html+='<div style="font-size:11px;color:var(--text2);margin-bottom:12px">'+progName+' · 📅 '+log.date+'</div>';

  html+='<div style="margin-bottom:10px">';
  html+='<div style="font-size:11px;color:var(--text2);margin-bottom:4px">⏱ Süre (dakika)</div>';
  html+='<input id="edit-dur" type="number" class="cwb-param-input" value="'+Math.floor((log.elapsedSec||0)/60)+'" style="width:120px;text-align:left;padding:8px 12px"></div>';

  html+='<div style="margin-bottom:10px">';
  html+='<div style="font-size:11px;color:var(--text2);margin-bottom:4px">🔥 Kalori (kcal)</div>';
  html+='<input id="edit-kcal" type="number" class="cwb-param-input" value="'+(log.kcal||0)+'" style="width:120px;text-align:left;padding:8px 12px"></div>';

  html+='<div style="margin-bottom:14px">';
  html+='<div style="font-size:11px;color:var(--text2);margin-bottom:4px">📝 Not</div>';
  html+='<input id="edit-note" type="text" class="ex-search" placeholder="Antrenman notu..." value="'+(log.note||'')+'" style="margin-bottom:0"></div>';

  html+='<button class="btn btn-p btn-full" onclick="saveWorkoutLogEdit('+idx+')">💾 Kaydet</button>';
  html+='</div>';

  el.innerHTML=html;
}

/* ── Düzenleme kaydet ── */

function saveWorkoutLogEdit(idx){
  var logs=getWorkoutLogs();
  var log=logs[idx];
  if(!log) return;
  log.elapsedSec=(parseInt(document.getElementById('edit-dur').value)||0)*60;
  log.kcal=parseInt(document.getElementById('edit-kcal').value)||0;
  log.note=(document.getElementById('edit-note').value||'').trim();
  logs[idx]=log;
  _lsSet('rf_workout_logs',JSON.stringify(logs));
  saveToFirebase();
  showToast('✅ Kaydedildi!');
  renderWorkoutHistory();
}

/* ══════════════════════════════════════════════════════════
   PO (Progressive Overload) HİNT SİSTEMİ
   ══════════════════════════════════════════════════════════ */

function _ws_getPoHint(progId,dayIdx,exId,setIdx,currentKg,currentReps){
  var logs=getWorkoutLogs();
  /* Aynı program, aynı gün, aynı egzersizin önceki set verilerini bul */
  for(var i=logs.length-1;i>=0;i--){
    var l=logs[i];
    if(l.programId!==progId||l.dayIndex!==dayIdx) continue;
    if(!l.sets) continue;
    /* Bu egzersizin setlerini bul */
    var exSets=l.sets.filter(function(s){return s.exId===exId;});
    if(!exSets.length) continue;
    var prevSet=exSets[setIdx]||exSets[exSets.length-1];
    if(!prevSet) continue;

    var prevKg=parseFloat(prevSet.kg)||0;
    var prevReps=parseInt(prevSet.reps)||0;
    var curKg=parseFloat(currentKg)||0;
    var curReps=parseInt(currentReps)||0;

    var hint={_prevKg:prevKg||'',_prevReps:prevReps||'',type:'same',msg:'Öncekiyle aynı'};

    if(curKg>0&&curReps>0){
      var prevVol=prevKg*prevReps;
      var curVol=curKg*curReps;
      if(curVol>prevVol){
        hint.type='up';
        if(curKg>prevKg) hint.msg='Ağırlık artışı! +'+((curKg-prevKg).toFixed(1))+'kg';
        else hint.msg='Volüm artışı!';
      } else if(curVol<prevVol){
        hint.type='down';
        hint.msg='Öncekinden düşük';
      }
    } else if(prevKg>0||prevReps>0){
      /* Henüz girilmemiş — sadece placeholder bilgisi dön */
      hint.type=null;
      hint.msg=null;
    }
    return hint;
  }
  return null;
}

/* ── Streak hesapla ──────────────────────────────────────── */

function _calcStreak(logs){
  if(!logs||!logs.length)return 0;
  var today=new Date();today.setHours(0,0,0,0);
  var streak=0;
  var checkDate=new Date(today);
  for(var d=0;d<60;d++){
    var dateStr=checkDate.toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric'});
    var found=logs.some(function(l){return l.date===dateStr;});
    if(found){streak++;}
    else if(d>0){break;}
    checkDate.setDate(checkDate.getDate()-1);
  }
  return streak;
}

/* ── Log helpers ─────────────────────────────────────────── */

function getWorkoutLogs(){
  try{return JSON.parse(_lsGet('rf_workout_logs')||'[]');}catch(e){return[];}
}
