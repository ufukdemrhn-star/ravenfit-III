/* ══════════════════════════════════════════════════════════
   RavenFit — conditions.js
   Özel sağlık durumları
   ══════════════════════════════════════════════════════════ */

/* ── ÖZEL DURUMLAR (WIZARD S6) ───────────────────────── */

var BUILTIN_CONDITIONS=[
  /* Grup 1: Sağlık */
  {id:'cardiovascular', label_tr:'Kalp / Kardiyovasküler Hastalık', icon:'❤️', group:'saglik'},
  {id:'hypertension',   label_tr:'Hipertansiyon (Yüksek Tansiyon)',  icon:'🔴', group:'saglik'},
  {id:'diabetes-type1', label_tr:'Tip 1 Diyabet',                    icon:'🩸', group:'saglik'},
  {id:'diabetes-type2', label_tr:'Tip 2 Diyabet',                    icon:'🩸', group:'saglik'},
  {id:'asthma',         label_tr:'Astım',                            icon:'🫁', group:'saglik'},
  {id:'osteoporosis',   label_tr:'Osteoporoz / Kemik Erimesi',       icon:'🦴', group:'saglik'},
  {id:'epilepsy',       label_tr:'Epilepsi',                         icon:'⚡', group:'saglik'},
  /* Grup 2: Fiziksel Durum */
  {id:'lower-back',     label_tr:'Bel Fıtığı / Bel Ağrısı',         icon:'🔧', group:'fiziksel'},
  {id:'knee-injury',    label_tr:'Diz Rahatsızlığı',                 icon:'🦵', group:'fiziksel'},
  {id:'shoulder-injury',label_tr:'Omuz Rahatsızlığı',                icon:'💪', group:'fiziksel'},
  {id:'pregnancy',      label_tr:'Hamilelik',                        icon:'🤱', group:'fiziksel'},
  /* Grup 3: Beslenme & Diyet */
  {id:'vegetarian',     label_tr:'Vejetaryen',                       icon:'🥬', group:'beslenme'},
  {id:'vegan',          label_tr:'Vegan',                            icon:'🌱', group:'beslenme'},
  {id:'gluten',         label_tr:'Gluten Hassasiyeti / Çölyak',      icon:'🌾', group:'beslenme'},
  {id:'lactose',        label_tr:'Laktoz İntoleransı',               icon:'🥛', group:'beslenme'}
];

var CONDITIONS_GROUPS=[
  {id:'saglik',   label:'❤️ Sağlık Durumları'},
  {id:'fiziksel', label:'🏃 Fiziksel Durumlar'},
  {id:'beslenme', label:'🥗 Beslenme & Diyet'}
];

/* Condition ID → Türkçe etiket (icon dahil) */

function _condLabelTr(id){
  /* Önce JSON'dan, sonra BUILTIN'den ara */
  var list=(CONDITIONS_DATA && CONDITIONS_DATA.conditions) || BUILTIN_CONDITIONS || [];
  for(var i=0;i<list.length;i++){
    if(list[i].id===id){
      var icon=list[i].icon||'';
      var label=list[i].label_tr||list[i].name_tr||list[i].label||id;
      return (icon?icon+' ':'')+label;
    }
  }
  /* Bulunamazsa BUILTIN'den son şans */
  for(var j=0;j<BUILTIN_CONDITIONS.length;j++){
    if(BUILTIN_CONDITIONS[j].id===id) return BUILTIN_CONDITIONS[j].icon+' '+BUILTIN_CONDITIONS[j].label_tr;
  }
  return id;
}

function renderConditionsStep(){
  var rawList=CONDITIONS_DATA&&CONDITIONS_DATA.conditions?CONDITIONS_DATA.conditions:BUILTIN_CONDITIONS;
  /* JSON'dan gelen condition'larda 'group' alanı yok — BUILTIN'den fallback ekle */
  var builtinMap={};
  BUILTIN_CONDITIONS.forEach(function(b){builtinMap[b.id]=b;});
  var list=rawList.map(function(c){
    if(c.group) return c;
    var b=builtinMap[c.id];
    return {
      id:c.id,
      label_tr:c.label_tr||(b&&b.label_tr)||c.id,
      icon:c.icon||(b&&b.icon)||'⚠️',
      group:(b&&b.group)||'saglik'  /* fallback: bilinmeyenleri sağlık grubuna at */
    };
  });
  /* BUILTIN'de olup CONDITIONS_DATA'da olmayanları da ekle (güvenlik için) */
  BUILTIN_CONDITIONS.forEach(function(b){
    if(!list.some(function(c){return c.id===b.id;})) list.push(b);
  });

  var selected=U.conditions||[];
  var grid=document.getElementById('conditions-grid');
  if(!grid)return;

  var html='';
  CONDITIONS_GROUPS.forEach(function(grp){
    var items=list.filter(function(c){return c.group===grp.id;});
    if(!items.length)return;
    html+='<div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin:8px 0 5px 2px">'+grp.label+'</div>';
    html+='<div style="display:grid;gap:6px">';
    items.forEach(function(c){
      var sel=selected.indexOf(c.id)>=0;
      html+='<div class="oc compact'+(sel?' sel':'')+'" onclick="toggleCondition(\''+c.id+'\',this)" style="user-select:none">'+
        '<div class="oi">'+c.icon+'</div>'+
        '<div class="ot"><div class="on">'+c.label_tr+'</div></div>'+
        '<div class="orad"></div></div>';
    });
    html+='</div>';
  });
  grid.innerHTML=html;
}

