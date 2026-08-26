const src = require('fs').readFileSync(__dirname+'/../js/social/pricing.js','utf8');
eval(src.match(/var GELIR_VERGISI_DILIMLERI_2026[\s\S]*?\n\];/)[0]);
eval(src.match(/var PLATFORM_KOMISYONU[\s\S]*?var VERGI_YILI\s*=\s*\d+;/)[0]);
eval(src.match(/function gelirVergisiHesapla[\s\S]*?\n\}/)[0]);
eval(src.match(/function marjinalOran[\s\S]*?\n\}/)[0]);
eval(src.match(/function paketKazancHesapla[\s\S]*?\n\}/)[0]);
eval(src.match(/function hedefNettenFiyat[\s\S]*?\n\}/)[0]);

let pass=0,fail=0;
const t=(l,c,d)=>{ if(c){pass++;console.log('  ✅ '+l);} else {fail++;console.log('  ❌ '+l+(d?' → '+d:''));} };
const yakin=(a,b,tol)=>Math.abs(a-b)<=(tol||1);

console.log('\n╔══ FİYAT HESAPLAYICI ══╗');

console.log('\n▸ 2026 gelir vergisi tarifesi (resmî değerler)');
[[190000,28500],[400000,70500],[1000000,232500],[5300000,1737500]].forEach(([m,b])=>{
  t(m.toLocaleString('tr-TR')+' TL → '+b.toLocaleString('tr-TR')+' TL',
    yakin(gelirVergisiHesapla(m),b));
});
t('0 TL → 0 vergi', gelirVergisiHesapla(0)===0);
t('Negatif → 0', gelirVergisiHesapla(-5000)===0);
t('İlk dilim %15', yakin(gelirVergisiHesapla(100000), 15000));

console.log('\n▸ Artan oranlılık');
const v1=gelirVergisiHesapla(200000), v2=gelirVergisiHesapla(190000);
t('Dilim geçişi sürekli', yakin(v1-v2, 10000*0.20), (v1-v2).toFixed(0));
t('Gelir arttıkça vergi artar', gelirVergisiHesapla(500000)>gelirVergisiHesapla(400000));
t('Efektif oran < marjinal',
  gelirVergisiHesapla(500000)/500000 < marjinalOran(500000));

console.log('\n▸ Marjinal oran');
t('190k altı %15', marjinalOran(100000)===0.15);
t('400k altı %20', marjinalOran(300000)===0.20);
t('1M altı %27', marjinalOran(700000)===0.27);
t('5.3M altı %35', marjinalOran(2000000)===0.35);
t('5.3M üstü %40', marjinalOran(9000000)===0.40);

console.log('\n▸ KDV ayrıştırması');
let r=paketKazancHesapla({fiyat:1200,kdvDahil:true,adet:1,digerGelir:0,giderOrani:0});
t('KDV dahil: müşteri 1200 öder', yakin(r.musteriOdemesi,1200));
t('KDV dahil: KDV 200', yakin(r.kdvTutari,200));
t('KDV dahil: matrah 1000', yakin(r.kdvsizFiyat,1000));

r=paketKazancHesapla({fiyat:1000,kdvDahil:false,adet:1,digerGelir:0,giderOrani:0});
t('KDV hariç: müşteri 1200 öder', yakin(r.musteriOdemesi,1200));
t('KDV hariç: KDV 200', yakin(r.kdvTutari,200));

console.log('\n▸ Komisyon');
r=paketKazancHesapla({fiyat:1200,kdvDahil:true,adet:1,digerGelir:0,giderOrani:0});
t('Komisyon KDV\'siz tutardan (%5 × 1000 = 50)', yakin(r.komisyon,50));
t('KDV üzerinden komisyon alınmıyor', r.komisyon < 60);

console.log('\n▸ Bütünlük — tüm kalemler toplamı');
r=paketKazancHesapla({fiyat:2000,kdvDahil:true,adet:10,digerGelir:0,giderOrani:0.20});
const toplam = r.kdvTutari + r.komisyon + r.giderler + r.vergi + r.netKazanc;
t('Kalemler müşteri ödemesine eşit', yakin(toplam, r.musteriOdemesi, 2),
  toplam.toFixed(2)+' vs '+r.musteriOdemesi.toFixed(2));
t('Net kazanç pozitif', r.netKazanc>0);
t('Net oran mantıklı (%40-70)', r.netOran>0.40 && r.netOran<0.70,
  '%'+Math.round(r.netOran*100));

console.log('\n▸ Vergi dilimi etkisi');
const dusuk=paketKazancHesapla({fiyat:1000,kdvDahil:true,adet:5,digerGelir:0,giderOrani:0});
const yuksek=paketKazancHesapla({fiyat:1000,kdvDahil:true,adet:5,digerGelir:900000,giderOrani:0});
t('Yüksek gelirde vergi daha çok', yuksek.vergi > dusuk.vergi,
  dusuk.vergi.toFixed(0)+' → '+yuksek.vergi.toFixed(0));
t('Yüksek gelirde net daha az', yuksek.netKazanc < dusuk.netKazanc);
t('Beyan uyarısı çalışıyor',
  paketKazancHesapla({fiyat:5000,kdvDahil:true,adet:60,digerGelir:0,giderOrani:0}).beyanGerekli);

console.log('\n▸ Hedef netten fiyat');
const hedef=1000;
const onerilen=hedefNettenFiyat(hedef,{kdvDahil:true,adet:12,digerGelir:0,giderOrani:0.15});
const kontrol=paketKazancHesapla({fiyat:onerilen,kdvDahil:true,adet:12,digerGelir:0,giderOrani:0.15});
t('Önerilen fiyat hedefi tutturuyor', yakin(kontrol.netKazanc,hedef,5),
  onerilen+' ₺ → '+kontrol.netKazanc.toFixed(0)+' ₺ net');
t('Önerilen fiyat hedeften büyük', onerilen>hedef);

console.log('\n▸ Uç durumlar');
t('Fiyat 0 → net 0', paketKazancHesapla({fiyat:0,adet:1}).netKazanc===0);
t('Adet 0 → çökmüyor', !isNaN(paketKazancHesapla({fiyat:1000,adet:0}).netKazanc));
t('Gider %100 sınırlanıyor',
  paketKazancHesapla({fiyat:1000,adet:1,giderOrani:5}).netKazanc > -1000);
t('Eksik girdi → çökmüyor', !isNaN(paketKazancHesapla({}).netKazanc));

console.log('\n'+'─'.repeat(52));
console.log(`📊 HESAPLAYICI: ${pass}/${pass+fail} geçti`);
if(fail===0) console.log('🎉 Hesaplama doğru!'); else process.exitCode=1;
