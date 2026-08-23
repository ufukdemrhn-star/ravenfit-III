/* ══════════════════════════════════════════════════════════
   RavenFit — progress.js
   İlerleme sekmesi
   ══════════════════════════════════════════════════════════ */

/* ── TAB: İLERLEME (3 Haftalık Tablo ve Liste) ────────── */

function renderIlerleme(){
  var entries=getEntries();
  /* Tüm entry'leri timestamp'a göre sırala (en eski → en yeni) */
  entries=entries.slice().sort(function(a,b){return (a.timestamp||0)-(b.timestamp||0);});
  var elList=document.getElementById('h-list');
  var tblCont=document.getElementById('progress-table-container');

  if(!entries.length){
    elList.innerHTML='<div class="h-empty">📊 Henüz kayıt yok.<br>İlk ölçünü kaydet ve takibe başla!</div>';
    tblCont.style.display='none';
    return;
  }
  
  // Eski tip liste görünümü — en yeni üstte
  // realIdx için: getEntries()'in orijinal sırasındaki index'i bulmamız lazım
  var origEntries=getEntries();
  /* Uzun listeyi kırp: ilk 3 kayıt + "daha fazla göster" (madde 15).
     Tercih oturum boyunca korunur — kullanıcı açtıysa açık kalır. */
  var hepsiAcik = window._hListExpanded === true;
  var tersSirali = entries.slice().reverse();
  var gosterilecek = hepsiAcik ? tersSirali : tersSirali.slice(0,3);
  var gizliSayi = tersSirali.length - gosterilecek.length;

  elList.innerHTML=gosterilecek.map(function(e,i){
    /* Orijinal entries array'inde bu entry'nin gerçek index'ini bul */
    var realIdx=origEntries.findIndex(function(x){return x.timestamp===e.timestamp;});
    if(realIdx<0) realIdx=origEntries.indexOf(e);
    var isLatest=(i===0);
    var latestBadge=isLatest?'<span style="font-size:9px;color:var(--success);background:color-mix(in srgb, var(--success) 15%, transparent);padding:2px 6px;border-radius:5px;margin-left:6px;font-weight:700">● GÜNCEL</span>':'';
    return'<div class="hi"><div class="hi-left"><div class="hi-date">📅 '+e.date+latestBadge+'</div><div class="hi-d">'+e.weight+' kg | %'+e.bf+' yağ</div></div>'+
    '<div class="hi-stats"><div class="hi-stat"><div class="hi-sv" style="color:var(--accent)">%'+e.bf+'</div><div class="hi-sl">Yağ</div></div>'+
    '<div class="hi-stat"><div class="hi-sv" style="color:var(--success)">'+e.lm+'</div><div class="hi-sl">Yağsız</div></div>'+
    '<div class="hi-stat"><div class="hi-sv" style="color:var(--info)">'+e.ffmi+'</div><div class="hi-sl">FFMI</div></div>'+
    '<button class="edit-btn" onclick="editEntry('+realIdx+')">✎</button>'+
    '<button class="del-btn" onclick="deleteEntry('+realIdx+')">✕</button></div></div>';
  }).join('');

  /* Aç/kapa butonu — 3'ten fazla kayıt varsa göster */
  if(tersSirali.length > 3){
    elList.innerHTML += '<button class="h-more-btn" onclick="toggleHistoryList()">'+
      (hepsiAcik
        ? '▲ Daha az göster'
        : '▼ Daha fazla kayıt gör  <span style="opacity:.6">(+'+gizliSayi+')</span>')+
      '</button>';
  }

  // 4 sütunlu tablo — en yeni solda
  tblCont.style.display = 'block';
  var last4 = entries.slice(-4);
  // w0=son, w1, w2, w3 — son 4 ölçüm (eski→yeni sırada en yenisi w0)
  var w0 = last4.length >= 1 ? last4[last4.length-1] : null;
  var w1 = last4.length >= 2 ? last4[last4.length-2] : null;
  var w2 = last4.length >= 3 ? last4[last4.length-3] : null;
  var w3 = last4.length >= 4 ? last4[last4.length-4] : null;
  var male = U.gender==='male';

  /* Dinamik tarih etiketi — referans: BUGÜN (now), son ölçüm değil
     1-13 gün → "X gün önce", 14-29 gün → "X hafta önce", 30+ gün → "X ay önce" */
  function _relDateLbl(entry){
    if(!entry || !entry.timestamp) return '—';
    var now = Date.now();
    var diffMs = now - entry.timestamp;
    var days = Math.round(diffMs / 86400000);
    if(days < 0) days = 0;
    if(days === 0) return 'Bugün';
    if(days === 1) return 'Dün';
    if(days <= 13) return days + ' gün önce';
    if(days <= 29){
      var weeks = Math.round(days / 7);
      return weeks + ' hafta önce';
    }
    if(days <= 364){
      var months = Math.round(days / 30);
      return months + ' ay önce';
    }
    var years = Math.round(days / 365);
    return years + ' yıl önce';
  }

  /* Her sütun için başlık etiketi — w0 (güncel) bile bugünden farkıyla işaretlenir */
  var lblW0 = '<span style="color:var(--success)">●</span> ' + (w0 ? _relDateLbl(w0).toUpperCase() : 'GÜNCEL');
  var lblW1 = w1 ? _relDateLbl(w1) : '—';
  var lblW2 = w2 ? _relDateLbl(w2) : '—';
  var lblW3 = w3 ? _relDateLbl(w3) : '—';

  function mkRow(lbl, key, lowerBetter) {
    function fmt(e){ return e&&e[key]!=null?parseFloat(e[key]):null; }
    var v0=fmt(w0),v1=fmt(w1),v2=fmt(w2),v3=fmt(w3);
    // diff = son ölçüm vs bir önceki
    var diffHtml='';
    if(v0!=null&&v1!=null){
      var diff=Math.round((v0-v1)*10)/10;
      if(diff>0)     diffHtml='<span class="diff '+(lowerBetter?'diff-down':'diff-up')+'">↑'+diff+'</span>';
      else if(diff<0)diffHtml='<span class="diff '+(lowerBetter?'diff-up':'diff-down')+'">↓'+Math.abs(diff)+'</span>';
      else           diffHtml='<span class="diff diff-neutral">—</span>';
    }
    function d(v){return v!=null?v:'-';}
    return'<tr><td>'+lbl+'</td><td style="font-weight:700;color:var(--text)">'+d(v0)+(diffHtml)+'</td><td>'+d(v1)+'</td><td>'+d(v2)+'</td><td>'+d(v3)+'</td></tr>';
  }

  var rName = male ? 'Omuz/Bel' : 'Kalça/Bel';
  /* Eski "yag" + yeni "cut"/"recomp" hedefler için yağ kaybı vurgusu */
  var isYag = selGL === 'yag' || selGL === 'cut' || selGL === 'recomp';
  
  tblCont.innerHTML =
    '<div class="ptable-wrapper">' +
    '<table class="ptable"><thead><tr>' +
    '<th>Ölçü</th><th>'+lblW0+'</th><th>'+lblW1+'</th><th>'+lblW2+'</th><th>'+lblW3+'</th>' +
    '</tr></thead><tbody>' +
    mkRow('Ağırlık (kg)',   'weight',   isYag) +
    mkRow('Yağ Oranı (%)',  'bf',       true)  +
    mkRow('Yağsız Kütle',   'lm',       false) +
    mkRow('FFMI',           'ffmi',     false) +
    mkRow('VKİ',            'bmi',      isYag) +
    mkRow(rName + ' Oranı', 'ratio',    false) +
    mkRow('Boyun (cm)',      'neck',    false) +
    mkRow('Omuz (cm)',       'shoulder',false) +
    mkRow('Göğüs (cm)',      'chest',   false) +
    mkRow('Kol (cm)',        'arm',     false) +
    mkRow('Ön Kol (cm)',     'forearm', false) +
    mkRow('Bel (cm)',        'waist',   true)  +
    mkRow('Kalça (cm)',      'hip',     isYag) +
    mkRow('Bacak (cm)',      'leg',     false) +
    mkRow('Kalf (cm)',       'calf',    false) +
    '</tbody></table></div>';
  drawCharts();
}


/* Geçmiş kayıt listesini aç/kapa (madde 15). */
function toggleHistoryList(){
  window._hListExpanded = !window._hListExpanded;
  renderIlerleme();
}
