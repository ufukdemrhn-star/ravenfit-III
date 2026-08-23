/* ══════════════════════════════════════════════════════════
   RavenFit — branches.js
   Branş sistemi
   ══════════════════════════════════════════════════════════ */

/* ── BRANŞ SİSTEMİ ───────────────────────────────────────── */

var BRANCH_DEFS=[
  {id:'fitness',   label:'GYM',       icon:'🏋️', desc:'Ağırlık antrenmanı & vücut geliştirme', always:true},
  {id:'swimming',  label:'Yüzme',     icon:'🏊', desc:'Havuz antrenmanları & stil çalışmaları'},
  {id:'boxing',    label:'Boks',      icon:'🥊', desc:'Boks teknikleri & kondisyon', coming:true},
  {id:'yoga',      label:'Yoga',      icon:'🧘', desc:'Esneklik, denge ve nefes çalışması', coming:true},
  {id:'posture',   label:'Postür & Hareket', icon:'🧘', desc:'Duruş bozuklukları, ağrı yönetimi ve mobilite çalışmaları'},
  {id:'gymnastics',label:'Jimnastik', icon:'🤸', desc:'Hareketlilik & vücut ağırlığı kontrolü', coming:true}
];

function getUserBranches(){
  try{return JSON.parse(_lsGet('rf_branches')||'["fitness"]');}catch(e){return['fitness'];}
}

function saveUserBranches(arr){
  _lsSet('rf_branches',JSON.stringify(arr));
  saveToFirebase();
}

/* ══════════════════════════════════════════════════════════
   BRANŞ YÖNETİMİ
   ══════════════════════════════════════════════════════════ */

function renderBranchManager(){
  var el=document.getElementById('workout-main');
  if(!el) return;
  var active=getUserBranches();

  var html='<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">';
  html+='<button class="btn btn-s" onclick="renderWorkoutHome()" style="padding:8px 12px;font-size:12px">← Geri</button>';
  html+='<div style="font-size:16px;font-weight:700">Branşlarım</div></div>';
  html+='<div style="font-size:12px;color:var(--text2);margin-bottom:12px">Yaptığın sporları seç. Sadece seçtiklerin ana ekranda görünür.</div>';

  BRANCH_DEFS.forEach(function(b){
    var isActive=active.indexOf(b.id)>=0;
    html+='<div class="rc" style="padding:12px 14px;cursor:pointer;opacity:'+(b.coming?'.55':'1')+'" onclick="toggleBranch(\''+b.id+'\')">';
    html+='<div style="display:flex;align-items:center;gap:12px">';
    html+='<div style="font-size:26px;width:36px;text-align:center">'+b.icon+'</div>';
    html+='<div style="flex:1"><div style="font-size:14px;font-weight:700">'+b.label;
    if(b.coming) html+=' <span style="font-size:9px;background:var(--card2);border-radius:5px;padding:2px 6px;color:var(--text3)">Yakında</span>';
    if(b.always) html+=' <span style="font-size:9px;background:color-mix(in srgb, var(--success) 15%, transparent);border-radius:5px;padding:2px 6px;color:var(--success)">Zorunlu</span>';
    html+='</div>';
    html+='<div style="font-size:11px;color:var(--text2)">'+b.desc+'</div></div>';
    html+='<div style="width:26px;height:26px;border-radius:50%;border:2px solid '+(isActive?'var(--accent)':'var(--border)')+';background:'+(isActive?'var(--accent)':'none')+';display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;flex-shrink:0">'+(isActive?'✓':'')+'</div>';
    html+='</div></div>';
  });

  el.innerHTML=html;
}

function toggleBranch(id){
  var def=BRANCH_DEFS.find(function(b){return b.id===id;});
  if(!def||def.always) return;
  if(def.coming){ showToast('🚧 Bu branş yakında geliyor!'); return; }
  var list=getUserBranches();
  var idx=list.indexOf(id);
  if(idx>=0){ list.splice(idx,1); showToast('Branş kaldırıldı: '+def.label); }
  else { list.push(id); showToast('✅ Branş eklendi: '+def.label); }
  saveUserBranches(list);
  renderBranchManager();
}
