/* ══════════════════════════════════════════════════════════
   RavenFit — panels.js
   Beslenme panelleri: diyet, gizli kalori, öğün
   ══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   🍽️ BESLENME ARAÇLARI GRID + PANEL SİSTEMİ
   ══════════════════════════════════════════════════════════ */

var _activeBesPanel=null;

function renderBeslenmeToolsGrid(){
  var gridEl=document.getElementById('beslenme-tools-grid');
  var panelEl=document.getElementById('beslenme-panel-content');
  if(!gridEl) return;

  var tools=[
    {id:'supps',icon:'💊',label:'Supplementler',sub:'Test & Takip'},
    {id:'hidden',icon:'🍕',label:'Gizli Kalori',sub:'Kilo aldıranlar'},
    {id:'diet',icon:'🥗',label:'Beslenme',sub:'Diyet & öğün önerileri'}
  ];

  var html='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:8px">';
  tools.forEach(function(t){
    var isActive=_activeBesPanel===t.id;
    html+='<div onclick="toggleBeslenmePanel(\''+t.id+'\')" style="background:'+(isActive?'color-mix(in srgb, var(--success) 10%, transparent)':'var(--card)')+';border:1.5px solid '+(isActive?'var(--accent)':'var(--border)')+';border-radius:14px;padding:14px 8px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px;-webkit-tap-highlight-color:transparent;transition:all .18s">';
    html+='<div style="font-size:26px;line-height:1">'+t.icon+'</div>';
    html+='<div style="font-family:\'Bebas Neue\',cursive;font-size:14px;letter-spacing:.8px;color:'+(isActive?'var(--accent)':'var(--text)')+';line-height:1.1;text-align:center">'+t.label+'</div>';
    html+='<div style="font-size:9px;color:var(--text3);text-align:center">'+t.sub+'</div>';
    html+='</div>';
  });
  html+='</div>';
  gridEl.innerHTML=html;

  /* Panel içeriğini render et */
  if(!panelEl) return;
  if(!_activeBesPanel){panelEl.innerHTML='';return;}

  var phtml='';
  if(_activeBesPanel==='supps'){
    phtml+=_buildSuppsPanel();
  } else if(_activeBesPanel==='hidden'){
    phtml+=_buildHiddenCalPanel();
  } else if(_activeBesPanel==='diet'){
    phtml+=_buildDietPanel();
  }
  panelEl.innerHTML=phtml;

  /* Panel-spesifik post-render */
  if(_activeBesPanel==='supps') _postRenderSuppsPanel();
  if(_activeBesPanel==='hidden') _postRenderHiddenCal();
}

function toggleBeslenmePanel(id){
  _activeBesPanel=(_activeBesPanel===id)?null:id;
  renderBeslenmeToolsGrid();
}

/* ── Supplement paneli ── */

function _buildSuppsPanel(){
  var used=getUserSupplements();
  var html='<div class="rc" style="border-color:var(--accent);border-width:1.5px">';

  /* Supplement testi */
  html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">';
  html+='<div class="rct" style="margin-bottom:0">💊 Sana Uygun Supplementler</div>';
  html+='<button class="btn btn-p" onclick="openSuppModal()" style="font-size:11px;padding:6px 12px">🔬 Analizi Başlat</button>';
  html+='</div>';
  html+='<div id="supp-inline-result"></div>';

  /* Kullandığım supplementler */
  html+='<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">';
  html+='<div style="font-size:12px;font-weight:700;margin-bottom:8px">Kullandıklarım</div>';
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px" id="supps-used-grid">';
  SUPP_USED_LIST.forEach(function(s){
    var isUsed=used.indexOf(s.id)>=0;
    html+='<div onclick="toggleSuppUsed(\''+s.id+'\')" style="display:flex;align-items:center;gap:6px;padding:7px 8px;background:'+(isUsed?'color-mix(in srgb, var(--success) 10%, transparent)':'var(--card2)')+';border:1.5px solid '+(isUsed?'var(--success)':'var(--border)')+';border-radius:8px;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:all .15s">';
    html+='<div style="width:18px;height:18px;border-radius:4px;border:2px solid '+(isUsed?'var(--success)':'var(--border)')+';background:'+(isUsed?'var(--success)':'none')+';display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;flex-shrink:0">'+(isUsed?'✓':'')+'</div>';
    html+='<div style="font-size:11px;font-weight:'+(isUsed?'600':'400')+';color:'+(isUsed?'var(--text)':'var(--text2)')+'">'+s.emoji+' '+s.label+'</div>';
    html+='</div>';
  });
  html+='</div>';
  if(used.length) html+='<div style="margin-top:6px;font-size:10px;color:var(--text3)">✅ '+used.length+' aktif</div>';
  html+='</div></div>';
  return html;
}

