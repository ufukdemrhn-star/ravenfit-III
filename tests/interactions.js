const kaplar={likes:{},posts:{},profiles:{},comments:{}};
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

let ac=0;
function kol(ad, ust){
  const anahtar = ust ? ad+'@'+ust : ad;
  kaplar[anahtar]=kaplar[anahtar]||{};
  const kap=kaplar[anahtar];
  const api={
    doc:(id)=>{const gid=id||('d'+(++ac));return{
      id:gid,
      get:()=>Promise.resolve({exists:gid in kap,data:()=>kap[gid],id:gid}),
      set:(d,o)=>{kap[gid]=o&&o.merge?Object.assign({},kap[gid],d):d;return Promise.resolve();},
      delete:()=>{delete kap[gid];return Promise.resolve();},
      collection:(alt)=>kol(alt,gid)
    };},
    add:(d)=>{const gid='c'+(++ac);kap[gid]=d;return Promise.resolve({id:gid});},
    _f:[], where(f,op,v){api._f.push([f,op,v]);return api;}, limit(){return api;}, orderBy(){return api;},
    count(){return{get:()=>{
      let l=Object.keys(kap).map(id=>({id,data:()=>kap[id]}));
      api._f.forEach(([f,op,v])=>{l=l.filter(d=>d.data()[f]===v)});
      api._f=[];return Promise.resolve({data:()=>({count:l.length})});
    }};},
    get(){
      /* Gerçek Firestore'da QueryDocumentSnapshot.ref vardır —
         kod d.ref.delete() kullanıyor, sahte de sağlamalı */
      let l=Object.keys(kap).map(id=>({
        id, data:()=>kap[id],
        ref:{delete:()=>{delete kap[id];return Promise.resolve();}}
      }));
      api._f.forEach(([f,op,v])=>{l=l.filter(d=>d.data()[f]===v)});
      api._f=[];
      return Promise.resolve({empty:!l.length,docs:l,size:l.length,forEach:(fn)=>l.forEach(fn)});
    }
  };
  return api;
}
global.firebase={firestore:Object.assign(()=>({collection:kol}),
  {FieldValue:{serverTimestamp:()=>({seconds:Math.floor(Date.now()/1000)})}})};

eval(require('fs').readFileSync(__dirname+'/_combined.tmp.js','utf8'));
_fbDb={collection:kol}; _fbUser={uid:'u1'};
showToast=()=>{}; showConfirm=(a,b,cb)=>cb&&cb();

let pass=0,fail=0;
const t=(l,c,d)=>{ if(c){pass++;console.log('  ✅ '+l);} else {fail++;console.log('  ❌ '+l+(d?' → '+d:''));} };

console.log('\n╔══ BEĞENİ VE YORUM ══╗');
const PID='post1';

console.log('\n▸ Beğeni');
begendimMi(PID).then(b=>{
  t('Başlangıçta beğenilmemiş', b===false);
  return begeniDegistir(PID);
}).then(b=>{
  t('Beğenildi', b===true);
  t('likes belgesi oluştu', (PID+'_u1') in kaplar.likes);
  return begeniSay(PID);
}).then(n=>{
  t('Sayım = 1', n===1, n);
  return begendimMi(PID);
}).then(b=>{
  t('Durum önbellekten doğru', b===true);
  return begeniDegistir(PID);
}).then(b=>{
  t('Beğeni geri alındı', b===false);
  t('likes belgesi silindi', !((PID+'_u1') in kaplar.likes));
  return begeniSay(PID);
}).then(n=>{
  t('Sayım = 0', n===0, n);

  console.log('\n▸ Çift beğeni koruması');
  _begeniOnbellek={};
  kaplar.likes[PID+'_u1']={postId:PID,uid:'u1'};
  return begeniDegistir(PID);
}).then(b=>{
  t('Var olan beğeni tekrar eklenmiyor, kaldırılıyor', b===false);

  console.log('\n▸ Yorum');
  return yorumEkle(PID,'İlk yorum');
}).then(id=>{
  t('Yorum eklendi', !!id);
  return yorumEkle(PID,'İkinci yorum');
}).then(()=>yorumlariGetir(PID))
.then(l=>{
  t('Yorumlar okunuyor', l.length===2, l.length);
  t('Eskiden yeniye sıralı', l[0].metin==='İlk yorum');
  return yorumSay(PID);
}).then(n=>{
  t('Yorum sayımı = 2', n===2, n);

  console.log('\n▸ Yorum doğrulama');
  return yorumEkle(PID,'   ').then(()=>{t('Boş yorum engellendi',false);})
    .catch(e=>{t('Boş yorum engellendi', e.message.includes('boş'));});
}).then(()=>{
  return yorumEkle(PID,'x'.repeat(401)).then(()=>{t('Uzun yorum engellendi',false);})
    .catch(e=>{t('Uzun yorum engellendi', e.message.includes('400'));});
}).then(()=>{

  console.log('\n▸ Yanıtlar');
  return yorumlariGetir(PID);
}).then(l=>{
  const ustId=l[0].id;
  return yorumEkle(PID,'Bu bir yanıt',ustId).then(()=>ustId);
}).then(ustId=>{
  return yorumlariGetir(PID).then(l=>{
    const yanit=l.find(y=>y.ustYorum===ustId);
    t('Yanıt eklendi', !!yanit, 'ustYorum yok');
    t('ustYorum doğru', yanit && yanit.ustYorum===ustId);
    const ustler=l.filter(y=>!y.ustYorum);
    t('Üst yorumlar ayrılıyor', ustler.length>=1, ustler.length);
    return ustId;
  });
}).then(ustId=>{
  console.log('\n▸ Yorum beğenisi');
  return yorumBegendimMi(ustId).then(b=>{
    t('Başlangıçta beğenilmemiş', b===false);
    return yorumBegeniDegistir(ustId, PID);
  }).then(b=>{
    t('Yorum beğenildi', b===true);
    return yorumBegenileriGetir(PID);
  }).then(sayim=>{
    t('Toplu beğeni sayımı', sayim[ustId]===1, JSON.stringify(sayim));
    return yorumBegeniDegistir(ustId, PID);
  }).then(b=>{
    t('Beğeni geri alındı', b===false);
    return ustId;
  });
}).then(ustId=>{
  console.log('\n▸ Üst yorum silinince yanıtlar da silinir');
  return yorumSil(PID, ustId).then(()=>yorumlariGetir(PID));
}).then(l=>{
  t('Yetim yanıt kalmadı', !l.some(y=>y.ustYorum), l.filter(y=>y.ustYorum).length+' yetim');

  console.log('\n▸ Oturum temizliği');
  _begeniOnbellek={p1:true}; _yorumBegeniOnbellek={y1:true};
  etkilesimOnbellegiTemizle();
  t('Beğeni önbelleği temizlendi', Object.keys(_begeniOnbellek).length===0);
  t('Yorum beğeni önbelleği temizlendi', Object.keys(_yorumBegeniOnbellek).length===0);

  console.log('\n'+'─'.repeat(48));
  console.log(`📊 ETKİLEŞİM: ${pass}/${pass+fail} geçti`);
  if(fail===0) console.log('🎉 Beğeni ve yorum çalışıyor!'); else process.exitCode=1;
});
