const kaplar={applications:{},profiles:{}};
const reg={};
['pa-body','pa-ad','pa-aciklama','pa-kabul','pa-gonder-btn'].forEach(id=>
  reg[id]={id,value:'',innerHTML:'',checked:false,textContent:'',style:{},disabled:false,
    classList:{add(){},remove(){},toggle(){}}});
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

function kol(ad){
  const kap=kaplar[ad]=kaplar[ad]||{};
  const api={doc:(id)=>({id,get:()=>Promise.resolve({exists:id in kap,data:()=>kap[id],id}),
    set:(d,o)=>{kap[id]=o&&o.merge?Object.assign({},kap[id],d):d;return Promise.resolve();},
    delete:()=>{delete kap[id];return Promise.resolve();}}),
    _f:[],where(){return api;},limit(){return api;},orderBy(){return api;},
    get(){return Promise.resolve({empty:true,docs:[],size:0,forEach(){}})}};
  return api;
}
global.firebase={firestore:Object.assign(()=>({collection:kol}),
  {FieldValue:{serverTimestamp:()=>({seconds:1})}})};

eval(require('fs').readFileSync(__dirname+'/_combined.tmp.js','utf8'));
_fbDb={collection:kol}; _fbUser={uid:'u1'};
let toastlar=[];
showToast=(m)=>toastlar.push(m); showConfirm=(a,b,cb)=>cb&&cb();
yayinlaProfil=()=>{}; renderProfil=()=>{};

let pass=0,fail=0;
const t=(l,c,d)=>{ if(c){pass++;console.log('  ✅ '+l);} else {fail++;console.log('  ❌ '+l+(d?' → '+d:''));} };

console.log('\n╔══ PROFESYONEL BAŞVURUSU ══╗');

console.log('\n▸ Yapılandırma');
t('2 rol tanımlı', PRO_ROLLER.length===2);
t('Antrenör var', PRO_ROLLER.some(r=>r.id==='antrenor'));
t('Diyetisyen var', PRO_ROLLER.some(r=>r.id==='diyetisyen'));
t('4 durum tanımlı', Object.keys(PRO_DURUMLAR).length===4);

console.log('\n▸ Doğrulama — eksik alanlar');
_basvuru={rol:null,belge:null,ad:'',aciklama:''};
toastlar=[]; paGonder();
t('Rol seçilmeden reddediliyor', toastlar[0]&&toastlar[0].includes('türünü'));

_basvuru.rol='antrenor'; reg['pa-ad'].value=''; toastlar=[]; paGonder();
t('Ad girilmeden reddediliyor', toastlar[0]&&toastlar[0].includes('ad soyad'));

reg['pa-ad'].value='Test Kullanıcı'; toastlar=[]; paGonder();
t('Belge olmadan reddediliyor', toastlar[0]&&toastlar[0].includes('Belge'));

_basvuru.belge={veri:'data:image/jpeg;base64,xxx',bayt:5000};
toastlar=[]; reg['pa-kabul'].checked=false; paGonder();
t('Beyan onaylanmadan reddediliyor', toastlar[0]&&toastlar[0].includes('Beyan'));

console.log('\n▸ Geçerli başvuru');
reg['pa-kabul'].checked=true; toastlar=[];
paGonder();
setTimeout(()=>{
  t('Başvuru kaydedildi', 'u1' in kaplar.applications);
  const b=kaplar.applications['u1'];
  t('Durum beklemede', b.durum==='beklemede', b.durum);
  t('Rol doğru', b.rol==='antrenor');
  t('Belge kaydedildi', !!b.belge);
  const p=JSON.parse(depo['rf_profile']||'{}');
  t('Yerel profil güncellendi', p.onay==='beklemede' && p.rol==='antrenor',
    JSON.stringify(p));

  console.log('\n▸ Onay rozeti');
  t('Onaysızda rozet YOK', onayRozeti({onay:'yok',rol:'antrenor'})==='');
  t('Beklemedeyken rozet YOK', onayRozeti({onay:'beklemede',rol:'antrenor'})==='');
  const r=onayRozeti({onay:'onayli',rol:'antrenor'});
  t('Onaylıda rozet VAR', r.includes('svg'));
  t('Antrenör rozeti düdük', r.includes('circle'));
  const r2=onayRozeti({onay:'onayli',rol:'diyetisyen'});
  t('Diyetisyen rozeti farklı', r2!==r && r2.includes('svg'));
  t('Rol yoksa rozet yok', onayRozeti({onay:'onayli',rol:'uye'})==='');
  const e=onayEtiketi({onay:'onayli',rol:'antrenor'});
  t('Etiket metni var', e.includes('Onaylı Antrenör'));

  console.log('\n▸ 17. rozet');
  const defs=_getBadgeDefs();
  t('17 rozet tanımlı', defs.length===17, defs.length);
  t('Onaylı Koç rozeti var', defs.some(b=>b.id==='verified_coach'));

  console.log('\n▸ Başvuruyu geri çekme');
  paBasvuruIptal();
  setTimeout(()=>{
    t('Başvuru silindi', !('u1' in kaplar.applications));
    const p2=JSON.parse(depo['rf_profile']||'{}');
    t('Profil sıfırlandı', p2.onay==='yok' && p2.rol==='uye');

    console.log('\n'+'─'.repeat(48));
    console.log(`📊 BAŞVURU: ${pass}/${pass+fail} geçti`);
    if(fail===0) console.log('🎉 Başvuru sistemi çalışıyor!'); else process.exitCode=1;
  },20);
},20);
