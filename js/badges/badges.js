/* ══════════════════════════════════════════════════════════
   RavenFit — badges.js
   Rozet sistemi ve kutlama
   ══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   🏅 ROZET / BADGE SİSTEMİ
   ══════════════════════════════════════════════════════════ */

/* Fallback badge tanımları (badges.json yüklenemezse) */

var BADGES_FALLBACK=[
  {id:'first_workout',name_tr:'İlk Adım',desc_tr:'İlk antrenmanını tamamladın!',icon:'🎯',condition_type:'workout_count',condition_value:1,branch:'all'},
  {id:'analysis_done',name_tr:'Kendini Tanı',desc_tr:'Vücut analizini tamamladın!',icon:'🧬',condition_type:'analysis_complete',condition_value:1,branch:'all'},
  {id:'streak_7',name_tr:'Demir İrade',desc_tr:'7 gün üst üste antrenman yaptın!',icon:'🔥',condition_type:'streak',condition_value:7,branch:'all'},
  {id:'streak_14',name_tr:'Durdurulamaz',desc_tr:'14 gün üst üste antrenman!',icon:'💎',condition_type:'streak',condition_value:14,branch:'all'},
  {id:'streak_30',name_tr:'Efsane',desc_tr:'30 gün üst üste antrenman yaptın!',icon:'⚡',condition_type:'streak',condition_value:30,branch:'all'},
  {id:'workout_10',name_tr:'Çaylak',desc_tr:'10 antrenman tamamladın!',icon:'💪',condition_type:'workout_count',condition_value:10,branch:'all'},
  {id:'workout_25',name_tr:'Kararlı',desc_tr:'25 antrenman tamamladın!',icon:'🎖️',condition_type:'workout_count',condition_value:25,branch:'all'},
  {id:'workout_50',name_tr:'Veteran',desc_tr:'50 antrenman tamamladın!',icon:'🏆',condition_type:'workout_count',condition_value:50,branch:'all'},
  {id:'workout_100',name_tr:'Centurion',desc_tr:'100 antrenman! Gerçek bir savaşçısın.',icon:'👑',condition_type:'workout_count',condition_value:100,branch:'all'},
  {id:'first_swim',name_tr:'İlk Dalış',desc_tr:'İlk yüzme antrenmanını tamamladın!',icon:'🏊',condition_type:'workout_count_branch',condition_value:1,branch:'swimming'},
  {id:'first_posture',name_tr:'Dik Dur',desc_tr:'İlk postür antrenmanını tamamladın!',icon:'🧘',condition_type:'workout_count_branch',condition_value:1,branch:'posture'},
  {id:'entries_4',name_tr:'Takipçi',desc_tr:'4 haftalık ölçüm kaydın var!',icon:'📊',condition_type:'entries_count',condition_value:4,branch:'all'},
  {id:'entries_12',name_tr:'Veri Gurusu',desc_tr:'12 haftalık ölçüm takibi!',icon:'📈',condition_type:'entries_count',condition_value:12,branch:'all'},
  {id:'multi_branch',name_tr:'Çok Yönlü',desc_tr:'2+ branşta aktif antrenman yapıyorsun!',icon:'🌟',condition_type:'branch_active',condition_value:2,branch:'all'},
  {id:'supp_master',name_tr:'Supplement Ustası',desc_tr:'5+ supplement kullanıyorsun!',icon:'💊',condition_type:'supplement_count',condition_value:5,branch:'all'},
  {id:'water_champ',name_tr:'Su Şampiyonu',desc_tr:'Günlük su hedefini tamamladın!',icon:'💧',condition_type:'water_complete',condition_value:1,branch:'all'}
];

function _getBadgeDefs(){
  return (BADGES_DATA&&BADGES_DATA.badges)||BADGES_FALLBACK;
}

function getEarnedBadges(){
  try{return JSON.parse(_lsGet('rf_badges')||'[]');}catch(e){return[];}
}

function saveEarnedBadges(arr){
  _lsSet('rf_badges',JSON.stringify(arr));
  saveToFirebase();
}

/* ── Ana kontrol fonksiyonu ── */

var _badgeQueue=[];

var _badgeShowing=false;

