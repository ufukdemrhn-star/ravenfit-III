/* ══════════════════════════════════════════════════════════
   RavenFit — admin/reports.js
   Şikâyet sistemi ve içerik yönetimi

   reports/{id} → { tur, hedefId, hedefUid, sebep, aciklama,
                    sikayetEden, durum, tarih }

   tur    : 'post' | 'profil' | 'yorum'
   durum  : 'acik' | 'kapatildi' | 'islem_yapildi'

   Kullanıcılar şikâyet oluşturabilir ama okuyamaz — yalnızca
   yöneticiler tüm şikâyetleri görür. Bu, şikâyet edenin
   kimliğinin korunması için gereklidir.
   ══════════════════════════════════════════════════════════ */

var SIKAYET_SEBEPLERI = [
  {id:'spam',      ad:'Spam veya yanıltıcı'},
  {id:'taciz',     ad:'Taciz veya nefret söylemi'},
  {id:'uygunsuz',  ad:'Uygunsuz içerik'},
  {id:'sahte',     ad:'Sahte hesap veya belge'},
  {id:'tehlikeli', ad:'Tehlikeli sağlık tavsiyesi'},
  {id:'diger',     ad:'Diğer'}
];

var _sikayetHedef = null;

/* ── Kullanıcı tarafı: şikâyet oluşturma ─────────────────── */
function openReport(tur, hedefId, hedefUid){
  if(!_fbUser || !_fbDb){
    showToast('Şikâyet için giriş yapmalısın.','warn');
    return;
  }
  _sikayetHedef = {tur:tur, hedefId:hedefId, hedefUid:hedefUid, sebep:null};

  var el = document.getElementById('rp-body');
  if(el){
    var turAd = tur === 'post' ? 'gönderiyi' : tur === 'profil' ? 'profili' : 'yorumu';
    el.innerHTML =
      '<div class="pa-bilgi">Bu ' + turAd + ' neden şikâyet ediyorsun? ' +
      'Şikâyetin gizli tutulur, karşı taraf kimliğini görmez.</div>' +
      '<div class="rp-sebepler">' +
      SIKAYET_SEBEPLERI.map(function(s){
        return '<button class="rp-sebep" data-rs="' + s.id + '" ' +
               'onclick="rpSebepSec(\'' + s.id + '\')">' + s.ad + '</button>';
      }).join('') +
      '</div>' +
      '<div class="fg" style="margin-top:14px">' +
        '<label class="fl">Ek açıklama <span style="color:var(--text3)">(isteğe bağlı)</span></label>' +
        '<textarea class="fi" id="rp-aciklama" rows="3" maxlength="300" ' +
          'placeholder="Durumu kısaca anlat..."></textarea>' +
      '</div>';
  }

  var ov = document.getElementById('report-overlay');
  if(ov){ ov.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeReport(){
  var ov = document.getElementById('report-overlay');
  if(ov) ov.classList.remove('active');
  document.body.style.overflow = '';
  _sikayetHedef = null;
}

function rpSebepSec(sebep){
  if(!_sikayetHedef) return;
  _sikayetHedef.sebep = sebep;
  document.querySelectorAll('.rp-sebep').forEach(function(b){
    b.classList.toggle('sec', b.dataset.rs === sebep);
  });
}

function rpGonder(){
  if(!_sikayetHedef) return;
  if(!_sikayetHedef.sebep){
    showToast('Bir sebep seç.','warn');
    return;
  }
  var ac = document.getElementById('rp-aciklama');
  var btn = document.getElementById('rp-gonder-btn');
  if(btn){ btn.disabled = true; btn.textContent = 'Gönderiliyor...'; }

  _fbDb.collection('reports').add({
    tur: _sikayetHedef.tur,
    hedefId: _sikayetHedef.hedefId,
    hedefUid: _sikayetHedef.hedefUid || null,
    sebep: _sikayetHedef.sebep,
    aciklama: ac ? ac.value.trim() : '',
    sikayetEden: _fbUser.uid,
    durum: 'acik',
    tarih: firebase.firestore.FieldValue.serverTimestamp()
  })
    .then(function(){
      if(btn){ btn.disabled = false; btn.textContent = 'Şikâyet Et'; }
      closeReport();
      showToast('✅ Şikâyetin alındı, inceleyeceğiz.');
    })
    .catch(function(e){
      if(btn){ btn.disabled = false; btn.textContent = 'Şikâyet Et'; }
      showToast('❌ Şikâyet gönderilemedi.','error');
    });
}

/* ── Yönetici tarafı: şikâyet listesi ────────────────────── */
function _adminSikayetleriYukle(){
  if(!_fbDb) return;
  _fbDb.collection('reports').where('durum','==','acik').limit(100).get()
    .then(function(snap){
      var liste = [];
      snap.forEach(function(d){ var r = d.data(); r.id = d.id; liste.push(r); });
      liste.sort(function(a,b){
        var ta = a.tarih && a.tarih.seconds ? a.tarih.seconds : 0;
        var tb = b.tarih && b.tarih.seconds ? b.tarih.seconds : 0;
        return tb - ta;
      });
      _adminListe = liste;
      _adminSikayetCiz();
    })
    .catch(function(e){
      var el = document.getElementById('ad-body');
      if(el) el.innerHTML = '<div class="dsc-durum">Şikâyetler okunamadı.<br>' +
        '<span style="font-size:11px">' + (e && e.message || '') + '</span></div>';
    });
}

function _adminSikayetCiz(){
  var el = document.getElementById('ad-body');
  if(!el) return;

  if(!_adminListe.length){
    el.innerHTML = '<div class="dsc-durum">Açık şikâyet yok. 👍</div>';
    return;
  }

  el.innerHTML = _adminListe.map(function(r){
    var sebep = SIKAYET_SEBEPLERI.find(function(s){ return s.id === r.sebep; });
    var tarih = r.tarih && r.tarih.seconds
      ? new Date(r.tarih.seconds*1000).toLocaleDateString('tr-TR') : '';
    var turEtiket = r.tur === 'post' ? '📷 Gönderi'
                  : r.tur === 'profil' ? '👤 Profil' : '💬 Yorum';

    var html = '<div class="ad-kart">';
    html +=   '<div class="ad-kart-ust">';
    html +=     '<span class="ad-rol">' + turEtiket + '</span>';
    html +=     '<span class="ad-tarih">' + tarih + '</span>';
    html +=   '</div>';
    html +=   '<div class="ad-ad">' + (sebep ? sebep.ad : r.sebep) + '</div>';
    if(r.aciklama){
      html += '<div class="ad-aciklama">' + _adKacir(r.aciklama) + '</div>';
    }
    html +=   '<div class="ad-eylemler">';
    if(r.tur === 'post'){
      html +=   '<button class="ad-btn" onclick="adminIcerikGor(\'post\',\'' + r.hedefId + '\')">Gönderiyi Gör</button>';
      html +=   '<button class="ad-btn red" onclick="adminGonderiSil(\'' + r.hedefId + '\',\'' + r.id + '\')">Gönderiyi Sil</button>';
    } else if(r.tur === 'profil'){
      html +=   '<button class="ad-btn" onclick="adminIcerikGor(\'profil\',\'' + r.hedefId + '\')">Profili Gör</button>';
    }
    html +=     '<button class="ad-btn" onclick="adminSikayetKapat(\'' + r.id + '\')">Kapat</button>';
    html +=   '</div>';
    html += '</div>';
    return html;
  }).join('');
}

function adminIcerikGor(tur, id){
  closeAdminPanel();
  if(tur === 'post' && typeof openPost === 'function') openPost(id);
  else if(tur === 'profil' && typeof openUserProfile === 'function') openUserProfile(id);
}

function adminSikayetKapat(raporId){
  _fbDb.collection('reports').doc(raporId)
    .set({durum:'kapatildi', kapatan:_fbUser.uid}, {merge:true})
    .then(function(){ showToast('Şikâyet kapatıldı.'); _adminYukle(); })
    .catch(function(){ showToast('❌ İşlem başarısız.','error'); });
}

/* Yönetici yetkisiyle gönderi silme */
function adminGonderiSil(postId, raporId){
  showConfirm('Gönderiyi Sil',
    'Bu gönderi ve tüm fotoğrafları kalıcı olarak silinecek. ' +
    'Bu işlem geri alınamaz.',
    function(){
      var ref = _fbDb.collection('posts').doc(postId);
      ref.collection('media').get()
        .then(function(snap){
          return Promise.all(snap.docs.map(function(d){ return d.ref.delete(); }));
        })
        .then(function(){ return ref.collection('comments').get(); })
        .then(function(snap){
          return Promise.all(snap.docs.map(function(d){ return d.ref.delete(); }));
        })
        .then(function(){ return ref.delete(); })
        .then(function(){
          if(raporId){
            return _fbDb.collection('reports').doc(raporId)
              .set({durum:'islem_yapildi', kapatan:_fbUser.uid}, {merge:true});
          }
        })
        .then(function(){ showToast('Gönderi silindi.'); _adminYukle(); })
        .catch(function(e){
          showToast('❌ Silinemedi: ' + (e && e.message || ''),'error');
        });
    }, 'Kalıcı Olarak Sil');
}

/* ── İçerik arama — kullanıcı adıyla ─────────────────────── */
function _adminIcerikAra(){
  var el = document.getElementById('ad-body');
  if(!el) return;
  el.innerHTML =
    '<div class="dsc-ara" style="margin:0 0 12px">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
        '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
      '<input id="ad-ara-input" type="text" placeholder="Kullanıcı adı ara..." ' +
        'onkeydown="if(event.key===\'Enter\')adminKullaniciAra()">' +
    '</div>' +
    '<button class="btn btn-p btn-full" onclick="adminKullaniciAra()">Ara</button>' +
    '<div id="ad-ara-sonuc" style="margin-top:14px"></div>';
}

function adminKullaniciAra(){
  var inp = document.getElementById('ad-ara-input');
  var sonuc = document.getElementById('ad-ara-sonuc');
  if(!inp || !sonuc) return;
  var q = inp.value.trim().toLowerCase();
  if(!q) return;

  sonuc.innerHTML = '<div class="dsc-durum">Aranıyor...</div>';
  profilAra(q, 20).then(function(liste){
    if(!liste.length){
      sonuc.innerHTML = '<div class="dsc-durum">Kullanıcı bulunamadı.</div>';
      return;
    }
    sonuc.innerHTML = liste.map(function(p){
      var bas = (p.isim || p.nickname || '?').charAt(0).toUpperCase();
      var av = p.avatar ? '<img src="' + p.avatar + '" alt="">' : '<span>' + bas + '</span>';
      var rozet = (typeof onayRozeti === 'function') ? onayRozeti(p, 13) : '';
      return '<div class="ad-kart" style="padding:12px">' +
               '<div class="dsc-satir" style="padding:0;pointer-events:none">' +
                 '<div class="dsc-av">' + av + '</div>' +
                 '<div class="dsc-bilgi">' +
                   '<div class="dsc-nick">@' + (p.nickname||'') + rozet + '</div>' +
                   '<div class="dsc-isim">' + (p.isim||'') + '</div>' +
                 '</div>' +
               '</div>' +
               '<div class="ad-eylemler" style="margin-top:10px">' +
                 '<button class="ad-btn" onclick="adminProfilAc(\'' + p.uid + '\')">Profili Gör</button>' +
               '</div>' +
             '</div>';
    }).join('');
  });
}
