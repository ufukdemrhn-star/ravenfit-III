/* ══════════════════════════════════════════════════════════
   RavenFit — goals.js
   Hedef seçimi, kapılar ve hızlı düzenleme
   ══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   🎯 ÖNERİ ALGORİTMASI — HİBRİT DECISION TREE
   
   3 Faktör:
   1. Yağ Oranı (R.bf) — Navy formülü
   2. Antrenman Geçmişi (U.training_age) — Wizard'da sorulur
   3. FFMI (R.ffmi) — Yağsız Kütle İndeksi
   
   Çıktı: { primary: 'cut|recomp|maintain|bulk',
            alternative: '...' or null,
            reason: 'Türkçe açıklama',
            gates: { cut:'safe|risky', bulk:'safe|risky' } }
   ══════════════════════════════════════════════════════════ */

/* HARD GATE - SOFT: Seçeneği kapatmaz, sadece "risky" işaretler */

function _calcGoalGates(){
  var bf=R.bf||20, male=U.gender==='male';
  var gates={cut:'safe', bulk:'safe', recomp:'safe', maintain:'safe'};
  /* Bulk gate: BF çok yüksekse riskli */
  if(male && bf>25) gates.bulk='risky';
  else if(!male && bf>32) gates.bulk='risky';
  /* Cut gate: BF çok düşükse riskli */
  if(male && bf<8) gates.cut='risky';
  else if(!male && bf<16) gates.cut='risky';
  return gates;
}

/* Gate uyarı mesajları */

function _gateWarning(goal){
  var bf=R.bf||0, male=U.gender==='male';
  if(goal==='bulk'){
    var limit=male?'%25':'%32';
    return '⚠️ Yağ oranın <strong>%'+bf.toFixed(1)+'</strong> ve bu seviyede bulk dönemi sağlıksız yağ kazanımına yol açabilir. '+limit+' altında olduğunda bulk daha güvenli. Yine de devam edebilirsin ama önce <strong>recomp</strong> ile yağ oranını düşürmeni öneriyoruz.';
  }
  if(goal==='cut'){
    var limit2=male?'%8':'%16';
    return '⚠️ Yağ oranın <strong>%'+bf.toFixed(1)+'</strong> — bu seviye zaten çok düşük. Cut yapmak hormon dengesini bozabilir, performansı düşürebilir. '+limit2+' üzerinde olduğunda cut güvenlidir. <strong>Maintain</strong> veya <strong>bulk</strong> seçeneklerini düşünebilirsin.';
  }
  return null;
}

/* Training age — wizard'dan veya log sayısından */

function _getTrainingAge(){
  /* Önce wizard cevabını kontrol et */
  if(U.training_age){
    if(U.training_age==='none') return 'beginner';
    if(U.training_age==='lt1') return 'beginner';
    if(U.training_age==='1to3') return 'intermediate';
    if(U.training_age==='gt3') return 'advanced';
  }
  /* Fallback: log sayısına bak */
  return getUserLevel();
}

/* FFMI bandı */

function _ffmiBand(ffmi, male){
  if(male){
    if(ffmi<18) return 'low';     /* az kas */
    if(ffmi<22) return 'mid';     /* ortalama */
    return 'high';                 /* iyi gelişmiş */
  } else {
    if(ffmi<15) return 'low';
    if(ffmi<18) return 'mid';
    return 'high';
  }
}

/* Önerilen hedef — Hibrit decision tree */

function recGoal(){
  var r=recGoalDetailed();
  return r.primary;
}

