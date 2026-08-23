/* ══════════════════════════════════════════════════════════
   RavenFit — programs.js
   Program seçimi ve özel program oluşturucu
   ══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   PROGRAM SEÇ — hazır/özel sekmeli, hedef+seviye filtreli
   ══════════════════════════════════════════════════════════ */

function renderWorkoutBrowse(){
  var el=document.getElementById('workout-main');
  if(!el) return;
  var branch=window._browseBranch||'fitness';
  var tab=window._browseTab||'ready';
  var filterGoal=window._browseGoal||'all';
  var filterDiff=window._browseDiff||'all';
  var bDef=BRANCH_DEFS.find(function(b){return b.id===branch;})||{label:branch,icon:'💪'};

  var html='<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">';
  html+='<button class="btn btn-s" onclick="renderBranchDetail(\''+branch+'\')" style="padding:8px 12px;font-size:12px">← Geri</button>';
  html+='<div style="font-size:16px;font-weight:700">'+bDef.icon+' '+bDef.label+' Programları</div></div>';

  /* Sekmeler */
  html+='<div style="display:flex;background:var(--card2);border-radius:9px;padding:3px;margin-bottom:12px;border:1px solid var(--border)">';
  html+='<button style="flex:1;padding:8px;border:none;border-radius:6px;font-family:\'Outfit\',sans-serif;font-size:12px;font-weight:600;cursor:pointer;background:'+(tab==='ready'?'var(--card)':'transparent')+';color:'+(tab==='ready'?'var(--text)':'var(--text2)')+'" onclick="window._browseTab=\'ready\';renderWorkoutBrowse()">Hazır Programlar</button>';
  html+='<button style="flex:1;padding:8px;border:none;border-radius:6px;font-family:\'Outfit\',sans-serif;font-size:12px;font-weight:600;cursor:pointer;background:'+(tab==='custom'?'var(--card)':'transparent')+';color:'+(tab==='custom'?'var(--text)':'var(--text2)')+'" onclick="window._browseTab=\'custom\';renderWorkoutBrowse()">Özel Programlarım</button>';
  html+='</div>';

  if(tab==='ready'){
    /* Hedef filtre */
    var goalTr={all:'Tüm Hedefler',bulk:'Kas Kazanımı',cut:'Yağ Yakımı',recomp:'Rekomp',health:'Sağlık',perf:'Performans'};
    html+='<div class="prog-filter-row">';
    ['all','bulk','cut','recomp','health','perf'].forEach(function(g){
      html+='<div class="ex-chip'+(filterGoal===g?' sel':'')+'" onclick="window._browseGoal=\''+g+'\';renderWorkoutBrowse()">'+goalTr[g]+'</div>';
    });
    html+='</div>';

    /* Seviye filtre */
    html+='<div class="prog-filter-row">';
    [{v:'all',l:'Tüm Seviyeler'},{v:'1',l:'Başlangıç'},{v:'2',l:'Orta'},{v:'3',l:'İleri'}].forEach(function(d){
      html+='<div class="ex-chip'+(filterDiff===d.v?' sel':'')+'" onclick="window._browseDiff=\''+d.v+'\';renderWorkoutBrowse()">'+d.l+'</div>';
    });
    html+='</div>';

    var data=_getBranchWorkouts(branch);
    if(!data){
      html+='<div style="text-align:center;padding:20px;color:var(--text2);font-size:13px">Veriler yükleniyor...</div>';
    } else {
      var filteredList=data.workouts.filter(function(p){
        var matchGoal=filterGoal==='all'||(p.goal&&p.goal.indexOf(filterGoal)>=0);
        var matchDiff=filterDiff==='all'||String(p.difficulty)===filterDiff;
        return matchGoal&&matchDiff;
      });
      if(!filteredList.length){
        html+='<div style="text-align:center;padding:20px;color:var(--text2);font-size:13px">Eşleşen program yok.</div>';
      }
      filteredList.forEach(function(prog){
        var activeKey='active_workout_'+branch;
        var isActive=U[activeKey]===prog.id;
        html+='<div class="rc" style="cursor:pointer;'+(isActive?'border-color:var(--accent);border-width:2px':'')+'" onclick="selectWorkoutProgram(\''+prog.id+'\',\''+branch+'\')">';
        html+='<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">';
        html+='<div style="flex:1;min-width:0">';
        html+='<div style="font-size:15px;font-weight:700;margin-bottom:3px">'+prog.name_tr+'</div>';
        html+='<div style="font-size:11px;color:var(--text2);margin-bottom:6px">'+(prog.description_tr||'')+'</div>';
        html+='<div style="display:flex;gap:5px;flex-wrap:wrap">';
        html+='<span class="badge bb">'+(prog.days_per_week||prog.days.length)+' gün/hafta</span>';
        html+='<span class="badge '+(prog.difficulty===1?'bg':prog.difficulty===2?'by':'br')+'">'+['','Başlangıç','Orta','İleri'][prog.difficulty||1]+'</span>';
        html+='</div></div>';
        html+=(isActive?'<span class="badge bg" style="flex-shrink:0">✓ Aktif</span>':'<span style="color:var(--text3);font-size:20px">›</span>');
        html+='</div></div>';
      });
    }
  } else {
    /* Özel Programlar */
    var customs=getCustomWorkouts().filter(function(p){ return !p._branch||p._branch===branch; });
    if(!customs.length){
      html+='<div style="text-align:center;padding:20px;color:var(--text2);font-size:13px">Henüz özel programın yok.</div>';
    } else {
      customs.forEach(function(p){
        var activeKey='active_workout_'+(p._branch||branch);
        var isActive=U[activeKey]===p.id;
        html+='<div class="rc" style="'+(isActive?'border-color:var(--accent);border-width:2px':'')+'">';
        html+='<div style="display:flex;align-items:center;gap:8px">';
        html+='<div onclick="selectWorkoutProgram(\''+p.id+'\',\''+(p._branch||branch)+'\')" style="flex:1;cursor:pointer">';
        html+='<div style="font-size:14px;font-weight:700">'+p.name_tr+'</div>';
        html+='<div style="font-size:11px;color:var(--text2)">'+(p.days&&p.days[0]?p.days[0].exercises.length:0)+' egzersiz/gün</div></div>';
        html+=(isActive?'<span class="badge bg">✓ Aktif</span>':'');
        html+='<button onclick="deleteCustomWorkout(\''+p.id+'\')" style="background:none;border:none;color:var(--accent);font-size:18px;cursor:pointer;padding:2px 6px">✕</button>';
        html+='</div></div>';
      });
    }
    html+='<button class="btn btn-p btn-full" onclick="renderCustomWorkoutBuilder()" style="margin-top:8px">➕ Yeni Program Oluştur</button>';
  }
  el.innerHTML=html;
}

