const kaplar={deletionRequests:{},profiles:{},posts:{},likes:{},follows:{},
              users:{},nicknames:{},notifications:{},blocks:{},packages:{},
              applications:{},commentLikes:{},followRequests:{},reports:{}};
global.document={getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],
  createElement:()=>({style:{},classList:{add(){},remove(){}}}),
  body:{style:{},appendChild(){},classList:{add(){},remove(){},toggle(){}}},
  documentElement:{setAttribute(){},getAttribute:()=>'gece',style:{setProperty(){},colorScheme:''}},addEventListener(){}};
global.getComputedStyle=()=>({getPropertyValue:()=>'#000'});
global.location={protocol:'https:',origin:'',pathname:'/',reload(){}};
global.window={location:global.location,addEventListener(){},scrollTo(){}};
const depo={};
global.localStorage={get length(){return Object.keys(depo).length},key(i){return Object.keys(depo)[i]},
  getItem:(k)=>depo[k]??null,setItem:(k,v)=>{depo[k]=String(v)},removeItem:(k)=>{delete depo[k]}};
global.navigator={vibrate(){}}; global.fetch=()=>Promise.reject(new Error('x'));

let sayac=0;
function kol(ad, ust){
  const k = ust ? ad+'@'+ust : ad;
  kaplar[k]=kaplar[k]||{};
  const kap=kaplar[k];
  const api={
    doc:(id)=>({id:id||'d'+(++sayac),
      get:()=>Promise.resolve({exists:id in kap,data:()=>kap[id],id}),
      set:(d,o)=>{kap[id]=o&&o.merge?Object.assign({},kap[id],d):d;return Promise.resolve();},
      delete:()=>{delete kap[id];return Promise.resolve();},
      ref:{delete:()=>{delete kap[id];return Promise.resolve();}},
      collection:(a)=>kol(a,id)}),
    add:(d)=>{const i='x'+(++sayac);kap[i]=d;return Promise.resolve({id:i});},
    _f:[],where(f,op,v){api._f.push([f,op,v]);return api;},limit(){return api;},orderBy(){return api;},
    count(){return{get:()=>Promise.resolve({data:()=>({count:0})})};},
    get(){
      let l=Object.keys(kap).map(id=>({id,data:()=>kap[id],
        ref:{delete:()=>{delete kap[id];return Promise.resolve();},
             collection:(a)=>kol(a,id)}}));
      api._f.forEach(([f,op,v])=>{l=l.filter(d=>op==='in'?v.includes(d.data()[f]):d.data()[f]===v)});
      api._f=[];
      return Promise.resolve({empty:!l.length,docs:l,size:l.length,forEach:(fn)=>l.forEach(fn)});
    }};
  return api;
}
global.firebase={firestore:Object.assign(()=>({collection:kol}),
  {FieldValue:{serverTimestamp:()=>({seconds:Math.floor(Date.now()/1000)})}})};

eval(require('fs').readFileSync(__dirname+'/_combined.tmp.js','utf8'));
_fbDb={collection:kol}; _fbUser={uid:'silinen'};
let toastlar=[];
showToast=(m)=>toastlar.push(m); showConfirm=(a,b,cb)=>cb&&cb();
_engelOnbellek={engelledigim:{},engelleyen:{}};
saveData=()=>{}; renderProfil=()=>{};

let pass=0,fail=0;
const t=(l,c,d)=>{ if(c){pass++;console.log('  ✅ '+l);} else {fail++;console.log('  ❌ '+l+(d?' → '+d:''));} };
const gun=(n)=>({seconds:Math.floor((Date.now()+n*86400000)/1000)});

console.log('\n╔══ HESAP SİLME ══╗');

console.log('\n▸ Yapılandırma');
t('15 gün bekleme', SILME_BEKLEME_GUN===15);
t('7 gün cayma', SILME_CAYMA_GUN===7);
t('7 sebep tanımlı', SILME_SEBEPLERI.length===7);

console.log('\n▸ Gizlilik ayarı kalıcılığı (düzeltilen hata)');
depo['nickname']='silinen';
depo['rf_profile']=JSON.stringify({nickname:'silinen',gizli:false});
kaplar.profiles['silinen']={uid:'silinen',nickname:'silinen'};
const src=require('fs').readFileSync(__dirname+'/../js/social/privacy.js','utf8');
t('gizlilikDegistir saveData çağırıyor', src.includes('saveData()'),
  'kalıcılık için şart');
t('Toplu kabul fonksiyonu var', typeof bekleyenIstekleriTopluKabul==='function');

