const postlar={}, medyalar={}, profiller={};
global.document={getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],
  createElement:(t)=>({style:{},classList:{add(){},remove(){}},getContext:()=>({drawImage(){},imageSmoothingEnabled:true,imageSmoothingQuality:''}),toDataURL:()=>'data:image/jpeg;base64,'+'x'.repeat(200)}),
  body:{style:{},appendChild(){},classList:{add(){},remove(){},toggle(){}}},
  documentElement:{setAttribute(){},getAttribute:()=>'gece',style:{setProperty(){},colorScheme:''}},addEventListener(){}};
global.getComputedStyle=()=>({getPropertyValue:()=>'#0F1113'});
global.location={protocol:'https:',origin:'',pathname:'/',reload(){}};
global.window={location:global.location,addEventListener(){},scrollTo(){}};
const depo={};
global.localStorage={get length(){return Object.keys(depo).length},key(i){return Object.keys(depo)[i]},
  getItem:(k)=>depo[k]??null,setItem:(k,v)=>{depo[k]=String(v)},removeItem:(k)=>{delete depo[k]}};
global.navigator={vibrate(){}}; global.fetch=()=>Promise.reject(new Error('x'));

let sayac=0;
function kol(ad, ustId){
  const kap = ad==='posts'?postlar : ad==='profiles'?profiller : (medyalar[ustId]=medyalar[ustId]||{});
  const api={
    doc:(id)=>{
      const gercekId = id || ('post'+(++sayac));
      return {
        id: gercekId,
        get:()=>Promise.resolve({exists:gercekId in kap,data:()=>kap[gercekId],id:gercekId}),
        set:(d,o)=>{kap[gercekId]= o&&o.merge?Object.assign({},kap[gercekId],d):d; return Promise.resolve();},
        delete:()=>{delete kap[gercekId];return Promise.resolve();},
        ref:{delete:()=>{delete kap[gercekId];return Promise.resolve();}},
        collection:(alt)=>kol(alt, gercekId)
      };
    },
    _f:[], where(f,op,v){api._f.push([f,op,v]);return api;}, limit(){return api;}, orderBy(){return api;},
    count(){ return {get:()=>{
      let l=Object.keys(kap).map(id=>({id,data:()=>kap[id]}));
      api._f.forEach(([f,op,v])=>{l=l.filter(d=>d.data()[f]===v)});
      api._f=[]; return Promise.resolve({data:()=>({count:l.length})});
    }};},
    get(){
      let l=Object.keys(kap).map(id=>({id,data:()=>kap[id],ref:{delete:()=>{delete kap[id];return Promise.resolve();}}}));
      api._f.forEach(([f,op,v])=>{l=l.filter(d=>d.data()[f]===v)});
      api._f=[];
      return Promise.resolve({empty:!l.length,docs:l,size:l.length,forEach:(fn)=>l.forEach(fn)});
    }
  };
  return api;
}
global.firebase={firestore:Object.assign(()=>({collection:kol}),
  {FieldValue:{serverTimestamp:()=>({seconds:Math.floor(Date.now()/1000)}),increment:(n)=>({__inc:n})}})};

eval(require('fs').readFileSync(__dirname+'/_combined.tmp.js','utf8'));
_fbDb={collection:kol}; _fbUser={uid:'u1',email:'a@b.c'};
showToast=()=>{}; showConfirm=(a,b,cb)=>cb&&cb();

let pass=0,fail=0;
const t=(l,c,d)=>{ if(c){pass++;console.log('  ✅ '+l);} else {fail++;console.log('  ❌ '+l+(d?' → '+d:''));} };

console.log('\n╔══ GÖNDERİ SİSTEMİ ══╗');

console.log('\n▸ Yapılandırma');
t('En fazla 5 fotoğraf', GONDERI_MAX_FOTO===5);
t('4 gönderi türü', GONDERI_TURLERI.length===4);
t('Metin sınırı 500', GONDERI_MAX_METIN===500);

console.log('\n▸ Gönderi oluşturma (doğrudan Firestore)');
const ref=_fbDb.collection('posts').doc();
const pid=ref.id;
ref.set({uid:'u1',metin:'İlk gönderi',tur:'antrenman',fotoSayisi:2,
  onizlemeler:['data:img1','data:img2'],begeni:0,yorum:0,
  tarih:{seconds:Math.floor(Date.now()/1000)}})
.then(()=>Promise.all([
  ref.collection('media').doc('0').set({sira:0,veri:'TAM1'}),
  ref.collection('media').doc('1').set({sira:1,veri:'TAM2'})
]))
.then(()=>{
  t('Ana belge oluştu', pid in postlar);
  t('Önizlemeler ana belgede', postlar[pid].onizlemeler.length===2);
  t('Tam fotoğraflar AYRI belgelerde', Object.keys(medyalar[pid]).length===2);
  return gonderileriGetir('u1');
}).then(l=>{
  t('Gönderiler okunuyor', l.length===1, l.length);
  t('Metin doğru', l[0].metin==='İlk gönderi');
  return gonderiSay('u1');
}).then(n=>{
  t('Sayım doğru', n===1, n);
  return gonderiMedyaGetir(pid);
}).then(m=>{
  t('Tam fotoğraflar getiriliyor', m.length===2, m.length);
  t('Sıralı geliyor', m[0].sira===0 && m[1].sira===1);
  t('Tam veri farklı', m[0].veri==='TAM1');

  console.log('\n▸ Izgara çizimi');
  const h=gonderiIzgarasi([postlar[pid]], true);
  t('Izgara HTML üretiyor', h.includes('pr-grid-item'));
  t('Kapak fotoğrafı var', h.includes('data:img1'));
  t('Çoklu işareti var', h.includes('pr-grid-multi'));
  const bos=gonderiIzgarasi([], true);
  t('Boş durum mesajı', bos.includes('İlk gönderini paylaş'));
  const bosBaska=gonderiIzgarasi([], false);
  t('Başkası için farklı mesaj', bosBaska.includes('paylaşılmamış'));

  console.log('\n▸ Yazı-only gönderi');
  const y=gonderiIzgarasi([{id:'p2',metin:'Sadece yazı',tur:'serbest',fotoSayisi:0,onizlemeler:[]}],true);
  t('Yazı kutusu çiziliyor', y.includes('pr-grid-yazi'));

  console.log('\n▸ Silme');
  return ref.collection('media').get();
}).then(s=>Promise.all(s.docs.map(d=>d.ref.delete())))
.then(()=>_fbDb.collection('posts').doc(pid).delete())
.then(()=>{
  t('Ana belge silindi', !(pid in postlar));
  t('Fotoğraflar silindi', Object.keys(medyalar[pid]||{}).length===0);

  console.log('\n▸ Tarih biçimi');
  t('az önce', _pdTarih({seconds:Math.floor(Date.now()/1000)})==='az önce');
  t('dakika', _pdTarih({seconds:Math.floor(Date.now()/1000)-300}).includes('dakika'));
  t('saat', _pdTarih({seconds:Math.floor(Date.now()/1000)-7200}).includes('saat'));
  t('boş tarih', _pdTarih(null)==='az önce');

  console.log('\n'+'─'.repeat(48));
  console.log(`📊 GÖNDERİ: ${pass}/${pass+fail} geçti`);
  if(fail===0) console.log('🎉 Gönderi sistemi çalışıyor!'); else process.exitCode=1;
});