function recGoalDetailed(){
  var bf=R.bf||20, male=U.gender==='male', ffmi=R.ffmi||20;
  var trainingAge=_getTrainingAge();
  var ffmiB=_ffmiBand(ffmi, male);

  /* BF bandı */
  var bfBand;
  if(male){
    if(bf>25) bfBand='very_high';
    else if(bf>=18) bfBand='high';
    else if(bf>=12) bfBand='mid';
    else if(bf>=8) bfBand='low';
    else bfBand='very_low';
  } else {
    if(bf>32) bfBand='very_high';
    else if(bf>=26) bfBand='high';
    else if(bf>=20) bfBand='mid';
    else if(bf>=16) bfBand='low';
    else bfBand='very_low';
  }

  var primary, alternative=null, reason='';

  /* ── DECISION TREE ── */
  if(bfBand==='very_high'){
    /* Çok yüksek yağ → her durumda cut */
    primary='cut';
    alternative=(trainingAge==='beginner')?'recomp':null;
    reason='Yağ oranın yüksek (%'+bf.toFixed(1)+'), sağlıklı bir aralığa inmek için kalori açığı en mantıklı yol.';
    if(trainingAge==='beginner'){
      reason+=' Yeni başlayan olduğun için recomp da iyi bir seçenek.';
    }
  }
  else if(bfBand==='high'){
    /* Yüksek yağ */
    if(trainingAge==='beginner'){
      primary='recomp';
      alternative='cut';
      reason='Yağ oranın yüksek (%'+bf.toFixed(1)+') ama yeni başlayansın — recomp ile aynı anda yağ kaybedip kas kazanabilirsin (newbie gains).';
    } else {
      primary='cut';
      alternative='recomp';
      reason='Yağ oranın orta-yüksek (%'+bf.toFixed(1)+'). Antrenman geçmişin var, cut ile odaklanmış yağ kaybı en verimli yol.';
    }
  }
  else if(bfBand==='mid'){
    /* Orta yağ */
    if(trainingAge==='beginner'){
      primary='recomp';
      alternative='maintain';
      reason='Yağ oranın orta seviyede (%'+bf.toFixed(1)+'). Yeni başlayan olduğun için recomp en verimli — kas kazanmaya hazırsın.';
    } else if(ffmiB==='low'){
      primary='maintain';
      alternative='recomp';
      reason='Yağ oranın iyi (%'+bf.toFixed(1)+') ama kas kütlen düşük (FFMI '+ffmi.toFixed(1)+'). Önce temel kasları oluşturmak için maintain.';
    } else {
      primary='maintain';
      alternative='bulk';
      reason='Yağ oranın orta (%'+bf.toFixed(1)+'), kas kütlen iyi. Formunu koruyabilir veya hafif bulk yapabilirsin.';
    }
  }
  else if(bfBand==='low'){
    /* Düşük yağ */
    if(trainingAge==='beginner'){
      primary='maintain';
      alternative='bulk';
      reason='Yağ oranın düşük (%'+bf.toFixed(1)+'), kas kütlen büyümeye hazır. Önce maintain ile alışkanlık kur, sonra bulk düşünebilirsin.';
    } else {
      primary='bulk';
      alternative=ffmiB==='high'?'maintain':'recomp';
      reason='Yağ oranın düşük (%'+bf.toFixed(1)+') ve antrenman geçmişin var — kas kazanmaya hazırsın.';
      if(ffmiB==='high'){
        reason+=' Kas kütlen zaten iyi seviyede, maintain de iyi bir alternatif.';
      }
    }
  }
  else { /* very_low */
    primary='bulk';
    alternative='maintain';
    reason='Yağ oranın çok düşük (%'+bf.toFixed(1)+'). Sağlığın için kalori fazlasıyla beslenmen önemli.';
  }

  return {
    primary: primary,
    alternative: alternative,
    reason: reason,
    gates: _calcGoalGates(),
    factors: {
      bf: bf,
      bfBand: bfBand,
      trainingAge: trainingAge,
      ffmi: ffmi,
      ffmiBand: ffmiB
    }
  };
}

/* Bulk uygun mu? — gate'e bağlı */

function _bulkOk(){
  return _calcGoalGates().bulk==='safe';
}

/* Haftalık vücut ağırlığı değişim aralığı (% bodyweight/week) */

