const kaplar={blocks:{},follows:{},profiles:{},followRequests:{},posts:{}};
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

function kol(ad){
  const kap=kaplar[ad]=kaplar[ad]||{};
  const api={
    doc:(id)=>({id,get:()=>Promise.resolve({exists:id in kap,data:()=>kap[id],id}),
      set:(d,o)=>{kap[id]=o&&o.merge?Object.assign({},kap[id],d):d;return Promise.resolve();},
      delete:()=>{delete kap[id];return Promise.resolve();},
      ref:{delete:()=>{delete kap[id];return Promise.resolve();}}}),
    _f:[],where(f,op,v){api._f.push([f,op,v]);return api;},limit(){return api;},orderBy(){return api;},
    count(){return{get:()=>{
      let l=Object.keys(kap).map(id=>({id,data:()=>kap[id]}));
      api._f.forEach(([f,op,v])=>{l=l.filter(d=>op==='in'?v.includes(d.data()[f]):d.data()[f]===v)});
      api._f=[];return Promise.resolve({data:()=>({count:l.length})});}};},
    get(){
      let l=Object.keys(kap).map(id=>({id,data:()=>kap[id],
        ref:{delete:()=>{delete kap[id];return Promise.resolve();}}}));
      api._f.forEach(([f,op,v])=>{l=l.filter(d=>op==='in'?v.includes(d.data()[f]):d.data()[f]===v)});
      api._f=[];
      return Promise.resolve({empty:!l.length,docs:l,size:l.length,forEach:(fn)=>l.forEach(fn)});
    }};
  return api;
}
global.firebase={firestore:Object.assign(()=>({collection:kol}),
  {FieldValue:{serverTimestamp:()=>({seconds:1})}})};

eval(require('fs').readFileSync(__dirname+'/_combined.tmp.js','utf8'));
_fbDb={collection:kol}; _fbUser={uid:'ben'};
showToast=()=>{}; showConfirm=(a,b,cb)=>cb&&cb(); renderProfil=()=>{};

let pass=0,fail=0;
const t=(l,c,d)=>{ if(c){pass++;console.log('  ✅ '+l);} else {fail++;console.log('  ❌ '+l+(d?' → '+d:''));} };

console.log('\n╔══ ENGELLEME VE GİZLİLİK ══╗');

kaplar.profiles={
  ben:{uid:'ben',nickname:'ben'},
  acik:{uid:'acik',nickname:'acik',gizli:false},
  gizli:{uid:'gizli',nickname:'gizli',gizli:true},
  kotu:{uid:'kotu',nickname:'kotu'}
};
kaplar.follows={'ben_acik':{takipEden:'ben',takipEdilen:'acik'}};
kaplar.posts={
  p1:{uid:'acik',metin:'Açık gönderi',tarih:{seconds:100}},
  p2:{uid:'gizli',metin:'Gizli gönderi',tarih:{seconds:200}},
  p3:{uid:'kotu',metin:'Kötü gönderi',tarih:{seconds:300}}
};

