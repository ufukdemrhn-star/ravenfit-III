/* ══════════════════════════════════════════════════════════
   RavenFit — measurements.js
   Ölçüler sekmesi ve haftalık kayıt
   ══════════════════════════════════════════════════════════ */

/* ── TAB: ÖLÇÜLERİM ──────────────────────────────────── */

/* Eski sürümlerde ilk ölçüm kaydına boy ve yaş yazılmıyordu.
   Bu yüzden "Ölçülerim → Başlangıç" sütununda boy/yaş boş görünüyordu.
   Aşağıdaki onarım, eksik alanları mevcut profilden bir kez doldurur. */
function _onarEksikOlcuAlanlari(){
  var entries=getEntries();
  if(!entries.length) return entries;
  var degisti=false;
  entries.forEach(function(e){
    if(e.height==null && U.height){ e.height=U.height; degisti=true; }
    if(e.age==null    && U.age){    e.age=U.age;       degisti=true; }
  });
  if(degisti){ _setEntries(entries); }
  return entries;
}

function renderOlculerim(){
  _onarEksikOlcuAlanlari();
  var male=U.gender==='male';
  var ratioHTML='';
  if(male){
    var swr=R.swr,lo=1.3,hi=2.0,ideal=1.618;
    var pct=clamp((swr-lo)/(hi-lo)*100,4,96),idPct=(ideal-lo)/(hi-lo)*100;
    var cat=swr>=1.5&&swr<=1.75?{t:'İdeal ✅',c:'bg'}:swr<1.5?{t:'Geliştirilmeli',c:'by'}:{t:'Çok Geniş',c:'bb'};
    ratioHTML='<div class="ratio-row"><div class="ratio-head"><div class="ratio-name">Omuz / Bel Oranı</div><div class="ratio-val">'+swr+'</div></div>'+
      '<div class="ratio-trk"><div class="ratio-fill" data-pct="'+pct+'" style="width:0%"></div>'+
      '<div class="ratio-ideal" style="left:'+idPct+'%"><div class="bar-il">İdeal (1.6)</div></div></div>'+
      '<div class="ratio-lbl"><span>1.3</span><span>1.6 İdeal</span><span>2.0+</span></div>'+
      '<div class="badge '+cat.c+'" style="margin-top:6px">● '+cat.t+' — Hedef ≈ 1.6</div></div>';
  } else {
    var whr=R.whr,lo=0.6,hi=1.0,ideal=0.7;
    var pct=clamp((whr-lo)/(hi-lo)*100,4,96),idPct=(ideal-lo)/(hi-lo)*100;
    var cat=whr<=0.75?{t:'İdeal ✅',c:'bg'}:whr<=0.85?{t:'Normal',c:'by'}:{t:'Yüksek ⚠️',c:'br'};
    ratioHTML='<div class="ratio-row"><div class="ratio-head"><div class="ratio-name">Bel / Kalça Oranı</div><div class="ratio-val">'+whr+'</div></div>'+
      '<div class="ratio-trk"><div class="ratio-fill" data-pct="'+pct+'" style="width:0%"></div>'+
      '<div class="ratio-ideal" style="left:'+idPct+'%"><div class="bar-il">İdeal (0.7)</div></div></div>'+
      '<div class="ratio-lbl"><span>0.6</span><span>0.7 İdeal</span><span>1.0+</span></div>'+
      '<div class="badge '+cat.c+'" style="margin-top:6px">● '+cat.t+' — İdeal ≤ 0.75</div></div>';
  }
  document.getElementById('ratio-content').innerHTML=ratioHTML;
  setTimeout(function(){document.querySelectorAll('.ratio-fill').forEach(function(f){f.style.width=f.dataset.pct+'%';});},200);

  var iw=R.iw;
  document.getElementById('iw-lo-v').textContent=iw.lo;
  document.getElementById('iw-hi-v').textContent=iw.hi;
  document.getElementById('iw-lo-lbl').textContent='Min: '+iw.lo+' kg';
  document.getElementById('iw-hi-lbl').textContent='Maks: '+iw.hi+' kg';
  var diff=Math.round((U.weight-iw.hi)*10)/10;
  var diffLo=Math.round((U.weight-iw.lo)*10)/10;
  var diffTxt;
  if(U.weight>=iw.lo&&U.weight<=iw.hi){diffTxt='✅ Kilonuz ideal aralık içinde!';}
  else if(U.weight>iw.hi){diffTxt='⬇️ İdeal üst sınırın '+diff+' kg üzeridesiniz';}
  else{diffTxt='⬆️ İdeal alt sınırın '+Math.abs(diffLo)+' kg altındasınız';}
  document.getElementById('iw-diff').textContent=diffTxt;
  var range=iw.hi-iw.lo;
  var iwPct=clamp((U.weight-iw.lo)/range*100,4,96);
  setTimeout(function(){document.getElementById('iw-mrk').style.left=iwPct+'%';},250);

  var entries=getEntries();
  var startEntry=entries.length>0?entries[0]:null; /* En eski kayıt = başlangıç */

  var rows=[
    {l:'Boy',      k:'height',  cur:U.height,              unit:'cm',  lb:false},
    {l:'Kilo',     k:'weight',  cur:U.weight,              unit:'kg',  lb:true},
    {l:'Boyun',    k:'neck',    cur:U.neck,                unit:'cm',  lb:true},
    {l:'Bel',      k:'waist',   cur:U.waist,               unit:'cm',  lb:true},
    male?
      {l:'Omuz',   k:'shoulder',cur:U.shoulder||null,      unit:'cm',  lb:false}:
      {l:'Kalça',  k:'hip',     cur:U.hip||null,           unit:'cm',  lb:false},
    {l:'Yaş',      k:'age',     cur:U.age,                 unit:'yaş', lb:false},
    {l:'VKİ',      k:'bmi',     cur:R.bmi,                 unit:'',    lb:true},
    {l:'Yağ Oranı',k:'bf',      cur:R.bf?R.bf.toFixed(2):null,unit:'%',lb:true},
    {l:'Yağsız Kütle',k:'lm',   cur:R.lm?R.lm.toFixed(2):null,unit:'kg',lb:false},
    {l:'FFMI',     k:'ffmi',    cur:R.ffmi?R.ffmi.toFixed(2):null,unit:'',lb:false}
  ];

  function diffArrow(cur,start,lb){
    if(cur==null||start==null)return'';
    var d=Math.round((parseFloat(cur)-parseFloat(start))*10)/10;
    if(d===0)return'';
    var good=(lb&&d<0)||(!lb&&d>0);
    return' <span style="font-size:10px;font-weight:700;color:'+(good?'var(--success)':'var(--accent)')+'">'+(d>0?'↑':'↓')+Math.abs(d)+'</span>';
  }

  var mlistHTML='';
  if(startEntry&&entries.length>1){
    /* İki sütun: Başlangıç | Şu An */
    mlistHTML+='<div style="display:grid;grid-template-columns:1fr 80px 80px;gap:0;border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:4px">'+
      '<div style="background:var(--card2);padding:6px 8px;font-size:9px;font-weight:700;color:var(--text2);text-transform:uppercase">ÖLÇÜ</div>'+
      '<div style="background:var(--card2);padding:6px 8px;font-size:9px;font-weight:700;color:var(--text2);text-transform:uppercase;text-align:center">BAŞLANGIÇ</div>'+
      '<div style="background:var(--card2);padding:6px 8px;font-size:9px;font-weight:700;color:var(--accent);text-transform:uppercase;text-align:center">ŞU AN</div>';
    rows.forEach(function(r){
      var sv=startEntry[r.k];
      if(r.cur==null&&sv==null)return;
      mlistHTML+=
        '<div style="padding:7px 8px;font-size:11px;color:var(--text2);border-top:1px solid var(--border)">'+r.l+'</div>'+
        '<div style="padding:7px 8px;font-size:12px;font-weight:600;text-align:center;border-top:1px solid var(--border);color:var(--text3)">'+(sv!=null?sv+'':' — ')+'</div>'+
        '<div style="padding:7px 8px;font-size:12px;font-weight:700;text-align:center;border-top:1px solid var(--border);color:var(--text)">'+(r.cur!=null?r.cur+'':' — ')+diffArrow(r.cur,sv,r.lb)+'</div>';
    });
    mlistHTML+='</div>';
    mlistHTML+='<div style="font-size:10px;color:var(--text3);text-align:center">📅 Başlangıç: '+startEntry.date+'</div>';
  } else {
    /* Sadece tek kayıt veya hiç yok — düz liste */
    mlistHTML=rows.filter(function(r){return r.cur!=null;}).map(function(r){
      return'<div class="mlist-row"><div class="mlist-lbl">'+r.l+'</div><div class="mlist-val">'+r.cur+(r.unit?' '+r.unit:'')+'</div></div>';
    }).join('');
    if(!startEntry)mlistHTML+='<div style="font-size:11px;color:var(--text2);margin-top:8px">💡 İlerleme karşılaştırması için haftalık takipten ölçü gir.</div>';
  }
  document.getElementById('mlist').innerHTML=mlistHTML;
}

