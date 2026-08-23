/* Dinlenme süresini 15sn adımlarla ayarlar (15–300sn arası).
   Araçlar ekranındaki  −/+  butonlarına bağlıdır. */
function adjustRestTime(delta){
  _restTime=Math.max(15,Math.min(300,_restTime+delta));
  /* Araçlar ekranındaki göstergeyi güncelle */
  var el=document.getElementById('tools-rest-time-val');
  if(el) el.textContent=_restTime+'s';
}

function playBeep(){try{var ctx=new(window.AudioContext||window.webkitAudioContext)();var o=ctx.createOscillator();var g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=880;g.gain.value=0.3;o.start();o.stop(ctx.currentTime+0.15);}catch(e){}
  if(navigator.vibrate)try{navigator.vibrate([200,100,200]);}catch(e){}}

/* ══════════════════════════════════════════════════════════
   KATMAN 2A — ARAÇLAR SAYFASI
   ══════════════════════════════════════════════════════════ */

function renderWorkoutTools(){
  var el=document.getElementById('workout-main');
  if(!el) return;
  var logs=getWorkoutLogs();
  var branches=getUserBranches();

  var html='<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">';
  html+='<button class="btn btn-s" onclick="renderWorkoutHome()" style="padding:8px 12px;font-size:12px">← Geri</button>';
  html+='<div style="font-size:16px;font-weight:700">🛠️ Araçlar</div></div>';

  /* ── 🧮 HESAPLAYICILAR (madde 16) ──────────────────────
     Kronometre ve Set Sayacı da buraya taşındı — hepsi aynı
     tıklanabilir kart deseninde, 3×2 ızgara. */
  html+='<div class="rc">';
  html+='<div class="rct">🧮 Hesaplayıcılar</div>';
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  html+='<div class="calc-tool-card" onclick="openCalculator(\'1rm\')"><div class="calc-tool-icon">💪</div><div class="calc-tool-label">1RM</div><div class="calc-tool-sub">Max Tahmini</div></div>';
  html+='<div class="calc-tool-card" onclick="openCalculator(\'working-set\')"><div class="calc-tool-icon">⚙️</div><div class="calc-tool-label">Çalışma Seti</div><div class="calc-tool-sub">%1RM × Rep</div></div>';
  html+='<div class="calc-tool-card" onclick="openCalculator(\'pr\')"><div class="calc-tool-icon">🎯</div><div class="calc-tool-label">PR Denemesi</div><div class="calc-tool-sub">Rekor Kırma</div></div>';
  html+='<div class="calc-tool-card" onclick="openCalculator(\'sleep\')"><div class="calc-tool-icon">😴</div><div class="calc-tool-label">Uyku</div><div class="calc-tool-sub">REM Döngüsü</div></div>';
  html+='<div class="calc-tool-card" onclick="openToolOverlay(\'chrono\')"><div class="calc-tool-icon">⏱️</div><div class="calc-tool-label">Kronometre</div><div class="calc-tool-sub" id="tools-chrono-preview">'+(_chronoMs>0||_chronoRunning?'Aktif':'Hazır')+'</div></div>';
  html+='<div class="calc-tool-card" onclick="openToolOverlay(\'set-counter\')"><div class="calc-tool-icon">💪</div><div class="calc-tool-label">Set Sayacı</div><div class="calc-tool-sub">'+_setCount+' set · '+_restTime+'s</div></div>';
  html+='</div>';
  html+='<div style="margin-top:10px;font-size:10px;color:var(--text3);text-align:center">Seviyen: <strong>'+getUserLevelLabel()+'</strong> · Birim: <strong>'+unitLabel()+'</strong></div>';
  html+='</div>';

  /* ── Egzersiz Havuzu + Antrenman Geçmişi (en altta) ── */
  var exCount=0;
  branches.forEach(function(bId){
    var d=_getBranchExercises(bId);
    if(d&&d.exercises) exCount+=d.exercises.length;
  });
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">';
  html+='<div class="wh-card" onclick="openExerciseLibraryFrom(\''+branches[0]+'\',\'tools\')" style="padding:14px 10px;text-align:center">';
  html+='<div style="font-size:28px;margin-bottom:4px">📚</div>';
  html+='<div class="wh-card-label" style="font-size:13px">Egzersiz Havuzu</div>';
  html+='<div style="font-size:10px;color:var(--text2);margin-top:2px">'+(exCount>0?exCount+' egzersiz':'Yükleniyor...')+'</div>';
  html+='</div>';
  html+='<div class="wh-card" onclick="window._historyBranch=null;renderWorkoutHistory()" style="padding:14px 10px;text-align:center">';
  html+='<div style="font-size:28px;margin-bottom:4px">📋</div>';
  html+='<div class="wh-card-label" style="font-size:13px">Antrenman Geçmişi</div>';
  html+='<div style="font-size:10px;color:var(--text2);margin-top:2px">'+logs.length+' kayıt</div>';
  html+='</div>';
  html+='</div>';

  el.innerHTML=html;
}

