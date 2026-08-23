/* Egzersiz havuzunu açar ve geri dönüş hedefini kaydeder.
   Doğrudan inline onclick içinde tırnak kaçışıyla uğraşmak yerine
   bu fonksiyon çağrılır — okunabilir ve hataya kapalı.
     nereden: 'tools'  → Araçlar menüsüne döner
              'branch' → İlgili branş detayına döner  */
function openExerciseLibraryFrom(branchId, nereden){
  window._exCat = 'all';
  window._exSearch = '';
  window._exBranch = branchId;
  window._cwReturnToBuilder = false;
  window._exReturnTo = (nereden === 'tools')
    ? 'renderWorkoutTools()'
    : "renderBranchDetail('" + branchId + "')";
  renderExerciseLibrary();
}

/* ══════════════════════════════════════════════════════════
   RavenFit — library.js
   Egzersiz havuzu ve filtreler
   ══════════════════════════════════════════════════════════ */

/* ── Egzersiz Havuzu Ana Ekranı ──────────────────────────── */

function renderExerciseLibrary(){
  var el=document.getElementById('workout-main');
  if(!el)return;

  /* Branş state */
  var branch=window._exBranch||'fitness';
  var _curCat=window._exCat||'all';
  var _curSearch=window._exSearch||'';
  var _curStroke=window._exStroke||'all';
  var isSwim=(branch==='swimming');
  var isPosture=(branch==='posture');

  /* Veri kaynağı */
  var dataSource=_getBranchExercises(branch);
  if(!dataSource){
    var branchLabel=isSwim?'Yüzme egzersiz verileri':isPosture?'Postür egzersiz verileri':'Egzersiz verileri';
    el.innerHTML='<div class="rc"><div style="color:var(--text2);font-size:12px;text-align:center;padding:20px 0">'+branchLabel+' yükleniyor...<br>İnterneti kontrol et.</div></div>';
    return;
  }
  var exercises=dataSource.exercises||[];

  /* Fitness için: yeni filtre sistemi (ekipman çoklu + tek kas kategorisi) */
  var _fitMuscleCat = window._exMuscleCat || null;  /* tek kas kategorisi: chest, back, vb. */
  var _fitEquips    = window._exEquips || [];        /* çoklu ekipman seçimi */

  /* Filtrele */
  var filtered=exercises.filter(function(e){
    /* Kategori filtresi (yüzme/postür için klasik chip) */
    var matchCat=true;
    if(_curCat!=='all'){
      if(isSwim){
        var grp=SWIM_CATEGORY_GROUPS.find(function(g){return g.id===_curCat;});
        if(grp&&grp.match){
          matchCat=grp.match.indexOf(e.category)>=0;
        } else {
          matchCat=e.category===_curCat;
        }
      } else if(isPosture){
        matchCat=e.category===_curCat;
      }
      /* Fitness için _curCat artık kullanılmıyor — _fitMuscleCat var */
    }
    /* Stil filtresi (sadece yüzme) */
    var matchStroke=true;
    if(isSwim&&_curStroke!=='all'){
      matchStroke=(e.stroke===_curStroke)||(e.stroke==='general'&&_curStroke==='general');
    }
    /* Arama */
    var matchSearch=!_curSearch||
      (e.name_tr||'').toLowerCase().indexOf(_curSearch.toLowerCase())>=0||
      (e.name_en||'').toLowerCase().indexOf(_curSearch.toLowerCase())>=0;

    /* Fitness: ekipman filtresi (çoklu, OR — egzersizdeki ekipmanların en az biri seçili olmalı) */
    var matchEquip=true;
    if(!isSwim && !isPosture && _fitEquips.length){
      var exEq = e.equipment || [];
      /* Egzersiz seçilen ekipmanlardan en az birini içermeli */
      matchEquip = exEq.some(function(eq){return _fitEquips.indexOf(eq)>=0;});
    }

    /* Fitness: kas kategorisi filtresi (tek seçim) */
    var matchMuscle=true;
    if(!isSwim && !isPosture && _fitMuscleCat){
      var keys = (typeof MUSCLE_CATEGORY_MAP!=='undefined') ? (MUSCLE_CATEGORY_MAP[_fitMuscleCat]||[]) : [];
      var exM = e.muscles||{};
      /* Egzersizde bu kategoriye ait kaslardan en az biri varsa eşleşir */
      matchMuscle = keys.some(function(k){return exM[k]!==undefined && exM[k]>0;});
    }

    return matchCat && matchStroke && matchSearch && matchEquip && matchMuscle;
  });

  /* Fitness + kas kategorisi seçilmişse → o kategorinin maksimum puanına göre sırala (yüksekten düşüğe) */
  if(!isSwim && !isPosture && _fitMuscleCat){
    var muscleKeys = (typeof MUSCLE_CATEGORY_MAP!=='undefined') ? (MUSCLE_CATEGORY_MAP[_fitMuscleCat]||[]) : [];
    filtered.sort(function(a,b){
      var aM = a.muscles||{}, bM = b.muscles||{};
      var aMax = 0, bMax = 0;
      muscleKeys.forEach(function(k){
        if(aM[k]>aMax) aMax = aM[k];
        if(bM[k]>bMax) bMax = bM[k];
      });
      return bMax - aMax;
    });
  }

  /* Geri butonu — nereden gelindiyse oraya döner.
     window._exReturnTo, havuzu açan ekran tarafından set edilir. */
  var backFn = window._cwReturnToBuilder
    ? 'renderCustomWorkoutBuilder()'
    : (window._exReturnTo || 'renderWorkoutHome()');

  var html='<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">';
  html+='<button class="btn btn-s" onclick="'+backFn+'" style="padding:8px 12px;font-size:12px;flex-shrink:0">← Geri</button>';
  html+='<div style="font-size:16px;font-weight:700">Egzersiz Havuzu</div>';
  html+='</div>';

  /* ── Branş sekmeleri (sadece aktif branşlar) ── */
  var allBranchDefs={fitness:{label:'🏋️ Fitness'},swimming:{label:'🏊 Yüzme'},posture:{label:'🧘 Postür'}};
  var activeBranches=getUserBranches().filter(function(b){return allBranchDefs[b];});
  /* Eğer sadece 1 branş aktifse sekme gösterme */
  if(activeBranches.length>1){
    html+='<div style="display:flex;background:var(--card2);border-radius:9px;padding:3px;margin-bottom:10px;border:1px solid var(--border)">';
    activeBranches.forEach(function(bId){
      var isSel=(branch===bId);
      var lbl=allBranchDefs[bId]?allBranchDefs[bId].label:bId;
      html+='<button style="flex:1;padding:7px 4px;border:none;border-radius:6px;font-family:\'Outfit\',sans-serif;font-size:11px;font-weight:600;cursor:pointer;background:'+(isSel?'var(--card)':'transparent')+';color:'+(isSel?'var(--text)':'var(--text2)')+'" onclick="window._exBranch=\''+bId+'\';window._exCat=\'all\';window._exStroke=\'all\';renderExerciseLibrary()">'+lbl+'</button>';
    });
    html+='</div>';
  }

  /* Arama + Filtre butonu (fitness için) */
  if(!isSwim && !isPosture){
    var activeCount = (_fitMuscleCat?1:0) + _fitEquips.length;
    html+='<div style="display:flex;gap:8px;margin-bottom:10px">';
    html+='<input class="ex-search" type="text" placeholder="🔍 Egzersiz ara..." value="'+_curSearch+'" oninput="window._exSearch=this.value;window._exSearchCursor=this.selectionStart;window._exSearchFocused=true;renderExerciseLibrary()" onfocus="window._exSearchFocused=true" onblur="window._exSearchFocused=false" style="margin-bottom:0;flex:1">';
    html+='<button class="ex-filter-btn'+(activeCount?' has-active':'')+'" onclick="openExFilter()">';
    html+='🎛 Filtre';
    if(activeCount) html+='<span class="badge">'+activeCount+'</span>';
    html+='</button>';
    html+='</div>';

    /* Aktif filtre chip'leri */
    if(activeCount){
      html+='<div class="ex-active-chips">';
      if(_fitMuscleCat){
        var catLbl = (typeof MUSCLE_CATEGORY_LABELS!=='undefined' && MUSCLE_CATEGORY_LABELS[_fitMuscleCat]) ? MUSCLE_CATEGORY_LABELS[_fitMuscleCat] : _fitMuscleCat;
        html+='<span class="ex-active-chip" onclick="_removeExFilter(\'muscle\')">💪 '+catLbl+'<span class="x">✕</span></span>';
      }
      _fitEquips.forEach(function(eq){
        var lbl = EQUIPMENT_TR[eq] || eq;
        html+='<span class="ex-active-chip" onclick="_removeExFilter(\'eq\',\''+eq+'\')">'+lbl+'<span class="x">✕</span></span>';
      });
      html+='<button class="ex-clear-all" onclick="clearExFilters()">Hepsini temizle</button>';
      html+='</div>';
    }
  } else {
    /* Yüzme/Postür için klasik arama */
    html+='<input class="ex-search" type="text" placeholder="🔍 Egzersiz ara..." value="'+_curSearch+'" oninput="window._exSearch=this.value;window._exSearchCursor=this.selectionStart;window._exSearchFocused=true;renderExerciseLibrary()" onfocus="window._exSearchFocused=true" onblur="window._exSearchFocused=false">';
  }

  /* ── Kategori filtreleri (sadece yüzme/postür için chip) ── */
  if(isSwim){
    html+='<div class="ex-filter-row">';
    SWIM_CATEGORY_GROUPS.forEach(function(g){
      html+='<div class="ex-chip'+(_curCat===g.id?' sel':'')+'" onclick="window._exCat=\''+g.id+'\';renderExerciseLibrary()">'+g.label+'</div>';
    });
    html+='</div>';
  } else if(isPosture){
    html+='<div class="ex-filter-row">';
    POSTURE_CATEGORY_GROUPS.forEach(function(g){
      html+='<div class="ex-chip'+(_curCat===g.id?' sel':'')+'" onclick="window._exCat=\''+g.id+'\';renderExerciseLibrary()">'+g.label+'</div>';
    });
    html+='</div>';
  }

  /* ── Stil filtresi (yüzme) ── */
  if(isSwim){
    html+='<div class="ex-filter-row" style="margin-top:-4px">';
    SWIM_STROKE_FILTERS.forEach(function(sf){
      html+='<div class="ex-chip'+(_curStroke===sf.id?' sel':'')+'" onclick="window._exStroke=\''+sf.id+'\';renderExerciseLibrary()">'+sf.label+'</div>';
    });
    html+='</div>';
  }

  /* ── Egzersiz listesi ── */
  html+='<div class="rc" style="padding:4px 0">';
  if(!filtered.length){
    html+='<div style="text-align:center;padding:20px 0;color:var(--text2);font-size:13px">Sonuç bulunamadı 🤷</div>';
  } else {
    filtered.forEach(function(e){
      var metaLine='';
      if(isSwim){
        /* Yüzme: stil + mesafe + kategori */
        var parts=[];
        if(e.stroke) parts.push(STROKE_TR[e.stroke]||e.stroke);
        if(e.distance_m) parts.push(e.distance_m+'m');
        parts.push(CATEGORY_TR[e.category]||e.category);
        metaLine=parts.join(' · ');
      } else if(isPosture){
        /* Postür: süre + set + kategori */
        var pparts=[];
        if(e.duration_sec) pparts.push(e.duration_sec+'sn');
        if(e.sets&&e.reps) pparts.push(e.sets+'×'+e.reps);
        if(e.pain_safe) pparts.push('✅ Güvenli');
        pparts.push(CATEGORY_TR[e.category]||e.category);
        metaLine=pparts.join(' · ');
      } else {
        /* Fitness: ekipman + kas + zorluk */
        var topMuscle=e.muscles?Object.keys(e.muscles).reduce(function(a,b){return e.muscles[a]>e.muscles[b]?a:b},''):'';
        var equip=e.equipment&&e.equipment.length?e.equipment.slice(0,2).map(function(eq){return EQUIPMENT_TR[eq]||eq;}).join(', '):'Vücut Ağırlığı';
        var diffLabel=['','●','●●','●●●'][e.difficulty||1];
        metaLine=equip+' · '+(MUSCLE_TR[topMuscle]||topMuscle)+' · '+diffLabel;
      }

      html+='<div class="ex-item" onclick="renderExerciseDetail(\''+e.id+'\')">';
      html+='<div class="ex-item-ico">'+(CATEGORY_EMOJI[e.category]||(isSwim?'🏊':'💪'))+'</div>';
      html+='<div class="ex-item-body">';
      html+='<div class="ex-item-name">'+e.name_tr+'</div>';
      html+='<div class="ex-item-meta">'+metaLine+'</div>';
      html+='</div>';
      html+='<div class="ex-item-arrow">›</div>';
      html+='</div>';
    });
  }
  html+='</div>';

  /* Sayaç */
  html+='<div style="text-align:center;font-size:10px;color:var(--text3);margin-top:6px">'+filtered.length+' / '+exercises.length+' egzersiz gösteriliyor</div>';

  el.innerHTML=html;
  var inp=el.querySelector('.ex-search');
  if(inp){
    /* Focus + cursor pozisyonunu koru — yazmaya devam edebilsin */
    if(window._exSearchFocused){
      inp.focus();
      try {
        var pos = (window._exSearchCursor != null) ? window._exSearchCursor : inp.value.length;
        inp.setSelectionRange(pos, pos);
      } catch(e){}
    } else if(_curSearch){
      try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch(e){}
    }
  }
}