/* ── İLK HAFTA ÖLÇÜMLERINI KAYDET (wizard step 5) ──────── */

function saveFirstWeekMeasurements() {
  // Ağırlık step 5'ten güncellendi mi? (isteğe bağlı)
  var wt5 = parseFloat(document.getElementById('s5-wt').value);
  if (wt5 && wt5 !== U.weight) { U.weight = wt5; }

  // Kalan ölçüler — sadece girilmişse al
  var ch    = parseFloat(document.getElementById('s5-ch').value)   || U.chest    || null;
  var arm   = parseFloat(document.getElementById('s5-arm').value)  || U.arm      || null;
  var farm  = parseFloat(document.getElementById('s5-farm').value) || U.forearm  || null;
  var leg   = parseFloat(document.getElementById('s5-leg').value)  || U.leg      || null;
  var calf  = parseFloat(document.getElementById('s5-calf').value) || U.calf     || null;

  if (ch)   U.chest   = ch;
  if (arm)  U.arm     = arm;
  if (farm) U.forearm = farm;
  if (leg)  U.leg     = leg;
  if (calf) U.calf    = calf;

  // Back-sync s5 -> U
  var nk5=parseFloat(document.getElementById('s5-nk').value);
  var wst5=parseFloat(document.getElementById('s5-wst').value);
  var spe5=parseFloat(document.getElementById('s5-spe').value);
  var hip5=parseFloat(document.getElementById('s5-hip').value);
  if(nk5&&nk5!==U.neck)U.neck=nk5;
  if(wst5&&wst5!==U.waist)U.waist=wst5;
  if(U.gender==='male'&&spe5&&spe5!==U.shoulder)U.shoulder=spe5;
  if(U.gender==='female'&&hip5&&hip5!==U.hip)U.hip=hip5;

  // Hesaplamaları güncelle ve kaydet
  calcAll();
  saveData();

  // İlk hafta kaydını entries'e ekle
  var now = new Date();
  var entry = {
    date: now.toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric'}),
    timestamp: now.getTime(),
    weight: U.weight,
    /* Boy ve yaş da kaydediliyor — "Başlangıç" sütununda boş kalmasın (madde 13) */
    height: U.height || null,
    age: U.age || null,
    neck: U.neck, waist: U.waist,
    shoulder: U.shoulder || null,
    chest: U.chest || null,
    arm: U.arm || null,
    forearm: U.forearm || null,
    hip: U.hip || null,
    leg: U.leg || null,
    calf: U.calf || null,
    bf: R.bf.toFixed(2), lm: R.lm.toFixed(2),
    ffmi: R.ffmi.toFixed(2), bmi: R.bmi,
    ratio: (U.gender === 'male' ? R.swr : R.whr)
  };

  // Zaten bugün kayıt var mı? Varsa güncelle, yoksa ekle
  var entries = getEntries();
  var today = entry.date;
  var todayIdx = entries.findIndex(function(e){ return e.date === today; });
  if (todayIdx >= 0) {
    entries[todayIdx] = entry; // bugünkü kaydı güncelle
  } else {
    entries.push(entry);
  }
  _setEntries(entries);
  saveToFirebase();
}

