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
  else _renderBaskaProfil();
}

/* ── Başkasının profilini aç ─────────────────────────────── */
function openUserProfile(uid){
  if(_fbUser && uid === _fbUser.uid){ uid = null; }   /* kendi profilim */
  _goruntulenenUid = uid;
  _profilSekmesi = 'posts';
  closeDiscover();
  if(typeof switchMain === 'function') switchMain('profil');
  renderProfil();
}

/* Kendi profilime dön */
function backToOwnProfile(){
  _goruntulenenUid = null;
  _profilSekmesi = 'posts';
  renderProfil();
}

var _bakilanProfil = null;   /* görüntülenen profil verisi */

function _renderBaskaProfil(){
  var uid = _goruntulenenUid;

  /* Yükleniyor durumu */
  _prYaz('pr-nick', '@...');
  _prYaz('pr-name', 'Yükleniyor...');
  var bioEl = document.getElementById('pr-bio');
  if(bioEl){ bioEl.textContent = ''; bioEl.style.display='none'; }

  /* Avatar düzenleme butonu başkasının profilinde GİZLİ */
  var avEdit = document.getElementById('pr-av-edit');
  if(avEdit) avEdit.style.display = 'none';

  /* Üstteki + butonu da gizlenmeli — başkasının profiline gönderi atılmaz */
  _prUstButonlar(false);

  profilGetir(uid).then(function(p){
    _bakilanProfil = p;

    _prYaz('pr-nick', '@' + (p.nickname || ''));

    var adEl = document.getElementById('pr-name');
    if(adEl){
      adEl.innerHTML = (p.isim || p.nickname || 'İsimsiz') +
        (p.onay === 'onayli' ? ' <span class="pr-verified" title="Onaylı hesap">✔</span>' : '');
    }

    if(bioEl){
      bioEl.textContent = p.bio || '';
      bioEl.style.display = p.bio ? 'block' : 'none';
    }

    _sayacYaz('pr-c-post', p.gonderi || 0);
    _sayacYaz('pr-c-followers', p.takipci || 0);
    _sayacYaz('pr-c-following', p.takip || 0);

    /* Avatar */
    var img = document.getElementById('avatar-img');
    var ini = document.getElementById('avatar-initials');
    if(p.avatar && img){
      img.src = p.avatar; img.style.display = 'block';
      if(ini) ini.style.display = 'none';
    } else {
      if(img){ img.src=''; img.style.display='none'; }
      if(ini){
        ini.textContent = (p.isim || p.nickname || '?').charAt(0).toUpperCase();
        ini.style.display = '';
      }
    }

    _renderBaskaEylemler(uid);
    _renderBaskaVitrin(p);
    _renderProfilSekmesi();
  }).catch(function(e){
    _prYaz('pr-name', 'Profil bulunamadı');
    var act = document.getElementById('pr-actions');
    if(act){
      act.innerHTML = '<button class="pr-act primary" onclick="backToOwnProfile()">' +
                      '← Profilime Dön</button>';
    }
  });
}

function _prYaz(id, metin){
  var el = document.getElementById(id);
  if(el) el.textContent = metin;
}

/* Üst satırdaki + ve ☰ butonları — sadece kendi profilimde */
function _prUstButonlar(goster){
  var kap = document.querySelector('.pr-top-actions');
  if(!kap) return;
  if(goster){
    kap.innerHTML =
      '<button class="pr-icon-btn" onclick="openNewPost()" title="Yeni gönderi" aria-label="Yeni gönderi">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
          '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg></button>' +
      '<button class="pr-icon-btn" onclick="openSettingsDrawer()" title="Menü" aria-label="Menü">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
          '<path d="M4 7h16M4 12h16M4 17h16"/></svg></button>';
  } else {
    kap.innerHTML =
      '<button class="pr-icon-btn" onclick="backToOwnProfile()" title="Profilime dön" aria-label="Profilime dön">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
          '<path d="M19 12H5M11 18l-6-6 6-6"/></svg></button>';
  }
}

/* Takip Et / Mesaj At / Abone Ol */
function _renderBaskaEylemler(uid){
  var act = document.getElementById('pr-actions');
  if(!act) return;

  act.innerHTML =
    '<button class="pr-act primary" id="pr-takip-btn" disabled>...</button>' +
    '<button class="pr-act" onclick="showToast(\'Mesajlaşma yakında eklenecek.\',\'warn\')">Mesaj At</button>' +
    (_bakilanProfil && _bakilanProfil.onay === 'onayli'
      ? '<button class="pr-act" onclick="showToast(\'Hizmet satın alma yakında eklenecek.\',\'warn\')">Abone Ol</button>'
      : '');

  takipEdiyorMuyum(uid).then(function(ediyor){
    _takipButonYaz(ediyor);
  });
}

