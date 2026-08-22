/* ══════════════════════════════════════════════════════════
   RavenFit — storage.js
   localStorage okuma/yazma, dışa/içe aktarma
   ══════════════════════════════════════════════════════════ */

function getEntries(){try{return JSON.parse(localStorage.getItem('rf_entries')||'[]');}catch(e){return[];}}

/* Merkezi entry yazma — tüm ölçüm kayıtları buradan geçer.
   Modülerleşmede → js/core/storage.js */

function _setEntries(entries){
  try { localStorage.setItem('rf_entries', JSON.stringify(entries)); }
  catch(e){ console.warn('_setEntries hata:', e); }
}

function resetAll(){
  showConfirm('Tüm Verileri Sıfırla','Tüm veriler, ölçümler ve geçmiş kayıtlar silinecek. Emin misin?',function(){
    localStorage.removeItem('rf_data');localStorage.removeItem('rf_entries');localStorage.removeItem('rf_water_today');localStorage.removeItem('rf_workout_logs');localStorage.removeItem('rf_custom_workouts');localStorage.removeItem('rf_supplements_used');localStorage.removeItem('rf_badges');
    /* Firebase'den de sil */
    if(_fbUser&&_fbDb){
      _fbDb.collection('users').doc(_fbUser.uid).set({rf_data:'',rf_entries:'[]',updated:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
    }
    U={};R={};A={};BT={};selST=null;selGL=null;step=0;clearInterval(_chronoInterval);clearInterval(_restInterval);_setCount=0;_chronoRunning=false;_chronoMs=0;_restActive=false;_suppStep=0;_suppAnswers={};
    document.querySelectorAll('#wizard input.fi').forEach(function(inp){inp.value='';});
    document.querySelectorAll('.gbtn.sel').forEach(function(el){el.classList.remove('sel');});
    document.querySelectorAll('.oc.sel').forEach(function(el){el.classList.remove('sel');});
    document.getElementById('bottom-nav').classList.remove('visible');
    goHome();
    showToast('Tüm veriler sıfırlandı.','success');
  },'Evet, Sıfırla');
}

/* ── Export / Import ─────────────────────────────────── */

function exportData(){
  var data={
    version:'0.6.1',
    exported:new Date().toISOString(),
    rf_data:localStorage.getItem('rf_data')||'{}',
    rf_entries:localStorage.getItem('rf_entries')||'[]'
  };
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='ravenfit_yedek_'+new Date().toLocaleDateString('tr-TR').replace(/\./g,'-')+'.json';
  a.click();
  showToast('✅ Veriler dışa aktarıldı!');
}

function importData(){
  var inp=document.createElement('input');
  inp.type='file';inp.accept='.json';
  inp.onchange=function(e){
    var file=e.target.files[0];if(!file)return;
    var reader=new FileReader();
    reader.onload=function(ev){
      try{
        var data=JSON.parse(ev.target.result);
        if(data.rf_data){localStorage.setItem('rf_data',data.rf_data);}
        if(data.rf_entries){localStorage.setItem('rf_entries',data.rf_entries);}
        saveToFirebase();
        showToast('✅ Veriler içe aktarıldı! Sayfa yenileniyor...');
        setTimeout(function(){location.reload();},1500);
      }catch(ex){showToast('❌ Dosya okunamadı.');}
    };
    reader.readAsText(file);
  };
  inp.click();
}
