/* ══════════════════════════════════════════════════════════
   RavenFit — one-rm.js
   1RM hesaplayıcı
   ══════════════════════════════════════════════════════════ */

/* ── 1RM Formülleri ── */

function _formulaEpley(kg,reps){return kg*(1+reps/30);}

function _formulaBrzycki(kg,reps){return reps<37?kg*36/(37-reps):kg*(1+reps/30);}

function _formulaLombardi(kg,reps){return kg*Math.pow(reps,0.10);}

function _formulaWathen(kg,reps){return (100*kg)/(48.8+53.8*Math.exp(-0.075*reps));}

/* ── Kullanıcının en iyi setini log'lardan bul ── */

function _findBestSet(){
  var logs=getWorkoutLogs();
  var bestEstimated=0;
  var bestKg=0,bestReps=0,bestExId=null,bestExName='';
  logs.forEach(function(l){
    if(!l.sets)return;
    l.sets.forEach(function(s){
      if(!s.kg||!s.reps)return;
      var kg=parseFloat(s.kg),reps=parseInt(s.reps);
      if(!kg||!reps||reps>12)return; /* 1RM formülleri 12+ rep için geçersiz */
      var est=_formulaWathen(kg,reps);
      if(est>bestEstimated){
        bestEstimated=est;
        bestKg=kg;bestReps=reps;bestExId=s.exId;
        var ex=_findExercise(s.exId);
        bestExName=ex.name_tr||s.exId;
      }
    });
  });
  return bestEstimated>0?{kg:bestKg,reps:bestReps,exId:bestExId,exName:bestExName,estimated:bestEstimated}:null;
}

/* ══ 1. 1RM HESAPLAYICI ══════════════════════════════════ */

function _calc1RM(){
  var kgVal=_calcState.kg||'';
  var repVal=_calcState.reps||'';
  var html='';

  /* Input kartı */
  html+='<div class="calc-grid-card">';
  html+='<div class="calc-label">Kaldırdığın Yük ('+unitLabel()+')</div>';
  html+='<input class="calc-input" type="number" inputmode="decimal" step="0.5" placeholder="—" value="'+kgVal+'" oninput="_calcState.kg=this.value;_calc1RMUpdate()" id="calc-1rm-kg">';
  html+='<div style="height:10px"></div>';
  html+='<div class="calc-label">Tekrar Sayısı (1-12 arası)</div>';
  html+='<input class="calc-input" type="number" inputmode="numeric" min="1" max="12" placeholder="—" value="'+repVal+'" oninput="_calcState.reps=this.value;_calc1RMUpdate()" id="calc-1rm-reps">';
  html+='<button class="btn btn-s btn-full" onclick="_calc1RMAutoFill()" style="margin-top:12px;font-size:12px">📊 Son Antrenmandan Al</button>';
  html+='</div>';

  /* Sonuç */
  html+='<div id="calc-1rm-result"></div>';

  /* Açıklama — formül bilgileri */
  html+='<div class="calc-grid-card" style="background:var(--card2)">';
  html+='<div style="font-size:11px;color:var(--text2);line-height:1.55">';
  html+='💡 <strong>1RM nedir?</strong> Bir egzersizi 1 tekrar yapabileceğin maksimum ağırlık.<br>';
  html+='Örnek: 80 kg × 8 tekrar yaptıysan, tahmini 1RM\'in ~101 kg.<br><br>';
  html+='⚠️ Bu sadece tahmindir. Gerçek 1RM denemesi için ısınma yapıp kademeli artır.';
  html+='</div>';
  /* Formül açıklamaları */
  html+='<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">';
  html+='<div style="font-size:11px;font-weight:700;color:var(--text);margin-bottom:6px">📐 Kullanılan Formüller</div>';
  html+='<div style="font-size:10px;color:var(--text2);line-height:1.6">';
  html+='<strong style="color:var(--accent)">Wathen</strong> — En hassas formül, RavenFit\'in ana hesabı. Geniş tekrar aralığında tutarlı sonuç verir.<br>';
  html+='<strong>Epley</strong> — En yaygın kullanılan. Düşük-orta tekrarlarda Wathen\'a çok yakın. <em>1RM = kg × (1 + rep/30)</em><br>';
  html+='<strong>Brzycki</strong> — Düşük tekrarlarda (1-5) daha hassas. <em>1RM = kg × 36 / (37 - rep)</em><br>';
  html+='<strong>Lombardi</strong> — Eski ama hâlâ kullanılan kuvvet formülü. <em>1RM = kg × rep^0.10</em>';
  html+='</div></div></div>';

  setTimeout(_calc1RMUpdate,30);
  return html;
}

