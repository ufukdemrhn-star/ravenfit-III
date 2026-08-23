/* ══════════════════════════════════════════════════════════
   RavenFit — wizard.js
   7 adımlı analiz sihirbazı
   ══════════════════════════════════════════════════════════ */

function startWizard(){step=0;selST=null;selGL=null;_redsAcknowledged=false;_bulkAcknowledged=false;closeAllOverlays();showScreen('wizard');document.getElementById('bottom-nav').classList.remove('visible');updWizStep();updGenderUI();restoreWiz();}

function startWizardFromTouch(e){if(e)e.preventDefault();startWizard();}

function restoreWiz(){
  if(!U.age)return;
  sv('i-name',U.name||'');if(U.gender)selGender(U.gender);sv('i-age',U.age);sv('i-ht',U.height);sv('i-wt',U.weight);
  sv('i-nk',U.neck);sv('i-wst',U.waist);sv('i-spe',U.shoulder||'');sv('i-hip',U.hip||'');
  // Step 5 prefill
  sv('s5-wt',U.weight||'');sv('s5-ch',U.chest||'');sv('s5-arm',U.arm||'');
  sv('s5-farm',U.forearm||'');sv('s5-leg',U.leg||'');sv('s5-calf',U.calf||'');
  sv('s5-age',U.age||'');sv('s5-ht',U.height||'');sv('s5-nk',U.neck||'');sv('s5-wst',U.waist||'');sv('s5-spe',U.shoulder||'');sv('s5-hip',U.hip||'');
  Object.keys(A).forEach(function(g){var el=document.querySelector('[data-g="'+g+'"][data-v="'+A[g]+'"]');if(el)markSel(g,el);});
  if(A.sd!==undefined){
    var shEls=document.querySelectorAll('[data-g="sh"]');
    var shZ=document.querySelector('[data-g="sh"][data-v="0"]');
    if(A.sd===0){
      shEls.forEach(function(e){e.classList.remove('sel');e.classList.add('locked');});
      if(shZ){shZ.classList.add('sel');shZ.classList.remove('locked');}
    } else {
      shEls.forEach(function(e){
        if(e.dataset.v==='0'){e.classList.add('locked');e.classList.remove('sel');}
        else{e.classList.remove('locked');}
      });
    }
  }
  if(A.st)selST=A.st;
  if(A.gl){
    /* Eski hedef isimlerini yeni'ye mapla */
    var oldGlMap={yag:'cut', idame:'maintain', kutle:'bulk'};
    selGL=oldGlMap[A.gl]||A.gl;
    A.gl=selGL;
  }
  /* Training age */
  if(A.ta || U.training_age){
    var ta=A.ta||U.training_age;
    var taEl=document.querySelector('[data-g="ta"][data-v="'+ta+'"]');
    if(taEl){
      document.querySelectorAll('[data-g="ta"]').forEach(function(e){e.classList.remove('sel');});
      taEl.classList.add('sel');
    }
    U.training_age=ta;
  }
  Object.keys(BT).forEach(function(g){var q=BT[g];var el=document.querySelector('[data-g="'+g+'"][data-ec="'+q.ec+'"][data-me="'+q.me+'"][data-en="'+q.en+'"]');if(el)markSelBT(g,el);});
}

function sv(id,v){var el=document.getElementById(id);if(el&&v!=null&&v!==undefined&&v!=='')el.value=v;}

/* ── WIZARD NAV ───────────────────────────────────────── */

function prevStep(){if(step>0){step--;updWizStep();}}

function nextStep(){
  if(!validate(step))return;
  if(step===6){
    // Son adım: ilk hafta ölçülerini kaydet + analizi bitir
    try {
      saveFirstWeekMeasurements();
    } catch(err){
      console.error('saveFirstWeekMeasurements hatası:',err);
      showToast('⚠️ Ölçü kaydı sırasında bir hata oluştu, devam ediliyor...','warn');
    }
    try {
      showResults();
    } catch(err){
      console.error('showResults hatası:',err);
      showToast('⚠️ Sonuç ekranı yüklenirken hata: '+(err.message||err),'warn');
    }
    return;
  }
  step++;updWizStep();
  if(step===4){
    try { collectPartial(); } catch(err){ console.warn('collectPartial:',err); }
    try { calcAll(); } catch(err){ console.warn('calcAll:',err); }
    try { renderGoalStep(); } catch(err){ console.warn('renderGoalStep:',err); }
  }
  if(step===5){
    updS5GenderUI();
    sv('s5-age',U.age||'');sv('s5-ht',U.height||'');
    sv('s5-wt',U.weight||'');sv('s5-nk',U.neck||'');sv('s5-wst',U.waist||'');
    sv('s5-spe',U.shoulder||'');sv('s5-hip',U.hip||'');
  }
  if(step===6){
    renderConditionsStep();
  }
}