/* ──────────────────────────────────────────────────────────
   🎛 EGZERSİZ FİLTRE SHEET FONKSİYONLARI
   ────────────────────────────────────────────────────────── */

/* Geçici state: sheet kapanırken yapılan değişiklikler buradan ana state'e taşınır */

var _exFilterDraft = { muscle:null, equips:[] };

function openExFilter(){
  /* Mevcut state'i geçici drafta kopyala */
  _exFilterDraft.muscle = window._exMuscleCat || null;
  _exFilterDraft.equips = (window._exEquips||[]).slice();
  _renderExFilterContent();
  document.getElementById('ex-filter-bg').classList.add('open');
  document.getElementById('ex-filter-sheet').classList.add('open');
  document.body.style.overflow='hidden';
}

function closeExFilter(){
  document.getElementById('ex-filter-bg').classList.remove('open');
  document.getElementById('ex-filter-sheet').classList.remove('open');
  document.body.style.overflow='';
}

function applyExFilters(){
  /* Drafttan ana state'e yaz */
  window._exMuscleCat = _exFilterDraft.muscle;
  window._exEquips    = _exFilterDraft.equips.slice();
  closeExFilter();
  renderExerciseLibrary();
}

function clearExFilters(){
  _exFilterDraft.muscle = null;
  _exFilterDraft.equips = [];
  window._exMuscleCat = null;
  window._exEquips = [];
  /* Eğer sheet açıksa yenile, değilse direkt liste yenile */
  var sheet=document.getElementById('ex-filter-sheet');
  if(sheet && sheet.classList.contains('open')){
    _renderExFilterContent();
  } else {
    renderExerciseLibrary();
  }
}