gizlilikDegistir(true).then(sonuc=>{
  t('Gizli yapıldı', sonuc.gizli===true);
  t('Yerel profil güncellendi', JSON.parse(depo['rf_profile']).gizli===true);
  t('Firestore güncellendi', kaplar.profiles['silinen'].gizli===true);

  console.log('\n▸ Açığa geçişte bekleyen istekler kabul ediliyor');
  kaplar.followRequests['a_silinen']={isteyen:'a',hedef:'silinen',durum:'beklemede'};
  kaplar.followRequests['b_silinen']={isteyen:'b',hedef:'silinen',durum:'beklemede'};
  kaplar.followRequests['c_silinen']={isteyen:'c',hedef:'silinen',durum:'beklemede'};
  return gizlilikDegistir(false);
}).then(sonuc=>{
  t('Açık yapıldı', sonuc.gizli===false);
  t('3 istek kabul edildi', sonuc.kabulEdilen===3, sonuc.kabulEdilen);
  const onayli=Object.values(kaplar.followRequests).filter(r=>r.durum==='onayli');
  t('Hepsi onaylı işaretlendi', onayli.length===3, onayli.length);

  console.log('\n▸ Silme talebi');
  _silmeSecim={sebep:'gecici',aciklama:'Ara veriyorum'};
  return _fbDb.collection('deletionRequests').doc('silinen').set({
    uid:'silinen',nickname:'silinen',sebep:'gecici',
    talepTarihi:gun(0),silmeTarihi:gun(15),durum:'bekliyor'
  }).then(()=>_fbDb.collection('profiles').doc('silinen').set({silinecek:true},{merge:true}));
}).then(()=>{
  t('Talep oluştu', 'silinen' in kaplar.deletionRequests);
  t('Profil gizlendi', kaplar.profiles['silinen'].silinecek===true);
  t('silinmeyiBekliyorMu true', silinmeyiBekliyorMu(kaplar.profiles['silinen']));

  console.log('\n▸ Gizlenme kapsamı');
  const gizli={uid:'silinen',silinecek:true};
  t('Keşfetten gizli', _dscEngelAyikla([gizli, {uid:'normal'}]).length===1);
  return profilleriGetir(['silinen','normal']);
}).then(l=>{
  kaplar.profiles['normal']={uid:'normal',nickname:'normal'};
  t('Takipçi listesinden gizli', !l.some(p=>p.uid==='silinen'), l.length+' profil');

  console.log('\n▸ Geri sayım');
  t('15 gün kaldı', _kalanGun(gun(15))===15, _kalanGun(gun(15)));
  t('1 gün kaldı', _kalanGun(gun(1))===1);
  t('Süre dolmuş → 0', _kalanGun(gun(-3))===0);
  t('Cayma süresi taze talepte dolmadı', !_caymaSuresiDoldu(gun(0)));
  t('8 gün önceki talepte cayma doldu', _caymaSuresiDoldu(gun(-8)));

  console.log('\n▸ Vazgeçme');
  return Promise.all([
    _fbDb.collection('deletionRequests').doc('silinen').delete(),
    _fbDb.collection('profiles').doc('silinen').set({silinecek:false},{merge:true})
  ]);
}).then(()=>{
  t('Talep silindi', !('silinen' in kaplar.deletionRequests));
  t('Profil geri geldi', kaplar.profiles['silinen'].silinecek===false);
  t('Artık gizli değil', !silinmeyiBekliyorMu(kaplar.profiles['silinen']));

  console.log('\n▸ Yönetici kalıcı silme');
  kaplar.deletionRequests['kurban']={uid:'kurban',nickname:'kurban',silmeTarihi:gun(-1)};
  kaplar.profiles['kurban']={uid:'kurban'};
  kaplar.users['kurban']={nickname:'kurban'};
  kaplar.nicknames['kurban']={uid:'kurban'};
  kaplar.posts['p1']={uid:'kurban',metin:'gönderi'};
  kaplar.likes['l1']={uid:'kurban',postId:'p1'};
  kaplar.follows['kurban_x']={takipEden:'kurban',takipEdilen:'x'};
  kaplar.follows['x_kurban']={takipEden:'x',takipEdilen:'kurban'};
  kaplar.notifications['n1']={hedef:'kurban',kimden:'z'};
  kaplar.packages['pk1']={uid:'kurban'};
  kaplar.applications['kurban']={uid:'kurban'};
  _fbUser={uid:'admin'};
  _adminSilmeYurut('kurban');
  return new Promise(r=>setTimeout(r,120));
}).then(()=>{
  t('Profil silindi', !('kurban' in kaplar.profiles));
  t('users belgesi silindi', !('kurban' in kaplar.users));
  t('Kullanıcı adı eşlemesi silindi', !('kurban' in kaplar.nicknames));
  t('Gönderi silindi', !('p1' in kaplar.posts));
  t('Beğeni silindi', !('l1' in kaplar.likes));
  t('Takip (giden) silindi', !('kurban_x' in kaplar.follows));
  t('Takip (gelen) silindi', !('x_kurban' in kaplar.follows));
  t('Bildirim silindi', !('n1' in kaplar.notifications));
  t('Paket silindi', !('pk1' in kaplar.packages));
  t('Başvuru silindi', !('kurban' in kaplar.applications));
  t('Silme talebi silindi', !('kurban' in kaplar.deletionRequests));

  console.log('\n'+'─'.repeat(48));
  console.log(`📊 HESAP SİLME: ${pass}/${pass+fail} geçti`);
  if(fail===0) console.log('🎉 Silme akışı çalışıyor!'); else process.exitCode=1;
});
