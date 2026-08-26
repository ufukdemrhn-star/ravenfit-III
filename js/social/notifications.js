/* ══════════════════════════════════════════════════════════
   RavenFit — notifications.js
   Bildirimler

   VERİ YAPISI
   ──────────────────────────────────────────────────────────
   notifications/{id} → { hedef, kimden, tur, hedefId,
                          onizleme, okundu, tarih }

   hedef   : bildirimi ALAN kullanıcı
   kimden  : eylemi YAPAN kullanıcı
   tur     : takip | takipIstegi | istekKabul | begeni |
             yorum | yanit | yorumBegeni | onay
   hedefId : gönderi/yorum kimliği (varsa)
   onizleme: yorum metni veya gönderi başlangıcı

   NEDEN ALT KOLEKSİYON DEĞİL?
   notifications/{uid}/items/{id} yapısı daha temiz görünür ama
   Firestore kurallarında alt koleksiyona YAZMA izni vermek için
   üst belgeyi okumak gerekir; başkası sana bildirim yazamaz.
   Düz koleksiyonda "hedef" alanı kurallarla korunabilir.

   ⚠️ ÜRETİM NOTU
   Bildirimler istemciden yazılıyor. Kötü niyetli biri sahte
   bildirim üretebilir (kural yalnızca "kimden == kendisi"
   olduğunu doğrular). Gerçek uygulamada Cloud Functions ile
   sunucu tarafında üretilmelidir.
   ══════════════════════════════════════════════════════════ */

var BILDIRIM_TURLERI = {
  takip:       {ikon:'👤', metin:'seni takip etmeye başladı'},
  takipIstegi: {ikon:'🔔', metin:'sana takip isteği gönderdi'},
  istekKabul:  {ikon:'✅', metin:'takip isteğini kabul etti'},
  begeni:      {ikon:'❤️', metin:'gönderini beğendi'},
  yorum:       {ikon:'💬', metin:'gönderine yorum yaptı'},
  yanit:       {ikon:'↩️', metin:'yorumuna yanıt verdi'},
  yorumBegeni: {ikon:'💗', metin:'yorumunu beğendi'},
  onay:        {ikon:'🎖️', metin:'Profesyonel hesabın onaylandı'}
};

var BILDIRIM_SAYFA = 20;
var _bildirimler = [];
var _okunmamisSayi = 0;

/* ── Bildirim oluşturma ──────────────────────────────────── */

/* Bildirim yazar. Kendi eylemin için bildirim üretilmez. */
function bildirimGonder(hedefUid, tur, hedefId, onizleme){
  if(!_fbUser || !_fbDb) return Promise.resolve();
  if(!hedefUid || hedefUid === _fbUser.uid) return Promise.resolve();

  /* Engelli kullanıcıya bildirim gitmez */
  if(typeof engelliMi === 'function' && engelliMi(hedefUid)){
    return Promise.resolve();
  }

  return _fbDb.collection('notifications').add({
    hedef: hedefUid,
    kimden: _fbUser.uid,
    tur: tur,
    hedefId: hedefId || null,
    onizleme: (onizleme || '').slice(0, 120),
    okundu: false,
    tarih: firebase.firestore.FieldValue.serverTimestamp()
  }).catch(function(e){
    console.warn('Bildirim gönderilemedi:', e && e.message);
  });
}

/* ── Okuma ───────────────────────────────────────────────── */

function bildirimleriGetir(limit){
  return new Promise(function(cozumle){
    if(!_fbUser || !_fbDb) return cozumle([]);
    _fbDb.collection('notifications')
      .where('hedef','==',_fbUser.uid)
      .limit(limit || BILDIRIM_SAYFA * 3).get()
      .then(function(snap){
        var liste = [];
        snap.forEach(function(d){ var b = d.data(); b.id = d.id; liste.push(b); });
        /* Yeniden eskiye — sunucu damgası istemcide sıralanır */
        liste.sort(function(a,b){
          var ta = a.tarih && a.tarih.seconds ? a.tarih.seconds : 0;
          var tb = b.tarih && b.tarih.seconds ? b.tarih.seconds : 0;
          return tb - ta;
        });
        /* Engellenenlerin bildirimleri gizlenir */
        if(typeof engelliMi === 'function'){
          liste = liste.filter(function(b){ return !engelliMi(b.kimden); });
        }
        cozumle(liste);
      })
      .catch(function(e){
        console.warn('Bildirimler okunamadı:', e && e.message);
        cozumle([]);
      });
  });
}

function okunmamisSay(){
  return new Promise(function(cozumle){
    if(!_fbUser || !_fbDb) return cozumle(0);
    var sorgu = _fbDb.collection('notifications')
      .where('hedef','==',_fbUser.uid)
      .where('okundu','==',false);
    if(typeof sorgu.count === 'function'){
      sorgu.count().get()
        .then(function(s){ cozumle(s.data().count || 0); })
        .catch(function(){ cozumle(0); });
    } else {
      sorgu.limit(100).get()
        .then(function(s){ cozumle(s.size !== undefined ? s.size : (s.docs||[]).length); })
        .catch(function(){ cozumle(0); });
    }
  });
}

/* Alt menüdeki okunmamış rozetini günceller */
function bildirimRozetiGuncelle(){
  okunmamisSay().then(function(n){
    _okunmamisSayi = n;
    var el = document.getElementById('bnav-bildirim-rozet');
    if(!el) return;
    if(n > 0){
      el.textContent = n > 99 ? '99+' : String(n);
      el.style.display = 'flex';
    } else {
      el.style.display = 'none';
    }
  });
}

