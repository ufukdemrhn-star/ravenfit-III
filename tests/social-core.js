const profiller={}, takipler={};
const reg={};
['pr-nick','pr-name','pr-bio','pr-c-post','pr-c-followers','pr-c-following',
 'pr-actions','pr-vitrin','pr-av-edit','avatar-img','avatar-initials',
 'dsc-body','dsc-baslik','dsc-input','fl-body','fl-baslik'].forEach(id=>
  reg[id]={id,value:'',textContent:'',innerHTML:'',style:{},
    classList:{add(){},remove(){},contains:()=>false,toggle(){}},disabled:false});

global.document={
  getElementById:(id)=>reg[id]||null,
  querySelector:(s)=>s==='.pr-top-actions'?{innerHTML:''}:null,
  querySelectorAll:()=>[],
  createElement:()=>({style:{},classList:{add(){},remove(){}}}),
  body:{style:{},appendChild(){},classList:{add(){},remove(){},toggle(){}}},
  documentElement:{setAttribute(){},getAttribute:()=>'gece',style:{setProperty(){},colorScheme:''}},
  addEventListener(){}};
global.getComputedStyle=()=>({getPropertyValue:()=>'#0F1113'});
global.location={protocol:'https:',origin:'',pathname:'/',reload(){}};
global.window={location:global.location,addEventListener(){},scrollTo(){}};
const depo={};
global.localStorage={get length(){return Object.keys(depo).length},key(i){return Object.keys(depo)[i]},
  getItem:(k)=>depo[k]??null,setItem:(k,v)=>{depo[k]=String(v)},removeItem:(k)=>{delete depo[k]}};
global.navigator={vibrate(){}}; global.fetch=()=>Promise.reject(new Error('x'));

function kol(ad){
  const kap = ad==='profiles'?profiller:takipler;
  const api={
    doc:(id)=>({
      get:()=>Promise.resolve({exists:id in kap,data:()=>kap[id],id}),
      set:(d,o)=>{
        const mevcut = kap[id]||{};
        const yeni = {};
        for(const k in d){
          yeni[k] = (d[k] && d[k].__inc!==undefined)
            ? (mevcut[k]||0)+d[k].__inc : d[k];
        }
        kap[id]= o&&o.merge ? Object.assign({},mevcut,yeni) : yeni;
        return Promise.resolve();
      },
      delete:()=>{delete kap[id];return Promise.resolve();}
    }),
    _f:[],
    where(f,op,v){ api._f.push([f,op,v]); return api; },
    orderBy(){ return api; }, limit(){ return api; },
    get(){
      let ler=Object.keys(kap).map(id=>({id,data:()=>kap[id]}));
      api._f.forEach(([f,op,v])=>{
        ler = ler.filter(d=>{
          const val=d.data()[f];
          if(op==='==') return val===v;
          if(op==='array-contains') return Array.isArray(val)&&val.includes(v);
          return true;
        });
      });
      api._f=[];
      return Promise.resolve({empty:!ler.length,docs:ler,forEach:(fn)=>ler.forEach(fn)});
    }
  };
  return api;
}
global.firebase={firestore:Object.assign(()=>({collection:kol}),
  {FieldValue:{serverTimestamp:()=>'TS',increment:(n)=>({__inc:n})}})};

eval(require('fs').readFileSync(__dirname+'/_combined.tmp.js','utf8'));
_fbDb={collection:kol};
showToast=()=>{}; switchMain=()=>{}; saveData=()=>{}; saveToFirebase=()=>{};
closeDiscover=()=>{}; setAvatarInitials=()=>{};

let pass=0,fail=0;
const t=(l,c,d)=>{ if(c){pass++;console.log('  ✅ '+l);} else {fail++;console.log('  ❌ '+l+(d?' → '+d:''));} };

console.log('\n╔══ SOSYAL ÇEKİRDEK TESTİ ══╗');

console.log('\n▸ Profil yayınlama — gizlilik');
_fbUser={uid:'u1',email:'ttt1@ravenfit.app'};
_isGuest=false;
depo['nickname']='ttt1';
depo['rf_profile']=JSON.stringify({nickname:'ttt1',isim:'Test Bir',bio:'Sporcu'});
depo['rf_share_stats']=JSON.stringify({bf:true,ffmi:true});  // sadece 2 alan açık
U={gender:'male',height:175,weight:80,neck:38,waist:85,age:30,arm:38};
R={};A={st:'bb',gl:'cut'};selST='bb';selGL='cut';
calcAll();
_profilYayinla();

