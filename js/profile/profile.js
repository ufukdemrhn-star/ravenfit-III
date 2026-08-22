/* ══════════════════════════════════════════════════════════
   RavenFit — profile.js
   Profil ölçü tablosu
   ══════════════════════════════════════════════════════════ */

function renderProfilMlist(){
  if(!R.bf)return;
  var male=U.gender==='male';
  var entries=getEntries();
  var first=entries.length>0?entries[0]:null;          /* En eski = başlangıç */
  var last=entries.length>1?entries[entries.length-1]:null; /* En yeni = şu an */

  function diffBadge(cur,prev,lowerBetter){
    if(cur==null||prev==null)return'';
    var d=Math.round((parseFloat(cur)-parseFloat(prev))*10)/10;
    if(d===0)return'<span style="font-size:10px;color:var(--text3)"> —</span>';
    var good=(lowerBetter&&d<0)||(!lowerBetter&&d>0);
    var col=good?'var(--success)':'var(--accent)';
    return'<span style="font-size:10px;color:'+col+';font-weight:700"> '+(d>0?'↑':'↓')+Math.abs(d)+'</span>';
  }

  /* Şu An değerleri: önce en yeni entry, yoksa U objesi */
  function curVal(k){
    if(last&&last[k]!=null)return last[k];
    return U[k]||null;
  }
  function curCalc(k){
    /* hesaplanan değerler (bf, lm, ffmi) sadece son analizden */
    if(last&&last[k]!=null)return last[k];
    if(k==='bf')return R.bf?parseFloat(R.bf.toFixed(2)):null;
    if(k==='lm')return R.lm?parseFloat(R.lm.toFixed(2)):null;
    if(k==='ffmi')return R.ffmi?parseFloat(R.ffmi.toFixed(2)):null;
    return null;
  }

  var fields=[
    {l:'Kilo (kg)',    k:'weight',  cur:curVal('weight'),   lb:true},
    {l:'Yağ Oranı %', k:'bf',      cur:curCalc('bf'),      lb:true},
    {l:'Yağsız Kütle',k:'lm',      cur:curCalc('lm'),      lb:false},
    {l:'FFMI',        k:'ffmi',    cur:curCalc('ffmi'),     lb:false},
    {l:'Boyun (cm)',  k:'neck',    cur:curVal('neck'),      lb:false},
    {l:'Bel (cm)',    k:'waist',   cur:curVal('waist'),     lb:true},
    male?{l:'Omuz (cm)',k:'shoulder',cur:curVal('shoulder'),lb:false}
        :{l:'Kalça (cm)',k:'hip',    cur:curVal('hip'),     lb:false},
    {l:'Göğüs (cm)', k:'chest',   cur:curVal('chest'),     lb:false},
    {l:'Kol (cm)',   k:'arm',     cur:curVal('arm'),        lb:false},
  ];

  var html='';

  if(first){
    html+='<div style="display:grid;grid-template-columns:1fr 80px 80px;gap:0;margin-bottom:10px;border:1px solid var(--border);border-radius:10px;overflow:hidden">'+
      '<div style="background:var(--card2);padding:7px 8px;font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text2);letter-spacing:.5px">ÖLÇÜ</div>'+
      '<div style="background:var(--card2);padding:7px 8px;font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text2);letter-spacing:.5px;text-align:center">BAŞLANGIÇ</div>'+
      '<div style="background:var(--card2);padding:7px 8px;font-size:9px;font-weight:700;text-transform:uppercase;color:var(--accent);letter-spacing:.5px;text-align:center">ŞU AN</div>';
    fields.forEach(function(f){
      var fv=first[f.k]!=null?parseFloat(first[f.k]):null;
      var cv=f.cur!=null?parseFloat(f.cur):null;
      if(fv==null&&cv==null)return;
      html+=
        '<div style="padding:8px;font-size:11px;color:var(--text2);border-top:1px solid var(--border)">'+f.l+'</div>'+
        '<div style="padding:8px;font-size:12px;font-weight:600;text-align:center;border-top:1px solid var(--border);color:var(--text3)">'+(fv!=null?fv:'—')+'</div>'+
        '<div style="padding:8px;font-size:12px;font-weight:700;color:var(--accent);text-align:center;border-top:1px solid var(--border)">'+(cv!=null?cv:'—')+diffBadge(cv,fv,f.lb)+'</div>';
    });
    html+='</div>';
    html+='<div style="font-size:10px;color:var(--text3);text-align:center">'+
      '📅 Başlangıç: '+first.date+(last?' &nbsp;·&nbsp; Son: '+last.date:'')+'</div>';
  } else {
    html+='<div style="font-size:12px;color:var(--text2);margin-bottom:8px">Haftalık takipten ölçü girdikten sonra başlangıç karşılaştırması burada görünür.</div>';
    fields.forEach(function(f){
      if(f.cur==null)return;
      html+='<div class="mlist-row"><div class="mlist-lbl">'+f.l+'</div><div class="mlist-val">'+f.cur+'</div></div>';
    });
  }

  var el=document.getElementById('mlist-profil');
  if(el)el.innerHTML=html;
}