function _weeklyChangeRange(gl){
  /* Returns {min, max} as decimal: 0.005 = %0.5 */
  if(gl==='cut') return {min:-0.01, max:-0.005};
  if(gl==='recomp') return {min:-0.005, max:0};
  if(gl==='maintain') return {min:-0.0025, max:0.0025};
  if(gl==='bulk'){
    /* Seviyeye göre: beginner / intermediate / advanced */
    var lvl='beginner';
    try{ lvl=getUserLevel(); }catch(e){}
    if(lvl==='advanced') return {min:0.001, max:0.002};
    if(lvl==='intermediate') return {min:0.0015, max:0.003};
    return {min:0.0025, max:0.005};
  }
  return {min:0, max:0};
}

/* ── GOAL STEP ────────────────────────────────────────── */

function renderGoalStep(){
  /* R.tdee/R.bf yoksa erken çık */
  if(!R.tdee || !R.bf){ return; }

  try { renderGoalAdvice(selGL || R.recGoal); } catch(err){ console.warn('renderGoalAdvice hata:',err); }

  /* Recomp extra'yı sync et */
  try {
    var rcExtra=document.getElementById('recomp-extra');
    if(rcExtra) rcExtra.style.display=(selGL==='recomp')?'block':'none';
  } catch(err){}

  /* Açıklamaları dinamik kg değerleriyle güncelle */
  try {
    var bf=R.bf||20, male=U.gender==='male';
    var goals=['cut','recomp','maintain','bulk'];
    goals.forEach(function(g){
      var od=document.getElementById('od-'+g);
      if(!od) return;
      var cal=calcGoalCalories(R.tdee, g, bf, male);
      var diff=cal-R.tdee;
      var pctStr=R.tdee?(diff>0?'+':'')+((diff/R.tdee)*100).toFixed(0)+'%':'';
      var calStr=(diff>=0?'+':'')+diff+' kcal';
      od.textContent=calStr+' ('+pctStr+' TDEE)';
    });
  } catch(err){ console.warn('Goal options dynamic render hata:',err); }

  /* ── HİBRİT SİSTEM: gate + önerilen + alternatif badge ── */
  try {
    var detail=recGoalDetailed();
    var gates=detail.gates;

    document.querySelectorAll('[data-g="gl"]').forEach(function(el){
      /* Eski badge'leri temizle */
      var oldRec=el.querySelector('.rec-badge');if(oldRec)oldRec.remove();
      var oldAlt=el.querySelector('.alt-badge');if(oldAlt)oldAlt.remove();
      /* Risky class temizle */
      el.classList.remove('risky');

      var v=el.dataset.v;

      /* Gate: riskli ise işaretle */
      if(gates[v]==='risky') el.classList.add('risky');

      /* Önerilen badge */
      if(v===detail.primary){
        var b=document.createElement('span');b.className='rec-badge';
        b.textContent='⭐ Önerilen';
        var on=el.querySelector('.on');if(on)on.appendChild(b);
      }
      /* Alternatif badge */
      else if(v===detail.alternative){
        var b2=document.createElement('span');b2.className='alt-badge';
        b2.textContent='💡 Alternatif';
        var on2=el.querySelector('.on');if(on2)on2.appendChild(b2);
      }
    });

    /* "Neden bu öneri?" artık renderGoalAdvice içinde otomatik gösteriliyor */
  } catch(err){ console.warn('Hybrid badge render hata:',err); }
}

