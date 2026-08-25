/* ══════════════════════════════════════════════════════════
   RavenFit — badge-showcase.js
   Rozet vitrini

   Profilde tüm rozetler değil, kullanıcının SEÇTİĞİ en fazla 5
   rozet gösterilir. Seçim ekranında kilitli rozetler de görünür —
   kullanıcı neyi kazanabileceğini bilsin diye — ama seçilemezler.
   ══════════════════════════════════════════════════════════ */

var ROZET_VITRIN_SINIRI = 5;
var _bsSecim = null;   /* seçim ekranı açıkken geçici kopya */

function getRozetVitrini(){
  try {
    var ham = _lsGet('rf_badge_showcase');
    if(ham){
      var d = JSON.parse(ham);
      if(Array.isArray(d)) return d.slice(0, ROZET_VITRIN_SINIRI);
    }
  } catch(e){}
  /* Seçim yapılmamışsa: en son kazanılan 5 rozet */
  var kazanilan = (typeof getEarnedBadges === 'function') ? getEarnedBadges() : [];
  return kazanilan.slice(-ROZET_VITRIN_SINIRI).map(function(r){ return r.id; });
}

function saveRozetVitrini(liste){
  _lsSet('rf_badge_showcase', JSON.stringify((liste||[]).slice(0, ROZET_VITRIN_SINIRI)));
  if(typeof saveData === 'function') saveData();
}

/* ── Profildeki rozet şeridi ─────────────────────────────── */
function renderRozetVitrini(){
  var el = document.getElementById('profil-badges');
  if(!el) return;

  var defs = (typeof _getBadgeDefs === 'function') ? _getBadgeDefs() : [];
  if(!defs.length){
    el.innerHTML = '<div style="font-size:12px;color:var(--text2)">Rozet verileri yükleniyor...</div>';
    return;
  }

  var kazanilan = (typeof getEarnedBadges === 'function') ? getEarnedBadges() : [];
  var kazanilanIdler = kazanilan.map(function(r){ return r.id; });
  var vitrin = getRozetVitrini().filter(function(id){ return kazanilanIdler.indexOf(id) >= 0; });

  var html = '<div class="bs-head">';
  html += '<div class="bs-sayac">' + kazanilan.length + ' / ' + defs.length + ' rozet kazanıldı</div>';
  if(kendiProfilimMi && kendiProfilimMi()){
    html += '<button class="pr-detay-btn" onclick="openBadgePicker()">Düzenle ›</button>';
  }
  html += '</div>';

  if(!vitrin.length){
    html += '<div class="bs-bos">' +
      (kazanilan.length
        ? 'Sergilemek için rozet seç.'
        : 'Henüz rozet kazanmadın. Antrenman yaparak kazanmaya başla.') +
      '</div>';
  } else {
    html += '<div class="bs-serit" data-adet="' + vitrin.length + '">';
    vitrin.forEach(function(id){
      var b = defs.find(function(x){ return x.id === id; });
      if(!b) return;
      var kayit = kazanilan.find(function(r){ return r.id === id; });
      html += '<div class="bs-rozet" title="' + (b.desc_tr || '') + '">' +
                '<div class="bs-ikon">' + b.icon + '</div>' +
                '<div class="bs-ad">' + b.name_tr + '</div>' +
                (kayit && kayit.date ? '<div class="bs-tarih">' + kayit.date + '</div>' : '') +
              '</div>';
    });
    html += '</div>';
  }
  el.innerHTML = html;
}

/* ── Seçim ekranı ────────────────────────────────────────── */
function openBadgePicker(){
  _bsSecim = getRozetVitrini().slice();
  var ov = document.getElementById('badge-picker-overlay');
  if(!ov) return;
  ov.classList.add('active');
  document.body.style.overflow = 'hidden';
  _bpRender();
}

function closeBadgePicker(){
  var ov = document.getElementById('badge-picker-overlay');
  if(ov) ov.classList.remove('active');
  document.body.style.overflow = '';
}

function bpToggle(id){
  var i = _bsSecim.indexOf(id);
  if(i >= 0){
    _bsSecim.splice(i, 1);
  } else {
    if(_bsSecim.length >= ROZET_VITRIN_SINIRI){
      showToast('En fazla ' + ROZET_VITRIN_SINIRI + ' rozet sergileyebilirsin.','warn');
      return;
    }
    _bsSecim.push(id);
  }
  _bpRender();
}

function _bpRender(){
  var govde = document.getElementById('bp-body');
  if(!govde) return;

  var defs = (typeof _getBadgeDefs === 'function') ? _getBadgeDefs() : [];
  var kazanilan = (typeof getEarnedBadges === 'function') ? getEarnedBadges() : [];
  var kazanilanIdler = kazanilan.map(function(r){ return r.id; });

  var html = '<div class="sp-ozet">' +
               '<div><strong>' + _bsSecim.length + '/' + ROZET_VITRIN_SINIRI + '</strong> seçildi</div>' +
               '<div><strong>' + kazanilan.length + '/' + defs.length + '</strong> kazanıldı</div>' +
             '</div>';
  html += '<div class="sp-ipucu">Seçtiğin rozetler profilinde görünür. ' +
          'Kilitli rozetler seçilemez ama neyi kazanabileceğini görebilirsin.</div>';

  /* Önce kazanılanlar */
  var acik = defs.filter(function(b){ return kazanilanIdler.indexOf(b.id) >= 0; });
  var kilit = defs.filter(function(b){ return kazanilanIdler.indexOf(b.id) < 0; });

  if(acik.length){
    html += '<div class="sp-grup-baslik">Kazandıkların</div><div class="bp-grid">';
    acik.forEach(function(b){
      var secili = _bsSecim.indexOf(b.id) >= 0;
      var kayit = kazanilan.find(function(r){ return r.id === b.id; });
      html += '<button class="bp-hucre' + (secili ? ' sec' : '') + '" onclick="bpToggle(\'' + b.id + '\')">' +
                (secili ? '<span class="bp-tik">✓</span>' : '') +
                '<div class="bp-ikon">' + b.icon + '</div>' +
                '<div class="bp-ad">' + b.name_tr + '</div>' +
                (kayit && kayit.date ? '<div class="bp-alt">' + kayit.date + '</div>' : '') +
              '</button>';
    });
    html += '</div>';
  }

  if(kilit.length){
    html += '<div class="sp-grup-baslik">Henüz Kazanılmadı</div><div class="bp-grid">';
    kilit.forEach(function(b){
      html += '<button class="bp-hucre kilit" disabled title="' + (b.desc_tr||'') + '">' +
                '<div class="bp-ikon">🔒</div>' +
                '<div class="bp-ad">' + b.name_tr + '</div>' +
                '<div class="bp-alt">' + (b.desc_tr || '') + '</div>' +
              '</button>';
    });
    html += '</div>';
  }

  govde.innerHTML = html;
}

function bpKaydet(){
  saveRozetVitrini(_bsSecim);
  closeBadgePicker();
  showToast('✅ Rozet vitrinin güncellendi.');
  renderRozetVitrini();
}