function _postRenderSuppsPanel(){
  /* Eğer önceki analiz sonucu varsa inline'da göster */
  if(_lastSuppResults){
    var inlineEl=document.getElementById('supp-inline-result');
    if(inlineEl){
      var results=calcSuppScores(_suppAnswers);
      results.sort(function(a,b){return b.score-a.score;});
      var maxShow={min:1,low:2,mid:4,high:7}[_suppAnswers.budget]||3;
      var shown=results.filter(function(s){return s.score>0;}).slice(0,maxShow);
      var short='<div style="margin-top:6px">';
      short+='<div style="font-size:11px;color:var(--text2);margin-bottom:6px">✅ Son analiz:</div>';
      shown.slice(0,4).forEach(function(s){
        short+='<div style="font-size:11px;margin-bottom:3px;display:flex;align-items:center;gap:5px">'+
          '<span>'+s.emoji+'</span><strong>'+s.name+'</strong> <span style="color:var(--text3);font-size:9px">'+s.dose+'</span></div>';
      });
      short+='<button onclick="openLastSuppResults()" style="background:none;border:none;color:var(--accent);font-size:10px;cursor:pointer;padding:4px 0;font-family:\'Outfit\',sans-serif;font-weight:600">Tamamını Gör →</button>';
      short+='</div>';
      inlineEl.innerHTML=short;
    }
  }
}

/* ── Gizli Kalori paneli ── */

function _buildHiddenCalPanel(){
  var html='<div class="rc" style="border-color:var(--warn);border-width:1.5px">';
  html+='<div class="rct">🍕 Gizli Kilo Aldıranlar</div>';
  html+='<div style="font-size:11px;color:var(--text2);margin-bottom:10px">Farkında olmadan tükettiğin içeceklerin yıllık etkisini hesapla.</div>';
  html+='<div id="hidden-cal-panel-body"></div>';
  html+='</div>';
  return html;
}

function _postRenderHiddenCal(){
  var el=document.getElementById('hidden-cal-panel-body');
  if(!el) return;
  var rows=HIDDEN_CALS.map(function(item,i){
    return'<div class="hcal-row"><div class="hcal-name">'+item.name+'</div><div class="hcal-kcal">'+item.kcal+' kcal</div><input class="hcal-input" type="number" id="hcal-'+i+'" min="0" max="10" value="0" oninput="calcHiddenCals()"></div>';
  }).join('');
  el.innerHTML=rows+'<div id="hcal-result" style="margin-top:10px"></div>';
}

/* ── Diyet paneli ── */

function _buildDietPanel(){
  var html='<div class="rc" style="border-color:var(--success);border-width:1.5px">';
  /* Öğün önerileri */
  html+=_buildMealSuggestionsInline();
  /* Kişisel diyet önerileri */
  html+=_buildDietAdviceInline();
  html+='</div>';
  return html;
}

function _buildMealSuggestionsInline(){
  if(!R.goalCal) return '';
  var gl=selGL||R.recGoal;
  /* Eski → yeni map */
  var glMap={yag:'cut', idame:'maintain', kutle:'bulk'};
  if(glMap[gl]) gl=glMap[gl];
  var conds=U.conditions||[];
  var html='<div class="rct">🍽️ Öğün Önerileri</div>';
  var tips=[];
  if(gl==='bulk'){
    var mealCal=Math.round(R.goalCal/5);
    tips.push('Gün içinde 4-6 öğün. Öğün başı ~<strong>'+mealCal+' kcal</strong>.');
    tips.push('Antrenman öncesi/sonrası karbonhidrat yığ.');
  } else if(gl==='cut'){
    var mealCal3=Math.round(R.goalCal/3);
    tips.push('3 ana + 1-2 ara öğün. Ana öğün ~<strong>'+mealCal3+' kcal</strong>.');
    tips.push('Protein öncelikli, akşam karbo azalt.');
  } else if(gl==='recomp'){
    var mealCalR=Math.round(R.goalCal/4);
    tips.push('4 dengeli öğün. Öğün başı ~<strong>'+mealCalR+' kcal</strong>.');
    tips.push('Antrenman saatlerinde karbo yığ; diğer öğünlerde protein + sağlıklı yağ.');
  } else {
    var mealCal4=Math.round(R.goalCal/4);
    tips.push('3-4 dengeli öğün. Öğün başı ~<strong>'+mealCal4+' kcal</strong>.');
    tips.push('Karboları antrenman saatlerine yakın yığ.');
  }
  if(conds.indexOf('vegan')>=0) tips.push('<span style="color:var(--warn)">🌱</span> B12, omega-3 (alg bazlı), çinko takviyesi şart.');
  if(conds.indexOf('diabetes-type1')>=0||conds.indexOf('diabetes-type2')>=0) tips.push('<span style="color:var(--accent)">🩸</span> Karbo miktarı/zamanlamasını doktorunla planla.');
  tips.forEach(function(t){
    html+='<div style="font-size:11px;color:var(--text);margin-bottom:6px;line-height:1.5;padding-left:6px;border-left:2px solid var(--border)">'+t+'</div>';
  });
  return html;
}