/* ── YENİ MODAL & HAFTALIK KAYIT İŞLEMLERİ ─────────────── */

function openMeasurementModal() {
  document.getElementById('m-age').value = U.age || '';
  document.getElementById('m-ht').value = U.height || '';
  document.getElementById('m-wt').value = U.weight || '';
  document.getElementById('m-nk').value = U.neck || '';
  document.getElementById('m-wst').value = U.waist || '';
  document.getElementById('m-sh').value = U.shoulder || '';
  document.getElementById('m-ch').value = U.chest || '';
  document.getElementById('m-arm').value = U.arm || '';
  document.getElementById('m-farm').value = U.forearm || '';
  document.getElementById('m-hip').value = U.hip || '';
  document.getElementById('m-leg').value = U.leg || '';
  document.getElementById('m-calf').value = U.calf || '';
  document.getElementById('measureModal').classList.add('active');
}

function closeMeasurementModal() {
  document.getElementById('measureModal').classList.remove('active');
  document.querySelector('#measureModal .modal-title').textContent='Haftalık Ölçümler';
  _editingEntryIdx=null;
}

function editEntry(idx){
  _editingEntryIdx=idx;
  var entries=getEntries();var e=entries[idx];if(!e)return;
  /* Yaş/Boy: entry'de varsa onu kullan, yoksa current U */
  document.getElementById('m-age').value=e.age||U.age||'';
  document.getElementById('m-ht').value=e.height||U.height||'';
  document.getElementById('m-wt').value=e.weight||'';
  document.getElementById('m-nk').value=e.neck||'';
  document.getElementById('m-wst').value=e.waist||'';
  document.getElementById('m-sh').value=e.shoulder||'';
  document.getElementById('m-ch').value=e.chest||'';
  document.getElementById('m-arm').value=e.arm||'';
  document.getElementById('m-farm').value=e.forearm||'';
  document.getElementById('m-hip').value=e.hip||'';
  document.getElementById('m-leg').value=e.leg||'';
  document.getElementById('m-calf').value=e.calf||'';
  document.querySelector('#measureModal .modal-title').textContent='Kaydı Düzenle';
  document.getElementById('measureModal').classList.add('active');
}