/* ── Program seçimi ── */

function selectWorkoutProgram(id,branch){
  branch=branch||'fitness';
  var activeKey='active_workout_'+branch;
  var prog=_findProgram(id);
  if(!prog) return;
  /* Zaten aktifse geri dön */
  if(U[activeKey]===id){ renderBranchDetail(branch); return; }
  showConfirm(prog.name_tr,'Bu programı seçmek istiyor musun?',function(){
    U[activeKey]=id;
    /* fitness branşı için backward-compat */
    if(branch==='fitness') U.active_workout_fitness=id;
    saveData();
    showToast('✅ Program seçildi!');
    window._browseTab='ready';
    renderBranchDetail(branch);
  },'Seç');
}

/* ══════════════════════════════════════════════════════════
   Özel Antrenman Oluşturucu (mevcut — korunuyor)
   ══════════════════════════════════════════════════════════ */

var _cwExercises=[];

var _cwName='Benim Programım';

function getCustomWorkouts(){try{return JSON.parse(_lsGet('rf_custom_workouts')||'[]');}catch(e){return[];}}

function saveCustomWorkouts(list){_lsSet('rf_custom_workouts',JSON.stringify(list));saveToFirebase();}

function deleteCustomWorkout(id){
  showConfirm('Programı Sil','Bu özel program silinecek.',function(){
    var list=getCustomWorkouts().filter(function(w){return w.id!==id;});
    saveCustomWorkouts(list);
    BRANCH_DEFS.forEach(function(b){var k='active_workout_'+b.id;if(U[k]===id) delete U[k];});
    if(U.active_workout_fitness===id) delete U.active_workout_fitness;
    saveData(); showToast('Program silindi.'); renderWorkoutBrowse();
  },'Evet, Sil');
}