function _calc1RMUpdate(){
  var kg=parseFloat(_calcState.kg)||0;
  var reps=parseInt(_calcState.reps)||0;
  var el=document.getElementById('calc-1rm-result');
  if(!el) return;
  if(!kg||!reps||reps<1||reps>12){
    el.innerHTML='<div class="calc-result" style="opacity:.5"><div class="calc-result-val">—</div><div class="calc-result-unit">'+unitLabel()+'</div><div class="calc-result-sub">Yük ve tekrar gir (1-12 rep)</div></div>';
    return;
  }
  /* Ana: Wathen (en hassas). Diğerleri referans. */
  var wa=_formulaWathen(kg,reps);
  var ep=_formulaEpley(kg,reps);
  var br=_formulaBrzycki(kg,reps);
  var lo=_formulaLombardi(kg,reps);

  var html='<div class="calc-result">';
  html+='<div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">TAHMİNİ 1RM</div>';
  html+='<div class="calc-result-val">'+wa.toFixed(2)+'</div>';
  html+='<div class="calc-result-unit">'+unitLabel()+'</div>';
  html+='<div class="calc-result-sub">Wathen formülü (ana hesap)</div>';
  html+='</div>';

  /* 4 formül karşılaştırma — 2×2 grid */
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">';
  html+='<div class="calc-formula-cell" style="border:1.5px solid var(--accent)"><div class="calc-formula-val" style="color:var(--accent)">'+wa.toFixed(2)+'</div><div class="calc-formula-lbl">Wathen ★</div></div>';
  html+='<div class="calc-formula-cell"><div class="calc-formula-val">'+ep.toFixed(2)+'</div><div class="calc-formula-lbl">Epley</div></div>';
  html+='<div class="calc-formula-cell"><div class="calc-formula-val">'+br.toFixed(2)+'</div><div class="calc-formula-lbl">Brzycki</div></div>';
  html+='<div class="calc-formula-cell"><div class="calc-formula-val">'+lo.toFixed(2)+'</div><div class="calc-formula-lbl">Lombardi</div></div>';
  html+='</div>';

  /* Yüzdelik dağılım (Wathen bazlı) */
  html+='<div class="calc-grid-card" style="margin-top:12px"><div class="calc-label">% 1RM dağılımı</div>';
  var pcts=[95,90,85,80,75,70,65,60,50];
  var repMap={95:'1-2',90:'3-4',85:'5-6',80:'7-8',75:'9-10',70:'10-12',65:'12-15',60:'15-18',50:'20+'};
  pcts.forEach(function(p){
    var v=(wa*p/100);
    html+='<div class="calc-percentage-row">';
    html+='<span class="calc-pct-pct">%'+p+'</span>';
    html+='<span class="calc-pct-val">'+v.toFixed(1)+' '+unitLabel()+'</span>';
    html+='<span class="calc-pct-range">'+repMap[p]+' rep</span>';
    html+='</div>';
  });
  html+='</div>';

  el.innerHTML=html;
}

function _calc1RMAutoFill(){
  var best=_findBestSet();
  if(!best){
    showToast('📭 Henüz antrenman kaydın yok','warn');
    return;
  }
  /* Kullanıcının birimine çevir */
  var displayKg=getUnit()==='lb'?(best.kg*2.20462).toFixed(1):best.kg.toFixed(1);
  _calcState.kg=displayKg;
  _calcState.reps=best.reps;
  var kgInp=document.getElementById('calc-1rm-kg');
  var repInp=document.getElementById('calc-1rm-reps');
  if(kgInp) kgInp.value=displayKg;
  if(repInp) repInp.value=best.reps;
  showToast('✅ '+best.exName+' seti yüklendi ('+displayKg+' '+unitLabel()+' × '+best.reps+')','success');
  _calc1RMUpdate();
}