function _takipButonYaz(ediyor){
  var b = document.getElementById('pr-takip-btn');
  if(!b) return;
  b.disabled = false;
  b.textContent = ediyor ? 'Takiptesin' : 'Takip Et';
  b.className = 'pr-act ' + (ediyor ? 'following' : 'primary');
  b.onclick = function(){ toggleTakip(); };
}

function toggleTakip(){
  var uid = _goruntulenenUid;
  if(!uid) return;
  var b = document.getElementById('pr-takip-btn');
  if(b){ b.disabled = true; b.textContent = '...'; }

  takipDegistir(uid).then(function(ediyor){
    _takipButonYaz(ediyor);
    /* Takipçi sayacını anında güncelle */
    var p = _profilOnbellek[uid];
    if(p) _sayacYaz('pr-c-followers', p.takipci || 0);
    showToast(ediyor ? '✅ Takip ediliyor.' : 'Takip bırakıldı.');
  }).catch(function(e){
    _takipButonYaz(false);
    showToast('❌ ' + e.message, 'error');
  });
}

/* Başkasının vitrini — SADECE paylaştıkları */
function _renderBaskaVitrin(p){
  var el = document.getElementById('pr-vitrin');
  if(!el) return;

  var ist = p.istatistik || {};
  var vitrin = (p.vitrin || []).filter(function(id){ return ist[id] !== undefined; });

  if(!vitrin.length){
    el.className = 'pr-vitrin-bos';
    el.innerHTML = 'Bu kullanıcı istatistiklerini paylaşmıyor.';
    return;
  }

  el.className = 'pr-vitrin';
  el.innerHTML = vitrin.map(function(id){
    var a = alanBul(id);
    return '<div class="pr-vit">' +
             '<div class="pr-vit-v">' + _baskaDegerMetni(id, ist[id]) + '</div>' +
             '<div class="pr-vit-l">' + (a ? a.ad : id) + '</div>' +
           '</div>';
  }).join('');
}

/* Başkasının değerini biçimlendir — kendi verimizden değil, profilden */
function _baskaDegerMetni(id, deger){
  var a = alanBul(id);
  if(!a || deger === null || deger === undefined) return '—';
  var v = Number(deger);
  if(isNaN(v)) return '—';
  var s = a.ondalik > 0 ? v.toFixed(a.ondalik) : String(Math.round(v));
  return a.birim ? (s + (a.birim === '%' ? '%' : ' ' + a.birim)) : s;
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

  /* Sayaçlar — Firestore'daki açık profilden okunur */
  _sayacYaz('pr-c-post', 0);
  _sayacYaz('pr-c-followers', 0);
  _sayacYaz('pr-c-following', 0);
  if(_fbUser && typeof profilGetir === 'function'){
    /* Önbelleği atla — kendi sayaçlarım güncel olmalı */
    if(_profilOnbellek) delete _profilOnbellek[_fbUser.uid];
    profilGetir(_fbUser.uid).then(function(pf){
      _sayacYaz('pr-c-post', pf.gonderi || 0);
      _sayacYaz('pr-c-followers', pf.takipci || 0);
      _sayacYaz('pr-c-following', pf.takip || 0);
    }).catch(function(){});
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
  _prUstButonlar(true);

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
  /* Başkasının profilindeyse onun paylaştıkları gösterilir */
  var baska = !kendiProfilimMi() && _bakilanProfil;
  var paylasilan, degerAl;
  if(baska){
    var ist = _bakilanProfil.istatistik || {};
    paylasilan = ISTATISTIK_ALANLARI.filter(function(a){ return ist[a.id] !== undefined; });
    degerAl = function(id){ return _baskaDegerMetni(id, ist[id]); };
  } else {
    var ayarlar = getPaylasimAyarlari();
    paylasilan = ISTATISTIK_ALANLARI.filter(function(a){
      return ayarlar[a.id] && alanMetni(a.id) !== '—';
    });
    degerAl = alanMetni;
  }

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
function openPostList(){ switchProfileTab('posts'); }
/* Takipçi / takip listesi */
function openFollowList(tur){
  var uid = _goruntulenenUid || (_fbUser ? _fbUser.uid : null);
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