function checkAndAwardBadges(){
  var defs=_getBadgeDefs();
  var earned=getEarnedBadges();
  var logs=getWorkoutLogs();
  var entries=getEntries();
  var streak=_calcStreak(logs);
  var newBadges=[];

  defs.forEach(function(badge){
    /* Zaten kazanılmış mı? */
    if(earned.some(function(e){return e.id===badge.id;})) return;

    var met=false;
    switch(badge.condition_type){
      case 'workout_count':
        met=logs.length>=badge.condition_value;
        break;
      case 'workout_count_branch':
        var branchLogs=logs.filter(function(l){
          return _getBranchForProgram(l.programId)===badge.branch||(l.branch===badge.branch);
        });
        met=branchLogs.length>=badge.condition_value;
        break;
      case 'streak':
        met=streak>=badge.condition_value;
        break;
      case 'analysis_complete':
        met=!!(R&&R.bf&&R.bf>0);
        break;
      case 'entries_count':
        met=entries.length>=badge.condition_value;
        break;
      case 'branch_active':
        /* Kullanıcının kaç farklı branşta antrenman logu var */
        var activeBranches={};
        logs.forEach(function(l){
          var b=l.branch||_getBranchForProgram(l.programId);
          activeBranches[b]=true;
        });
        met=Object.keys(activeBranches).length>=badge.condition_value;
        break;
      case 'supplement_count':
        met=getUserSupplements().length>=badge.condition_value;
        break;
      case 'water_complete':
        var wState=getWaterState();
        var wTarget=_calcWaterTarget();
        met=wState.count>=wTarget.cups&&wTarget.cups>0;
        break;
    }

    if(met){
      var now=new Date();
      var record={
        id:badge.id,
        date:now.toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric'}),
        timestamp:now.getTime()
      };
      earned.push(record);
      newBadges.push(badge);
    }
  });

  if(newBadges.length){
    saveEarnedBadges(earned);
    /* Sırayla popup göster */
    newBadges.forEach(function(b){ _badgeQueue.push(b); });
    _processNextBadge();
  }
}

function _processNextBadge(){
  if(_badgeShowing||!_badgeQueue.length) return;
  _badgeShowing=true;
  showBadgePopup(_badgeQueue.shift());
}

/* ── Kutlama popup'ı ── */

function showBadgePopup(badge){
  var overlay=document.getElementById('badge-popup-overlay');
  var iconEl=document.getElementById('badge-popup-icon');
  var nameEl=document.getElementById('badge-popup-name');
  var descEl=document.getElementById('badge-popup-desc');
  if(!overlay) return;

  iconEl.textContent=badge.icon;
  nameEl.textContent=badge.name_tr;
  descEl.textContent=badge.desc_tr;

  /* Konfeti oluştur */
  _spawnConfetti();

  overlay.classList.add('active');

  /* Vibrasyon */
  if(navigator.vibrate) try{navigator.vibrate([100,80,100,80,200]);}catch(e){}
}

function closeBadgePopup(){
  var overlay=document.getElementById('badge-popup-overlay');
  if(overlay) overlay.classList.remove('active');
  /* Konfeti temizle */
  var cc=document.getElementById('confetti-container');
  if(cc) cc.innerHTML='';
  _badgeShowing=false;
  /* Sırada bekleyen varsa göster */
  if(_badgeQueue.length){
    setTimeout(_processNextBadge,400);
  }
}

/* ── Konfeti oluşturucu ── */

function _spawnConfetti(){
  var container=document.getElementById('confetti-container');
  if(!container) return;
  container.innerHTML='';
  var colors=['var(--accent)','var(--success)','var(--warn)','var(--info)','#f72585','#7209b7','#4361ee','var(--success)','#ffd166','#ef476f'];
  var count=35;
  for(var i=0;i<count;i++){
    var piece=document.createElement('div');
    piece.className='confetti-piece';
    var color=colors[Math.floor(Math.random()*colors.length)];
    var left=Math.random()*100;
    var size=6+Math.random()*8;
    var fallDur=2+Math.random()*2.5;
    var fallDelay=Math.random()*1.2;
    var shape=Math.random()>0.5?'50%':'2px';
    piece.style.cssText='left:'+left+'%;width:'+size+'px;height:'+size+'px;background:'+color+';border-radius:'+shape+';--fall-duration:'+fallDur+'s;--fall-delay:'+fallDelay+'s';
    container.appendChild(piece);
  }
  /* Konfeti otomatik temizlensin */
  setTimeout(function(){
    if(container) container.innerHTML='';
  },5000);
}

/* ── Profil rozetleri render ── */

function renderProfileBadges(){
  var el=document.getElementById('profil-badges');
  if(!el) return;
  var defs=_getBadgeDefs();
  var earned=getEarnedBadges();

  if(!defs.length){
    el.innerHTML='<div style="font-size:12px;color:var(--text2)">Rozet verileri yükleniyor...</div>';
    return;
  }

  var earnedCount=0;
  var html='<div class="badge-grid">';
  defs.forEach(function(badge){
    var record=earned.find(function(e){return e.id===badge.id;});
    var isEarned=!!record;
    if(isEarned) earnedCount++;
    html+='<div class="badge-cell '+(isEarned?'earned':'locked')+'">';
    html+='<div class="badge-cell-icon">'+(isEarned?badge.icon:'🔒')+'</div>';
    html+='<div class="badge-cell-name">'+badge.name_tr+'</div>';
    if(isEarned&&record.date){
      html+='<div class="badge-cell-date">'+record.date+'</div>';
    } else {
      html+='<div class="badge-cell-date" style="font-size:8px;color:var(--text3)">'+badge.desc_tr+'</div>';
    }
    html+='</div>';
  });
  html+='</div>';

  /* Özet */
  var pct=defs.length>0?Math.round(earnedCount/defs.length*100):0;
  html+='<div style="margin-top:8px;font-size:10px;color:var(--text3);text-align:center">'+
    '🏅 '+earnedCount+' / '+defs.length+' rozet kazanıldı ('+pct+'%)</div>';

  el.innerHTML=html;
}