/* ══════════════════════════════════════════════════════════
   🔧 ARAÇLAR OVERLAY (Kronometre + Set Sayacı)
   ══════════════════════════════════════════════════════════ */

function openToolOverlay(kind){
  var title, sub, body;
  if(kind==='chrono'){
    title='KRONOMETRE';
    sub='ZAMAN ÖLÇÜMÜ';
    body='<div class="calc-grid-card" style="text-align:center;padding:30px 16px">';
    body+='<div class="chrono-display" id="tools-chrono-display" style="font-size:56px">00:00.00</div>';
    body+='<div class="chrono-btn-row" style="margin-top:20px;justify-content:center">';
    body+='<button class="btn btn-p" id="tools-chrono-toggle" onclick="_toolsChronoToggle()" style="min-width:110px">▶ Başlat</button>';
    body+='<button class="btn btn-s" onclick="_toolsChronoReset()">↺ Sıfırla</button>';
    body+='</div></div>';
    body+='<div class="calc-grid-card" style="background:var(--card2)">';
    body+='<div style="font-size:11px;color:var(--text2);line-height:1.5">⏱️ <strong>Kronometre</strong> antrenman sürelerini, kardiyo ölçümlerini veya genel zamanlamaları takip etmen için. Sayfadan çıksan bile durumunu korur — saniye ve yüz milisaniye hassasiyetinde çalışır.</div></div>';
  } else {
    title='SET SAYACI';
    sub='DİNLENME & SET TAKİBİ';
    body='<div class="calc-grid-card">';
    body+='<div class="calc-label">Dinlenme Süresi (saniye)</div>';
    body+='<div class="rest-adj" style="margin:10px 0">';
    body+='<button class="rest-adj-btn" onclick="adjustRestTime(-15)">−</button>';
    body+='<div class="rest-adj-val" id="tools-rest-time-val">'+_restTime+'s</div>';
    body+='<button class="rest-adj-btn" onclick="adjustRestTime(15)">+</button>';
    body+='</div>';
    body+='<div class="rest-display" id="tools-rest-display" style="font-size:32px;padding:14px">—</div>';
    body+='<button class="btn btn-p btn-full" id="tools-btn-set-done" onclick="_toolsSetDone()" style="margin-top:10px">✅ Seti Bitir</button>';
    body+='</div>';
    body+='<div class="calc-grid-card">';
    body+='<div style="display:flex;align-items:center;justify-content:space-between">';
    body+='<div>';
    body+='<div class="calc-label">Tamamlanan Set</div>';
    body+='<div style="font-family:\'Bebas Neue\',cursive;font-size:48px;letter-spacing:2px;color:var(--accent);line-height:1" id="tools-set-count">'+_setCount+'</div>';
    body+='</div>';
    body+='<button class="btn btn-s" onclick="_toolsResetSets()">Sıfırla</button>';
    body+='</div></div>';
    body+='<div class="calc-grid-card" style="background:var(--card2)">';
    body+='<div style="font-size:11px;color:var(--text2);line-height:1.5">💪 <strong>Set & Dinlenme Sayacı:</strong> Her seti bitirdiğinde butona bas — otomatik dinlenme geri sayımı başlar ve set sayısı artar. Antrenmanın boyunca takip etmeni sağlar.</div></div>';
  }
  document.getElementById('calc-header-title').textContent='🔧 '+title;
  document.getElementById('calc-header-sub').textContent=sub;
  document.getElementById('calc-body').innerHTML=body;
  document.getElementById('calc-overlay').classList.add('active');
  _activeCalc='tool-'+kind;

  /* Sync chrono display if running */
  if(kind==='chrono'){
    if(_chronoRunning){
      var btn=document.getElementById('tools-chrono-toggle');
      if(btn) btn.innerHTML='⏸ Durdur';
      _toolsChronoUpdate();
    } else if(_chronoMs>0){
      var btn=document.getElementById('tools-chrono-toggle');
      if(btn) btn.innerHTML='▶ Devam';
      var ms=_chronoMs; var s=Math.floor(ms/1000); var m=Math.floor(s/60); var cs=Math.floor((ms%1000)/10); s=s%60;
      document.getElementById('tools-chrono-display').textContent=pad2(m)+':'+pad2(s)+'.'+pad2(cs);
    }
  }
}

