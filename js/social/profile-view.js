/* ══════════════════════════════════════════════════════════
   RavenFit — profile-view.js
   Profil ekranının çizimi

   İKİ DURUM VAR — karıştırılmamalı:
     Kendi profilim  → Profili Düzenle / Profili Paylaş
     Başkasınınki    → Takip Et / Mesaj At / Abone Ol

   _goruntulenenUid null ise kendi profilimizdeyiz.
   ══════════════════════════════════════════════════════════ */

var _goruntulenenUid = null;   /* null = kendi profilim */
var _profilSekmesi = 'posts';

function kendiProfilimMi(){
  return _goruntulenenUid === null;
}

/* Profil ekranını çizer */
function renderProfil(){
  if(kendiProfilimMi()) _renderKendiProfil();
  /* Başkasının profili Faz P5'te */
}

function _renderKendiProfil(){
  var p = getYerelProfil();
  var nick = p.nickname || _lsGet('nickname') || '';

  /* Kullanıcı adı */
  var nickEl = document.getElementById('pr-nick');
  if(nickEl) nickEl.textContent = nick ? '@' + nick : '@kullanıcı';

  /* İsim */
  var adEl = document.getElementById('pr-name');
  if(adEl){
    var isim = p.isim || (typeof U !== 'undefined' ? (U.name || '') : '');
    var onayli = p.onay === 'onayli';
    adEl.innerHTML = (isim || nick || 'İsimsiz') +
      (onayli ? ' <span class="pr-verified" title="Onaylı hesap">✔</span>' : '');
  }

  /* Biyografi */
  var bioEl = document.getElementById('pr-bio');
  if(bioEl){
    bioEl.textContent = p.bio || '';
    bioEl.style.display = p.bio ? 'block' : 'none';
  }

  /* Sayaçlar — sosyal veriler henüz yok, 0 gösterilir */
  _sayacYaz('pr-c-post', p.gonderiSayisi || 0);
  _sayacYaz('pr-c-followers', p.takipciSayisi || 0);
  _sayacYaz('pr-c-following', p.takipSayisi || 0);

  /* Avatar */
  if(typeof setAvatarInitials === 'function') setAvatarInitials();

  /* Eylem butonları — KENDİ profilim */
  var act = document.getElementById('pr-actions');
  if(act){
    act.innerHTML =
      '<button class="pr-act primary" onclick="openProfileEdit()">Profili Düzenle</button>' +
      '<button class="pr-act" onclick="shareProfile()">Profili Paylaş</button>';
  }

  /* Avatar düzenleme butonu sadece kendi profilimde */
  var avEdit = document.getElementById('pr-av-edit');
  if(avEdit) avEdit.style.display = 'flex';

  _renderVitrin();
  _renderProfilSekmesi();
}

function _sayacYaz(id, v){
  var el = document.getElementById(id);
  if(el) el.textContent = _sayiKisalt(v);
}

/* 1234 → 1.2B  ·  1234567 → 1.2M */
function _sayiKisalt(n){
  n = Number(n) || 0;
  if(n < 1000) return String(n);
  if(n < 1000000) return (n/1000).toFixed(n < 10000 ? 1 : 0).replace('.0','') + 'B';
  return (n/1000000).toFixed(1).replace('.0','') + 'M';
}

/* ── Vitrin: en fazla 4 değer ───────────────────────────── */
function _renderVitrin(){
  var el = document.getElementById('pr-vitrin');
  if(!el) return;

  var ayarlar = getPaylasimAyarlari();
  var vitrin = getVitrinAlanlari().filter(function(id){
    return ayarlar[id] && alanMetni(id) !== '—';
  });

  if(!vitrin.length){
    el.className = 'pr-vitrin-bos';
    el.innerHTML = 'Henüz istatistik paylaşmıyorsun.<br>' +
      'Hangi değerlerin görüneceğini seçebilirsin.' +
      '<br><button onclick="openStatsPanel()">İstatistikleri Seç</button>';
    return;
  }

  el.className = 'pr-vitrin';
  el.innerHTML = vitrin.map(function(id){
    var a = alanBul(id);
    return '<div class="pr-vit">' +
             '<div class="pr-vit-v">' + alanMetni(id) + '</div>' +
             '<div class="pr-vit-l">' + (a ? a.ad : id) + '</div>' +
           '</div>';
  }).join('');
}

