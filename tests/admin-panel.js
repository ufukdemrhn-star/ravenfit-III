const kaplar={admins:{},applications:{},profiles:{},reports:{},posts:{}};
const acik={};
const reg={};
['ad-body','ad-belge-img','ad-belge-bilgi','admin-giris','rp-body','rp-aciklama'].forEach(id=>
  reg[id]={id,value:'',innerHTML:'',textContent:'',src:'',style:{display:''},
    classList:{add(){},remove(){},toggle(){},contains:()=>false}});
['admin-screen','admin-doc-overlay','report-overlay','discover-overlay','feed-screen',
 'user-profile-screen','post-detail-overlay'].forEach(id=>
  reg[id]={id,style:{},classList:{
    add:(c)=>{acik[id]=true}, remove:(c)=>{acik[id]=false},
    contains:(c)=>!!acik[id], toggle(){}}});

global.document={getElementById:(id)=>reg[id]||null,querySelector:()=>null,querySelectorAll:()=>[],
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
global.prompt=()=>'Belge okunaklı değil';

let izinliOku = true;
function kol(ad){
  const kap=kaplar[ad]=kaplar[ad]||{};
  const api={
    doc:(id)=>({id:id||'r'+Date.now(),
      get:()=>{
        if(ad==='admins' && !izinliOku) return Promise.reject(new Error('permission-denied'));
        return Promise.resolve({exists:id in kap,data:()=>kap[id],id});
      },
      set:(d,o)=>{kap[id]=o&&o.merge?Object.assign({},kap[id],d):d;return Promise.resolve();},
      delete:()=>{delete kap[id];return Promise.resolve();},
      collection:(a)=>kol(a+'@'+id)}),
    add:(d)=>{const i='r'+Object.keys(kap).length;kap[i]=d;return Promise.resolve({id:i});},
    _f:[],where(f,op,v){api._f.push([f,op,v]);return api;},limit(){return api;},orderBy(){return api;},
    get(){
      let l=Object.keys(kap).map(id=>({id,data:()=>kap[id],ref:{delete:()=>{delete kap[id];return Promise.resolve();}}}));
      api._f.forEach(([f,op,v])=>{l=l.filter(d=>d.data()[f]===v)});
      api._f=[];
      return Promise.resolve({empty:!l.length,docs:l,size:l.length,forEach:(fn)=>l.forEach(fn)});
    }};
  return api;
}
global.firebase={firestore:Object.assign(()=>({collection:kol}),
  {FieldValue:{serverTimestamp:()=>({seconds:1})}})};

eval(require('fs').readFileSync(__dirname+'/_combined.tmp.js','utf8'));
_fbDb={collection:kol};
let toastlar=[];
showToast=(m)=>toastlar.push(m); showConfirm=(a,b,cb)=>cb&&cb();
openUserProfile=()=>{}; openPost=()=>{}; profilAra=()=>Promise.resolve([]);

let pass=0,fail=0;
const t=(l,c,d)=>{ if(c){pass++;console.log('  ✅ '+l);} else {fail++;console.log('  ❌ '+l+(d?' → '+d:''));} };

console.log('\n╔══ YÖNETİCİ PANELİ ══╗');

console.log('\n▸ Yetki kontrolü');
_fbUser={uid:'normal'};
yoneticiKontrolEt().then(y=>{
  t('Normal kullanıcı yönetici DEĞİL', y===false);
  t('Panel girişi gizli', reg['admin-giris'].style.display==='none');

  toastlar=[]; openAdminPanel();
  t('Yetkisiz açış engellendi', !acik['admin-screen']);
  t('Uyarı verildi', toastlar[0]&&toastlar[0].includes('yetkin yok'));

  console.log('\n▸ Yönetici girişi');
  kaplar.admins['patron']={rol:'admin'};
  _fbUser={uid:'patron'};
  return yoneticiKontrolEt();
}).then(y=>{
  t('Yönetici tanındı', y===true);
  t('Panel girişi görünür', reg['admin-giris'].style.display==='flex');

  console.log('\n▸ Okuma reddedilirse');
  izinliOku=false; _fbUser={uid:'saldirgan'};
  return yoneticiKontrolEt();
}).then(y=>{
  t('İzin reddinde yönetici DEĞİL', y===false);
  izinliOku=true; _fbUser={uid:'patron'};

  console.log('\n▸ Başvuru onaylama');
  kaplar.applications['aday']={uid:'aday',rol:'antrenor',ad:'Test Antrenör',
    belge:'data:image/jpeg;base64,xxx',durum:'beklemede',tarih:{seconds:100}};
  kaplar.profiles['aday']={nickname:'aday',onay:'beklemede',rol:'antrenor'};
  _adminSekme='basvurular';
  return new Promise(r=>{_adminBasvurulariYukle('beklemede');setTimeout(r,20);});
}).then(()=>{
  t('Bekleyen başvuru listelendi', _adminListe.length===1, _adminListe.length);
  t('Belge verisi var', !!_adminListe[0].belge);

  adminBelgeAc('aday');
  t('Belge görüntüleyici açıldı', acik['admin-doc-overlay']);
  t('Belge görsele yüklendi', reg['ad-belge-img'].src.includes('base64'));
  adminBelgeKapat();
  t('Görüntüleyici kapandı', !acik['admin-doc-overlay']);

  adminOnayla('aday');
  return new Promise(r=>setTimeout(r,20));
}).then(()=>{
  t('applications güncellendi', kaplar.applications['aday'].durum==='onayli');
  t('profiles güncellendi', kaplar.profiles['aday'].onay==='onayli');
  t('Rol yazıldı', kaplar.profiles['aday'].rol==='antrenor');
  t('Onaylayan kaydedildi', kaplar.applications['aday'].onaylayan==='patron');

  console.log('\n▸ Onay kaldırma');
  _adminListe=[kaplar.applications['aday']];
  _adminListe[0].uid='aday';
  adminOnayKaldir('aday');
  return new Promise(r=>setTimeout(r,20));
}).then(()=>{
  t('Onay kaldırıldı', kaplar.profiles['aday'].onay==='red');
  t('Rol üyeye döndü', kaplar.profiles['aday'].rol==='uye');

  console.log('\n▸ Şikâyet');
  _fbUser={uid:'sikayetci'};
  openReport('post','post1','sahibi');
  t('Şikâyet ekranı açıldı', acik['report-overlay']);
  toastlar=[]; rpGonder();
  t('Sebepsiz gönderilemiyor', toastlar[0]&&toastlar[0].includes('sebep'));
  rpSebepSec('spam'); rpGonder();
  return new Promise(r=>setTimeout(r,20));
}).then(()=>{
  const r=Object.values(kaplar.reports)[0];
  t('Şikâyet kaydedildi', !!r);
  t('Sebep doğru', r&&r.sebep==='spam');
  t('Şikâyet eden kaydedildi', r&&r.sikayetEden==='sikayetci');
  t('Durum açık', r&&r.durum==='acik');
  t('6 sebep tanımlı', SIKAYET_SEBEPLERI.length===6);

  console.log('\n▸ Dönüş yığını');
  navSifirla();
  acik['discover-overlay']=true;
  navGizle('discover', ()=>{acik['discover-overlay']=false;}, ()=>{acik['discover-overlay']=true;});
  t('Keşfet kapandı', !acik['discover-overlay']);
  t('Yığında 1 öge', _navYigin.length===1);
  navGeri();
  return new Promise(r=>setTimeout(r,60));
}).then(()=>{
  t('Keşfet geri açıldı', acik['discover-overlay']===true);
  t('Yığın boşaldı', _navYigin.length===0);
  t('Boş yığında navGeri false', navGeri()===false);

  console.log('\n'+'─'.repeat(48));
  console.log(`📊 YÖNETİCİ: ${pass}/${pass+fail} geçti`);
  if(fail===0) console.log('🎉 Panel çalışıyor!'); else process.exitCode=1;
});