function toggleCondition(id,el){
  if(!U.conditions)U.conditions=[];
  var idx=U.conditions.indexOf(id);
  if(idx>=0){U.conditions.splice(idx,1);el.classList.remove('sel');}
  else{U.conditions.push(id);el.classList.add('sel');}
}

/* ── PROFİL > HESABIM: ÖZEL DURUMLAR DÜZENLEME ─────────────── */

/* Geçici state — overlay açıkken seçimler buraya yazılır */

var _condEditDraft = [];

function renderConditionsSummary(){
  var el=document.getElementById('conditions-summary');
  if(!el)return;
  var userConds=(U&&U.conditions)?U.conditions:[];
  if(!userConds.length){
    el.innerHTML='<span style="color:var(--text3)">Henüz özel durum seçilmemiş</span>';
    return;
  }
  /* Etiketleri al */
  var labels=userConds.map(function(id){return _condLabelTr(id);}).filter(Boolean);
  if(labels.length<=3){
    el.innerHTML=labels.join(' · ');
  } else {
    el.innerHTML=labels.slice(0,3).join(' · ')+' <span style="color:var(--text3)">+ '+(labels.length-3)+' daha</span>';
  }
}

function openConditionsEdit(){
  /* Mevcut seçimleri draft'a kopyala */
  _condEditDraft = (U.conditions||[]).slice();
  _renderConditionsEditGrid();
  document.getElementById('conditions-edit-overlay').classList.add('active');
  document.body.style.overflow='hidden';
}

function closeConditionsEdit(){
  document.getElementById('conditions-edit-overlay').classList.remove('active');
  document.body.style.overflow='';
}

function saveConditionsEdit(){
  /* Draft'tan U'ya kaydet */
  U.conditions = _condEditDraft.slice();
  try { saveData(); } catch(e){ console.warn('saveData hatası:',e); }
  /* Hesabım kartındaki özeti yenile */
  renderConditionsSummary();
  /* Overlay'i kapat */
  closeConditionsEdit();
  /* Bildirim */
  if(typeof showToast==='function'){
    showToast('✅ Özel durumların güncellendi','success');
  }
}

function _toggleConditionEdit(id, el){
  var idx=_condEditDraft.indexOf(id);
  if(idx>=0){
    _condEditDraft.splice(idx,1);
    if(el) el.classList.remove('sel');
  } else {
    _condEditDraft.push(id);
    if(el) el.classList.add('sel');
  }
}

function _renderConditionsEditGrid(){
  var grid=document.getElementById('conditions-edit-grid');
  if(!grid)return;

  var rawList=CONDITIONS_DATA&&CONDITIONS_DATA.conditions?CONDITIONS_DATA.conditions:BUILTIN_CONDITIONS;
  var builtinMap={};
  BUILTIN_CONDITIONS.forEach(function(b){builtinMap[b.id]=b;});
  var list=rawList.map(function(c){
    if(c.group) return c;
    var b=builtinMap[c.id];
    return {
      id:c.id,
      label_tr:c.label_tr||(b&&b.label_tr)||c.id,
      icon:c.icon||(b&&b.icon)||'⚠️',
      group:(b&&b.group)||'saglik'
    };
  });
  BUILTIN_CONDITIONS.forEach(function(b){
    if(!list.some(function(c){return c.id===b.id;})) list.push(b);
  });

  var html='';
  CONDITIONS_GROUPS.forEach(function(grp){
    var items=list.filter(function(c){return c.group===grp.id;});
    if(!items.length)return;
    html+='<div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin:14px 0 6px 2px">'+grp.label+'</div>';
    html+='<div style="display:grid;gap:6px">';
    items.forEach(function(c){
      var sel=_condEditDraft.indexOf(c.id)>=0;
      html+='<div class="oc compact'+(sel?' sel':'')+'" onclick="_toggleConditionEdit(\''+c.id+'\',this)" style="user-select:none">'+
        '<div class="oi">'+c.icon+'</div>'+
        '<div class="ot"><div class="on">'+c.label_tr+'</div></div>'+
        '<div class="orad"></div></div>';
    });
    html+='</div>';
  });
  grid.innerHTML=html;
}
