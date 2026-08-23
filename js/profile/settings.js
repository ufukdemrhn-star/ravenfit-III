/* ══════════════════════════════════════════════════════════
   RavenFit — settings.js
   Ayarlar çekmecesi
   ══════════════════════════════════════════════════════════ */

/* ── SETTINGS DRAWER ─────────────────────────────────────── */

/* Depolama göstergesini günceller — çekmece her açıldığında çağrılır. */
function _renderStorageUsage(){
  if(typeof _lsKullanim!=='function') return;
  var k=_lsKullanim();
  var txt=document.getElementById('storage-usage-txt');
  var bar=document.getElementById('storage-usage-bar');
  var not=document.getElementById('storage-usage-note');
  if(txt) txt.textContent=k.toplamKB+' KB';
  if(bar){
    bar.style.width=Math.max(2,k.doluluk)+'%';
    bar.style.background = k.doluluk>=85 ? 'var(--accent)'
                         : k.doluluk>=60 ? 'var(--warn)'
                         : 'var(--success)';
  }
  if(not){
    if(k.doluluk>=85){
      not.innerHTML='⚠️ <strong style="color:var(--accent)">Depolama doluyor.</strong> Verilerini dışa aktarıp yedekle.';
    } else {
      var enBuyuk=k.kalemler[0];
      var adlar={rf_workout_logs:'antrenman geçmişi',rf_entries:'ölçüm kayıtları',
                 avatar:'profil fotoğrafı',rf_data:'profil verisi',
                 rf_custom_workouts:'özel programlar'};
      not.textContent = enBuyuk
        ? 'En çok yer kaplayan: '+(adlar[enBuyuk.anahtar]||enBuyuk.anahtar)+' ('+Math.round(enBuyuk.bayt/1024)+' KB)'
        : '';
    }
  }
}

function openSettingsDrawer(){
  document.getElementById('settings-drawer').classList.add('open');
  document.getElementById('sdw-overlay').classList.add('open');
  /* Birim + seviye butonlarını sync et */
  var unit=getUnit();
  document.querySelectorAll('[data-unit-btn]').forEach(function(b){
    var isSel=b.dataset.unitBtn===unit;
    b.style.background=isSel?'var(--accent-btn)':'transparent';
    b.style.color=isSel?'var(--on-accent)':'var(--text2)';
  });
  refreshLevelButtons();
  _renderStorageUsage();
}

function closeSettingsDrawer(){
  document.getElementById('settings-drawer').classList.remove('open');
  document.getElementById('sdw-overlay').classList.remove('open');
}

function refreshLevelButtons(){
  var mode=getUserLevelMode();
  document.querySelectorAll('[data-level-btn]').forEach(function(b){
    var isSel=b.dataset.levelBtn===mode;
    b.style.background=isSel?'var(--accent-btn)':'var(--card2)';
    b.style.color=isSel?'var(--on-accent)':'var(--text2)';
    b.style.borderColor=isSel?'var(--accent-btn)':'var(--border)';
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
