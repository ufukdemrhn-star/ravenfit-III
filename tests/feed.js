const kaplar={posts:{},profiles:{},follows:{},likes:{}};
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

let sorguSayisi=0, sonInBoyutlari=[];
function kol(ad, ust){
  const k = ust ? ad+'@'+ust : ad;
  kaplar[k]=kaplar[k]||{};
  const kap=kaplar[k];
  const api={
    doc:(id)=>({id:id||'x',get:()=>Promise.resolve({exists:id in kap,data:()=>kap[id],id}),
      set:(d,o)=>{kap[id]=o&&o.merge?Object.assign({},kap[id],d):d;return Promise.resolve();},
      delete:()=>{delete kap[id];return Promise.resolve();},collection:(a)=>kol(a,id)}),
    _f:[], where(f,op,v){
      if(op==='in') sonInBoyutlari.push(v.length);
      api._f.push([f,op,v]);return api;
    },
    limit(){return api;}, orderBy(){return api;},
    count(){return{get:()=>{
      let l=Object.keys(kap).map(id=>({id,data:()=>kap[id]}));
      api._f.forEach(([f,op,v])=>{l=l.filter(d=>op==='in'?v.includes(d.data()[f]):d.data()[f]===v)});
      api._f=[];return Promise.resolve({data:()=>({count:l.length})});
    }};},
    get(){
      sorguSayisi++;
      let l=Object.keys(kap).map(id=>({id,data:()=>kap[id],ref:{delete:()=>Promise.resolve()}}));
      api._f.forEach(([f,op,v])=>{l=l.filter(d=>op==='in'?v.includes(d.data()[f]):d.data()[f]===v)});
      api._f=[];
      return Promise.resolve({empty:!l.length,docs:l,size:l.length,forEach:(fn)=>l.forEach(fn)});
    }
  };
  return api;
}
global.firebase={firestore:Object.assign(()=>({collection:kol}),
  {FieldValue:{serverTimestamp:()=>({seconds:1}),increment:(n)=>({__inc:n})}})};

eval(require('fs').readFileSync(__dirname+'/_combined.tmp.js','utf8'));
_fbDb={collection:kol}; _fbUser={uid:'ben'};
showToast=()=>{};

let pass=0,fail=0;
const t=(l,c,d)=>{ if(c){pass++;console.log('  ✅ '+l);} else {fail++;console.log('  ❌ '+l+(d?' → '+d:''));} };

console.log('\n╔══ ANA AKIŞ ══╗');

// 3 kullanıcı, farklı zamanlarda gönderiler
kaplar.posts={
  p1:{uid:'a', metin:'Eski',  tarih:{seconds:100}, onizlemeler:['i1'], fotoSayisi:1},
  p2:{uid:'b', metin:'Yeni',  tarih:{seconds:300}, onizlemeler:[],     fotoSayisi:0},
  p3:{uid:'c', metin:'Orta',  tarih:{seconds:200}, onizlemeler:['i3'], fotoSayisi:2},
  p4:{uid:'ben', metin:'Benim', tarih:{seconds:250}, onizlemeler:[],   fotoSayisi:0}
};
kaplar.profiles={
  a:{nickname:'ali'}, b:{nickname:'bora'}, c:{nickname:'cem'}, ben:{nickname:'raven'}
};
// ben → a ve b'yi takip ediyorum
kaplar.follows={ 'ben_a':{takipEden:'ben',takipEdilen:'a'},
                 'ben_b':{takipEden:'ben',takipEdilen:'b'} };

console.log('\n▸ Sıralama');
_akisTumGonderiler().then(l=>{
  t('Tüm gönderiler geldi', l.length===4, l.length);
  t('Yeniden eskiye sıralı', l[0].metin==='Yeni' && l[3].metin==='Eski',
    l.map(x=>x.metin).join(','));

  console.log('\n▸ Takip akışı');
  return _akisTakipGonderileri();
}).then(l=>{
  const uidler=l.map(x=>x.uid);
  t('Takip edilenler var', uidler.includes('a') && uidler.includes('b'));
  t('Kendi gönderim de var', uidler.includes('ben'));
  t('Takip edilmeyen YOK', !uidler.includes('c'), 'c sızdı');
  t('Sıralı geliyor', l[0].tarih.seconds >= l[l.length-1].tarih.seconds);

  console.log('\n▸ 30 sınırı parçalanması');
  // 75 takip edilen ekle
  for(let i=0;i<75;i++){
    kaplar.follows['ben_u'+i]={takipEden:'ben',takipEdilen:'u'+i};
  }
  sonInBoyutlari=[]; sorguSayisi=0;
  return _akisTakipGonderileri();
}).then(()=>{
  t('Parçalara bölündü', sonInBoyutlari.length>=3, sonInBoyutlari.length+' parça');
  t('Her parça ≤30', sonInBoyutlari.every(n=>n<=30), sonInBoyutlari.join(','));
  const toplam=sonInBoyutlari.reduce((a,b)=>a+b,0);
  t('Hiç kullanıcı atlanmadı', toplam===78, toplam+' (75 takip + ben + a + b)');

  console.log('\n▸ Kart çizimi');
  _akisProfiller={a:{nickname:'ali',uid:'a'}};
  const h=_akisKartHTML(kaplar.posts.p1);
  t('Kart HTML üretiyor', h.includes('fd-kart'));
  t('Yazar adı var', h.includes('@ali'));
  t('Kapak fotoğrafı var', h.includes('i1'));
  t('Beğeni butonu var', h.includes('akisBegen'));
  const h2=_akisKartHTML(kaplar.posts.p3);
  t('Çoklu fotoğraf işareti', h2.includes('⧉ 2'));
  const h3=_akisKartHTML(kaplar.posts.p2);
  t('Fotoğrafsız gönderi de çiziliyor', h3.includes('fd-metin') && !h3.includes('fd-medya'));

  console.log('\n'+'─'.repeat(48));
  console.log(`📊 AKIŞ: ${pass}/${pass+fail} geçti`);
  if(fail===0) console.log('🎉 Ana akış çalışıyor!'); else process.exitCode=1;
});
