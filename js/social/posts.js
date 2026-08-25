/* ══════════════════════════════════════════════════════════
   RavenFit — posts.js
   Gönderi sistemi

   DEPOLAMA MİMARİSİ
   ──────────────────────────────────────────────────────────
   Firebase Storage ücretli plan gerektirdiği için fotoğraflar
   Firestore'da saklanır. Belge başına 1 MB sınırı var — ama
   HER BELGE kendi sınırına sahip. Bu yüzden:

     posts/{postId}            metin + küçük önizlemeler (~120 KB)
     posts/{postId}/media/{n}  her fotoğraf ayrı belge (~200 KB)

   Izgarada yalnızca önizlemeler yüklenir → akış hızlı kalır.
   Tam fotoğraf ancak gönderi açılınca iner.

   ÜRETİM NOTU: Gerçek uygulamada nesne depolamaya (S3/Cloudinary)
   taşınmalı. Arayüz değişmez, sadece bu dosya değişir.
   ══════════════════════════════════════════════════════════ */

var GONDERI_MAX_FOTO = 5;
var GONDERI_MAX_METIN = 500;

var GONDERI_TURLERI = [
  {id:'serbest',   ad:'Serbest',   ikon:'💬'},
  {id:'antrenman', ad:'Antrenman', ikon:'🏋️'},
  {id:'ilerleme',  ad:'İlerleme',  ikon:'📈'},
  {id:'tarif',     ad:'Tarif',     ikon:'🥗'}
];

/* ── Yeni gönderi durumu ─────────────────────────────────── */
var _yeniGonderi = { fotograflar:[], tur:'serbest' };

function openNewPost(){
  if(!_fbUser || !_fbDb){
    showToast('Gönderi paylaşmak için giriş yapmalısın.','warn');
    return;
  }
  _yeniGonderi = { fotograflar:[], tur:'serbest' };
  var ov = document.getElementById('new-post-overlay');
  if(!ov) return;
  ov.classList.add('active');
  document.body.style.overflow = 'hidden';
  _npCiz();
}

function closeNewPost(){
  var ov = document.getElementById('new-post-overlay');
  if(ov) ov.classList.remove('active');
  document.body.style.overflow = '';
  _yeniGonderi = { fotograflar:[], tur:'serbest' };
}

function npFotoSec(){
  var inp = document.getElementById('np-file-input');
  if(inp) inp.click();
}

function npFotoEklendi(olay){
  var inp = (olay && olay.target) ? olay.target : olay;
  if(!inp || !inp.files || !inp.files.length) return;

  var dosyalar = Array.prototype.slice.call(inp.files);
  var bosYer = GONDERI_MAX_FOTO - _yeniGonderi.fotograflar.length;
  if(bosYer <= 0){
    showToast('En fazla ' + GONDERI_MAX_FOTO + ' fotoğraf ekleyebilirsin.','warn');
    try { inp.value=''; } catch(e){}
    return;
  }
  if(dosyalar.length > bosYer){
    showToast(bosYer + ' fotoğraf daha ekleyebilirsin.','warn');
    dosyalar = dosyalar.slice(0, bosYer);
  }

  var durum = document.getElementById('np-durum');
  if(durum) durum.textContent = 'Fotoğraflar işleniyor...';

  Promise.all(dosyalar.map(function(d){ return gorselCiftiUret(d); }))
    .then(function(sonuclar){
      sonuclar.forEach(function(s){ _yeniGonderi.fotograflar.push(s); });
      if(durum) durum.textContent = '';
      _npCiz();
    })
    .catch(function(e){
      if(durum) durum.textContent = '';
      showToast('❌ ' + (e && e.message || 'Fotoğraf işlenemedi.'),'error');
    });

  try { inp.value=''; } catch(e){}
}

function npFotoSil(i){
  _yeniGonderi.fotograflar.splice(i,1);
  _npCiz();
}

function npTurSec(tur){
  _yeniGonderi.tur = tur;
  _npCiz();
}

