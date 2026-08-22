/* ══════════════════════════════════════════════════════════
   RavenFit — index.js
   Hesaplayıcı yönlendirici
   ══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   🧮 HESAPLAYICILAR SİSTEMİ
   ══════════════════════════════════════════════════════════ */

var _activeCalc=null;

var _calcState={};

function openCalculator(id){
  _activeCalc=id;
  _calcState={};
  var names={
    '1rm':{title:'1RM TAHMİNİ',sub:'MAX KALDIRIŞ',icon:'💪'},
    'working-set':{title:'ÇALIŞMA SETİ',sub:'HEDEF % × REP',icon:'⚙️'},
    'sleep':{title:'UYKU DÖNGÜSÜ',sub:'REM OPTİMİZASYON',icon:'😴'},
    'pr':{title:'REKOR DENEMESİ',sub:'PR ATTEMPT',icon:'🎯'}
  };
  /* PR için: sonuç ekranı veya yarıda kalanları setup'a sıfırla
     (target/exercise/plates kullanıcı tercihi olarak kalır) */
  if(id==='pr' && _pr){
    if(_pr.screen==='result' || _pr.screen==='attempt-active' || _pr.screen==='warmup-active'){
      _resetPRState();
    }
    /* Setup ekranı zaten yarıda kalmışsa olduğu gibi devam et */
    if(!_pr.screen) _pr.screen='setup';
  }
  var info=names[id]||{title:id.toUpperCase(),sub:'HESAPLAYICI',icon:'🧮'};
  document.getElementById('calc-header-title').textContent=info.icon+' '+info.title;
  document.getElementById('calc-header-sub').textContent=info.sub;
  document.getElementById('calc-overlay').classList.add('active');
  renderCalculator(id);
}

function closeCalculator(){
  var wasActive=_activeCalc;
  _activeCalc=null;
  document.getElementById('calc-overlay').classList.remove('active');
  /* PR timer cleanup */
  if(_pr && _pr._restTimer){
    clearInterval(_pr._restTimer);
    _pr._restTimer=null;
  }
  /* Araçlar sayfası aktifse refresh (preview güncellensin) */
  if(document.getElementById('workout-main')){
    var wm=document.getElementById('workout-main');
    /* Sadece araçlar sayfasındaysa */
    if(wm.innerHTML.indexOf('🛠️ Araçlar')>=0){
      renderWorkoutTools();
    }
  }
}

function renderCalculator(id){
  var body=document.getElementById('calc-body');
  if(!body) return;
  if(id==='1rm') body.innerHTML=_calc1RM();
  else if(id==='working-set') body.innerHTML=_calcWorkingSet();
  else if(id==='sleep') body.innerHTML=_calcSleep();
  else if(id==='pr') _renderPR();
  else body.innerHTML='<div style="text-align:center;color:var(--text2);padding:40px">🚧 Yapım aşamasında</div>';
}
