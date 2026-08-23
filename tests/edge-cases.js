global.document={getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,
  createElement:()=>({style:{},classList:{add(){},remove(){}},appendChild(){}}),
  body:{appendChild(){},style:{}},documentElement:{setAttribute(){},style:{setProperty(){}}},addEventListener(){}};
global.window={location:{protocol:'https:',origin:'',pathname:'/'},addEventListener(){},scrollTo(){}};
global.localStorage={_d:{},getItem(k){return this._d[k]??null},setItem(k,v){this._d[k]=v},removeItem(){}};
global.navigator={vibrate(){}};global.fetch=()=>Promise.reject(new Error('x'));global.firebase=undefined;
eval(require('fs').readFileSync(__dirname+'/_combined.tmp.js','utf8'));

let pass=0,fail=0;
function t(l,c,d){ if(c){pass++;console.log('  ✅ '+l);} else {fail++;console.log('  ❌ '+l+(d?'  → '+d:''));} }
const fin = v => Number.isFinite(v) && !Number.isNaN(v);

console.log('\n╔══ UÇ DURUM TESTİ — güvenlik yardımcıları işe yarıyor mu? ══╗');

console.log('\n▸ calcBF — imkânsız girdiler');
// Bel = boyun  → log10(0) = -Infinity
U={gender:'male',height:175,neck:40,waist:40,weight:80};
let bf=calcBF();
t('Bel = boyun → NaN değil', fin(bf), 'sonuç: '+bf);
t('Sonuç makul aralıkta (2-70)', bf>=2&&bf<=70, 'sonuç: '+bf);

// Bel < boyun → log10(negatif) = NaN
U={gender:'male',height:175,neck:45,waist:40,weight:80};
bf=calcBF();
t('Bel < boyun → NaN değil', fin(bf), 'sonuç: '+bf);

// Boy 0
U={gender:'male',height:0,neck:38,waist:85,weight:80};
bf=calcBF();
t('Boy 0 → NaN değil', fin(bf), 'sonuç: '+bf);

// Kadın: bel+kalça = boyun
U={gender:'female',height:165,neck:100,waist:50,hip:50,weight:60};
bf=calcBF();
t('Kadın uç durum → NaN değil', fin(bf), 'sonuç: '+bf);

console.log('\n▸ calcFFMI — sıfıra bölme');
U={gender:'male',height:0,weight:80};
let f=calcFFMI(20);
t('Boy 0 → ffmi Infinity değil', fin(f.ffmi), 'ffmi: '+f.ffmi);
t('Boy 0 → norm Infinity değil', fin(f.norm), 'norm: '+f.norm);
t('ffm doğru hesaplandı', f.ffm===64, 'ffm: '+f.ffm);

console.log('\n▸ _safeRound — IEEE 754 hassasiyeti');
t('_safeRound(1.005, 2) = 1.01', _safeRound(1.005,2)===1.01, 'sonuç: '+_safeRound(1.005,2));
t('Ham Math.round hatalı verirdi', Math.round(1.005*100)/100===1, 'ham: '+(Math.round(1.005*100)/100));
t('_safeRound(NaN) = 0', _safeRound(NaN,2)===0);
t('_safeRound(Infinity) = 0', _safeRound(Infinity,2)===0);
t('_safeRound(null) = 0', _safeRound(null,2)===0);

console.log('\n▸ _safeDiv — sıfıra bölme');
t('_safeDiv(10, 0) = 0', _safeDiv(10,0)===0);
t('_safeDiv(10, 0, 99) = 99', _safeDiv(10,0,99)===99);
t('_safeDiv(10, 2) = 5', _safeDiv(10,2)===5);
t('_safeDiv(NaN, 2) = 0', _safeDiv(NaN,2)===0);

console.log('\n▸ calcAll — tam zincir, bozuk girdiyle');
U={gender:'male',height:0,weight:0,neck:0,waist:0,age:0};
R={};A={st:'bb',gl:'cut'};selST='bb';selGL='cut';
let threw=null;
try{ calcAll(); }catch(e){ threw=e.message; }
t('calcAll çökmüyor', threw===null, threw);
t('R.bf geçerli sayı', fin(R.bf), 'bf: '+R.bf);
t('R.bmi geçerli sayı', fin(R.bmi), 'bmi: '+R.bmi);
t('R.ffmi geçerli sayı', fin(R.ffmi), 'ffmi: '+R.ffmi);
t('R.tdee geçerli sayı', fin(R.tdee), 'tdee: '+R.tdee);
t('R.goalCal geçerli sayı', fin(R.goalCal), 'goalCal: '+R.goalCal);

console.log('\n'+'─'.repeat(58));
console.log(`📊 UÇ DURUM: ${pass}/${pass+fail} geçti`);
if(fail===0) console.log('🎉 Güvenlik yardımcıları gerçekten koruyor!');
else process.exitCode=1;
