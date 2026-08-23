/* ══════════════════════════════════════════════════════════
   RavenFit — state.js
   Global durum, birim ve seviye yardımcıları
   ══════════════════════════════════════════════════════════ */

/* ── STATE ────────────────────────────────────────────── */

var _rfConfirmCb=null;

var _rfConfirmCancelCb=null;

/* ══════════════════════════════════════════════════════════
   ⚖️ BİRİM SİSTEMİ (kg / lb)
   ══════════════════════════════════════════════════════════ */

function getUnit(){return _lsGet('rf_unit')||'kg';}

function setUnit(u){
  _lsSet('rf_unit',u);
  saveToFirebase();
  /* Anlık gösterim güncelleme */
  document.querySelectorAll('[data-unit-btn]').forEach(function(b){
    b.classList.toggle('sel',b.dataset.unitBtn===u);
  });
  /* Açık hesaplayıcı varsa yeniden render */
  if(_activeCalc) renderCalculator(_activeCalc);
  showToast('⚖️ Birim: '+u.toUpperCase(),'success');
}

function unitToKg(val){
  if(val==null||val==='')return null;
  var v=parseFloat(val);if(isNaN(v))return null;
  return getUnit()==='lb'?v/2.20462:v;
}

function unitLabel(){return getUnit().toUpperCase();}

/* ══════════════════════════════════════════════════════════
   🎚️ KULLANICI SEVİYE SİSTEMİ (otomatik + manuel override)
   ══════════════════════════════════════════════════════════ */

function getUserLevelMode(){return _lsGet('rf_level_mode')||'auto';}

function setUserLevelMode(m){
  _lsSet('rf_level_mode',m);
  saveToFirebase();
}

function getUserLevel(){
  var mode=getUserLevelMode();
  if(mode==='beginner') return 'beginner';
  if(mode==='intermediate') return 'intermediate';
  if(mode==='advanced') return 'advanced';
  /* Otomatik hesapla */
  var logs=getWorkoutLogs();
  if(logs.length>=50) return 'advanced';
  if(logs.length>=10) return 'intermediate';
  return 'beginner';
}

function getUserLevelLabel(){
  var l=getUserLevel();
  var map={beginner:'🌱 Yeni Başlayan',intermediate:'💪 Orta Seviye',advanced:'🔥 İleri Seviye'};
  return map[l]||'—';
}

var step=0, U={}, R={}, A={}, BT={}, selST=null, selGL=null, _editingEntryIdx=null;

var CONDITIONS_DATA=null;

var EXERCISES_DATA=null;

var WORKOUTS_DATA=null;

var EXERCISES_SWIM=null;

var WORKOUTS_SWIM=null;

var EXERCISES_POST=null;

var WORKOUTS_POST=null;

var BADGES_DATA=null;

/* toggleBranch ve renderBranchManager yeni workout koduna taşındı */

var _suppStep=0,_suppAnswers={},_suppMaxStep=9;

var _chronoRunning=false,_chronoStart=0,_chronoMs=0,_chronoInterval=null;

var _restTime=60,_restRemain=0,_restInterval=null,_setCount=0,_restActive=false;

_suppStep=0;_suppAnswers={};

/* NOT: Uygulama başlatma kodu buradan js/app.js'e taşındı.
   Modülerleşme sırasında bu blok yanlışlıkla iki yerde kalmıştı ve
   applyTheme / loadDataFiles / showAuthScreen iki kez çalışıyordu
   (8 JSON dosyası için 16 fetch isteği). Tek kaynak: js/app.js */

function saveData(){
  var str=JSON.stringify({U:U,R:R,A:A,BT:BT,selST:selST,selGL:selGL,conditions:U.conditions||[]});
  _lsSet('rf_data',str);
  if(!_isGuest)saveToFirebase();
}