function saveWeeklyMeasurements(){
  var fd={
    age:parseInt(document.getElementById('m-age').value)||null,
    height:parseFloat(document.getElementById('m-ht').value)||null,
    weight:parseFloat(document.getElementById('m-wt').value)||null,
    neck:parseFloat(document.getElementById('m-nk').value)||null,
    waist:parseFloat(document.getElementById('m-wst').value)||null,
    shoulder:parseFloat(document.getElementById('m-sh').value)||null,
    chest:parseFloat(document.getElementById('m-ch').value)||null,
    arm:parseFloat(document.getElementById('m-arm').value)||null,
    forearm:parseFloat(document.getElementById('m-farm').value)||null,
    hip:parseFloat(document.getElementById('m-hip').value)||null,
    leg:parseFloat(document.getElementById('m-leg').value)||null,
    calf:parseFloat(document.getElementById('m-calf').value)||null
  };
  var tmpU=Object.assign({},U);
  if(fd.age)tmpU.age=fd.age;
  if(fd.height)tmpU.height=fd.height;
  if(fd.weight)tmpU.weight=fd.weight;if(fd.neck)tmpU.neck=fd.neck;if(fd.waist)tmpU.waist=fd.waist;
  if(fd.shoulder)tmpU.shoulder=fd.shoulder;if(fd.hip)tmpU.hip=fd.hip;
  var savedU=U;U=tmpU;calcAll();
  var entryBf=R.bf.toFixed(2),entryLm=R.lm.toFixed(2),entryFfmi=R.ffmi.toFixed(2),entryBmi=R.bmi;
  var entryRatio=savedU.gender==='male'?R.swr:R.whr;
  U=savedU;calcAll();
  var entries=getEntries();var now=new Date();
  var entry={
    date:_editingEntryIdx!==null?entries[_editingEntryIdx].date:now.toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric'}),
    timestamp:_editingEntryIdx!==null?entries[_editingEntryIdx].timestamp:now.getTime(),
    age:fd.age||U.age||null,
    height:fd.height||U.height||null,
    weight:fd.weight||U.weight,neck:fd.neck||U.neck,waist:fd.waist||U.waist,
    shoulder:fd.shoulder||U.shoulder||null,chest:fd.chest||U.chest||null,arm:fd.arm||U.arm||null,
    forearm:fd.forearm||U.forearm||null,hip:fd.hip||U.hip||null,leg:fd.leg||U.leg||null,calf:fd.calf||U.calf||null,
    bf:entryBf,lm:entryLm,ffmi:entryFfmi,bmi:entryBmi,ratio:entryRatio};
  if(_editingEntryIdx!==null){
    entries[_editingEntryIdx]=entry;
    /* Düzenleme sonrası U'yu en son kayıttan senkronize et */
    _syncUFromLatestEntry(entries);
  }
  else{
    if(fd.age)U.age=fd.age;if(fd.height)U.height=fd.height;
    if(fd.weight)U.weight=fd.weight;if(fd.neck)U.neck=fd.neck;if(fd.waist)U.waist=fd.waist;
    if(fd.shoulder)U.shoulder=fd.shoulder;if(fd.chest)U.chest=fd.chest;if(fd.arm)U.arm=fd.arm;
    if(fd.forearm)U.forearm=fd.forearm;if(fd.hip)U.hip=fd.hip;if(fd.leg)U.leg=fd.leg;if(fd.calf)U.calf=fd.calf;
    calcAll();saveData();entries.push(entry);
  }
  _setEntries(entries);
  saveToFirebase();
  var wasEdit=_editingEntryIdx!==null;
  closeMeasurementModal();renderAll();
  showToast(wasEdit?'✅ Kayıt güncellendi!':'✅ Ölçümler kaydedildi!','success');
  if(!wasEdit) setTimeout(checkAndAwardBadges,600);

  /* ══ HEDEF YENİDEN DEĞERLENDİRME ══
     Yeni ölçü sonrası: mevcut hedef yağ oranı için hala uygun mu? */
  if(!wasEdit) setTimeout(_checkGoalReevaluation, 1200);
}

