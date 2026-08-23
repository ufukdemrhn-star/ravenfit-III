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
  /* ── FFMI birleşik skala (madde 11) ──────────────────────
     6 bant, cinsiyete göre farklı eşikler. Bantlar detay
     modalıyla (js/health/ffmi-detail.js) birebir aynı olmalı. */
  var ffmiBantlar = _ffmiBands(male);   /* tek kaynak: js/health/calculations.js */

  var ffmiLo = male ? 14 : 10;
  var ffmiHi = ffmiBantlar[ffmiBantlar.length-1].ust;

  /* Segment genişlikleri gerçek aralık büyüklüğüyle orantılı —
     böylece noktanın konumu bandıyla tutarlı olur. */
  var scaleEl = document.getElementById('ffmi-scale');
  if(scaleEl){
    var alt = ffmiLo, segHtml = '';
    ffmiBantlar.forEach(function(b){
      var genislik = Math.max(0, b.ust - alt);
      segHtml += '<div class="ffmi-seg" style="background:'+b.renk+';flex:'+genislik+'"></div>';
      alt = b.ust;
    });
    scaleEl.innerHTML = segHtml;
  }

  var ffmiPct = clamp((ffmi-ffmiLo)/(ffmiHi-ffmiLo)*100, 2, 98);
  setTimeout(function(){
    var d=document.getElementById('ffmi-mrk');
    if(d) d.style.left = ffmiPct + '%';
  }, 250);

  /* "Sen: 21.4 — İyi" satırı */
  var aktifBant = ffmiBantlar.find(function(b){ return ffmi < b.ust; }) || ffmiBantlar[ffmiBantlar.length-1];
  var youEl = document.getElementById('ffmi-you');
  if(youEl){
    youEl.innerHTML = 'Sen: <strong>' + ffmi.toFixed(1) + '</strong> — ' +
      '<strong style="color:' + aktifBant.renk + '">' + aktifBant.ad + '</strong>';
  }
  /* Rozet ve açıklama — skalayla AYNI banttan gelir.
     Eskiden ayrı yazılmıştı ve etiketler uyuşmuyordu
     (skala "İyi" derken rozet "Atletik" diyordu). */
  var ffmiCat = aktifBant.ad;
  var ffmiCls = aktifBant.cls;
  var ffmiTxt = aktifBant.txt;
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
  /* Grafik türü kullanıcı tercihi olarak saklanır (madde 12) */
  var grafikTur = _lsGet('rf_bt_chart','bar');
  document.getElementById('bt-res').innerHTML=
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px">'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:11px;color:var(--text2);margin-bottom:2px">Baskın vücut tipin</div>'+
        '<div style="font-size:22px;font-weight:700;color:'+dcols[dom]+';margin-bottom:4px">'+dom+'</div>'+
        '<div style="font-size:12px;color:var(--text2)">'+descs[dom]+'</div>'+
      '</div>'+
      '<button class="chart-toggle" onclick="toggleBtChart()" '+
        'title="Grafik türünü değiştir" aria-label="Grafik türünü değiştir">'+
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" '+
          'stroke-linecap="round" stroke-linejoin="round">'+
          '<polyline points="23 4 23 10 17 10"></polyline>'+
          '<polyline points="1 20 1 14 7 14"></polyline>'+
          '<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>'+
        '</svg></button>'+
    '</div>'+
    '<div id="bt-chart">'+_btChartHTML(bt,grafikTur)+'</div>';
  if(grafikTur==='bar'){
    setTimeout(function(){document.querySelectorAll('.btif').forEach(function(b){b.style.width=b.dataset.pct+'%';});},200);
  }

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


/* ══════════════════════════════════════════════════════════
   VÜCUT TİPİ GRAFİĞİ — ÇUBUK ↔ PASTA (madde 12)
   Kütüphane kullanılmaz; pasta doğrudan SVG ile çizilir.
   Tercih localStorage'da saklanır.
   ══════════════════════════════════════════════════════════ */

function _btChartHTML(bt, tur){
  if(tur === 'pie') return _btPieHTML(bt);
  return mkBTB('Ektomorf',bt.ecto,'var(--info)')
       + mkBTB('Mezomorf',bt.meso,'var(--success)')
       + mkBTB('Endomorf',bt.endo,'var(--warn)');
}

/* SVG halka (donut) grafiği.
   Her dilim, stroke-dasharray ile çevre uzunluğu üzerinden çizilir:
   dilim uzunluğu = çevre × (yüzde/100), kalan boşluk bırakılır. */
function _btPieHTML(bt){
  var dilimler = [
    {ad:'Ektomorf', pct:bt.ecto, renk:'var(--info)'},
    {ad:'Mezomorf', pct:bt.meso, renk:'var(--success)'},
    {ad:'Endomorf', pct:bt.endo, renk:'var(--warn)'}
  ];
  var R_ = 54, KALINLIK = 22;
  var cevre = 2 * Math.PI * R_;
  var ofset = 0;
  var halka = '';
  dilimler.forEach(function(d){
    var uzunluk = cevre * (d.pct / 100);
    halka += '<circle cx="70" cy="70" r="' + R_ + '" fill="none" '+
             'stroke="' + d.renk + '" stroke-width="' + KALINLIK + '" '+
             'stroke-dasharray="' + uzunluk.toFixed(2) + ' ' + (cevre - uzunluk).toFixed(2) + '" '+
             'stroke-dashoffset="' + (-ofset).toFixed(2) + '" '+
             'transform="rotate(-90 70 70)" '+
             'style="transition:stroke-dasharray .7s ease"></circle>';
    ofset += uzunluk;
  });

  var efsane = dilimler.map(function(d){
    return '<div style="display:flex;align-items:center;gap:7px;margin-bottom:7px">'+
             '<span style="width:11px;height:11px;border-radius:3px;background:'+d.renk+';flex-shrink:0"></span>'+
             '<span style="font-size:12px;color:var(--text2);flex:1">'+d.ad+'</span>'+
             '<span style="font-size:13px;font-weight:700;color:'+d.renk+'">'+d.pct.toFixed(1)+'%</span>'+
           '</div>';
  }).join('');

  return '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:center">'+
           '<svg width="140" height="140" viewBox="0 0 140 140" style="flex-shrink:0">'+
             '<circle cx="70" cy="70" r="'+R_+'" fill="none" stroke="var(--card2)" stroke-width="'+KALINLIK+'"></circle>'+
             halka +
           '</svg>'+
           '<div style="flex:1;min-width:130px">'+efsane+'</div>'+
         '</div>';
}

/* Çubuk ↔ pasta arasında geçiş yapar, tercihi saklar. */
function toggleBtChart(){
  var suanki = _lsGet('rf_bt_chart','bar');
  var yeni = (suanki === 'bar') ? 'pie' : 'bar';
  _lsSet('rf_bt_chart', yeni);
  var el = document.getElementById('bt-chart');
  if(el && R && R.bt){
    el.innerHTML = _btChartHTML(R.bt, yeni);
    if(yeni === 'bar'){
      setTimeout(function(){
        document.querySelectorAll('.btif').forEach(function(b){ b.style.width = b.dataset.pct + '%'; });
      }, 60);
    }
  }
}
