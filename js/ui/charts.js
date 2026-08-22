/* ══════════════════════════════════════════════════════════
   RavenFit — charts.js
   SVG grafik çizimi
   ══════════════════════════════════════════════════════════ */

function drawSvgChart(cId,entries,key,label,cssVar){
  var co=document.getElementById(cId);if(!co)return;
  var valid=entries.filter(function(e){return e[key]!=null&&!isNaN(parseFloat(e[key]));});
  if(valid.length<2){co.innerHTML='<div class="chart-title">'+label+'</div><div class="chart-empty">📊 Grafik için en az 2 kayıt gerekli</div>';return;}
  var color=getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  var W=280,H=110,pX=30,pT=16,pB=24,pW=W-pX*2,pH=H-pT-pB,n=valid.length;
  var vals=valid.map(function(e){return parseFloat(e[key]);});
  var mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals),rng=mx-mn||1;
  var pts=vals.map(function(v,i){return[(pX+(i/(n-1))*pW).toFixed(1),(pT+(1-(v-mn)/rng)*pH).toFixed(1),v,valid[i].date];});
  var poly=pts.map(function(p){return p[0]+','+p[1];}).join(' ');
  var area=poly+' '+pts[n-1][0]+','+(pT+pH)+' '+pts[0][0]+','+(pT+pH);
  var gId='g_'+cId;
  var defs='<defs><linearGradient id="'+gId+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+color+'" stop-opacity="0.22"/><stop offset="100%" stop-color="'+color+'" stop-opacity="0.02"/></linearGradient></defs>';
  var midY=(pT+pH/2).toFixed(1);
  var grid='<line x1="'+pX+'" y1="'+midY+'" x2="'+(W-pX)+'" y2="'+midY+'" stroke="var(--border)" stroke-width="0.5" stroke-dasharray="3,3"/>';
  var circles=pts.map(function(p){return'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3" fill="'+color+'" stroke="var(--bg)" stroke-width="1.5"/>';}).join('');
  var f=pts[0],l=pts[n-1];
  var vl='<text x="'+f[0]+'" y="'+(parseFloat(f[1])-6)+'" text-anchor="middle" font-size="8" fill="'+color+'">'+parseFloat(f[2]).toFixed(1)+'</text><text x="'+l[0]+'" y="'+(parseFloat(l[1])-6)+'" text-anchor="middle" font-size="8" fill="'+color+'">'+parseFloat(l[2]).toFixed(1)+'</text>';
  var dl='<text x="'+f[0]+'" y="'+(H-4)+'" text-anchor="start" font-size="7" fill="var(--text3)">'+(f[3]||'').substring(0,5)+'</text><text x="'+l[0]+'" y="'+(H-4)+'" text-anchor="end" font-size="7" fill="var(--text3)">'+(l[3]||'').substring(0,5)+'</text>';
  var yl='<text x="'+(pX-3)+'" y="'+(pT+pH+3)+'" text-anchor="end" font-size="7" fill="var(--text3)">'+mn.toFixed(1)+'</text><text x="'+(pX-3)+'" y="'+(pT+4)+'" text-anchor="end" font-size="7" fill="var(--text3)">'+mx.toFixed(1)+'</text>';
  co.innerHTML='<div class="chart-title">'+label+'</div><svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" class="chart-svg">'+defs+grid+'<polygon points="'+area+'" fill="url(#'+gId+')"/><polyline points="'+poly+'" fill="none" stroke="'+color+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'+circles+vl+yl+dl+'</svg>';
}

function drawCharts(){var e=getEntries();drawSvgChart('chart-bf',e,'bf','📊 Yağ Oranı (%)','--accent');drawSvgChart('chart-weight',e,'weight','⚖️ Kilo (kg)','--info');drawSvgChart('chart-lm',e,'lm','💪 Yağsız Kütle (kg)','--success');}
