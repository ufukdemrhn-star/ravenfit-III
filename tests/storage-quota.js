let toastlar=[];
global.document={getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,
  createElement:()=>({style:{},classList:{add(){},remove(){}},appendChild(){}}),
  body:{appendChild(){},style:{}},documentElement:{setAttribute(){},style:{setProperty(){}}},addEventListener(){}};
global.window={location:{protocol:'https:',origin:'',pathname:'/'},addEventListener(){},scrollTo(){}};
global.navigator={vibrate(){}};global.fetch=()=>Promise.reject(new Error('x'));global.firebase=undefined;

// Kota dolu localStorage simülasyonu
let doluMu=false;
const depo={};
global.localStorage={
  _d:depo,
  get length(){return Object.keys(depo).length},
  key(i){return Object.keys(depo)[i]},
  getItem(k){return depo[k]??null},
  setItem(k,v){
    if(doluMu){ const e=new Error('quota'); e.name='QuotaExceededError'; e.code=22; throw e; }
    depo[k]=String(v);
  },
  removeItem(k){delete depo[k]}
};

eval(require('fs').readFileSync(__dirname+'/_combined.tmp.js','utf8'));
showToast=(m,t)=>{toastlar.push(m)};

let pass=0,fail=0;
const t=(l,c,d)=>{ if(c){pass++;console.log('  ✅ '+l);} else {fail++;console.log('  ❌ '+l+(d?' → '+d:''));} };

console.log('\n╔══ DEPOLAMA KOTA TESTİ ══╗');

console.log('\n▸ Normal durumda');
t('_lsSet başarılı', _lsSet('test','abc')===true);
t('Veri yazıldı', localStorage.getItem('test')==='abc');
t('_lsGet okuyor', _lsGet('test')==='abc');
t('_lsGet varsayılan döner', _lsGet('yok','vars')==='vars');

console.log('\n▸ Kota dolduğunda');
doluMu=true; toastlar=[];
let hata=null;
try{ var r=_lsSet('test2','xyz'); }catch(e){ hata=e.message; }
t('_lsSet istisna FIRLATMIYOR', hata===null, hata);
t('false döndürüyor', r===false);
t('Kullanıcı uyarıldı', toastlar.length===1, toastlar.length+' toast');
t('Uyarı metni anlamlı', (toastlar[0]||'').indexOf('depolama')>-1||(toastlar[0]||'').indexOf('Depolama')>-1);

toastlar=[]; _lsSet('test3','a');
t('Tekrar tekrar uyarmıyor', toastlar.length===0);

console.log('\n▸ KRİTİK: saveData kota dolunca ne yapıyor?');
U={gender:'male',height:175,weight:80,neck:38,waist:85,age:30};
R={};A={};BT={};selST='bb';selGL='cut';_isGuest=false;
let fbCagrildi=false;
saveToFirebase=()=>{fbCagrildi=true;};
hata=null;
try{ saveData(); }catch(e){ hata=e.message; }
t('saveData çökmüyor', hata===null, hata);
t('Firebase senkronu YİNE DE çalışıyor', fbCagrildi===true,
  'kota hatası bulut yedeğini engellememeli');

console.log('\n▸ Depolama kullanım raporu');
doluMu=false;
localStorage.setItem('rf_workout_logs','x'.repeat(5000));
localStorage.setItem('rf_data','y'.repeat(1000));
const k=_lsKullanim();
t('Toplam boyut hesaplanıyor', k.toplamKB>0, k.toplamKB+' KB');
t('Kalemler sıralı', k.kalemler.length>0 && k.kalemler[0].anahtar==='rf_workout_logs',
  k.kalemler[0]?k.kalemler[0].anahtar:'yok');
t('Doluluk yüzdesi 0-100', k.doluluk>=0 && k.doluluk<=100, k.doluluk+'%');

console.log('\n'+'─'.repeat(50));
console.log(`📊 KOTA TESTİ: ${pass}/${pass+fail} geçti`);
if(fail===0) console.log('🎉 Depolama katmanı güvenli!'); else process.exitCode=1;