function _removeExFilter(kind, value){
  if(kind==='muscle'){
    window._exMuscleCat = null;
  } else if(kind==='eq'){
    var arr = window._exEquips||[];
    var i = arr.indexOf(value);
    if(i>=0) arr.splice(i,1);
    window._exEquips = arr;
  }
  renderExerciseLibrary();
}

/* Drafttaki seçimi toggle et */

function _toggleExFilterMuscle(catId){
  if(_exFilterDraft.muscle === catId){
    _exFilterDraft.muscle = null;
  } else {
    _exFilterDraft.muscle = catId;
  }
  _renderExFilterContent();
}

function _toggleExFilterEquip(eqId){
  var arr = _exFilterDraft.equips;
  var i = arr.indexOf(eqId);
  if(i>=0) arr.splice(i,1);
  else arr.push(eqId);
  _renderExFilterContent();
}

function _renderExFilterContent(){
  var el = document.getElementById('ex-filter-content');
  if(!el) return;
  var html = '';

  /* ─ Hedef Kas (tek seçim) ─ */
  html+='<div class="ex-filter-section">';
  html+='<div class="ex-filter-section-title">💪 Hedef Kas Grubu (Tek Seçim)</div>';
  html+='<div class="ex-filter-grid">';
  var catList = [
    {id:'chest',     label:'Chest',     icon:'💪'},
    {id:'back',      label:'Back',      icon:'🦅'},
    {id:'shoulders', label:'Shoulders', icon:'🏋️'},
    {id:'arms',      label:'Arms',      icon:'💪'},
    {id:'legs',      label:'Legs',      icon:'🦵'},
    {id:'glutes',    label:'Glutes',    icon:'🍑'},
    {id:'core',      label:'Core',      icon:'⚡'},
    {id:'full-body', label:'Full Body', icon:'🔥'}
  ];
  catList.forEach(function(c){
    var sel = _exFilterDraft.muscle === c.id;
    html+='<div class="ex-filter-opt'+(sel?' sel':'')+'" onclick="_toggleExFilterMuscle(\''+c.id+'\')">';
    html+='<span class="ico">'+c.icon+'</span>';
    html+='<span>'+c.label+'</span>';
    if(sel) html+='<span class="check">✓</span>';
    html+='</div>';
  });
  html+='</div>';
  html+='<div style="font-size:10px;color:var(--text3);margin-top:8px;font-style:italic">Bir kas grubu seçtiğinde, egzersizler o gruba olan etki puanına göre sıralanır.</div>';
  html+='</div>';

  /* ─ Ekipman (çoklu seçim) ─ */
  html+='<div class="ex-filter-section">';
  html+='<div class="ex-filter-section-title">🏋️ Ekipman (Çoklu Seçim)</div>';
  html+='<div class="ex-filter-grid">';
  EQUIPMENT_FILTER_LIST.forEach(function(eq){
    var sel = _exFilterDraft.equips.indexOf(eq.id)>=0;
    html+='<div class="ex-filter-opt'+(sel?' sel':'')+'" onclick="_toggleExFilterEquip(\''+eq.id+'\')">';
    html+='<span class="ico">'+eq.icon+'</span>';
    html+='<span style="flex:1">'+eq.label+'</span>';
    if(sel) html+='<span class="check">✓</span>';
    html+='</div>';
  });
  html+='</div>';
  html+='</div>';

  el.innerHTML = html;
}