function _buildDietAdviceInline(){
  if(!R.bf) return '';
  var gl=selGL||R.recGoal;
  var glMap={yag:'cut', idame:'maintain', kutle:'bulk'};
  if(glMap[gl]) gl=glMap[gl];
  var bp=determineBodyProfile(R.bf,R.ffmi,R.bmi);
  var gNames={cut:'🔥 Cut (Yağ Kaybı)', recomp:'♻️ Recomp', maintain:'⚖️ Maintain', bulk:'💪 Bulk'};
  var html='<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">';
  html+='<div style="font-size:12px;font-weight:700;margin-bottom:8px">🥗 Kişisel Diyet Önerileri</div>';
  var tips=[];
  tips.push('🎯 <strong>Hedef:</strong> '+(gNames[gl]||gl)+' — '+R.goalCal+' kcal/gün');
  tips.push('🥩 <strong>Protein:</strong> En az '+R.minProt+'g/gün (vücut ağırlığı: '+U.weight.toFixed(1)+' kg)');
  if(U.weight>R.iw.hi) tips.push('⚠️ İdeal aralığın ('+R.iw.lo+'-'+R.iw.hi+' kg) '+Math.round((U.weight-R.iw.hi)*10)/10+' kg üzerinde.');
  else if(U.weight<R.iw.lo) tips.push('⬆️ İdeal aralığın ('+R.iw.lo+'-'+R.iw.hi+' kg) '+Math.round((R.iw.lo-U.weight)*10)/10+' kg altında.');
  tips.push('🧬 <strong>'+bp.n+':</strong> '+getDietTipByProfile(bp.n));
  tips.push('💧 Günlük en az '+R.water.toFixed(1)+' lt su.');
  tips.forEach(function(t){
    html+='<div style="font-size:11px;color:var(--text);margin-bottom:5px;line-height:1.4">'+t+'</div>';
  });
  html+='</div>';
  return html;
}

/* ── DİYET ÖNERİLERİ YARDIMCILARI ────────────────────── */

var HIDDEN_CALS=[{name:'Cola (330ml)',kcal:140},{name:'Ice Tea (330ml)',kcal:130},{name:'Ayran (200ml)',kcal:77},{name:'Limonata (250ml)',kcal:120},{name:'Portakal Suyu (250ml)',kcal:110},{name:'Cappuccino (200ml)',kcal:80},{name:'Şekerli Çay (200ml)',kcal:30}];

function getDietTipByProfile(n){
  var m={'Obese (Obez)':'Önceliğin kalori açığı ve günlük hareketi artırmak. Haftada 0.5-1kg kayıp hedefle. Şekerli içecekleri tamamen kes.','Overweight (Kilolu)':'Kontrollü kalori açığı ile yağ kaybına odaklan. Protein ağırlıklı beslen, işlenmiş gıdaları azalt.','Skinny (Zayıf)':'Kalori fazlası ile beslen. Protein ağırlıklı, sık öğünler. Ağırlık antrenmanı şart.','Athletic (Atletik)':'Mevcut formu korumak için dengeli beslen. Makro dağılımına dikkat et, kalori idame düzeyinde tut.','Muscular (Kaslı)':'Kas kütleni korumak için yeterli protein al. Definasyon istiyorsan hafif kalori açığı uygula.','Skinny-fat':'Protein ağırlıklı beslen (2g/kg). Kalori idame veya hafif açıkta tut. Direnç antrenmanı ile kas kazan.','Bulky (Hacimli)':'Yavaş kalori açığı (300-400 kcal) ile cut dönemi başlat. Proteini yüksek tut, kas kaybını önle.','Lean (Yağsız/Fit)':'Kas kazanmak istiyorsan hafif kalori fazlası ekle. Protein odaklı beslen.','Fit':'Dengeli beslenmeye devam et. Hedefe göre kalori ayarla. Makro dağılımını koru.','Average (Ortalama)':'Tutarlı beslenme ve antrenman ile net bir hedefe yönel. Protein alımını artır.'};
  return m[n]||'Dengeli ve protein ağırlıklı beslenmeye odaklan.';
}

function calcHiddenCals(){
  var total=0;
  HIDDEN_CALS.forEach(function(item,i){
    var inp=document.getElementById('hcal-'+i);
    var count=inp?parseInt(inp.value)||0:0;
    total+=count*item.kcal;
  });
  var yearlyKg=Math.round(total*365/7700*10)/10;
  var el=document.getElementById('hcal-result');
  if(el)el.innerHTML='<div style="font-size:11px;color:var(--text2)">Yıllık Tahmini Kilo Alımı</div><div class="hcal-result-big">'+yearlyKg.toFixed(1)+' kg</div><div style="font-size:10px;color:var(--text3);margin-top:4px">Günlük '+total+' kcal × 365 gün ÷ 7700 kcal/kg</div>';
}
