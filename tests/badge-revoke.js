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
global.firebase=undefined;
eval(require('fs').readFileSync(__dirname+'/_combined.tmp.js','utf8'));
showToast=()=>{}; saveToFirebase=()=>{}; _fbUser=null; _fbDb=null;

let pass=0,fail=0;
const t=(l,c,d)=>{ if(c){pass++;console.log('  ✅ '+l);} else {fail++;console.log('  ❌ '+l+(d?' → '+d:''));} };
const rozetVar=(id)=>getEarnedBadges().some(e=>e.id===id);

console.log('\n╔══ ROZET GERİ ALMA ══╗');

console.log('\n▸ Simge çakışması');
const defs=_getBadgeDefs();
const say={};
defs.forEach(b=>{say[b.icon]=(say[b.icon]||0)+1});
const cakisan=Object.entries(say).filter(([i,n])=>n>1);
t('Hiçbir simge tekrarlanmıyor', cakisan.length===0,
  cakisan.map(([i,n])=>i+'×'+n).join(','));
t('Onaylı Koç simgesi 🥇', defs.find(b=>b.id==='verified_coach').icon==='🥇');
t('Kararlı simgesi 🎖️', defs.find(b=>b.id==='workout_25').icon==='🎖️');

console.log('\n▸ Onaylıyken rozet veriliyor');
depo['rf_profile']=JSON.stringify({nickname:'test',onay:'onayli',rol:'antrenor'});
depo['rf_badges']='[]';
checkAndAwardBadges();
t('Onaylı Koç verildi', rozetVar('verified_coach'));

console.log('\n▸ Onay kalkınca rozet GERİ ALINIYOR');
depo['rf_badge_showcase']=JSON.stringify(['verified_coach','first_workout']);
depo['rf_profile']=JSON.stringify({nickname:'test',onay:'red',rol:'uye'});
checkAndAwardBadges();
t('Onaylı Koç geri alındı', !rozetVar('verified_coach'));
const vit=JSON.parse(depo['rf_badge_showcase']);
t('Vitrinden de çıkarıldı', !vit.includes('verified_coach'), vit.join(','));
t('Diğer vitrin rozeti korundu', vit.includes('first_workout'));

console.log('\n▸ Tekrar onaylanınca geri geliyor');
depo['rf_profile']=JSON.stringify({nickname:'test',onay:'onayli',rol:'diyetisyen'});
checkAndAwardBadges();
t('Diyetisyen için de veriliyor', rozetVar('verified_coach'));

console.log('\n▸ Kalıcı rozetler etkilenmiyor');
depo['rf_workout_logs']=JSON.stringify(
  Array.from({length:30},(_,i)=>({id:'w'+i,date:'2026-0'+(i%9+1)+'-01T10:00:00Z',sets:[]})));
checkAndAwardBadges();
const kalici=rozetVar('workout_25');
t('Antrenman rozeti kazanıldı', kalici);
depo['rf_profile']=JSON.stringify({nickname:'test',onay:'red',rol:'uye'});
checkAndAwardBadges();
t('Onay kalksa da antrenman rozeti KALIYOR', rozetVar('workout_25'));
t('Ama Onaylı Koç gitti', !rozetVar('verified_coach'));

console.log('\n▸ Koşul değerlendirme');
depo['rf_profile']=JSON.stringify({onay:'beklemede',rol:'antrenor'});
t('Beklemede rozet vermiyor', !_rozetKosuluSagli('verified_coach'));
depo['rf_profile']=JSON.stringify({onay:'onayli',rol:'uye'});
t('Onaylı ama rol üye ise vermiyor', !_rozetKosuluSagli('verified_coach'));
depo['rf_profile']='bozuk json';
t('Bozuk veride çökmüyor', _rozetKosuluSagli('verified_coach')===false);
t('Kalıcı rozetler hep geçerli', _rozetKosuluSagli('workout_25')===true);

console.log('\n'+'─'.repeat(48));
console.log(`📊 ROZET: ${pass}/${pass+fail} geçti`);
if(fail===0) console.log('🎉 Geri alma çalışıyor!'); else process.exitCode=1;