/* ══════════════════════════════════════════════════════════
   🎯 OTOMATİK HEDEF YENİDEN DEĞERLENDİRME
   Yeni vücut ölçüleri girildiğinde mevcut hedef yağ oranı bandı
   için uygun mu kontrol et — değilse popup ile yeni hedef öner.
   ══════════════════════════════════════════════════════════ */

function _checkGoalReevaluation(){
  if(!R.bf || !selGL) return;
  var newRec=recGoal();
  var current=selGL;
  /* Yeni öneri farklıysa VE mevcut hedef yağ oranı bandına aykırıysa uyar */
  if(newRec===current) return;

  /* Özel olarak BULK + yüksek yağ → kritik uyarı */
  var male=U.gender==='male';
  var bf=R.bf;
  var criticalBulk = (current==='bulk' && !_bulkOk());

  /* Cut → kütle kazanılması beklenmez ama yağ oranı düşerse: maintain ya da recomp önerilebilir */
  /* Bulk → yağ oranı çok artarsa: cut/recomp öner */
  /* Recomp → yağ oranı düştü/arttıysa: yeni öneri varsa göster */

  var titles={cut:'🔥 Cut → '+_goalLabel(newRec), recomp:'♻️ Recomp → '+_goalLabel(newRec),
              maintain:'⚖️ Maintain → '+_goalLabel(newRec), bulk:'💪 Bulk → '+_goalLabel(newRec)};
  var msg='';
  if(criticalBulk){
    msg='Yağ oranın <strong>%'+bf.toFixed(1)+'</strong>\'e çıktı. Bu seviyede bulk sağlıklı değil. '+
        '<strong>'+_goalLabel(newRec)+'</strong> hedefine geçmeni şiddetle öneriyoruz.';
  } else {
    msg='Yeni ölçülerine göre yağ oranın <strong>%'+bf.toFixed(1)+'</strong>. '+
        'Mevcut hedef "<strong>'+_goalLabel(current)+'</strong>" yerine '+
        '<strong>'+_goalLabel(newRec)+'</strong> daha uygun. Geçmek ister misin?';
  }

  showConfirm(
    '🎯 Hedef Önerisi Güncellendi',
    msg,
    function(){
      /* Onaylandı — yeni hedefe geç */
      selGL=newRec;
      /* Recomp ise mod sor — default balanced */
      if(newRec==='recomp' && !A.recompMode) A.recompMode='balanced';
      calcAll();
      saveData();
      saveToFirebase();
      renderAll();
      showToast('✅ Hedefin '+_goalLabel(newRec)+' olarak güncellendi','success');
    },
    'Evet, Geç'
  );
}

