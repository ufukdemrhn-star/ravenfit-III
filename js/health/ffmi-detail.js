/* ══════════════════════════════════════════════════════════
   RavenFit — ffmi-detail.js
   FFMI detay modalı
   ══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   📊 FFMI DETAY MODALI
   Modülerleşmede → js/ui/ffmi-detail.js
   ══════════════════════════════════════════════════════════ */

function openFFMIDetail(){
  var body=document.getElementById('ffmi-detail-body');
  if(!body) return;
  var male = U && U.gender === 'male';
  var ffmi = (R && R.ffmi) ? R.ffmi : null;
  
  /* Cinsiyet bazlı bantlar */
  /* Bantlar tek kaynaktan gelir: _ffmiBands() (js/health/calculations.js).
     Böylece ana sayfadaki skala, rozet ve bu tablo hep aynı eşikleri kullanır. */
  var _bl = _ffmiBands(male);
  var bands = _bl.map(function(b, i){
    return {
      min:   i === 0 ? 0 : _bl[i-1].ust,
      max:   i === _bl.length-1 ? 99 : b.ust,
      label: b.ad,
      cls:   b.cls,
      desc:  b.txt
    };
  });

  /* Mevcut FFMI hangi banta düşüyor? */
  var currentBand = null;
  if(ffmi != null){
    for(var i=0; i<bands.length; i++){
      if(ffmi >= bands[i].min && ffmi < bands[i].max){
        currentBand = i;
        break;
      }
    }
  }
  
  var html = '';
  
  /* Şu anki değer */
  if(ffmi != null){
    html += '<div style="background:color-mix(in srgb, var(--info) 6%, transparent);border:1px solid var(--info);border-radius:12px;padding:14px;margin-bottom:18px">';
    html += '<div style="font-size:11px;color:var(--text2);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px">Senin Değerin</div>';
    html += '<div style="display:flex;align-items:baseline;gap:10px"><div style="font-size:32px;font-weight:800;color:var(--info)">'+ffmi.toFixed(2)+'</div>';
    if(currentBand !== null){
      html += '<div style="font-size:13px;font-weight:600;color:var(--text)">'+bands[currentBand].label+'</div>';
    }
    html += '</div></div>';
  }
  
  /* FFMI nedir? */
  html += '<div style="margin-bottom:18px"><div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px">📖 FFMI Nedir?</div>';
  html += '<div style="font-size:12px;color:var(--text2);line-height:1.6">FFMI (Fat-Free Mass Index / Yağsız Kütle Endeksi), vücudundaki yağsız kütleyi (kas, kemik, organ vb.) boyuna göre normalize eden bir göstergedir. <strong style="color:var(--text)">BMI\'nin yapamadığı</strong> şeyi yapar: kas-yağ ayrımı. Sporcular ve düzenli antrenman yapanlar için kas gelişiminin daha doğru bir göstergesidir.</div></div>';
  
  /* Bant tablosu */
  html += '<div style="margin-bottom:18px"><div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:10px">📊 '+(male?'Erkek':'Kadın')+' FFMI Bantları</div>';
  for(var i=0; i<bands.length; i++){
    var b = bands[i];
    var isCurrent = (i === currentBand);
    var rangeStr;
    if(i === bands.length-1) rangeStr = b.min+'+';
    else rangeStr = b.min+' - '+b.max;
    
    html += '<div style="display:flex;align-items:flex-start;gap:10px;padding:10px;border-radius:10px;margin-bottom:6px;'+(isCurrent?'background:color-mix(in srgb, var(--info) 8%, transparent);border:1.5px solid var(--info)':'background:var(--card2);border:1px solid var(--border)')+'">';
    html += '<div style="flex-shrink:0;min-width:75px"><div class="badge '+b.cls+'" style="font-size:10px">'+b.label+'</div><div style="font-size:10px;color:var(--text2);margin-top:3px;font-weight:600">FFMI '+rangeStr+'</div></div>';
    html += '<div style="font-size:11px;color:'+(isCurrent?'var(--text)':'var(--text2)')+';line-height:1.5;flex:1">'+b.desc+(isCurrent?' <span style="color:var(--info);font-weight:700">← Sen buradasın</span>':'')+'</div>';
    html += '</div>';
  }
  html += '</div>';
  
  /* Bilgi notu */
  html += '<div style="background:color-mix(in srgb, var(--info) 6%, transparent);border-left:3px solid var(--info);border-radius:8px;padding:12px 14px;margin-bottom:12px">';
  html += '<div style="font-size:11px;font-weight:700;color:var(--info);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px">ℹ️ Önemli Not</div>';
  html += '<div style="font-size:11px;color:var(--text2);line-height:1.5">FFMI bir tahmin metriğidir. Hesaplama, Navy vücut yağı formülünden türetilen yağsız kütle üzerinden yapılır. Ölçüm protokolüne bağlı olarak gerçek değerden ±%5-10 sapabilir. Tek ölçüme değil, trend ve düzenli takibe odaklan.</div></div>';
  
  /* Referans */
  html += '<div style="font-size:10px;color:var(--text3);text-align:center;line-height:1.5;padding:8px"><em>Referanslar: Kouri et al. 1995, ISSN Position Stand. Boy normalize formülü uygulanmıştır (1.80m baz alınır).</em></div>';
  
  body.innerHTML = html;
  document.getElementById('ffmi-detail-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeFFMIDetail(){
  document.getElementById('ffmi-detail-overlay').classList.remove('active');
  document.body.style.overflow = '';
}
