const kaplar={notifications:{},posts:{},profiles:{},follows:{},blocks:{},
              followRequests:{},likes:{},commentLikes:{},applications:{}};
const reg={};
['bnav-bildirim-rozet','fd-bildirim-rozet','nt-body'].forEach(id=>
  reg[id]={id,textContent:'',innerHTML:'',style:{display:'none'},
    classList:{add(){},remove(){},contains:()=>false,toggle(){}}});
global.document={getElementById:(id)=>reg[id]||null,querySelector:()=>null,querySelectorAll:()=>[],
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

let sayac=0;
function kol(ad, ust){
  const k = ust ? ad+'@'+ust : ad;
  kaplar[k]=kaplar[k]||{};
  const kap=kaplar[k];
  const api={
    doc:(id)=>({id:id||'d'+(++sayac),
      get:()=>Promise.resolve({exists:id in kap,data:()=>kap[id],id}),
      set:(d,o)=>{kap[id]=o&&o.merge?Object.assign({},kap[id],d):d;return Promise.resolve();},
      delete:()=>{delete kap[id];return Promise.resolve();},
      collection:(a)=>kol(a,id)}),
    add:(d)=>{const i='n'+(++sayac);kap[i]=d;return Promise.resolve({id:i});},
    _f:[],where(f,op,v){api._f.push([f,op,v]);return api;},limit(){return api;},orderBy(){return api;},
    count(){return{get:()=>{
      let l=Object.keys(kap).map(id=>({id,data:()=>kap[id]}));
      api._f.forEach(([f,op,v])=>{l=l.filter(d=>d.data()[f]===v)});
      api._f=[];return Promise.resolve({data:()=>({count:l.length})});}};},
    get(){
      let l=Object.keys(kap).map(id=>({id,data:()=>kap[id],ref:{delete:()=>Promise.resolve()}}));
      api._f.forEach(([f,op,v])=>{l=l.filter(d=>op==='in'?v.includes(d.data()[f]):d.data()[f]===v)});
      api._f=[];
      return Promise.resolve({empty:!l.length,docs:l,size:l.length,forEach:(fn)=>l.forEach(fn)});
    }};
  return api;
}
global.firebase={firestore:Object.assign(()=>({collection:kol}),
  {FieldValue:{serverTimestamp:()=>({seconds:Math.floor(Date.now()/1000)})}})};

eval(require('fs').readFileSync(__dirname+'/_combined.tmp.js','utf8'));
_fbDb={collection:kol}; _fbUser={uid:'ben'};
showToast=()=>{}; showConfirm=(a,b,cb)=>cb&&cb();
_engelOnbellek={engelledigim:{},engelleyen:{}};

let pass=0,fail=0;
const t=(l,c,d)=>{ if(c){pass++;console.log('  ✅ '+l);} else {fail++;console.log('  ❌ '+l+(d?' → '+d:''));} };
const bildirimler=()=>Object.values(kaplar.notifications);

console.log('\n╔══ BİLDİRİMLER ══╗');

console.log('\n▸ Tür tanımları');
t('8 bildirim türü', Object.keys(BILDIRIM_TURLERI).length===8);
['takip','takipIstegi','istekKabul','begeni','yorum','yanit','yorumBegeni','onay']
  .forEach(k=>t(k+' tanımlı', !!BILDIRIM_TURLERI[k]));

console.log('\n▸ Bildirim oluşturma');
bildirimGonder('hedef','takip').then(()=>{
  t('Bildirim yazıldı', bildirimler().length===1);
  const b=bildirimler()[0];
  t('Hedef doğru', b.hedef==='hedef');
  t('Kimden doğru', b.kimden==='ben');
  t('Okunmamış başlıyor', b.okundu===false);

  console.log('\n▸ Kendine bildirim gitmiyor');
  return bildirimGonder('ben','takip');
}).then(()=>{
  t('Kendi eylemim bildirim üretmiyor', bildirimler().length===1);

  console.log('\n▸ Engelli kullanıcıya bildirim gitmiyor');
  _engelOnbellek.engelledigim['engelli']=true;
  return bildirimGonder('engelli','begeni','p1');
}).then(()=>{
  t('Engelliye bildirim yok', bildirimler().length===1);
  _engelOnbellek.engelledigim={};

  console.log('\n▸ Önizleme kırpılıyor');
  return bildirimGonder('hedef','yorum','p1','x'.repeat(200));
}).then(()=>{
  const b=bildirimler().find(x=>x.tur==='yorum');
  t('Önizleme 120 karaktere kırpıldı', b.onizleme.length===120, b.onizleme.length);

  console.log('\n▸ Takip → bildirim');
  kaplar.notifications={};
  _takipOnbellek={};
  return takipDegistir('birisi');
}).then(()=>new Promise(r=>setTimeout(r,20))).then(()=>{
  const b=bildirimler().find(x=>x.tur==='takip');
  t('Takip bildirimi üretildi', !!b, bildirimler().length+' bildirim');
  t('Doğru kişiye gitti', b && b.hedef==='birisi');

  console.log('\n▸ Beğeni → gönderi sahibine bildirim');
  kaplar.notifications={};
  kaplar.posts['p1']={uid:'yazar',metin:'Test gönderisi'};
  _begeniOnbellek={};
  return begeniDegistir('p1');
}).then(()=>new Promise(r=>setTimeout(r,30))).then(()=>{
  const b=bildirimler().find(x=>x.tur==='begeni');
  t('Beğeni bildirimi üretildi', !!b);
  t('Gönderi sahibine gitti', b && b.hedef==='yazar');
  t('Gönderi metni önizlemede', b && b.onizleme.includes('Test'));

  console.log('\n▸ Yorum → gönderi sahibine');
  kaplar.notifications={};
  return yorumEkle('p1','Güzel olmuş');
}).then(()=>new Promise(r=>setTimeout(r,30))).then(()=>{
  const b=bildirimler().find(x=>x.tur==='yorum');
  t('Yorum bildirimi üretildi', !!b);
  t('Yorum metni önizlemede', b && b.onizleme==='Güzel olmuş');

  console.log('\n▸ Takip isteği bildirimi');
  kaplar.notifications={};
  _takipIstekOnbellek={};
  return takipIstegiGonder('gizlihesap');
}).then(()=>new Promise(r=>setTimeout(r,20))).then(()=>{
  const b=bildirimler().find(x=>x.tur==='takipIstegi');
  t('İstek bildirimi üretildi', !!b);
  t('Hedefe gitti', b && b.hedef==='gizlihesap');

  console.log('\n▸ Okunmamış sayımı');
  kaplar.notifications={
    n1:{hedef:'ben',kimden:'a',tur:'takip',okundu:false,tarih:{seconds:300}},
    n2:{hedef:'ben',kimden:'b',tur:'begeni',okundu:false,tarih:{seconds:200}},
    n3:{hedef:'ben',kimden:'c',tur:'yorum',okundu:true,tarih:{seconds:100}},
    n4:{hedef:'baskasi',kimden:'d',tur:'takip',okundu:false,tarih:{seconds:400}}
  };
  return okunmamisSay();
}).then(n=>{
  t('Okunmamış sayısı doğru', n===2, n);
  return bildirimleriGetir();
}).then(l=>{
  t('Sadece bana gelenler', l.length===3, l.length);
  t('Yeniden eskiye sıralı', l[0].tarih.seconds===300);

  console.log('\n▸ Engelli bildirimleri gizleniyor');
  _engelOnbellek.engelledigim['a']=true;
  return bildirimleriGetir();
}).then(l=>{
  t('Engelli gönderenin bildirimi yok', !l.some(b=>b.kimden==='a'), l.length+' bildirim');
  _engelOnbellek.engelledigim={};

  console.log('\n▸ Okundu işaretleme');
  return bildirimleriGetir().then(l=>{ _bildirimler=l; return tumunuOkunduIsaretle(); });
}).then(()=>{
  const okunmamis=Object.values(kaplar.notifications).filter(b=>b.hedef==='ben'&&!b.okundu);
  t('Tümü okundu işaretlendi', okunmamis.length===0, okunmamis.length+' kaldı');

  console.log('\n▸ Rozet');
  kaplar.notifications={n1:{hedef:'ben',kimden:'a',tur:'takip',okundu:false,tarih:{seconds:1}}};
  bildirimRozetiGuncelle();
  return new Promise(r=>setTimeout(r,30));
}).then(()=>{
  t('Rozet gösteriliyor', reg['bnav-bildirim-rozet'].style.display==='flex');
  t('Sayı yazıldı', reg['bnav-bildirim-rozet'].textContent==='1');
  kaplar.notifications={};
  bildirimRozetiGuncelle();
  return new Promise(r=>setTimeout(r,30));
}).then(()=>{
  t('Boşken rozet gizli', reg['bnav-bildirim-rozet'].style.display==='none');

  console.log('\n▸ Oturum temizliği');
  _bildirimler=[{id:'x'}]; _okunmamisSayi=5;
  bildirimOnbellegiTemizle();
  t('Önbellek temizlendi', _bildirimler.length===0 && _okunmamisSayi===0);

  console.log('\n'+'─'.repeat(48));
  console.log(`📊 BİLDİRİM: ${pass}/${pass+fail} geçti`);
  if(fail===0) console.log('🎉 Bildirimler çalışıyor!'); else process.exitCode=1;
});
