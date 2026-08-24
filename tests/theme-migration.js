const attrs={};
let colorScheme='';
global.document={
  documentElement:{
    setAttribute:(k,v)=>attrs[k]=v, getAttribute:(k)=>attrs[k],
    get style(){return {set colorScheme(v){colorScheme=v}, get colorScheme(){return colorScheme}}}
  },
  getElementById:()=>null, querySelector:()=>null, querySelectorAll:()=>[],
  createElement:()=>({style:{},classList:{add(){},remove(){}}}),
  body:{style:{},appendChild(){},classList:{add(){},remove(){},toggle(){}}},
  addEventListener(){}
};
global.getComputedStyle=()=>({getPropertyValue:()=>'#0F1113'});
global.window={location:{protocol:'https:',origin:'',pathname:'/'},addEventListener(){},scrollTo(){}};
const depo={};
global.localStorage={get length(){return Object.keys(depo).length},key(i){return Object.keys(depo)[i]},
  getItem(k){return depo[k]??null},setItem(k,v){depo[k]=String(v)},removeItem(k){delete depo[k]}};
global.navigator={vibrate(){}}; global.fetch=()=>Promise.reject(new Error('x')); global.firebase=undefined;
eval(require('fs').readFileSync(__dirname+'/_combined.tmp.js','utf8'));
saveToFirebase=()=>{};

let pass=0,fail=0;
const t=(l,c,d)=>{ if(c){pass++;console.log('  ✅ '+l);} else {fail++;console.log('  ❌ '+l+(d?' → '+d:''));} };

console.log('\n╔══ TEMA GÖÇ TESTİ ══╗');
console.log('\n▸ Yeni tema kodları');
['gece','okyanus','menekse','bakir','aydinlik'].forEach(k=>{
  applyTheme(k);
  t(k+' uygulandı', attrs['data-theme']===k, attrs['data-theme']);
});

console.log('\n▸ Eski kodlar göç ediyor mu?');
const goc={dark:'gece',ocean:'okyanus',violet:'menekse',crimson:'bakir',
           rose:'menekse',forest:'okyanus',light:'aydinlik'};
Object.entries(goc).forEach(([eski,yeni])=>{
  applyTheme(eski);
  t(`${eski.padEnd(8)} → ${yeni}`, attrs['data-theme']===yeni, attrs['data-theme']);
});

console.log('\n▸ Bozuk değerler');
applyTheme('boyle-tema-yok'); t('Bilinmeyen → gece', attrs['data-theme']==='gece');
applyTheme(null);             t('null → gece', attrs['data-theme']==='gece');
applyTheme('');               t('boş → gece', attrs['data-theme']==='gece');

console.log('\n▸ color-scheme');
applyTheme('aydinlik'); t('aydinlik → light', colorScheme==='light', colorScheme);
applyTheme('gece');     t('gece → dark', colorScheme==='dark', colorScheme);

console.log('\n▸ Eski kod localStorage\'da güncelleniyor mu?');
depo['rf_theme']='crimson';
applyTheme('crimson');
t('rf_theme crimson → bakir', depo['rf_theme']==='bakir', depo['rf_theme']);

console.log('\n'+'─'.repeat(46));
console.log(`📊 TEMA GÖÇ: ${pass}/${pass+fail} geçti`);
if(fail===0) console.log('🎉 Göç sorunsuz!'); else process.exitCode=1;
