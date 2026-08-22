/* ══════════════════════════════════════════════════════════
   RavenFit — body.js
   Vücudum sekmesi
   ══════════════════════════════════════════════════════════ */

/* ── TAB: VÜCUDUM ─────────────────────────────────────── */

function renderVucudum(){
  var male=U.gender==='male',bf=R.bf;
  document.getElementById('bf-v').textContent=bf.toFixed(2);
  document.getElementById('lm-v').textContent=R.lm.toFixed(2)+' kg';
  document.getElementById('fm-v').textContent=R.fm.toFixed(2)+' kg';

  var lo=male?4:12,hi=male?38:48,ideal=male?15:22;
  var pct=clamp((bf-lo)/(hi-lo)*100,4,96),idPct=(ideal-lo)/(hi-lo)*100;
  document.getElementById('bf-lo').textContent='Düşük ('+lo+'%)';
  document.getElementById('bf-hi').textContent='Yüksek ('+hi+'%)';
  setTimeout(function(){
    document.getElementById('bf-mrk').style.left=pct+'%';
    document.getElementById('bf-ideal').style.left=idPct+'%';
  },200);

  var bfCat,bfCls;
  if(male){if(bf<6){bfCat='Çok Düşük ⚠️';bfCls='bb';}else if(bf<14){bfCat='Atletik 🏆';bfCls='bg';}else if(bf<21){bfCat='Fit ✅';bfCls='bg';}else if(bf<25){bfCat='Normal';bfCls='by';}else{bfCat='Fazla Yağlı ⚠️';bfCls='br';}}
  else{if(bf<14){bfCat='Çok Düşük ⚠️';bfCls='bb';}else if(bf<21){bfCat='Atletik 🏆';bfCls='bg';}else if(bf<28){bfCat='Fit ✅';bfCls='bg';}else if(bf<32){bfCat='Normal';bfCls='by';}else{bfCat='Fazla Yağlı ⚠️';bfCls='br';}}
  document.getElementById('bf-badge').innerHTML='<div class="badge '+bfCls+'">● '+bfCat+'</div>';

  var ffmi=R.ffmi;
  document.getElementById('ffmi-v').textContent=ffmi.toFixed(2);
  var ffmiLo=male?14:10,ffmiHi=male?30:26;
  var ffmiPct=clamp((ffmi-ffmiLo)/(ffmiHi-ffmiLo)*100,4,96);
  setTimeout(function(){document.getElementById('ffmi-mrk').style.left=ffmiPct+'%';},250);
  var ffmiCat,ffmiCls,ffmiTxt;
  if(male){
    if(ffmi<18){ffmiCat='Ortalama';ffmiCls='bb';ffmiTxt='Kas kütlesi ortalama. Düzenli antrenman ve doğru beslenmeyle geliştirebilirsin.';}
    else if(ffmi<20){ffmiCat='İyi';ffmiCls='bg';ffmiTxt='Ortalamanın üzerinde kas kütlesi. İyi bir gelişim sürecindeydin.';}
    else if(ffmi<22){ffmiCat='Atletik 💪';ffmiCls='bg';ffmiTxt='Atletik kas kütlesi seviyesi. Güçlü ve dengeli bir fiziğe sahipsin.';}
    else if(ffmi<25){ffmiCat='Kaslı 🏆';ffmiCls='bp';ffmiTxt='İleri düzey kas gelişimi. Doğal sınırların üst kısmındasın!';}
    else{ffmiCat='Elit 🔥';ffmiCls='br';ffmiTxt='Bu FFMI değerine doğal yollarla ulaşmak çok nadir. Tebrikler!';}
    document.getElementById('ffmi-lo-lbl').textContent='Ort.(<18)';
  } else {
    if(ffmi<14){ffmiCat='Ortalamanın Altı';ffmiCls='bb';ffmiTxt='Yağsız kütlen gelişime açık. Antrenman ve beslenmeyle ilerleyebilirsin.';}
    else if(ffmi<17){ffmiCat='Ortalama';ffmiCls='bg';ffmiTxt='Kadınlar için ortalama yağsız kütle seviyesi.';}
    else if(ffmi<20){ffmiCat='Atletik 💪';ffmiCls='bg';ffmiTxt='Kadınlar için atletik kas kütlesi. Harika bir seviye!';}
    else if(ffmi<22){ffmiCat='Güçlü 🏆';ffmiCls='bp';ffmiTxt='Üst düzey kas gelişimi. Güçlü fiziğin var!';}
    else{ffmiCat='Elit 🔥';ffmiCls='br';ffmiTxt='Bu FFMI değerine doğal yollarla ulaşmak kadınlar için oldukça nadir.';}
    document.getElementById('ffmi-lo-lbl').textContent='Ort.(<14)';
  }
  document.getElementById('ffmi-badge').innerHTML='<div class="badge '+ffmiCls+'" style="margin-top:6px">● '+ffmiCat+'</div>';
  document.getElementById('ffmi-info').textContent=ffmiTxt;

  var bmi=R.bmi;
  document.getElementById('bmi-v').textContent=bmi.toFixed(1);
  var bmiPct=clamp((bmi-14)/(42-14)*100,4,96);
  setTimeout(function(){document.getElementById('bmi-mrk').style.left=bmiPct+'%';},300);
  var bmiCat,bmiCls,bmiTxt;
  if(bmi<18.5){bmiCat='Zayıf';bmiCls='bb';bmiTxt='VKİ normalin altında. Kalori artışı ve protein hedeflenmeli.';}
  else if(bmi<25){bmiCat='Normal ✅';bmiCls='bg';bmiTxt='VKİ sağlıklı aralıkta. Devam et!';}
  else if(bmi<30){bmiCat='Fazla Kilolu';bmiCls='by';bmiTxt='VKİ normalin üzerinde. Aktivite ve beslenme düzenine dikkat et.';}
  else{bmiCat='Obez ⚠️';bmiCls='br';bmiTxt='VKİ obez sınırında. Bir profesyonele danışmanı öneririz.';}
  document.getElementById('bmi-badge').innerHTML='<div class="badge '+bmiCls+'" style="margin-top:6px">● '+bmiCat+'</div>';
  document.getElementById('bmi-info').textContent=bmiTxt;

  var bt=R.bt,dom=bt.ecto>=bt.meso&&bt.ecto>=bt.endo?'Ektomorf':bt.meso>=bt.endo?'Mezomorf':'Endomorf';
  var descs={Ektomorf:'İnce yapılı, hızlı metabolizma. Kilo almak zor ama fit kalmak kolay. Protein ve kalori alımına dikkat et.',Mezomorf:'Atletik yapı, dengeli metabolizma. Kas geliştirmek ve yağ yakmak görece kolay.',Endomorf:'Geniş yapı, yavaş metabolizma. Yağ depolamaya eğilim. Kardio ve kalori kontrolü ön planda olmalı.'};
  var dcols={Ektomorf:'var(--info)',Mezomorf:'var(--success)',Endomorf:'var(--warn)'};
  document.getElementById('bt-res').innerHTML=
    '<div style="margin-bottom:12px"><div style="font-size:11px;color:var(--text2);margin-bottom:2px">Baskın vücut tipin</div>'+
    '<div style="font-size:22px;font-weight:700;color:'+dcols[dom]+';margin-bottom:4px">'+dom+'</div>'+
    '<div style="font-size:12px;color:var(--text2)">'+descs[dom]+'</div></div>'+
    mkBTB('Ektomorf',bt.ecto,'var(--info)')+mkBTB('Mezomorf',bt.meso,'var(--success)')+mkBTB('Endomorf',bt.endo,'var(--warn)');
  setTimeout(function(){document.querySelectorAll('.btif').forEach(function(b){b.style.width=b.dataset.pct+'%';});},200);

  /* YENİ: Vücut Profili Algoritması Render */
  var bp = determineBodyProfile(bf, ffmi, bmi);
  document.getElementById('bp-res').innerHTML = 
    '<div style="font-size:11px;color:var(--text2);margin-bottom:2px">Algoritmik Vücut Profilin</div>'+
    '<div style="font-size:20px;font-weight:700;color:'+bp.c+';margin-bottom:4px">'+bp.n+'</div>'+
    '<div style="font-size:12px;color:var(--text2)">'+bp.d+'</div>';
}

function mkBTB(name,pct,col){
  return'<div class="bti"><div class="btih"><div class="btin">'+name+'</div><div class="btip" style="color:'+col+'">'+pct.toFixed(1)+'%</div></div>'+
    '<div class="btib"><div class="btif" data-pct="'+pct+'" style="background:'+col+';width:0%"></div></div></div>';
}