new Promise(r=>setTimeout(r,10)).then(()=>{
  const p=profiller['u1'];
  t('Profil yayınlandı', !!p);
  t('Kullanıcı adı yazıldı', p.nickname==='ttt1');
  t('Önek dizisi oluştu', Array.isArray(p.onekler)&&p.onekler.includes('tt'));
  t('SADECE açık istatistikler', Object.keys(p.istatistik).length===2,
    Object.keys(p.istatistik).join(','));
  t('Yağ oranı paylaşıldı', p.istatistik.bf!==undefined);
  t('🔒 Kilo PAYLAŞILMADI', p.istatistik.weight===undefined);
  t('🔒 Bel PAYLAŞILMADI', p.istatistik.waist===undefined);
  t('🔒 Yaş PAYLAŞILMADI', p.istatistik.age===undefined);

  console.log('\n▸ Arama');
  profiller['u2']={nickname:'ttt2',isim:'Test İki',onekler:['t','tt','ttt','ttt2'],istatistik:{},vitrin:[]};
  profiller['u3']={nickname:'raven',isim:'Raven',onekler:['r','ra','rav','rave','raven'],istatistik:{},vitrin:[]};
  return profilAra('ttt');
}).then(r=>{
  t('Önek araması çalışıyor', r.length===1, r.length+' sonuç');
  t('Kendimi listelemiyor', !r.some(p=>p.uid==='u1'));
  t('Doğru kullanıcı', r[0]&&r[0].nickname==='ttt2');
  return profilAra('r');
}).then(r=>{
  t('Tek harf araması', r.some(p=>p.nickname==='raven'));

  console.log('\n▸ Takip');
  _goruntulenenUid='u2';
  return takipDegistir('u2');
}).then(ediyor=>{
  t('Takip edildi', ediyor===true);
  t('follows belgesi oluştu', 'u1_u2' in takipler);
  return takipciSay('u2');
}).then(n=>{
  t('Takipçi SAYIMI = 1', n===1, n);
  return takipSay('u1');
}).then(n=>{
  t('Takip SAYIMI = 1', n===1, n);
  return takipEdiyorMuyum('u2');
}).then(e=>{
  t('Durum doğru okunuyor', e===true);
  return takipDegistir('u2');
}).then(ediyor=>{
  t('Takip bırakıldı', ediyor===false);
  t('follows belgesi silindi', !('u1_u2' in takipler));
  return takipciSay('u2');
}).then(n=>{
  t('Takipçi SAYIMI = 0', n===0, n);

  console.log('\n▸ Kendini takip koruması');
  return takipDegistir('u1').then(()=>{t('Kendini takip engellendi',false);})
    .catch(e=>{t('Kendini takip engellendi', e.message.includes('Kendini'));});
}).then(()=>{
  console.log('\n▸ Başkasının profilini okuma');
  return profilGetir('u2');
}).then(p=>{
  t('Profil okundu', p.nickname==='ttt2');
  t('uid eklendi', p.uid==='u2');
  console.log('\n▸ Önbellek temizliği (oturum sızıntısı)');
  _takipOnbellek['u2']=true;
  _profilOnbellek['u2']={nickname:'ttt2'};
  sosyalOnbellegiTemizle();
  t('Takip önbelleği temizlendi', Object.keys(_takipOnbellek).length===0);
  t('Profil önbelleği temizlendi', Object.keys(_profilOnbellek).length===0);

  console.log('\n▸ Branş ikonu (dizi araması)');
  t('BRANCH_DEFS dizi', Array.isArray(BRANCH_DEFS));
  const fit = BRANCH_DEFS.find(x=>x.id==='fitness');
  t('fitness bulunuyor', !!fit && fit.icon==='🏋️', fit?fit.icon:'yok');
  t('BRANCH_DEFS["fitness"] undefined (eski hata)', BRANCH_DEFS['fitness']===undefined);

  console.log('\n▸ Avatar zinciri');
  const fs=require('fs'), yol=__dirname+'/../js/';
  const av=fs.readFileSync(yol+'profile/avatar.js','utf8');
  const pf=fs.readFileSync(yol+'social/profiles.js','utf8');
  const sy=fs.readFileSync(yol+'social/profile-sync.js','utf8');
  const up=fs.readFileSync(yol+'social/user-profile.js','utf8');
  t('Yükleme sıkıştırıyor', av.includes("gorselSikistir(file, 'avatar')"));
  t('setAvatar YEREL KAYDEDIYOR', av.includes("_lsSet('avatar', b64OrNull)"));
  t('profilNesnesi avatarı okuyor', pf.includes("_lsGet('avatar')"));
  t('Yayında boyut koruması', sy.includes('400 * 1024'));
  t('Başkasının profili avatar gösteriyor', up.includes('p.avatar'));
  t('Eski avatar onarımı var', av.includes('function avatarOnar'));

  console.log('\n'+'─'.repeat(48));
  console.log(`📊 SOSYAL ÇEKİRDEK: ${pass}/${pass+fail} geçti`);
  if(fail===0) console.log('🎉 Sosyal katman çalışıyor!'); else process.exitCode=1;
});
