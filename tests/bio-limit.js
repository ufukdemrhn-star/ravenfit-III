const PE_BIO_SINIR=150, PE_BIO_SATIR=6, PE_BIO_SATIR_UZUN=35;
const src=require('fs').readFileSync(__dirname+'/../js/social/profile-edit.js','utf8');
eval(src.match(/function _bioGecerliMi[\s\S]*?\n\}/)[0]);
eval(src.match(/function _bioTemizle[\s\S]*?\n\}/)[0]);

let pass=0,fail=0;
const t=(l,c,d)=>{ if(c){pass++;console.log('  ✅ '+l);} else {fail++;console.log('  ❌ '+l+(d?' → '+d:''));} };

console.log('\n╔══ BİYOGRAFİ KURALLARI ══╗');

console.log('\n▸ Geçerlilik kuralları');
t('150 karakter geçerli', _bioGecerliMi('a'.repeat(35)+'\n'+'b'.repeat(35)));
t('151 karakter geçersiz', !_bioGecerliMi('a'.repeat(151)));
t('35 karakterlik satır geçerli', _bioGecerliMi('a'.repeat(35)));
t('36 karakterlik satır geçersiz', !_bioGecerliMi('a'.repeat(36)));
t('6 satır geçerli', _bioGecerliMi('a\nb\nc\nd\ne\nf'));
t('7 satır geçersiz', !_bioGecerliMi('a\nb\nc\nd\ne\nf\ng'));

console.log('\n▸ Boş satır — kullanıcının bildirdiği sorun');
t('Tek boş satır GEÇERLİ', _bioGecerliMi('Sporcu\n\nInquiries: mail@x.com'));
t('İki ardışık boş satır GEÇERLİ', _bioGecerliMi('A\n\n\nB'));
t('Boş satırla 6 satır GEÇERLİ', _bioGecerliMi('A\n\nB\n\nC\n'));
t('Sadece boş satırlar geçerli (temizlikte gider)', _bioGecerliMi('\n\n\n'));

console.log('\n▸ Kaydetme temizliği');
t('Baştaki boşluk atılır', _bioTemizle('\n\nSporcu')==='Sporcu');
t('Sondaki boşluk atılır', _bioTemizle('Sporcu\n\n')==='Sporcu');
t('İÇTEKİ boş satır KORUNUR',
  _bioTemizle('Sporcu\n\nMail')==='Sporcu\n\nMail',
  JSON.stringify(_bioTemizle('Sporcu\n\nMail')));
t('Sadece boşluk → boş', _bioTemizle('\n\n\n\n')==='');

console.log('\n▸ Kullanıcının biyografisi');
const bio='Sporcu\nAthlete by nature\nLawyer by force\nMetalhead by choice 🎸🤘\n\nInquiries: ufukdemrhn@gmail.com';
t('Geçerli mi', _bioGecerliMi(bio), 
  'satır:'+bio.split('\n').length+' enUzun:'+Math.max(...bio.split('\n').map(x=>x.length))+' toplam:'+bio.length);
const temiz=_bioTemizle(bio);
t('Birebir korunuyor', temiz===bio);
console.log('');
temiz.split('\n').forEach((l,i)=>console.log('    '+(i+1)+'│ '+l+'  ('+l.length+')'));

console.log('\n▸ Uç durumlar');
t('Boş metin geçerli', _bioGecerliMi(''));
t('null geçerli', _bioGecerliMi(null));
t('Emoji sayımı', _bioGecerliMi('🎸'.repeat(17)));

console.log('\n'+'─'.repeat(52));
console.log(`📊 BİYOGRAFİ: ${pass}/${pass+fail} geçti`);
if(fail===0) console.log('🎉 Kurallar doğru!'); else process.exitCode=1;