/* Araçlar sayfası krono — mevcut global state'i kullanır */

var _toolsChronoInterval2=null;

function _toolsChronoToggle(){
  if(_chronoRunning){
    clearInterval(_chronoInterval); clearInterval(_toolsChronoInterval2);
    _chronoMs+=Date.now()-_chronoStart; _chronoRunning=false;
    var btn=document.getElementById('tools-chrono-toggle');
    if(btn) btn.innerHTML='▶ Devam';
  } else {
    _chronoStart=Date.now(); _chronoRunning=true;
    /* Tek timer yeterli — eskiden burada 'chrono-display' elementini arayan
       ikinci bir setInterval daha vardı, ama o element artık yok.
       Saniyede ~33 kez boşa çalışıyordu. */
    _toolsChronoInterval2=setInterval(_toolsChronoUpdate,30);
    var btn=document.getElementById('tools-chrono-toggle');
    if(btn) btn.innerHTML='⏸ Durdur';
  }
}

function _toolsChronoUpdate(){
  var ms=_chronoMs+(_chronoRunning?(Date.now()-_chronoStart):0);
  var s=Math.floor(ms/1000); var m=Math.floor(s/60); var cs=Math.floor((ms%1000)/10); s=s%60;
  var disp=document.getElementById('tools-chrono-display');
  if(disp) disp.textContent=pad2(m)+':'+pad2(s)+'.'+pad2(cs);
}

function _toolsChronoReset(){
  clearInterval(_chronoInterval); clearInterval(_toolsChronoInterval2);
  _chronoRunning=false; _chronoMs=0; _chronoStart=0;
  var disp=document.getElementById('tools-chrono-display');
  if(disp) disp.textContent='00:00.00';
  var btn=document.getElementById('tools-chrono-toggle');
  if(btn) btn.innerHTML='▶ Başlat';
}

/* Araçlar sayfası set sayacı — mevcut global state'i kullanır */

var _toolsRestInterval2=null;

var _toolsRestActive=false;

function _toolsSetDone(){
  if(_toolsRestActive){ _toolsSkipRest(); return; }
  _setCount++;
  var sc=document.getElementById('tools-set-count');
  if(sc) sc.textContent=_setCount;
  _toolsStartRest();
  showToast('Set #'+_setCount+' tamamlandı! Dinlenme başlıyor...','success');
}

function _toolsStartRest(){
  _toolsRestActive=true; _restRemain=_restTime;
  var btn=document.getElementById('tools-btn-set-done');
  if(btn) btn.innerHTML='⏭ Dinlenmeyi Atla';
  var rd=document.getElementById('tools-rest-display');
  if(rd){ rd.classList.add('rest-active'); rd.textContent=_restRemain+'s'; }
  clearInterval(_toolsRestInterval2);
  _toolsRestInterval2=setInterval(function(){
    _restRemain--;
    if(_restRemain<=0){
      clearInterval(_toolsRestInterval2); _toolsRestActive=false;
      if(rd){ rd.classList.remove('rest-active'); rd.textContent='Hazırsın!'; }
      if(btn) btn.innerHTML='✅ Seti Bitir';
      playBeep(); showToast('⏰ Dinlenme bitti! Hazırsın!','success');
    } else {
      if(rd) rd.textContent=_restRemain+'s';
    }
  },1000);
}

function _toolsSkipRest(){
  clearInterval(_toolsRestInterval2); _toolsRestActive=false;
  var rd=document.getElementById('tools-rest-display');
  if(rd){ rd.classList.remove('rest-active'); rd.textContent='—'; }
  var btn=document.getElementById('tools-btn-set-done');
  if(btn) btn.innerHTML='✅ Seti Bitir';
}

function _toolsResetSets(){
  _setCount=0;
  var sc=document.getElementById('tools-set-count');
  if(sc) sc.textContent='0';
  _toolsSkipRest();
}
