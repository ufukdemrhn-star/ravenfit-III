const PE_BIO_SINIR=150, PE_BIO_SATIR=6, PE_BIO_SATIR_UZUN=30;
const src = require('fs').readFileSync(__dirname+'/../js/social/profile-edit.js','utf8');
eval(src.match(/function _bioDuzelt[\s\S]*?\n\}/)[0]);

let pass=0,fail=0;
const t=(l,c,d)=>{ if(c){pass++;console.log('  ✅ '+l);} else {fail++;console.log('  ❌ '+l+(d?'\n       → '+d:''));} };
const satir=s=>s?s.split('\n').length:0;
const enUzun=s=>Math.max(0,...s.split('\n').map(x=>x.length));

console.log('\n╔══ BİYOGRAFİ SINIRI TESTİ ══╗');

console.log('\n▸ Karakter sınırı');
let r=_bioDuzelt('a'.repeat(400));
t('400 karakter → 150 altı', r.length<=150, r.length+' karakter');
t('Satır başı 30 aşılmıyor', enUzun(r)<=30, 'en uzun: '+enUzun(r));

console.log('\n▸ Satır sınırı');
r=_bioDuzelt(Array(20).fill('satir').join('\n'));
t('20 satır → 6 satır', satir(r)<=6, satir(r)+' satır');

console.log('\n▸ Boş satır istismarı (kullanıcının bulduğu açık)');
r=_bioDuzelt('\n'.repeat(160));
t('160 boş satır → boş', r.length===0, JSON.stringify(r));
r=_bioDuzelt('  \n  \n  \n  \n  \n  \n  \n  ');
t('Sadece boşluk → boş', r.trim().length===0, JSON.stringify(r));
r=_bioDuzelt('Merhaba\n\n\n\n\nDünya');
t('Ardışık boş satır teke iner', satir(r)===3, satir(r)+' satır: '+JSON.stringify(r));

console.log('\n▸ Uzun satır bölünmesi');
r=_bioDuzelt('Bu cok uzun bir satir ve otuz karakteri kesinlikle asiyor');
t('Uzun satır bölündü', satir(r)>1, satir(r)+' satır');
t('Her satır 30 altı', enUzun(r)<=30, 'en uzun: '+enUzun(r));
t('Kelime ortasından bölmedi', !r.split('\n').some(l=>l.startsWith(' ')), JSON.stringify(r));

console.log('\n▸ Normal kullanım bozulmuyor');
const normal='Natural Bodybuilder 💪\nAnkara - Diyetisyen\nRavenFit Koçluk';
r=_bioDuzelt(normal);
t('Normal bio korunuyor', r===normal, JSON.stringify(r));

console.log('\n▸ Uç durumlar');
t('Boş girdi', _bioDuzelt('')==='');
t('null girdi', _bioDuzelt(null)==='');
t('undefined girdi', _bioDuzelt(undefined)==='');
r=_bioDuzelt('Tek satır');
t('Tek satır korunuyor', r==='Tek satır', JSON.stringify(r));

console.log('\n▸ Kullanıcının bildirdiği senaryo');
r=_bioDuzelt('x'.repeat(96));
t('96 karakterlik tek satır bölündü', enUzun(r)<=30, 'en uzun: '+enUzun(r));
t('Sonuç 150 karakter altı', r.length<=150, r.length+'');

console.log('\n'+'─'.repeat(52));
console.log(`📊 BİYOGRAFİ: ${pass}/${pass+fail} geçti`);
if(fail===0) console.log('🎉 Sınırlar çalışıyor!'); else process.exitCode=1;