function renderCustomWorkoutBuilder(){
  var el=document.getElementById('workout-main');if(!el) return;
  var branch=window._browseBranch||'fitness';

  var html='<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">';
  html+='<button class="btn btn-s" onclick="window._browseTab=\'custom\';renderWorkoutBrowse()" style="padding:8px 12px;font-size:12px">← Geri</button>';
  html+='<div style="font-size:16px;font-weight:700">Yeni Program</div></div>';

  html+='<div class="rc" style="margin-bottom:8px"><div class="rct">📝 Program Adı</div>';
  html+='<input class="ex-search" type="text" placeholder="Örn: Benim Push Günüm" value="'+(_cwName||'')+'" oninput="_cwName=this.value" style="margin-bottom:0"></div>';

  html+='<div class="rc" style="margin-bottom:8px">';
  html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">';
  html+='<div class="rct" style="margin-bottom:0">💪 Egzersizler ('+_cwExercises.length+')</div>';
  html+='<button class="btn btn-s" onclick="window._exCat=\'all\';window._exSearch=\'\';window._cwReturnToBuilder=true;renderExerciseLibrary()" style="font-size:11px;padding:6px 10px">+ Ekle</button></div>';

  var isBranchSwim=(branch==='swimming');
  if(!_cwExercises.length){
    html+='<div style="text-align:center;padding:14px;color:var(--text2);font-size:12px;background:var(--card2);border-radius:10px">Sağ üstten egzersiz ekle</div>';
  } else {
    _cwExercises.forEach(function(e,i){
      html+='<div class="cwb-ex-card">';
      html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">';
      html+='<div style="font-size:11px;color:var(--text3);min-width:16px">'+(i+1)+'</div>';
      html+='<div style="flex:1;font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+e.name_tr+'</div>';
      html+='<button onclick="_cwMoveEx('+i+',-1)" style="background:none;border:none;color:var(--text3);font-size:14px;cursor:pointer;padding:0 3px" '+(i===0?'disabled':'')+'>↑</button>';
      html+='<button onclick="_cwMoveEx('+i+',1)" style="background:none;border:none;color:var(--text3);font-size:14px;cursor:pointer;padding:0 3px" '+(i===_cwExercises.length-1?'disabled':'')+'>↓</button>';
      html+='<button onclick="_cwRemoveEx('+i+')" style="background:none;border:1px solid var(--border);border-radius:7px;color:var(--accent);font-size:11px;cursor:pointer;padding:3px 7px">✕</button>';
      html+='</div>';
      html+='<div class="cwb-params">';
      html+='<div><div class="cwb-param-label">Set</div><input class="cwb-param-input" type="number" min="1" max="20" value="'+(e.sets||3)+'" onchange="_cwUpdate('+i+',\'sets\',this.value)"></div>';
      html+='<div><div class="cwb-param-label">'+(isBranchSwim?'Mesafe':'Tekrar')+'</div><input class="cwb-param-input" type="text" placeholder="'+(isBranchSwim?'100m':'8-12')+'" value="'+(e.reps||(isBranchSwim?'100m':'10-12'))+'" onchange="_cwUpdate('+i+',\'reps\',this.value)"></div>';
      html+='<div><div class="cwb-param-label">Dinlenme (sn)</div><input class="cwb-param-input" type="number" min="15" max="600" value="'+(e.rest_sec||(isBranchSwim?30:90))+'" onchange="_cwUpdate('+i+',\'rest_sec\',this.value)"></div>';
      html+='</div></div>';
    });
  }
  html+='</div>';
  if(_cwExercises.length) html+='<button class="btn btn-p btn-full" onclick="saveCustomWorkout()" style="margin-bottom:20px">💾 Programı Kaydet</button>';
  el.innerHTML=html;
}

function _cwUpdate(i,field,val){if(!_cwExercises[i])return;if(field==='sets'||field==='rest_sec')_cwExercises[i][field]=parseInt(val)||3;else _cwExercises[i][field]=val;}

function _cwRemoveEx(i){_cwExercises.splice(i,1);renderCustomWorkoutBuilder();}

function _cwMoveEx(i,dir){var j=i+dir;if(j<0||j>=_cwExercises.length)return;var tmp=_cwExercises[i];_cwExercises[i]=_cwExercises[j];_cwExercises[j]=tmp;renderCustomWorkoutBuilder();}

function cwToggleExercise(exId){
  var ex=_findExercise(exId);
  if(!ex||!ex.id) return;
  /* Yüzme mi fitness mi? */
  var isSwim=(EXERCISES_SWIM&&EXERCISES_SWIM.exercises.some(function(e){return e.id===exId;}));
  var idx=(_cwExercises||[]).findIndex(function(e){return e.id===exId;});
  if(idx>=0){_cwExercises.splice(idx,1);showToast('Egzersiz kaldırıldı.');}
  else{
    if(!_cwExercises)_cwExercises=[];
    var entry={id:ex.id,name_tr:ex.name_tr,sets:3,rest_sec:isSwim?30:90};
    if(isSwim){
      entry.reps=ex.distance_m?(ex.distance_m+'m'):'100m';
      entry.distance=ex.distance_m||100;
    } else {
      entry.reps='10-12';
    }
    _cwExercises.push(entry);
    showToast('✅ '+ex.name_tr+' eklendi!');
  }
  renderExerciseDetail(exId);
}

function saveCustomWorkout(){
  if(!_cwExercises||!_cwExercises.length){showToast('❌ En az 1 egzersiz ekle.','error');return;}
  var name=(_cwName||'').trim()||'Benim Programım';
  var branch=window._browseBranch||'fitness';
  var id='custom_'+Date.now();
  var prog={id:id,name_tr:name,branch:branch,_branch:branch,_isCustom:true,days_per_week:1,goal:['recomp'],difficulty:2,duration_weeks:8,description_tr:'Kendi oluşturduğum program.',
    days:[{day:1,name:'Antrenman',exercises:_cwExercises.map(function(e){return{exercise_id:e.id,sets:e.sets||3,reps:e.reps||'10-12',rest_sec:e.rest_sec||90};})}]};
  var list=getCustomWorkouts();list.push(prog);saveCustomWorkouts(list);
  _cwExercises=[];_cwName='Benim Programım';window._cwReturnToBuilder=false;
  showToast('✅ Program kaydedildi!');window._browseTab='custom';renderWorkoutBrowse();
}
