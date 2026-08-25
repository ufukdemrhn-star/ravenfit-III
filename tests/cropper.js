const src = require('fs').readFileSync(__dirname+'/../js/social/cropper.js','utf8');
const KIRP_ORANLARI=[{id:'4:3',deger:4/3},{id:'1:1',deger:1},{id:'3:4',deger:3/4}];
const _kirp={oran:1,yakinlik:1,olcek:1,x:0,y:0,cerceveG:0,cerceveY:0,img:null};
eval(src.match(/function _kirpCerceveHesapla[\s\S]*?\n\}/)[0].replace("var alan = document.getElementById('cr-alan');\n  if(!alan) return;","var alan={clientWidth:_TEST_G,clientHeight:_TEST_Y};"));
eval(src.match(/function _kirpOrtala[\s\S]*?\n\}/)[0]);
eval(src.match(/function _kirpSinirla[\s\S]*?\n\}/)[0]);

let pass=0,fail=0;
const t=(l,c,d)=>{ if(c){pass++;console.log('  ✅ '+l);} else {fail++;console.log('  ❌ '+l+(d?' → '+d:''));} };
global._TEST_G=360; global._TEST_Y=400;

console.log('\n╔══ KIRPICI MATEMATİĞİ ══╗');

console.log('\n▸ Çerçeve boyutu');
[['4:3',4/3],['1:1',1],['3:4',3/4]].forEach(([ad,o])=>{
  _kirp.oran=o; _kirpCerceveHesapla();
  const gercek=_kirp.cerceveG/_kirp.cerceveY;
  t(`${ad} çerçeve oranı doğru`, Math.abs(gercek-o)<0.02,
    `${_kirp.cerceveG}×${_kirp.cerceveY} = ${gercek.toFixed(3)}`);
  t(`${ad} alana sığıyor`, _kirp.cerceveG<=336 && _kirp.cerceveY<=376);
});

console.log('\n▸ Fotoğraf çerçeveyi kaplıyor mu?');
[[1920,1080,'geniş'],[1080,1920,'uzun'],[1000,1000,'kare'],[3000,500,'panorama']].forEach(([g,y,ad])=>{
  _kirp.img={width:g,height:y}; _kirp.oran=1; _kirp.yakinlik=1;
  _kirpCerceveHesapla(); _kirpOrtala();
  const dg=g*_kirp.olcek, dy=y*_kirp.olcek;
  t(`${ad} çerçeveyi kaplıyor`, dg>=_kirp.cerceveG-1 && dy>=_kirp.cerceveY-1,
    `${dg.toFixed(0)}×${dy.toFixed(0)} vs ${_kirp.cerceveG}×${_kirp.cerceveY}`);
});

console.log('\n▸ Sürükleme sınırları');
_kirp.img={width:2000,height:1000}; _kirp.oran=1; _kirp.yakinlik=1;
_kirpCerceveHesapla(); _kirpOrtala();
const cg=_kirp.cerceveG, cy=_kirp.cerceveY;
_kirp.x=9999; _kirp.y=9999; _kirpSinirla();
t('Sağa/aşağı taşma engellendi', _kirp.x<=0 && _kirp.y<=0, `x=${_kirp.x} y=${_kirp.y}`);
_kirp.x=-99999; _kirp.y=-99999; _kirpSinirla();
const dg=2000*_kirp.olcek, dy=1000*_kirp.olcek;
t('Sola/yukarı taşma engellendi', _kirp.x>=cg-dg-1 && _kirp.y>=cy-dy-1,
  `x=${_kirp.x.toFixed(0)} min=${(cg-dg).toFixed(0)}`);
t('Boşluk oluşmuyor', _kirp.x<=0 && _kirp.x+dg>=cg-1);

console.log('\n▸ Yakınlaştırma');
_kirp.yakinlik=2; _kirpOrtala();
const dg2=2000*_kirp.olcek*_kirp.yakinlik;
t('2× yakınlaştırma büyütüyor', dg2>dg*1.9, `${dg.toFixed(0)} → ${dg2.toFixed(0)}`);
_kirp.x=0; _kirpSinirla();
t('Yakınken de sınır çalışıyor', _kirp.x<=0);

console.log('\n▸ Metin sınırları');
const ps=require('fs').readFileSync(__dirname+'/../js/social/posts.js','utf8');
const GONDERI_MAX_METIN=500,GONDERI_MAX_SATIR=20,GONDERI_SATIR_UZUN=60;
eval(ps.match(/function _npGecerliMi[\s\S]*?\n\}/)[0]);
t('500 karakter geçerli', _npGecerliMi('a'.repeat(60)+'\n'+'b'.repeat(60)));
t('501 karakter geçersiz', !_npGecerliMi('a'.repeat(501)));
t('60 karakterlik satır geçerli', _npGecerliMi('a'.repeat(60)));
t('61 karakterlik satır geçersiz', !_npGecerliMi('a'.repeat(61)));
t('20 satır geçerli', _npGecerliMi(Array(20).fill('x').join('\n')));
t('21 satır geçersiz', !_npGecerliMi(Array(21).fill('x').join('\n')));
t('Boş satır serbest', _npGecerliMi('A\n\nB'));

console.log('\n'+'─'.repeat(50));
console.log(`📊 KIRPICI: ${pass}/${pass+fail} geçti`);
if(fail===0) console.log('🎉 Kırpma matematiği doğru!'); else process.exitCode=1;
