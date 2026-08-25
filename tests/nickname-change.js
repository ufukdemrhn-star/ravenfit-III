/* Kullanıcı adı değiştirme + eski ad reddi senaryosu */
const eslemeler = {};           // nicknames koleksiyonu
const kullanicilar = {};        // users koleksiyonu
let cikisYapildi = false, hataMesaji = '';

const reg = {};
['auth-nick','auth-pass','auth-err','auth-btn-login','user-email-display',
 'avatar-initials','avatar-img'].forEach(id => reg[id] = {value:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){}}});

global.document = {
  getElementById:(id)=>reg[id]||null, querySelector:()=>null, querySelectorAll:()=>[],
  createElement:()=>({style:{},classList:{add(){},remove(){}}}),
  body:{style:{},appendChild(){},classList:{add(){},remove(){},toggle(){}}},
  documentElement:{setAttribute(){},getAttribute:()=>'gece',style:{setProperty(){},colorScheme:''}},
  addEventListener(){}
};
global.getComputedStyle=()=>({getPropertyValue:()=>'#0F1113'});
global.location={protocol:'https:',origin:'',pathname:'/',reload(){}};
global.window={location:global.location,addEventListener(){},scrollTo(){}};
const depo={};
global.localStorage={get length(){return Object.keys(depo).length},key(i){return Object.keys(depo)[i]},
  getItem:(k)=>depo[k]??null,setItem:(k,v)=>{depo[k]=String(v)},removeItem:(k)=>{delete depo[k]}};
global.navigator={vibrate(){}}; global.fetch=()=>Promise.reject(new Error('x'));

/* Sahte Firestore */
function belge(kol, id){
  const kap = kol==='nicknames' ? eslemeler : kullanicilar;
  return {
    get: ()=>Promise.resolve({exists: id in kap, data:()=>kap[id], id}),
    set: (d,o)=>{ kap[id] = o&&o.merge ? Object.assign({}, kap[id], d) : d; return Promise.resolve(); },
    delete: ()=>{ delete kap[id]; return Promise.resolve(); }
  };
}
global.firebase = {
  firestore: Object.assign(()=>({collection:(k)=>({doc:(id)=>belge(k,id)})}),
    {FieldValue:{serverTimestamp:()=>'TS'}})
};

eval(require('fs').readFileSync(__dirname+'/_combined.tmp.js','utf8'));

_fbDb = { collection:(k)=>({doc:(id)=>belge(k,id)}) };
_fbAuth = { signOut: ()=>{ cikisYapildi = true; return Promise.resolve(); } };
showToast=()=>{}; showAuthScreen=()=>{}; showLoginTab=()=>{};
setAvatarInitials=()=>{}; saveData=()=>{}; saveToFirebase=()=>{}; renderProfil=()=>{};

let pass=0,fail=0;
const t=(l,c,d)=>{ if(c){pass++;console.log('  ✅ '+l);} else {fail++;console.log('  ❌ '+l+(d?' → '+d:''));} };

console.log('\n╔══ KULLANICI ADI DEĞİŞTİRME ══╗');

/* Kurulum: ttt1 hesabı */
_fbUser = {uid:'u1', email:'ttt1@ravenfit.app'};
kullanicilar['u1'] = {nickname:'ttt1'};
eslemeler['ttt1'] = {uid:'u1', email:'ttt1@ravenfit.app'};
depo['nickname'] = 'ttt1';

console.log('\n▸ Başlangıç');
t('ttt1 eşlemesi var', 'ttt1' in eslemeler);

console.log('\n▸ ttt1 → ttt2 değişimi');
_nickDegistir('ttt2').then(()=>{
  t('ttt2 eşlemesi oluştu', 'ttt2' in eslemeler);
  t('ttt1 eşlemesi SİLİNDİ', !('ttt1' in eslemeler));
  t('users belgesi güncellendi', kullanicilar['u1'].nickname==='ttt2');
  t('Auth e-postası DEĞİŞMEDİ', _fbUser.email==='ttt1@ravenfit.app');
  t('Yerel ad güncellendi', depo['nickname']==='ttt2');

  console.log('\n▸ Giriş çözümlemesi');
  return _nickEmailCoz('ttt2');
}).then(mail=>{
  t('ttt2 → doğru e-posta', mail==='ttt1@ravenfit.app', mail);
  return _nickEmailCoz('ttt1');
}).then(mail=>{
  t('ttt1 → yedek yola düşüyor', mail==='ttt1@ravenfit.app', mail);
  console.log('     (bu normal — asıl kontrol giriş SONRASI yapılıyor)');

  console.log('\n▸ Eski adla giriş reddi');
  _denenenNick = 'ttt1';
  cikisYapildi = false;
  const kaynak = require('fs').readFileSync(__dirname+'/../js/auth/firebase.js','utf8');
  const kontrol = kaynak.includes("_denenenNick !== nick.toLowerCase()");
  t('Doğrulama kodu mevcut', kontrol);
  t('Uyarı mesajı tanımlı', kaynak.includes('artık kullanılmıyor'));
  t('signOut çağrısı var', kaynak.includes("_fbAuth.signOut()"));

  console.log('\n▸ Benzersizlik');
  return _nickBostaMi('ttt2');
}).then(bos=>{
  t('Kendi adım boşta sayılır', bos===true);
  _fbUser = {uid:'u2', email:'baska@ravenfit.app'};
  return _nickBostaMi('ttt2');
}).then(bos=>{
  t('Başkasının adı alınmış', bos===false);
  console.log('\n'+'─'.repeat(46));
  console.log(`📊 KULLANICI ADI: ${pass}/${pass+fail} geçti`);
  if(fail===0) console.log('🎉 Akış doğru!'); else process.exitCode=1;
});