function _npCiz(){
  var el = document.getElementById('np-body');
  if(!el) return;
  var f = _yeniGonderi.fotograflar;

  var html = '';

  /* Gönderi türü */
  html += '<div class="np-turler">';
  GONDERI_TURLERI.forEach(function(t){
    html += '<button class="np-tur' + (_yeniGonderi.tur===t.id?' sec':'') + '" ' +
            'onclick="npTurSec(\'' + t.id + '\')">' +
            '<span>' + t.ikon + '</span>' + t.ad + '</button>';
  });
  html += '</div>';

  /* Metin */
  var mevcutMetin = '';
  var eski = document.getElementById('np-metin');
  if(eski) mevcutMetin = eski.value;
  html += '<textarea class="fi np-metin" id="np-metin" rows="4" maxlength="' + GONDERI_MAX_METIN + '" ' +
          'placeholder="Ne paylaşmak istersin?" oninput="npMetinSay()">' +
          _npKacir(mevcutMetin) + '</textarea>';
  html += '<div class="np-sayac" id="np-sayac">' + mevcutMetin.length + ' / ' + GONDERI_MAX_METIN + '</div>';

  /* Fotoğraflar */
  html += '<div class="np-fotolar">';
  f.forEach(function(foto, i){
    html += '<div class="np-foto">' +
              '<img src="' + foto.onizleme.veri + '" alt="">' +
              '<button class="np-foto-sil" onclick="npFotoSil(' + i + ')" aria-label="Kaldır">&times;</button>' +
              '<span class="np-foto-boyut">' + baytMetni(foto.tam.bayt) + '</span>' +
            '</div>';
  });
  if(f.length < GONDERI_MAX_FOTO){
    html += '<button class="np-foto-ekle" onclick="npFotoSec()">' +
              '<span>+</span>' +
              '<small>' + f.length + '/' + GONDERI_MAX_FOTO + '</small>' +
            '</button>';
  }
  html += '</div>';
  html += '<div class="np-durum" id="np-durum"></div>';

  el.innerHTML = html;

  /* Metin alanına odaklan ve imleci sona al */
  var yeni = document.getElementById('np-metin');
  if(yeni && mevcutMetin){
    try { yeni.setSelectionRange(mevcutMetin.length, mevcutMetin.length); } catch(e){}
  }
}

function npMetinSay(){
  var t = document.getElementById('np-metin');
  var s = document.getElementById('np-sayac');
  if(t && s) s.textContent = t.value.length + ' / ' + GONDERI_MAX_METIN;
}

