/* ══════════════════════════════════════════════════════════
   RavenFit — settings.js
   Ayarlar çekmecesi
   ══════════════════════════════════════════════════════════ */

/* ── SETTINGS DRAWER ─────────────────────────────────────── */

function openSettingsDrawer(){
  document.getElementById('settings-drawer').classList.add('open');
  document.getElementById('sdw-overlay').classList.add('open');
  /* Birim + seviye butonlarını sync et */
  var unit=getUnit();
  document.querySelectorAll('[data-unit-btn]').forEach(function(b){
    var isSel=b.dataset.unitBtn===unit;
    b.style.background=isSel?'var(--accent)':'transparent';
    b.style.color=isSel?'#fff':'var(--text2)';
  });
  refreshLevelButtons();
}

function closeSettingsDrawer(){
  document.getElementById('settings-drawer').classList.remove('open');
  document.getElementById('sdw-overlay').classList.remove('open');
}

function refreshLevelButtons(){
  var mode=getUserLevelMode();
  document.querySelectorAll('[data-level-btn]').forEach(function(b){
    var isSel=b.dataset.levelBtn===mode;
    b.style.background=isSel?'var(--accent)':'var(--card2)';
    b.style.color=isSel?'#fff':'var(--text2)';
    b.style.borderColor=isSel?'var(--accent)':'var(--border)';
  });
  var info=document.getElementById('sdw-level-auto-info');
  if(info){
    if(mode==='auto'){
      info.textContent='🤖 Şu anki seviyen otomatik: '+getUserLevelLabel()+' ('+getWorkoutLogs().length+' antrenman kaydı)';
    } else {
      info.textContent='✋ Manuel olarak ayarladın: '+getUserLevelLabel();
    }
  }
}
