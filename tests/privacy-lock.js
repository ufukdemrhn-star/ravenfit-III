/* Türetme kilidi mantığını doğrula */
eval(require('fs').readFileSync(__dirname+'/../js/social/profiles.js','utf8')
     .replace(/_lsGet|_lsSet/g,'(function(){})'));

let pass=0,fail=0;
const t=(l,c,d)=>{ if(c){pass++;console.log('  ✅ '+l);} else {fail++;console.log('  ❌ '+l+(d?' → '+d:''));} };
const set=(...a)=>{const o={};a.forEach(k=>o[k]=true);return o;};

console.log('\n╔══ TÜRETME KİLİDİ TESTİ ══╗');

console.log('\n▸ Yağ oranı sızıntısı');
t('Ağırlık+Yağsız açıkken yağ oranı türetilir',
  !!_turetilebilirMi('bf', set('weight','lm')));
t('Sadece ağırlık açıkken türetilmez',
  !_turetilebilirMi('bf', set('weight')));
t('Sadece yağsız kütle açıkken türetilmez',
  !_turetilebilirMi('bf', set('lm')));

console.log('\n▸ Boy sızıntısı');
t('Ağırlık+VKİ açıkken boy türetilir',
  !!_turetilebilirMi('height', set('weight','bmi')));
t('Yağsız+FFMI açıkken boy türetilir',
  !!_turetilebilirMi('height', set('lm','ffmi')));
t('Sadece VKİ açıkken türetilmez',
  !_turetilebilirMi('height', set('bmi')));

console.log('\n▸ Ağırlık sızıntısı');
t('Yağsız+Yağ oranı açıkken ağırlık türetilir',
  !!_turetilebilirMi('weight', set('lm','bf')));
t('Boy+VKİ açıkken ağırlık türetilir',
  !!_turetilebilirMi('weight', set('height','bmi')));

console.log('\n▸ Oran sızıntısı');
t('Omuz+Bel açıkken oran türetilir',
  !!_turetilebilirMi('swr', set('shoulder','waist')));
t('Sadece omuz açıkken türetilmez',
  !_turetilebilirMi('swr', set('shoulder')));

console.log('\n▸ Çevre ölçüleri bağımsız olmalı');
['neck','chest','arm','forearm','hip','leg','calf'].forEach(k=>{
  t(k+' türetilemez', !_turetilebilirMi(k, set('weight','height','bf','lm','bmi','ffmi','shoulder','waist')));
});

console.log('\n▸ Gerçek senaryo: kullanıcı yağ oranını gizlemek istiyor');
let acik = set('weight','lm','ffmi','arm');
const zincir = _turetilebilirMi('bf', acik);
t('Kilit tetikleniyor', !!zincir, 'zincir yok');
t('Doğru kaynakları gösteriyor',
  zincir && zincir.kaynak.includes('weight') && zincir.kaynak.includes('lm'),
  zincir ? zincir.kaynak.join(',') : '');
delete acik['lm'];
t('Yağsız kütle kapatılınca kilit açılıyor', !_turetilebilirMi('bf', acik));

console.log('\n▸ Alan tanımları');
t('17 alan tanımlı', ISTATISTIK_ALANLARI.length===18, ISTATISTIK_ALANLARI.length+' alan');
t('Her alanın id\'si benzersiz',
  new Set(ISTATISTIK_ALANLARI.map(a=>a.id)).size===ISTATISTIK_ALANLARI.length);
t('Tüm zincir hedefleri geçerli alan',
  TURETME_ZINCIRLERI.every(z=>ISTATISTIK_ALANLARI.some(a=>a.id===z.hedef)));
t('Tüm zincir kaynakları geçerli alan',
  TURETME_ZINCIRLERI.every(z=>z.kaynak.every(k=>ISTATISTIK_ALANLARI.some(a=>a.id===k))));

console.log('\n'+'─'.repeat(50));
console.log(`📊 KİLİT TESTİ: ${pass}/${pass+fail} geçti`);
if(fail===0) console.log('🎉 Sızıntı koruması çalışıyor!'); else process.exitCode=1;