function _npKacir(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ── Paylaş ──────────────────────────────────────────────── */
function npPaylas(){
  var metinEl = document.getElementById('np-metin');
  var metin = metinEl ? metinEl.value.trim() : '';
  var f = _yeniGonderi.fotograflar;

  if(!metin && !f.length){
    showToast('Bir şeyler yaz veya fotoğraf ekle.','warn');
    return;
  }
  if(!_fbUser || !_fbDb){
    showToast('Giriş yapmalısın.','error');
    return;
  }

  var btn = document.getElementById('np-paylas-btn');
  if(btn){ btn.disabled = true; btn.textContent = 'Paylaşılıyor...'; }
  var durum = document.getElementById('np-durum');
  if(durum) durum.textContent = 'Gönderi oluşturuluyor...';

  var postRef = _fbDb.collection('posts').doc();
  var postId = postRef.id;

  /* Ana belge: metin + küçük önizlemeler (ızgarada gösterilir) */
  var anaBelge = {
    uid: _fbUser.uid,
    metin: metin,
    tur: _yeniGonderi.tur,
    fotoSayisi: f.length,
    onizlemeler: f.map(function(x){ return x.onizleme.veri; }),
    begeni: 0,
    yorum: 0,
    tarih: firebase.firestore.FieldValue.serverTimestamp()
  };

  postRef.set(anaBelge)
    .then(function(){
      /* Tam fotoğraflar ayrı belgelere — her biri kendi 1 MB bütçesinde */
      if(!f.length) return;
      if(durum) durum.textContent = 'Fotoğraflar yükleniyor...';
      return Promise.all(f.map(function(foto, i){
        return postRef.collection('media').doc(String(i)).set({
          sira: i,
          veri: foto.tam.veri,
          genislik: foto.tam.genislik,
          yukseklik: foto.tam.yukseklik
        });
      }));
    })
    .then(function(){
      if(btn){ btn.disabled = false; btn.textContent = 'Paylaş'; }
      closeNewPost();
      showToast('✅ Gönderin paylaşıldı!');
      /* Profil ızgarasını tazele */
      if(typeof _renderProfilSekmesi === 'function') _renderProfilSekmesi();
      if(typeof renderProfil === 'function') renderProfil();
    })
    .catch(function(e){
      if(btn){ btn.disabled = false; btn.textContent = 'Paylaş'; }
      if(durum) durum.textContent = '';
      console.warn('Gönderi hatası:', e);
      showToast('❌ Gönderi paylaşılamadı: ' + (e && e.message || ''),'error');
    });
}

/* ── Gönderi okuma ───────────────────────────────────────── */

function gonderileriGetir(uid, limit){
  return new Promise(function(cozumle){
    if(!_fbDb) return cozumle([]);
    _fbDb.collection('posts')
      .where('uid','==',uid)
      .limit(limit || 30).get()
      .then(function(snap){
        var liste = [];
        snap.forEach(function(d){
          var g = d.data(); g.id = d.id;
          liste.push(g);
        });
        /* Yeniden eskiye — tarih alanı sunucuda oluştuğu için
           istemcide sıralanır (bileşik dizin gerektirmez) */
        liste.sort(function(a,b){
          var ta = a.tarih && a.tarih.seconds ? a.tarih.seconds : 0;
          var tb = b.tarih && b.tarih.seconds ? b.tarih.seconds : 0;
          return tb - ta;
        });
        cozumle(liste);
      })
      .catch(function(e){
        console.warn('Gönderiler okunamadı:', e && e.message);
        cozumle([]);
      });
  });
}

function gonderiSay(uid){
  return new Promise(function(cozumle){
    if(!_fbDb) return cozumle(0);
    var sorgu = _fbDb.collection('posts').where('uid','==',uid);
    if(typeof sorgu.count === 'function'){
      sorgu.count().get()
        .then(function(s){ cozumle(s.data().count || 0); })
        .catch(function(){ cozumle(0); });
    } else {
      sorgu.limit(200).get()
        .then(function(s){ cozumle(s.size !== undefined ? s.size : (s.docs||[]).length); })
        .catch(function(){ cozumle(0); });
    }
  });
}

/* Tam fotoğrafları getir — gönderi açılınca */
function gonderiMedyaGetir(postId){
  return new Promise(function(cozumle){
    if(!_fbDb) return cozumle([]);
    _fbDb.collection('posts').doc(postId).collection('media').get()
      .then(function(snap){
        var liste = [];
        snap.forEach(function(d){ liste.push(d.data()); });
        liste.sort(function(a,b){ return (a.sira||0) - (b.sira||0); });
        cozumle(liste);
      })
      .catch(function(){ cozumle([]); });
  });
}

/* ── Izgara çizimi ───────────────────────────────────────── */
function gonderiIzgarasi(liste, sahibiMiyim){
  if(!liste.length){
    return '<div class="pr-tab-bos"><span class="ikon">📷</span>' +
           (sahibiMiyim ? 'Henüz gönderi yok.<br>İlk gönderini paylaş.'
                        : 'Henüz gönderi paylaşılmamış.') + '</div>';
  }
  return '<div class="pr-grid">' + liste.map(function(g){
    var kapak = (g.onizlemeler && g.onizlemeler[0]) ? g.onizlemeler[0] : null;
    var coklu = (g.fotoSayisi||0) > 1 ? '<span class="pr-grid-multi">⧉</span>' : '';
    var tur = GONDERI_TURLERI.find(function(t){ return t.id === g.tur; });
    return '<div class="pr-grid-item" onclick="openPost(\'' + g.id + '\')">' +
             (kapak
               ? '<img src="' + kapak + '" alt="">'
               : '<div class="pr-grid-yazi">' + (tur?tur.ikon+' ':'') +
                 _npKacir((g.metin||'').slice(0,80)) + '</div>') +
             coklu +
           '</div>';
  }).join('') + '</div>';
}

/* ── Gönderi detay ───────────────────────────────────────── */
var _acikGonderi = null;

function openPost(postId){
  if(!_fbDb) return;
  var ov = document.getElementById('post-detail-overlay');
  if(!ov) return;
  ov.classList.add('active');
  document.body.style.overflow = 'hidden';

  var g = document.getElementById('pd-body');
  if(g) g.innerHTML = '<div class="dsc-durum">Yükleniyor...</div>';

  _fbDb.collection('posts').doc(postId).get()
    .then(function(doc){
      if(!doc.exists) throw new Error('Gönderi bulunamadı');
      var post = doc.data(); post.id = doc.id;
      _acikGonderi = post;
      return Promise.all([post, profilGetir(post.uid), gonderiMedyaGetir(postId)]);
    })
    .then(function(r){
      _pdCiz(r[0], r[1], r[2]);
    })
    .catch(function(e){
      if(g) g.innerHTML = '<div class="dsc-durum">' + (e.message||'Açılamadı') + '</div>';
    });
}

function closePost(){
  var ov = document.getElementById('post-detail-overlay');
  if(ov) ov.classList.remove('active');
  document.body.style.overflow = '';
  _acikGonderi = null;
}

function _pdCiz(post, profil, medya){
  var el = document.getElementById('pd-body');
  if(!el) return;

  var bas = (profil.isim || profil.nickname || '?').charAt(0).toUpperCase();
  var av = profil.avatar ? '<img src="' + profil.avatar + '" alt="">' : '<span>' + bas + '</span>';
  var tur = GONDERI_TURLERI.find(function(t){ return t.id === post.tur; });
  var benimMi = _fbUser && post.uid === _fbUser.uid;

  var html = '';

  /* Başlık: yazar */
  html += '<div class="pd-yazar">';
  html +=   '<button class="dsc-av" style="border:none;padding:0" onclick="closePost();openUserProfile(\'' + post.uid + '\')">' + av + '</button>';
  html +=   '<div class="dsc-bilgi">';
  html +=     '<div class="dsc-nick">@' + (profil.nickname||'') + '</div>';
  html +=     '<div class="dsc-isim">' + _pdTarih(post.tarih) + '</div>';
  html +=   '</div>';
  if(tur) html += '<span class="pd-tur">' + tur.ikon + ' ' + tur.ad + '</span>';
  html += '</div>';

  /* Fotoğraflar */
  if(medya && medya.length){
    html += '<div class="pd-medya">';
    medya.forEach(function(m){
      html += '<img src="' + m.veri + '" alt="" loading="lazy">';
    });
    html += '</div>';
    if(medya.length > 1){
      html += '<div class="pd-medya-not">' + medya.length + ' fotoğraf · yana kaydır</div>';
    }
  }

  /* Metin */
  if(post.metin){
    html += '<div class="pd-metin">' + _npKacir(post.metin) + '</div>';
  }

  /* Eylemler */
  html += '<div class="pd-eylemler">';
  html +=   '<button class="pd-eylem" onclick="showToast(\'Beğeni yakında eklenecek.\',\'warn\')">♡ Beğen</button>';
  html +=   '<button class="pd-eylem" onclick="showToast(\'Yorumlar yakında eklenecek.\',\'warn\')">💬 Yorum</button>';
  if(benimMi){
    html += '<button class="pd-eylem sil" onclick="gonderiSil(\'' + post.id + '\')">🗑 Sil</button>';
  }
  html += '</div>';

  el.innerHTML = html;
}

function _pdTarih(ts){
  if(!ts || !ts.seconds) return 'az önce';
  var d = new Date(ts.seconds * 1000);
  var fark = (Date.now() - d.getTime()) / 1000;
  if(fark < 60) return 'az önce';
  if(fark < 3600) return Math.floor(fark/60) + ' dakika önce';
  if(fark < 86400) return Math.floor(fark/3600) + ' saat önce';
  if(fark < 604800) return Math.floor(fark/86400) + ' gün önce';
  return d.toLocaleDateString('tr-TR');
}

function gonderiSil(postId){
  showConfirm('Gönderiyi Sil',
    'Bu gönderi kalıcı olarak silinecek. Emin misin?',
    function(){
      var ref = _fbDb.collection('posts').doc(postId);
      /* Önce alt koleksiyondaki fotoğraflar, sonra ana belge */
      ref.collection('media').get()
        .then(function(snap){
          return Promise.all(snap.docs.map(function(d){ return d.ref.delete(); }));
        })
        .then(function(){ return ref.delete(); })
        .then(function(){
          closePost();
          showToast('Gönderi silindi.');
          if(typeof _renderProfilSekmesi === 'function') _renderProfilSekmesi();
          if(typeof renderProfil === 'function') renderProfil();
        })
        .catch(function(e){
          showToast('❌ Silinemedi: ' + (e && e.message || ''),'error');
        });
    }, 'Evet, Sil');
}