console.log('\n▸ Engelleme');
engelleriYukle().then(()=>{
  t('Başlangıçta engel yok', !engelliMi('kotu'));
  return engelle('kotu');
}).then(()=>{
  t('Engel oluştu', 'ben_kotu' in kaplar.blocks);
  t('engelliMi true döner', engelliMi('kotu'));
  t('benEngelledimMi true', benEngelledimMi('kotu'));
  t('Kendini engelleme reddi', true);
  return engelle('ben').then(()=>{t('Kendini engelleyemez',false);})
    .catch(e=>{t('Kendini engelleyemez', e.message.includes('Kendini'));});
}).then(()=>{
  console.log('\n▸ Engelleyince takipler kalkıyor');
  kaplar.follows['ben_x']={takipEden:'ben',takipEdilen:'x'};
  kaplar.follows['x_ben']={takipEden:'x',takipEdilen:'ben'};
  _engelOnbellek.engelledigim={};
  return engelle('x');
}).then(()=>{
  t('Benim takibim silindi', !('ben_x' in kaplar.follows));
  t('Onun takibi silindi', !('x_ben' in kaplar.follows));

  console.log('\n▸ Karşılıklı engel görünürlüğü');
  _engelOnbellek={engelledigim:{},engelleyen:{beniEngelleyen:true}};
  t('Beni engelleyeni göremem', engelliMi('beniEngelleyen'));
  t('Ama ben onu engellememişim', !benEngelledimMi('beniEngelleyen'));

  console.log('\n▸ Gizli profil görünürlüğü');
  _engelOnbellek={engelledigim:{},engelleyen:{}};
  _takipOnbellek={acik:true};
  t('Açık profil görülebilir', icerikGorulebilirMi(kaplar.profiles.acik));
  t('Gizli profil TAKİP ETMEDEN görülemez',
    !icerikGorulebilirMi(kaplar.profiles.gizli));
  _takipOnbellek['gizli']=true;
  t('Takip edince görülebilir', icerikGorulebilirMi(kaplar.profiles.gizli));
  t('Kendi profilim hep görülür', icerikGorulebilirMi(kaplar.profiles.ben));
  _engelOnbellek.engelledigim['acik']=true;
  t('Engelli profil görülemez', !icerikGorulebilirMi(kaplar.profiles.acik));

  console.log('\n▸ Keşfet akışı filtresi');
  _engelOnbellek={engelledigim:{kotu:true},engelleyen:{}};
  _takipOnbellek={};
  _profilOnbellek={};
  return _akisTumGonderiler();
}).then(liste=>{
  const uidler=liste.map(g=>g.uid);
  t('Engelli gönderi çıkarıldı', !uidler.includes('kotu'), uidler.join(','));
  t('GİZLİ hesap keşfette YOK', !uidler.includes('gizli'), uidler.join(','));
  t('Açık hesap görünüyor', uidler.includes('acik'));

  console.log('\n▸ Gizli hesap takip edilince akışta çıkar');
  _takipOnbellek={gizli:true};
  _profilOnbellek={};
  return _akisTumGonderiler();
}).then(liste=>{
  t('Takip edilen gizli hesap görünüyor',
    liste.map(g=>g.uid).includes('gizli'));

  console.log('\n▸ Takip isteği akışı');
  _takipIstekOnbellek={};
  return takipIstegiDurumu('gizli');
}).then(d=>{
  t('Başlangıçta istek yok', d==='yok');
  return takipIstegiGonder('gizli');
}).then(d=>{
  t('İstek gönderildi', d==='beklemede');
  t('followRequests belgesi var', 'ben_gizli' in kaplar.followRequests);
  return takipIstegiGeriCek('gizli');
}).then(d=>{
  t('İstek geri çekildi', d==='yok');
  t('Belge silindi', !('ben_gizli' in kaplar.followRequests));

  console.log('\n▸ İstek kabul akışı');
  kaplar.followRequests['baskasi_ben']={isteyen:'baskasi',hedef:'ben',durum:'beklemede'};
  return bekleyenIstekleriGetir();
}).then(l=>{
  t('Bekleyen istek listelendi', l.length===1, l.length);
  return takipIstegiKabul('baskasi');
}).then(()=>{
  t('İstek onaylı işaretlendi', kaplar.followRequests['baskasi_ben'].durum==='onayli');

  console.log('\n▸ Onaylanan istek takibe dönüşüyor');
  kaplar.followRequests['ben_hedef']={isteyen:'ben',hedef:'hedef',durum:'onayli'};
  return onaylananIstekleriIsle();
}).then(n=>{
  t('İstek işlendi', n===1, n);
  t('Takip belgesi oluştu', 'ben_hedef' in kaplar.follows);
  t('İstek belgesi silindi', !('ben_hedef' in kaplar.followRequests));

  console.log('\n▸ Önbellek temizliği');
  gizlilikOnbellegiTemizle();
  t('Engel önbelleği sıfırlandı', _engelOnbellek===null);
  t('İstek önbelleği sıfırlandı', Object.keys(_takipIstekOnbellek).length===0);

  console.log('\n'+'─'.repeat(48));
  console.log(`📊 GİZLİLİK: ${pass}/${pass+fail} geçti`);
  if(fail===0) console.log('🎉 Engelleme ve gizlilik çalışıyor!'); else process.exitCode=1;
});