/* ── Detay penceresi ────────────────────────────────────── */
function openStatsDetail(){
  var ayarlar = getPaylasimAyarlari();
  var paylasilan = ISTATISTIK_ALANLARI.filter(function(a){
    return ayarlar[a.id] && alanMetni(a.id) !== '—';
  });

  var govde = document.getElementById('sd-body');
  var baslik = document.getElementById('sd-baslik');
  if(baslik) baslik.textContent = kendiProfilimMi() ? 'İstatistiklerim' : 'İstatistikler';

  if(govde){
    if(!paylasilan.length){
      govde.innerHTML = '<div class="pr-tab-bos"><span class="ikon">📊</span>' +
        'Henüz paylaşılan istatistik yok.' +
        (kendiProfilimMi() ? '<br><br><button class="btn btn-p" onclick="closeStatsDetail();openStatsPanel()">İstatistikleri Seç</button>' : '') +
        '</div>';
    } else {
      var html = '';
      ['temel','hesap','olcu'].forEach(function(grup){
        var g = paylasilan.filter(function(a){ return a.grup === grup; });
        if(!g.length) return;
        html += '<div class="sp-grup-baslik">' + ISTATISTIK_GRUPLARI[grup] + '</div>';
        g.forEach(function(a){
          html += '<div class="sp-satir acik">' +
                    '<div class="sp-sol"><div class="sp-ad">' + a.ad + '</div></div>' +
                    '<div class="sp-sag" style="font-size:15px;font-weight:700;color:var(--accent)">' +
                      alanMetni(a.id) + '</div>' +
                  '</div>';
        });
      });
      /* Kendi profilinde düzenleme kısayolu */
      if(kendiProfilimMi()){
        html += '<div style="padding:14px 4px 4px">' +
                '<button class="btn btn-s btn-full" onclick="closeStatsDetail();openStatsPanel()">' +
                '⚙️ Paylaşım Ayarlarını Düzenle</button></div>';
      }
      govde.innerHTML = html;
    }
  }

  var ov = document.getElementById('stats-detail-overlay');
  if(ov){ ov.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeStatsDetail(){
  var ov = document.getElementById('stats-detail-overlay');
  if(ov) ov.classList.remove('active');
  document.body.style.overflow = '';
}

/* ── Profil sekmeleri ───────────────────────────────────── */
function switchProfileTab(sekme){
  _profilSekmesi = sekme;
  document.querySelectorAll('.pr-tab').forEach(function(t){
    t.classList.toggle('act', t.dataset.pt === sekme);
  });
  _renderProfilSekmesi();
}

function _renderProfilSekmesi(){
  var el = document.getElementById('pr-tab-body');
  if(!el) return;

  if(_profilSekmesi === 'posts'){
    el.innerHTML = '<div class="pr-tab-bos"><span class="ikon">📷</span>' +
      'Henüz gönderi yok.' +
      (kendiProfilimMi() ? '<br>İlk gönderini paylaş.' : '') +
      '</div>';
  } else if(_profilSekmesi === 'programs'){
    el.innerHTML = '<div class="pr-tab-bos"><span class="ikon">🏋️</span>' +
      '<strong>Antrenman Programları</strong><br>' +
      'Paylaştığın programlar burada görünecek.<br>' +
      '<span style="opacity:.7">Yakında</span></div>';
  } else {
    el.innerHTML = '<div class="pr-tab-bos"><span class="ikon">📣</span>' +
      '<strong>Hizmetler</strong><br>' +
      'Antrenörlük ve diyetisyenlik hizmetleri burada listelenecek.<br>' +
      '<span style="opacity:.7">Yakında</span></div>';
  }
}

/* ── Avatar tıklama — kendi profilimde değiştir, başkasınınkinde büyüt ── */
function onAvatarTap(){
  if(kendiProfilimMi()){ triggerAvatarUpload(); return; }
  /* Başkasının profilinde büyütme — Faz P5 */
}

/* ── Geçici yer tutucular (sonraki fazlarda gelecek) ────── */
function openNewPost(){ showToast('Gönderi paylaşma yakında eklenecek.','warn'); }
function openDiscover(){ showToast('Keşfet yakında eklenecek.','warn'); }
function openPostList(){ switchProfileTab('posts'); }
function openFollowList(tur){ showToast('Takipçi listeleri yakında eklenecek.','warn'); }
function shareProfile(){
  var p = getYerelProfil();
  var nick = p.nickname || _lsGet('nickname') || '';
  var metin = nick ? ('RavenFit profilim: @' + nick) : 'RavenFit profilim';
  if(navigator.share){
    navigator.share({title:'RavenFit', text:metin}).catch(function(){});
  } else {
    showToast('Profil bağlantısı yakında paylaşılabilir olacak.','warn');
  }
}
