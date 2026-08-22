/* ══════════════════════════════════════════════════════════
   RavenFit — data-loader.js
   JSON veri dosyalarını yükler
   ══════════════════════════════════════════════════════════ */

/* ── JSON VERİ YÜKLE ─────────────────────────────────── */

function loadDataFiles(){
  var base=window.location.protocol==='file:'?null:(window.location.origin+window.location.pathname.replace(/\/[^/]*$/,'/'));
  if(!base)return;
  /* Cache-busting: her yükleme yeni timestamp ile */
  var v='?v='+Date.now();
  var load=function(url,name,cb){
    fetch(url,{cache:'no-cache'})
      .then(function(r){
        if(!r.ok) throw new Error('HTTP '+r.status);
        return r.json();
      })
      .then(function(d){
        cb(d);
        console.log('✓ '+name+' yüklendi:', d.exercises?d.exercises.length+' egzersiz':'OK');
      })
      .catch(function(err){
        console.error('✗ '+name+' yükleme hatası:',err.message,url);
      });
  };
  load(base+'data/conditions.json'+v,         'conditions',  function(d){CONDITIONS_DATA=d;});
  load(base+'data/exercises-fitness.json'+v,  'fitness ex',  function(d){EXERCISES_DATA=d;});
  load(base+'data/workouts-fitness.json'+v,   'fitness wk',  function(d){WORKOUTS_DATA=d;});
  load(base+'data/exercises-swimming.json'+v, 'swim ex',     function(d){EXERCISES_SWIM=d;});
  load(base+'data/workouts-swimming.json'+v,  'swim wk',     function(d){WORKOUTS_SWIM=d;});
  load(base+'data/exercises-posture.json'+v,  'posture ex',  function(d){EXERCISES_POST=d;});
  load(base+'data/workouts-posture.json'+v,   'posture wk',  function(d){WORKOUTS_POST=d;});
  load(base+'data/badges.json'+v,             'badges',      function(d){BADGES_DATA=d;});
}
