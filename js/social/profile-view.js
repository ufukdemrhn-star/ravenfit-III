/* ══════════════════════════════════════════════════════════
   RavenFit — profile-view.js
   Profil ekranının çizimi

   İKİ DURUM VAR — karıştırılmamalı:
     Kendi profilim  → Profili Düzenle / Profili Paylaş
     Başkasınınki    → Takip Et / Mesaj At / Abone Ol

   Başkasının profili ayrı ekranda: js/social/user-profile.js
   ══════════════════════════════════════════════════════════ */

var _profilSekmesi = 'posts';

/* Bu ekran her zaman kendi profilimizdir. */
function kendiProfilimMi(){ return true; }

/* Profil ekranını çizer */
/* Kendi profil sekmesi. Başkasının profili AYRI EKRANDA
   (js/social/user-profile.js) — bu fonksiyon ona hiç karışmaz. */
function renderProfil(){
  _renderKendiProfil();
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
    adEl.innerHTML = (isim || nick || 'İsimsiz') +
      ((typeof onayRozeti === 'function') ? onayRozeti(p, 15) : '');
  }

  /* Biyografi */
  var bioEl = document.getElementById('pr-bio');
  if(bioEl){
    bioEl.textContent = p.bio || '';
    bioEl.style.display = p.bio ? 'block' : 'none';
  }

  /* Sayaçlar — Firestore'daki açık profilden okunur */
  _sayacYaz('pr-c-post', 0);
  _sayacYaz('pr-c-followers', 0);
  _sayacYaz('pr-c-following', 0);
  if(_fbUser){
    /* Sayaçlar follows koleksiyonundan sayılır — saklanan değere güvenilmez */
    if(typeof takipciSay === 'function'){
      takipciSay(_fbUser.uid).then(function(n){ _sayacYaz('pr-c-followers', n); });
      takipSay(_fbUser.uid).then(function(n){ _sayacYaz('pr-c-following', n); });
    }
    if(typeof gonderiSay === 'function'){
      gonderiSay(_fbUser.uid).then(function(n){ _sayacYaz('pr-c-post', n); });
    }
  }

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
  var degerAl = alanMetni;

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
                      degerAl(a.id) + '</div>' +
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
    el.innerHTML = '<div class="dsc-durum">Yükleniyor...</div>';
    if(_fbUser && typeof gonderileriGetir === 'function'){
      gonderileriGetir(_fbUser.uid, 30).then(function(liste){
        el.innerHTML = gonderiIzgarasi(liste, true);
        _sayacYaz('pr-c-post', liste.length);
        if(typeof gonderiIstatistikDoldur === 'function') gonderiIstatistikDoldur(liste);
      });
    } else {
      el.innerHTML = gonderiIzgarasi([], true);
    }
  } else if(_profilSekmesi === 'programs'){
    el.innerHTML = '<div class="pr-tab-bos"><span class="ikon">🏋️</span>' +
      '<strong>Antrenman Programları</strong><br>' +
      'Paylaştığın programlar burada görünecek.<br>' +
      '<span style="opacity:.7">Yakında</span></div>';
  } else {
    /* Hizmetler — onay durumuna göre farklı içerik */
    var p = getYerelProfil();
    var onay = p.onay || 'yok';
    if(onay === 'onayli'){
      el.innerHTML = '<div class="dsc-durum">Yükleniyor...</div>';
      if(_fbUser && typeof paketleriGetir === 'function'){
        paketleriGetir(_fbUser.uid).then(function(liste){
          el.innerHTML = paketListesiHTML(liste, true);
        });
      }
    } else if(onay === 'beklemede'){
      el.innerHTML = '<div class="pr-tab-bos"><span class="ikon">⏳</span>' +
        '<strong>Başvurun İnceleniyor</strong><br>' +
        'Onaylandığında hizmet paketlerini paylaşabileceksin.' +
        '<br><br><button class="btn btn-s" onclick="openProApplication()">Başvuruyu Gör</button></div>';
    } else {
      el.innerHTML = '<div class="pr-tab-bos"><span class="ikon">🎖️</span>' +
        '<strong>Antrenör veya Diyetisyen misin?</strong><br>' +
        'Belgeni doğrulat, profilinde onaylı rozet kazan ve<br>' +
        'hizmet paketlerini paylaş.' +
        '<br><br><button class="btn btn-p" onclick="openProApplication()">Başvuru Yap</button></div>';
    }
  }
}

/* ── Avatar tıklama — kendi profilimde değiştir, başkasınınkinde büyüt ── */
function onAvatarTap(){
  if(kendiProfilimMi()){ triggerAvatarUpload(); return; }
  /* Başkasının profilinde büyütme — Faz P5 */
}

/* ── Geçici yer tutucular (sonraki fazlarda gelecek) ────── */
function openNewPost(){ showToast('Gönderi paylaşma yakında eklenecek.','warn'); }
function openPostList(){ switchProfileTab('posts'); }
/* Takipçi / takip listesi */
function openFollowList(tur, hedefUid){
  var uid = hedefUid || (_fbUser ? _fbUser.uid : null);
  if(!uid){ showToast('Giriş yapmalısın.','warn'); return; }

  var baslik = document.getElementById('fl-baslik');
  if(baslik) baslik.textContent = (tur === 'followers') ? 'Takipçiler' : 'Takip Edilenler';

  var govde = document.getElementById('fl-body');
  if(govde) govde.innerHTML = '<div class="dsc-durum">Yükleniyor...</div>';

  var ov = document.getElementById('follow-list-overlay');
  if(ov){ ov.classList.add('active'); document.body.style.overflow = 'hidden'; }

  var getir = (tur === 'followers') ? takipcileriGetir : takipEdilenleriGetir;
  getir(uid, 50)
    .then(profilleriGetir)
    .then(function(liste){
      if(!govde) return;
      if(!liste.length){
        govde.innerHTML = '<div class="dsc-durum">' +
          (tur === 'followers' ? 'Henüz takipçi yok.' : 'Henüz kimse takip edilmiyor.') +
          '</div>';
        return;
      }
      govde.innerHTML = liste.map(function(p){
        var bas = (p.isim || p.nickname || '?').charAt(0).toUpperCase();
        var av = p.avatar ? '<img src="' + p.avatar + '" alt="">' : '<span>' + bas + '</span>';
        return '<button class="dsc-satir" onclick="closeFollowList();openUserProfile(\'' + p.uid + '\')">' +
                 '<div class="dsc-av">' + av + '</div>' +
                 '<div class="dsc-bilgi">' +
                   '<div class="dsc-nick">@' + (p.nickname||'') + '</div>' +
                   '<div class="dsc-isim">' + (p.isim||'') + '</div>' +
                 '</div></button>';
      }).join('');
    })
    .catch(function(){
      if(govde) govde.innerHTML = '<div class="dsc-durum">Liste yüklenemedi.</div>';
    });
}

function closeFollowList(){
  var ov = document.getElementById('follow-list-overlay');
  if(ov) ov.classList.remove('active');
  document.body.style.overflow = '';
}
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