function updWizStep(){
  document.querySelectorAll('.step').forEach(function(s){s.classList.remove('active');});
  document.getElementById('s'+step).classList.add('active');
  for(var i=0;i<7;i++){var ps=document.getElementById('ps'+i);if(!ps)continue;ps.className='ps';if(i<step)ps.classList.add('done');else if(i===step)ps.classList.add('act');}
  document.getElementById('prog-lbl').textContent='Adım '+(step+1)+' / 7';
  document.getElementById('btn-back').style.display=step>0?'flex':'none';
  document.getElementById('btn-next').innerHTML=step===6
    ?'🚀 Analizi Tamamla'
    :'Devam Et <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
}

/* ── VALIDATION ───────────────────────────────────────── */

function validate(s){
  document.querySelectorAll('.alert').forEach(function(a){a.classList.remove('v');});
  if(s===0){
    var age=gv('i-age'),ht=gv('i-ht'),wt=gv('i-wt');
    if(!U.gender||!age||!ht||!wt){document.getElementById('al0').classList.add('v');return false;}
    U.name=document.getElementById('i-name').value;U.age=+age;U.height=+ht;U.weight=+wt;return true;
  }
  if(s===1){
    var nk=gv('i-nk'),wst=gv('i-wst');
    if(!nk||!wst){document.getElementById('al1').classList.add('v');return false;}
    if(U.gender==='male'&&!gv('i-spe')){document.getElementById('al1').classList.add('v');return false;}
    if(U.gender==='female'&&!gv('i-hip')){document.getElementById('al1').classList.add('v');return false;}
    U.neck=+nk;U.waist=+wst;
    if(U.gender==='male')U.shoulder=+gv('i-spe');
    else U.hip=+gv('i-hip');
    return true;
  }
  if(s===2){
    if(A.job===undefined||A.sd===undefined||A.sh===undefined||A.ex===undefined||A.ta===undefined){document.getElementById('al2').classList.add('v');return false;}
    return true;
  }
  if(s===3){
    for(var i=1;i<=8;i++){if(!BT['bt'+i]){document.getElementById('al3').classList.add('v');return false;}}
    return true;
  }
  if(s===4){
    if(!selST||!selGL){document.getElementById('al4').classList.add('v');return false;}
    /* Recomp seçildiyse modu otomatik default'a ata */
    if(selGL==='recomp' && !A.recompMode) A.recompMode='balanced';
    A.st=selST;A.gl=selGL;
    try { calcAll(); } catch(err){ console.warn('calcAll hatası:',err); }
    try { saveData(); } catch(err){ console.warn('saveData hatası:',err); }
    return true;
  }
  // Step 5 (ölçüler) ve Step 6 (özel durumlar) her zaman geç
  return true;
}

function gv(id){var el=document.getElementById(id);return el?el.value.trim():'';}

/* ── UI HELPERS ───────────────────────────────────────── */

function selGender(g){
  U.gender=g;
  document.getElementById('gm').classList.toggle('sel',g==='male');
  document.getElementById('gf').classList.toggle('sel',g==='female');
  updGenderUI();
}

function updGenderUI(){
  if(!U.gender)return;
  var male=U.gender==='male';
  document.getElementById('wst-hint').textContent=male?'📍 Göbek deliği hizasından ölçün':'📍 Belin en ince noktasından ölçün';
  document.getElementById('grp-spe').style.display=male?'flex':'none';
  document.getElementById('grp-hip').style.display=male?'none':'flex';
}

function updS5GenderUI(){
  /* Her iki alan da her zaman görünür. Yağ oranı formülü erkekte omuz,
     kadında kalça kullanır — ilgili alan vurgulanır, diğeri sade kalır.
     "— opsiyonel" metni kaldırıldı (madde 10): tablo hizasını bozuyordu. */
  var male=U.gender==='male';
  var lSpe=document.getElementById('s5-lbl-spe');
  var lHip=document.getElementById('s5-lbl-hip');
  /* Etiketler sade tutulur — renk vurgusu tabloda dikkat dağıtıyordu.
     Hangi alanın kullanıldığı zaten hesaplamada belli oluyor. */
  if(lSpe){ lSpe.textContent='Omuz';  lSpe.style.removeProperty('color'); }
  if(lHip){ lHip.textContent='Kalça'; lHip.style.removeProperty('color'); }
}