function renderGoalAdvice(goal) {
  /* Eski isimleri mapla */
  var glMap={yag:'cut', idame:'maintain', kutle:'bulk'};
  if(glMap[goal]) goal=glMap[goal];

  var rTexts = {
    cut:      'Kalori açığıyla yağ kaybı dönemi. Yüksek protein, orta yağ, kontrollü karbonhidrat.',
    recomp:   'Eş zamanlı yağ kaybı + kas kazanımı. Yağ oranına göre ufak kalori ayarı, yüksek protein.',
    maintain: 'Mevcut kompozisyonu koruma. TDEE seviyesinde dengeli beslenme.',
    bulk:     'Kalori fazlasıyla kas kazanımı. Yağ oranına göre kontrollü artış.'
  };
  /* Haftalık kg değişim açıklaması */
  var bw=U.weight||0;
  var changeText='';
  try {
    var range=_weeklyChangeRange(goal);
    if(bw && range && (range.min!==0 || range.max!==0)){
      var minKg=parseFloat((bw*range.min).toFixed(2));
      var maxKg=parseFloat((bw*range.max).toFixed(2));
      if(range.max<=0){
        var lo=Math.abs(maxKg).toFixed(2), hi=Math.abs(minKg).toFixed(2);
        changeText='Haftalık hedef: <strong>'+lo+' - '+hi+' kg kayıp</strong>';
      } else if(range.min>=0){
        changeText='Haftalık hedef: <strong>'+minKg.toFixed(2)+' - '+maxKg.toFixed(2)+' kg kazanım</strong>';
      } else {
        var d=Math.abs(maxKg).toFixed(2);
        changeText='Sağlıklı dalgalanma: <strong>±'+d+' kg/hafta</strong>';
      }
    }
  } catch(err){ console.warn('Weekly change calc hata:',err); }

  var smartAdvice='';
  try { smartAdvice = getSmartWorkoutAdvice(goal); } catch(err){}

  var adviceHtml = smartAdvice
    ? '<br><br><strong style="color:var(--text)">📌 Antrenman Tavsiyesi:</strong> <span style="color:var(--warn)">' + smartAdvice + '</span>'
    : '';
  var changeHtml = changeText
    ? '<br><br><strong style="color:var(--accent)">📉</strong> ' + changeText
    : '';

  var elTxt=document.getElementById('g-rec-txt');
  if(elTxt){
    /* Neden bu öneri kutusu — her zaman göster */
    var reasonHtml='';
    try {
      var detail=recGoalDetailed();
      if(detail && detail.reason){
        reasonHtml='<div style="margin-top:10px;padding:10px 12px;background:color-mix(in srgb, var(--info) 8%, transparent);border-left:3px solid var(--info);border-radius:8px"><div style="font-size:11px;font-weight:700;color:var(--info);margin-bottom:3px">🧠 Neden bu öneri?</div><div style="font-size:11px;color:var(--text2);line-height:1.5">'+detail.reason+'</div></div>';
      }
    } catch(e){}
    elTxt.innerHTML='<strong>Hedef Analizi:</strong> ' + (rTexts[goal] || '') + changeHtml + adviceHtml + reasonHtml;
  }
}

/* ══════════════════════════════════════════════════════════
   ⚙️ HEDEF HIZLI DÜZENLEME — Beslenme tab'ından direkt erişim
   Wizard'a gitmeden spor türü + hedef + recomp modunu değiştir
   ══════════════════════════════════════════════════════════ */

function openGoalQuickEdit(){
  var ov=document.getElementById('goal-edit-overlay');
  if(!ov) return;
  ov.classList.add('active');
  _renderGoalQuickEdit();
}

function closeGoalQuickEdit(){
  var ov=document.getElementById('goal-edit-overlay');
  if(!ov) return;
  ov.classList.remove('active');
}