function tumunuOkunduIsaretle(){
  if(!_fbUser || !_fbDb) return Promise.resolve();
  var okunmamis = _bildirimler.filter(function(b){ return !b.okundu; });
  if(!okunmamis.length) return Promise.resolve();

  return Promise.all(okunmamis.map(function(b){
    b.okundu = true;
    return _fbDb.collection('notifications').doc(b.id)
      .set({okundu:true}, {merge:true}).catch(function(){});
  })).then(function(){
    _okunmamisSayi = 0;
    bildirimRozetiGuncelle();
  });
}

/* ── Ekran ───────────────────────────────────────────────── */

function openNotifications(){
  if(!_fbUser){ showToast('Giriş yapmalısın.','warn'); return; }
  var ov = document.getElementById('notif-screen');
  if(!ov) return;

  /* Altımızdaki ekranı yığına al */
  if(typeof _ekranAcikMi === 'function' && _ekranAcikMi('feed-screen')){
    navGizle('feed', closeFeed, openFeed);
  }

  ov.classList.add('active');
  document.body.style.overflow = 'hidden';

  var el = document.getElementById('nt-body');
  if(el) el.innerHTML = '<div class="dsc-durum">Yükleniyor...</div>';

  bildirimleriGetir().then(function(liste){
    _bildirimler = liste;
    if(!liste.length){
      if(el) el.innerHTML = '<div class="fd-bos"><span class="ikon">🔔</span>' +
        '<strong>Bildirim yok</strong>' +
        'Takip, beğeni ve yorumlar burada görünür.</div>';
      return;
    }
    /* Gönderenlerin profillerini topluca getir */
    var uidler = [];
    liste.forEach(function(b){ if(b.kimden && uidler.indexOf(b.kimden) < 0) uidler.push(b.kimden); });
    return Promise.all(uidler.map(function(u){
      return profilGetir(u).catch(function(){ return {uid:u, nickname:'kullanıcı'}; });
    })).then(function(profiller){
      var harita = {};
      profiller.forEach(function(p){ if(p) harita[p.uid] = p; });
      _ntCiz(harita);
      /* Ekran açıldıktan sonra okundu işaretle */
      setTimeout(tumunuOkunduIsaretle, 900);
    });
  });
}

function closeNotifications(){
  var ov = document.getElementById('notif-screen');
  if(ov) ov.classList.remove('active');
  if(typeof navGeri !== 'function' || !navGeri()){
    document.body.style.overflow = '';
  }
}

function _ntCiz(profiller){
  var el = document.getElementById('nt-body');
  if(!el) return;

  el.innerHTML = _bildirimler.map(function(b){
    var p = profiller[b.kimden] || {};
    var t = BILDIRIM_TURLERI[b.tur] || {ikon:'🔔', metin:'bildirim'};
    var bas = (p.isim || p.nickname || '?').charAt(0).toUpperCase();
    var av = p.avatar ? '<img src="' + p.avatar + '" alt="">' : '<span>' + bas + '</span>';
    var rozet = (typeof onayRozeti === 'function') ? onayRozeti(p, 11) : '';

    /* Sistem bildirimi (onay) — gönderen yok */
    var sistemMi = (b.tur === 'onay');

    var html = '<button class="nt-satir' + (b.okundu ? '' : ' yeni') + '" ' +
               'onclick="ntAc(\'' + b.id + '\')">';

    html +=   '<div class="nt-av">' + (sistemMi ? '<span>🎖️</span>' : av) + '</div>';
    html +=   '<div class="nt-govde">';
    html +=     '<div class="nt-metin">';
    if(!sistemMi){
      html +=     '<strong>@' + (p.nickname||'kullanıcı') + rozet + '</strong> ';
    }
    html +=       t.metin;
    html +=     '</div>';
    if(b.onizleme){
      html +=   '<div class="nt-onizleme">"' + _ntKacir(b.onizleme) + '"</div>';
    }
    html +=     '<div class="nt-tarih">' + _pdTarih(b.tarih) + '</div>';
    html +=   '</div>';
    html +=   '<span class="nt-ikon">' + t.ikon + '</span>';
    if(!b.okundu) html += '<span class="nt-nokta"></span>';
    html += '</button>';
    return html;
  }).join('');
}

/* Bildirime tıklanınca ilgili yere git */
function ntAc(bildirimId){
  var b = _bildirimler.find(function(x){ return x.id === bildirimId; });
  if(!b) return;

  /* Okundu işaretle */
  if(!b.okundu && _fbDb){
    b.okundu = true;
    _fbDb.collection('notifications').doc(b.id)
      .set({okundu:true}, {merge:true}).catch(function(){});
    bildirimRozetiGuncelle();
  }

  closeNotifications();

  if(b.tur === 'takipIstegi'){
    if(typeof openPrivacySettings === 'function') openPrivacySettings();
  } else if(b.tur === 'takip' || b.tur === 'istekKabul'){
    if(typeof openUserProfile === 'function') openUserProfile(b.kimden);
  } else if(b.tur === 'onay'){
    if(typeof openProApplication === 'function') openProApplication();
  } else if(b.hedefId && typeof openPost === 'function'){
    openPost(b.hedefId);
  }
}

function _ntKacir(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* Oturum değişince temizle */
function bildirimOnbellegiTemizle(){
  _bildirimler = [];
  _okunmamisSayi = 0;
  var el = document.getElementById('bnav-bildirim-rozet');
  if(el) el.style.display = 'none';
}