function renderExerciseDetail(exId){
  var el=document.getElementById('workout-main');
  if(!el)return;
  var ex=_findExercise(exId);
  if(!ex||!ex.id)return;

  /* Bu yüzme veya postür egzersizi mi? */
  var isSwim=false;
  var isPosture=false;
  if(EXERCISES_SWIM&&EXERCISES_SWIM.exercises.some(function(e){return e.id===exId;})) isSwim=true;
  if(EXERCISES_POST&&EXERCISES_POST.exercises.some(function(e){return e.id===exId;})) isPosture=true;

  var html='<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">'+
    '<button class="btn btn-s" onclick="renderExerciseLibrary()" style="padding:8px 12px;font-size:12px;flex-shrink:0">← Geri</button>'+
    '<div style="font-size:16px;font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+ex.name_tr+'</div>'+
  '</div>';

  /* Gif / placeholder */
  if(ex.gif){
    html+='<div style="text-align:center;margin-bottom:14px"><img src="'+ex.gif+'" style="width:100%;max-width:340px;border-radius:14px;border:1px solid var(--border)"></div>';
  } else {
    html+='<div style="background:var(--card2);border:1px solid var(--border);border-radius:14px;padding:32px;text-align:center;margin-bottom:14px;color:var(--text3);font-size:13px">'+
      (isSwim?'🏊 Hareket animasyonu yakında':isPosture?'🧘 Hareket animasyonu yakında':'📹 Hareket videosu yakında eklenecek')+'</div>';
  }

  /* Meta badges */
  html+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">';
  html+='<span class="badge bb">'+(CATEGORY_TR[ex.category]||ex.category)+'</span>';
  html+='<span class="badge '+(ex.difficulty===1?'bg':ex.difficulty===2?'by':'br')+'">'+ ['','Başlangıç','Orta','İleri'][ex.difficulty||1]+'</span>';
  if(!isSwim&&ex.is_compound) html+='<span class="badge by">Bileşik</span>';
  if(isSwim&&ex.stroke) html+='<span class="badge bb">'+(STROKE_TR[ex.stroke]||ex.stroke)+'</span>';
  html+='</div>';

  /* ── Yüzme spesifik bilgiler ── */
  if(isSwim){
    var swimInfo=[];
    if(ex.distance_m) swimInfo.push({icon:'📏',label:'Mesafe',val:ex.distance_m+' m'});
    if(ex.duration_min) swimInfo.push({icon:'⏱',label:'Süre',val:ex.duration_min+' dk'});
    if(ex.stroke) swimInfo.push({icon:'🏊',label:'Stil',val:STROKE_TR[ex.stroke]||ex.stroke});
    if(ex.intensity) swimInfo.push({icon:'🔥',label:'Yoğunluk',val:ex.intensity==='high'?'Yüksek':ex.intensity==='moderate'?'Orta':'Düşük'});

    if(swimInfo.length){
      html+='<div class="rc" style="margin-bottom:8px">';
      html+='<div class="rct">🏊 Antrenman Bilgileri</div>';
      html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
      swimInfo.forEach(function(info){
        html+='<div style="background:var(--card2);border-radius:9px;padding:10px;text-align:center">';
        html+='<div style="font-size:16px;margin-bottom:2px">'+info.icon+'</div>';
        html+='<div style="font-size:14px;font-weight:700;color:var(--accent)">'+info.val+'</div>';
        html+='<div style="font-size:9px;color:var(--text2);text-transform:uppercase;letter-spacing:.5px">'+info.label+'</div>';
        html+='</div>';
      });
      html+='</div></div>';
    }
  }

  /* ── Postür spesifik bilgiler ── */
  if(isPosture){
    var postInfo=[];
    if(ex.duration_sec) postInfo.push({icon:'⏱',label:'Süre',val:ex.duration_sec+' sn'});
    if(ex.sets&&ex.reps) postInfo.push({icon:'🔄',label:'Set × Tekrar',val:ex.sets+'×'+ex.reps});
    if(ex.rest_sec) postInfo.push({icon:'💤',label:'Dinlenme',val:ex.rest_sec+' sn'});
    if(ex.pain_safe) postInfo.push({icon:'✅',label:'Ağrıda Güvenli',val:'Evet'});

    if(postInfo.length){
      html+='<div class="rc" style="margin-bottom:8px">';
      html+='<div class="rct">🧘 Egzersiz Bilgileri</div>';
      html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
      postInfo.forEach(function(info){
        html+='<div style="background:var(--card2);border-radius:9px;padding:10px;text-align:center">';
        html+='<div style="font-size:16px;margin-bottom:2px">'+info.icon+'</div>';
        html+='<div style="font-size:14px;font-weight:700;color:var(--accent)">'+info.val+'</div>';
        html+='<div style="font-size:9px;color:var(--text2);text-transform:uppercase;letter-spacing:.5px">'+info.label+'</div>';
        html+='</div>';
      });
      html+='</div></div>';
    }
    /* Dikkat notu */
    if(ex.caution_tr){
      html+='<div style="background:color-mix(in srgb, var(--warn) 8%, transparent);border:1px solid color-mix(in srgb, var(--warn) 30%, transparent);border-radius:11px;padding:10px 14px;margin-bottom:8px">'+
        '<div style="font-size:12px;color:var(--warn);font-weight:700;margin-bottom:3px">⚠️ Dikkat</div>'+
        '<div style="font-size:11px;color:var(--text2);line-height:1.5">'+ex.caution_tr+'</div></div>';
    }
    /* Hedeflenen durumlar */
    if(ex.condition_target&&ex.condition_target.length){
      html+='<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px">';
      ex.condition_target.forEach(function(ct){
        html+='<span class="badge bb" style="font-size:10px">🎯 '+(CATEGORY_TR[ct]||ct)+'</span>';
      });
      html+='</div>';
    }
  }

  /* Ekipman */
  if(ex.equipment&&ex.equipment.length){
    html+='<div class="rc" style="margin-bottom:8px">';
    html+='<div class="rct">'+(isSwim?'🎒 Ekipman':'🔧 Gerekli Ekipman')+'</div>';
    html+='<div style="display:flex;gap:6px;flex-wrap:wrap">'+ex.equipment.map(function(eq){return '<span class="badge bb">'+(EQUIPMENT_TR[eq]||eq)+'</span>';}).join('')+'</div>';
    html+='</div>';
  }

  /* Kaslar (fitness veya yüzme — yüzmede de muscles varsa göster) */
  if(ex.muscles&&Object.keys(ex.muscles).length){
    html+='<div class="rc" style="margin-bottom:8px">';
    html+='<div class="rct">💪 Çalışan Kaslar</div>';
    /* Çalışan kaslar — renk kodlu liste (primary/secondary/tertiary) */
    var muscles=Object.entries(ex.muscles).sort(function(a,b){return b[1]-a[1];});
    var primary=muscles.filter(function(m){return m[1]>=8;});
    var secondary=muscles.filter(function(m){return m[1]>=5&&m[1]<8;});
    var tertiary=muscles.filter(function(m){return m[1]<5;});

    var renderGroup=function(label,col,bg,arr){
      if(!arr.length) return '';
      var h='<div style="margin-bottom:10px">';
      h+='<div style="font-size:9px;font-weight:700;color:'+col+';letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px">'+label+'</div>';
      arr.forEach(function(m){
        var pct=m[1]*10;
        h+='<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:'+bg+';border-left:3px solid '+col+';border-radius:8px;margin-bottom:5px">';
        h+='<div style="flex:1;font-size:13px;color:var(--text);font-weight:600">'+(MUSCLE_TR[m[0]]||m[0])+'</div>';
        h+='<div style="flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;max-width:120px"><div style="height:100%;background:'+col+';width:'+pct+'%;border-radius:3px"></div></div>';
        h+='<div style="font-size:11px;font-weight:700;color:'+col+';min-width:28px;text-align:right">'+m[1]+'/10</div>';
        h+='</div>';
      });
      h+='</div>';
      return h;
    };

    html+=renderGroup('Birincil (Primary)',  'var(--accent)', 'color-mix(in srgb, var(--accent) 8%, transparent)',  primary);
    html+=renderGroup('İkincil (Secondary)', 'var(--warn)', 'color-mix(in srgb, var(--warn) 8%, transparent)', secondary);
    html+=renderGroup('Destekleyici',        'var(--text3)', 'rgba(255,255,255,.03)', tertiary);

    html+='</div>';
  }

  /* Nasıl yapılır */
  if(ex.instructions_tr&&ex.instructions_tr.length){
    html+='<div class="rc" style="margin-bottom:8px">';
    html+='<div class="rct">📋 Nasıl Yapılır</div>';
    ex.instructions_tr.forEach(function(step,i){
      html+='<div style="display:flex;gap:8px;margin-bottom:7px;font-size:12px;color:var(--text)">'+
        '<div style="background:var(--accent);color:var(--on-accent);border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;margin-top:1px">'+(i+1)+'</div>'+
        '<div>'+step+'</div></div>';
    });
    html+='</div>';
  }

  /* İpuçları */
  if(ex.tips_tr&&ex.tips_tr.length){
    html+='<div class="rc" style="margin-bottom:8px">';
    html+='<div class="rct">💡 İpuçları</div>';
    ex.tips_tr.forEach(function(t){html+='<div style="font-size:12px;color:var(--text2);margin-bottom:5px">✓ '+t+'</div>';});
    html+='</div>';
  }

  /* Yaygın hatalar */
  if(ex.common_mistakes_tr&&ex.common_mistakes_tr.length){
    html+='<div class="rc" style="margin-bottom:8px">';
    html+='<div class="rct">⚠️ Yaygın Hatalar</div>';
    ex.common_mistakes_tr.forEach(function(m){html+='<div style="font-size:12px;color:var(--warn);margin-bottom:5px">✗ '+m+'</div>';});
    html+='</div>';
  }

  /* Özel durum uyarıları — yeni detaylı format + eski array fallback */
  var userConds=U.conditions||[];
  if(ex.contraindications && userConds.length){
    var contras=ex.contraindications;
    var matches=[]; /* {condId, severity, reason, alternative, condLabel} */

    /* Yeni format: obje { condId: {severity, reason, alternative} } */
    if(typeof contras === 'object' && !Array.isArray(contras)){
      Object.keys(contras).forEach(function(condId){
        if(userConds.indexOf(condId)>=0){
          var d=contras[condId]||{};
          matches.push({
            condId: condId,
            severity: d.severity||'medium',
            reason: d.reason||'Bu durum için bu egzersiz risk taşıyabilir.',
            alternative: d.alternative||null,
            condLabel: _condLabelTr(condId)
          });
        }
      });
    } else if(Array.isArray(contras)){
      /* Eski format: ["shoulder-injury", "cardiovascular"] */
      contras.forEach(function(condId){
        if(userConds.indexOf(condId)>=0){
          matches.push({
            condId: condId,
            severity: 'medium',
            reason: 'Bu egzersiz beyan ettiğin bu durumla çakışıyor.',
            alternative: null,
            condLabel: _condLabelTr(condId)
          });
        }
      });
    }

    if(matches.length){
      /* En yüksek severity'ye göre ana renk */
      var sevOrder={low:1, medium:2, high:3};
      var maxSev='low';
      matches.forEach(function(m){ if(sevOrder[m.severity]>sevOrder[maxSev]) maxSev=m.severity; });
      var sevColors={
        low:    {bg:'color-mix(in srgb, var(--info) 8%, transparent)',  border:'var(--info)', text:'var(--info)', label:'Dikkat'},
        medium: {bg:'color-mix(in srgb, var(--warn) 8%, transparent)',  border:'var(--warn)', text:'var(--warn)', label:'Uyarı'},
        high:   {bg:'color-mix(in srgb, var(--accent) 12%, transparent)',   border:'var(--accent)', text:'var(--accent)', label:'Yüksek Risk'}
      };
      var sevIcons={low:'ℹ️', medium:'⚠️', high:'🚨'};
      var mainCol=sevColors[maxSev];

      html+='<div style="background:'+mainCol.bg+';border:1.5px solid '+mainCol.border+';border-radius:12px;padding:14px;margin-bottom:10px">';
      html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">';
      html+='<div style="font-size:22px">'+sevIcons[maxSev]+'</div>';
      html+='<div>';
      html+='<div style="font-size:13px;font-weight:700;color:'+mainCol.text+'">'+mainCol.label+' — Beyan Ettiğin Durum'+(matches.length>1?'lar':'')+'</div>';
      html+='<div style="font-size:10px;color:var(--text2);margin-top:1px">Bu egzersiz '+matches.length+' özel durumunla çakışıyor</div>';
      html+='</div></div>';

      /* Her bir condition için detay kartı */
      matches.forEach(function(m){
        var c=sevColors[m.severity];
        var sevBadgeText={low:'Düşük', medium:'Orta', high:'Yüksek'}[m.severity];
        html+='<div style="background:var(--card);border:1px solid '+c.border+'33;border-left:3px solid '+c.border+';border-radius:8px;padding:10px 12px;margin-bottom:8px">';
        /* Başlık + severity badge */
        html+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap">';
        html+='<span style="font-size:13px;font-weight:700;color:var(--text)">'+m.condLabel+'</span>';
        html+='<span style="font-size:9px;font-weight:700;color:#fff;background:'+c.border+';padding:2px 6px;border-radius:4px;letter-spacing:.3px">'+sevBadgeText.toUpperCase()+' RİSK</span>';
        html+='</div>';
        /* Sebep */
        html+='<div style="font-size:11px;color:var(--text2);line-height:1.5;margin-bottom:6px"><strong style="color:var(--text)">Neden riskli?</strong> '+m.reason+'</div>';
        /* Alternatif */
        if(m.alternative){
          html+='<div style="font-size:11px;color:var(--text2);line-height:1.5;padding:6px 8px;background:color-mix(in srgb, var(--success) 6%, transparent);border-radius:6px;border-left:2px solid var(--success)">';
          html+='<strong style="color:var(--success)">💡 Alternatif:</strong> '+m.alternative;
          html+='</div>';
        }
        html+='</div>';
      });

      /* Genel uyarı altı */
      html+='<div style="font-size:10px;color:var(--text3);font-style:italic;margin-top:6px;text-align:center">Bu uygulama tıbbi tavsiye yerine geçmez. Şüpheniz varsa doktorunuza danışın.</div>';
      html+='</div>';
    }
  }

  /* Antrenman oluşturucuya ekle butonu */
  var inBuilder=(_cwExercises||[]).some(function(e){return e.id===ex.id;});
  html+='<div style="padding-bottom:20px">';
  html+='<button class="btn '+(inBuilder?'btn-s':'btn-p')+' btn-full" onclick="cwToggleExercise(\''+ex.id+'\')">'+
    (inBuilder?'✓ Antrenmanımda Var — Kaldır':'➕ Antrenmanıma Ekle')+'</button>';
  html+='</div>';

  el.innerHTML=html;
}