function _renderGoalQuickEdit(){
  var body=document.getElementById('goal-edit-body');
  if(!body) return;

  var detail=null;
  try { detail=recGoalDetailed(); } catch(e){}
  var currentGl=selGL||(detail&&detail.primary)||'maintain';
  var currentSt=selST||'hybrid';
  var currentRc=A.recompMode||'balanced';
  var gates=(detail&&detail.gates)||{cut:'safe',recomp:'safe',maintain:'safe',bulk:'safe'};

  var html='';

  /* ── 1. SPOR TÜRÜ ── */
  html+='<div class="calc-grid-card">';
  html+='<div class="calc-label" style="margin-bottom:8px">🏃 Spor Türü</div>';
  html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">';
  var sportOpts=[
    {id:'bb',icon:'🏋️',name:'Vücut Geliştirme',sub:'Ağırlık'},
    {id:'cardio',icon:'🏃',name:'Kardiyo',sub:'Kondisyon'},
    {id:'hybrid',icon:'⚡',name:'Hibrit',sub:'İkisi de'}
  ];
  sportOpts.forEach(function(s){
    var sel=currentSt===s.id;
    html+='<div onclick="_quickEditSport(\''+s.id+'\')" class="oc compact'+(sel?' sel':'')+'" style="flex-direction:column;text-align:center;padding:10px 6px;gap:4px">';
    html+='<div style="font-size:20px;width:auto;height:auto;background:transparent">'+s.icon+'</div>';
    html+='<div style="font-size:11px;font-weight:600;line-height:1.2">'+s.name+'</div>';
    html+='<div style="font-size:9px;color:var(--text2)">'+s.sub+'</div>';
    html+='</div>';
  });
  html+='</div></div>';

  /* ── 2. KALORİ HEDEFİ ── */
  html+='<div class="calc-grid-card">';
  html+='<div class="calc-label" style="margin-bottom:8px">🎯 Kalori Hedefi</div>';

  var bf=R.bf||20, male=U.gender==='male';
  var tdee=R.tdee||0;
  var goalOpts=[
    {id:'cut',icon:'🔥',name:'Cut',sub:'Yağ Kaybı'},
    {id:'recomp',icon:'♻️',name:'Recomp',sub:'Yağ↓+Kas↑'},
    {id:'maintain',icon:'⚖️',name:'Maintain',sub:'Koruma'},
    {id:'bulk',icon:'💪',name:'Bulk',sub:'Kütle'}
  ];
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">';
  goalOpts.forEach(function(g){
    var sel=currentGl===g.id;
    var risky=gates[g.id]==='risky';
    var recBadge=(detail&&detail.primary===g.id)?'<span class="rec-badge" style="font-size:8px;padding:1px 4px;margin-left:3px">⭐</span>':'';
    var altBadge=(detail&&detail.alternative===g.id)?'<span class="alt-badge" style="font-size:8px;padding:1px 4px;margin-left:3px">💡</span>':'';
    var cal=tdee?calcGoalCalories(tdee, g.id, bf, male):0;
    var diff=cal-tdee;
    var calStr=cal?((diff>=0?'+':'')+diff+' kcal'):'—';
    html+='<div onclick="_quickEditGoal(\''+g.id+'\')" class="oc'+(sel?' sel':'')+(risky?' risky':'')+'" style="padding:10px 12px;position:relative">';
    html+='<div class="oi">'+g.icon+'</div>';
    html+='<div class="ot"><div class="on">'+g.name+recBadge+altBadge+'</div><div class="od" style="font-size:9px">'+g.sub+' · '+calStr+'</div></div>';
    html+='<div class="orad"></div>';
    html+='</div>';
  });
  html+='</div>';

  /* Neden bu öneri */
  if(detail && detail.reason){
    html+='<div style="margin-top:10px;padding:8px 10px;background:color-mix(in srgb, var(--info) 8%, transparent);border-left:3px solid var(--info);border-radius:6px">';
    html+='<div style="font-size:10px;font-weight:700;color:var(--info);margin-bottom:2px">🧠 Neden bu öneri?</div>';
    html+='<div style="font-size:10px;color:var(--text2);line-height:1.4">'+detail.reason+'</div>';
    html+='</div>';
  }
  html+='</div>';

  /* ── 3. RECOMP MODU (sadece recomp seçiliyse) ── */
  if(currentGl==='recomp'){
    html+='<div class="calc-grid-card" id="quickedit-recomp-modes">';
    html+='<div class="calc-label" style="margin-bottom:8px">♻️ Recomp Karb Tercihi</div>';
    var rcOpts=[
      {id:'lowcarb',icon:'🥑',name:'Düşük Karb',sub:'Yağ 1.0 g/kg'},
      {id:'balanced',icon:'⚖️',name:'Dengeli',sub:'Yağ 0.8 g/kg'},
      {id:'performance',icon:'🏃',name:'Performans',sub:'Yağ 0.65 g/kg'}
    ];
    html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">';
    rcOpts.forEach(function(r){
      var sel=currentRc===r.id;
      html+='<div onclick="_quickEditRecompMode(\''+r.id+'\')" class="oc compact'+(sel?' sel':'')+'" style="flex-direction:column;text-align:center;padding:10px 6px;gap:3px">';
      html+='<div style="font-size:18px;width:auto;height:auto;background:transparent">'+r.icon+'</div>';
      html+='<div style="font-size:10px;font-weight:600;line-height:1.2">'+r.name+'</div>';
      html+='<div style="font-size:9px;color:var(--text2)">'+r.sub+'</div>';
      html+='</div>';
    });
    html+='</div></div>';
  }

  /* ── 4. SONUÇ ÖNİZLEMESİ ── */
  if(R.macros && R.goalCal){
    html+='<div class="calc-grid-card" style="background:linear-gradient(135deg, color-mix(in srgb, var(--accent) 6%, transparent), color-mix(in srgb, var(--info) 4%, transparent));border-color:var(--accent)">';
    html+='<div class="calc-label" style="margin-bottom:8px">📊 Güncel Değerler</div>';
    html+='<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border)">';
    html+='<span style="font-size:11px;color:var(--text2)">Günlük Kalori</span>';
    html+='<span style="font-family:\'Bebas Neue\',cursive;font-size:22px;letter-spacing:1px;color:var(--accent)">'+R.goalCal+' kcal</span>';
    html+='</div>';
    html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:8px">';
    html+='<div style="text-align:center;padding:6px;background:var(--card2);border-radius:8px"><div style="font-size:9px;color:var(--text2)">🥩 Protein</div><div style="font-family:\'Bebas Neue\',cursive;font-size:18px;color:var(--text)">'+R.macros.pg+'g</div></div>';
    html+='<div style="text-align:center;padding:6px;background:var(--card2);border-radius:8px"><div style="font-size:9px;color:var(--text2)">🍚 Karb</div><div style="font-family:\'Bebas Neue\',cursive;font-size:18px;color:var(--text)">'+R.macros.cg+'g</div></div>';
    html+='<div style="text-align:center;padding:6px;background:var(--card2);border-radius:8px"><div style="font-size:9px;color:var(--text2)">🥑 Yağ</div><div style="font-family:\'Bebas Neue\',cursive;font-size:18px;color:var(--text)">'+R.macros.fg+'g</div></div>';
    html+='</div></div>';
  }

  /* ── KAYDET BUTONU ── */
  html+='<button class="btn btn-p btn-full" onclick="_saveGoalQuickEdit()" style="margin-top:8px">✅ Tamam</button>';

  body.innerHTML=html;
}