function _goalLabel(g){
  return {cut:'Cut (Yağ Kaybı)', recomp:'Recomp', maintain:'Maintain (Koruma)', bulk:'Bulk (Kütle)'}[g]||g;
}

function deleteEntry(i){
  showConfirm('Kaydı Sil','Bu ölçüm kaydını silmek istediğine emin misin?',function(){
    var entries=getEntries();
    entries.splice(i,1);
    _setEntries(entries);
    /* U'yu en son entry'ye göre güncelle (varsa) */
    if(entries.length>0){
      _syncUFromLatestEntry(entries);
    }
    saveToFirebase();
    renderAll();
    showToast('🗑 Kayıt silindi','success');
  },'Sil');
}

/* En son entry'den U değerlerini senkronize et (özet tablo güncellensin) */

function _syncUFromLatestEntry(entries){
  /* Timestamp'a göre sırala, en yeniyi al */
  var sorted=entries.slice().sort(function(a,b){return (b.timestamp||0)-(a.timestamp||0);});
  var latest=sorted[0];
  if(!latest) return;
  if(latest.weight!=null) U.weight=latest.weight;
  if(latest.neck!=null) U.neck=latest.neck;
  if(latest.waist!=null) U.waist=latest.waist;
  if(latest.shoulder!=null) U.shoulder=latest.shoulder;
  if(latest.chest!=null) U.chest=latest.chest;
  if(latest.arm!=null) U.arm=latest.arm;
  if(latest.forearm!=null) U.forearm=latest.forearm;
  if(latest.hip!=null) U.hip=latest.hip;
  if(latest.leg!=null) U.leg=latest.leg;
  if(latest.calf!=null) U.calf=latest.calf;
  /* Yaş/Boy entry'de varsa onları da güncelle */
  if(latest.age!=null) U.age=latest.age;
  if(latest.height!=null) U.height=latest.height;
  try { calcAll(); saveData(); } catch(e){}
}