function selOpt(el,grp){
  markSel(grp,el);
  var rawV=el.dataset.v;
  var numV=parseFloat(rawV);
  A[grp]=isNaN(numV)?rawV:numV;
  if(grp==='sd'){
    var shEls=document.querySelectorAll('[data-g="sh"]');
    var shZ=document.querySelector('[data-g="sh"][data-v="0"]');
    if(A.sd===0){
      shEls.forEach(function(e){e.classList.remove('sel');e.classList.add('locked');});
      if(shZ){shZ.classList.add('sel');shZ.classList.remove('locked');}
      A.sh=0;
    } else {
      shEls.forEach(function(e){
        if(e.dataset.v==='0'){e.classList.add('locked');e.classList.remove('sel');}
        else{e.classList.remove('locked');}
      });
      if(A.sh===0){delete A.sh;}
    }
  }
  if(grp==='st')selST=el.dataset.v;
  if(grp==='ta'){
    /* Antrenman geçmişi — U.training_age'e kaydet */
    U.training_age=el.dataset.v;
    A.ta=el.dataset.v;
  }
  if(grp==='gl'){
    selGL=el.dataset.v;

    /* ⚠️ RED-S kontrolü: Cut + çok düşük yağ oranı → sağlık uyarısı */
    if(_checkRedsRisk(selGL)){
      openRedsWarning(function(){
        /* Onaylandıysa normal akış devam etsin — selGL zaten cut */
        try {
          if(typeof renderGoalStep==='function') renderGoalStep();
          if(typeof renderAll==='function') renderAll();
        } catch(e){}
      });
      return; /* Modal açıldı, gerisini bekle */
    }

    /* ⚠️ Bulk kontrolü: Bulk + yüksek yağ oranı → verimlilik uyarısı */
    if(_checkBulkRisk(selGL)){
      openBulkWarning(function(){
        try {
          if(typeof renderGoalStep==='function') renderGoalStep();
          if(typeof renderAll==='function') renderAll();
        } catch(e){}
      });
      return;
    }

    /* Risky gate kontrolü — sadece tıklanan kart riskliyse uyar */
    try {
      var gates=_calcGoalGates();
      if(gates[selGL]==='risky'){
        var warning=_gateWarning(selGL);
        if(warning && typeof showConfirm==='function'){
          /* Onay sor: devam edecek mi? */
          showConfirm(
            '⚠️ Bu hedef sana uygun değil',
            warning,
            function(){
              /* Yine de seç */
              /* zaten seçildi, sadece UI'ı güncelle */
            },
            'Yine de Seç',
            function(){
              /* İptal — önerilene geç */
              try {
                if(R.recGoal && R.recGoal!==selGL){
                  var recEl=document.querySelector('[data-g="gl"][data-v="'+R.recGoal+'"]');
                  if(recEl){
                    selOpt(recEl, 'gl');
                  }
                }
              } catch(e){}
            },
            'Önerilene Geç'
          );
        }
      }
    } catch(err){ console.warn('Gate warning hata:',err); }
    /* Recomp seçildiyse ek seçenekleri göster — defansif */
    try {
      var rcExtra=document.getElementById('recomp-extra');
      if(rcExtra){
        rcExtra.style.display=(selGL==='recomp')?'block':'none';
        if(selGL==='recomp' && !A.rc){
          A.rc='balanced';
          A.recompMode='balanced';
          var balEl=document.querySelector('[data-g="rc"][data-v="balanced"]');
          if(balEl){
            document.querySelectorAll('[data-g="rc"]').forEach(function(e){e.classList.remove('sel');});
            balEl.classList.add('sel');
          }
        }
      }
    } catch(err){ console.warn('Recomp render hatası:',err); }
    /* Hedef tavsiye metni + reason güncelle — renderGoalStep tüm panel'i yeniden çizer */
    try {
      if(R.recGoal && typeof renderGoalStep==='function') renderGoalStep();
    } catch(err){ console.warn('Goal step render hatası:',err); }
  }
  if(grp==='rc'){
    A.recompMode=el.dataset.v;
    try {
      if(selGL==='recomp' && R.tdee){
        var male=U.gender==='male';
        R.macros=calcMacros(R.goalCal, 'recomp', selST||'hybrid', R.lm, U.weight, R.bf, male, A.recompMode);
        if(typeof renderGoalStep==='function') renderGoalStep();
      }
    } catch(err){ console.warn('Recomp mode hatası:',err); }
  }
}

function markSel(grp,el){
  document.querySelectorAll('[data-g="'+grp+'"]').forEach(function(e){e.classList.remove('sel');});
  el.classList.add('sel');
}

function selBT(el,grp){
  markSelBT(grp,el);
  BT[grp]={ec:+el.dataset.ec,me:+el.dataset.me,en:+el.dataset.en};
}

function markSelBT(grp,el){
  document.querySelectorAll('[data-g="'+grp+'"]').forEach(function(e){e.classList.remove('sel');});
  el.classList.add('sel');
}

function collectPartial(){
  U.name=document.getElementById('i-name').value;
  U.age=+gv('i-age');U.height=+gv('i-ht');U.weight=+gv('i-wt');
  U.neck=+gv('i-nk');U.waist=+gv('i-wst');
  if(U.gender==='male')U.shoulder=+gv('i-spe');
  else U.hip=+gv('i-hip');
}