function _quickEditSport(id){
  selST=id;
  A.st=id;
  _recalcAndRefreshQuickEdit();
}

function _quickEditGoal(id){
  var detail=null;
  try { detail=recGoalDetailed(); } catch(e){}
  var gates=(detail&&detail.gates)||{};
  /* Riskli uyarı */
  if(gates[id]==='risky'){
    var warning=_gateWarning(id);
    if(warning){
      showConfirm(
        '⚠️ Bu hedef sana uygun değil',
        warning,
        function(){
          selGL=id; A.gl=id;
          if(id==='recomp' && !A.recompMode) A.recompMode='balanced';
          _recalcAndRefreshQuickEdit();
        },
        'Yine de Seç',
        function(){ /* iptal — değişiklik yok */ },
        'Vazgeç'
      );
      return;
    }
  }
  selGL=id; A.gl=id;
  if(id==='recomp' && !A.recompMode) A.recompMode='balanced';
  _recalcAndRefreshQuickEdit();
}

function _quickEditRecompMode(id){
  A.recompMode=id;
  A.rc=id;
  _recalcAndRefreshQuickEdit();
}

function _recalcAndRefreshQuickEdit(){
  try { calcAll(); } catch(e){}
  _renderGoalQuickEdit();
}

function _saveGoalQuickEdit(){
  try { calcAll(); saveData(); } catch(e){}
  try { renderAll(); } catch(e){}
  closeGoalQuickEdit();
  showToast('✅ Hedefin güncellendi','success');
}
