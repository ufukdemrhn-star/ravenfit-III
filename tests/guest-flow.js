/* Misafir akışının gerçek DOM davranışını simüle et */
class El {
  constructor(id, cls=''){
    this.id=id; this._cls=new Set(cls.split(' ').filter(Boolean));
    this._kids=[]; this._parent=null;
    this.textContent=''; this.innerHTML='';
    this.style={_p:{},setProperty(k,v){this._p[k]=v},removeProperty(k){delete this._p[k]},
      get display(){return this._p.display||''}, set display(v){this._p.display=v}};
    this.classList={add:(c)=>this._cls.add(c), remove:(c)=>this._cls.delete(c),
      contains:(c)=>this._cls.has(c), toggle:(c,f)=>{f?this._cls.add(c):this._cls.delete(c)}};
  }
  get gorunur(){ return this._cls.has('active') || this.style._p.display==='flex'; }
  querySelectorAll(){return[]} querySelector(){return null}
  appendChild(k){this._kids.push(k);k._parent=this} remove(){}
  addEventListener(){} scrollIntoView(){} setAttribute(){} getAttribute(){return null}
}

const reg = new Map();
['auth-screen','app-main','splash','wizard','results','bottom-nav','header',
 'splash-guest-actions','splash-home-btn','auth-tab-login','auth-tab-register',
 'auth-form-login','auth-form-register','user-email-display','guest-mode-note',
 'avatar-initials','avatar-img','prog-lbl','btn-back','btn-next',
 'bf-badge','ffmi-badge','ffmi-info','bmi-badge','bmi-info','bt-res','bp-res',
 'ffmi-v','bmi-v','ffmi-scale','ffmi-mrk','ffmi-you','auth-err','auth-err-r',
 'auth-nick','auth-pass','auth-nick-r','auth-pass-r','auth-pass-r2'].forEach(id=>reg.set(id,new El(id)));
for(let i=0;i<7;i++){ const e=new El('s'+i); e._cls.add('step'); reg.set('s'+i,e); reg.set('ps'+i,new El('ps'+i)); }
['vucudum','beslenme','antrenman','profil'].forEach(k=>{
  reg.set('ms-'+k,new El('ms-'+k)); reg.set('bnav-'+k,new El('bnav-'+k));
});
/* renderAll içindeki elemanlar — eksik olanlar null döner, guard'lı kod atlar */
new Proxy({},{});
reg.get('splash')._cls.add('screen'); reg.get('splash')._cls.add('active');
reg.get('wizard')._cls.add('screen');
reg.get('results')._cls.add('screen');

const bodyCls=new Set();
global.document={
  getElementById:(id)=>reg.get(id)||null,
  querySelectorAll:(sel)=>{
    if(sel==='.screen') return [reg.get('splash'),reg.get('wizard'),reg.get('results')];
    if(sel==='#results.active') return reg.get('results')._cls.has('active')?[reg.get('results')]:[];
    if(sel==='#splash.active')  return reg.get('splash')._cls.has('active')?[reg.get('splash')]:[];
    return [];
  },
  querySelector:(sel)=>{
    if(sel==='#results.active') return reg.get('results')._cls.has('active')?reg.get('results'):null;
    if(sel==='#splash.active')  return reg.get('splash')._cls.has('active')?reg.get('splash'):null;
    return null;
  },
  createElement:(t)=>new El('_'+t),
  body:{style:{},appendChild(){},classList:{add:c=>bodyCls.add(c),remove:c=>bodyCls.delete(c),
    toggle:(c,f)=>{f?bodyCls.add(c):bodyCls.delete(c)},contains:c=>bodyCls.has(c)}},
  documentElement:{setAttribute(){},style:{setProperty(){}}},
  addEventListener(){}
};
global.location={protocol:'https:',origin:'',pathname:'/',reload(){}};
global.window={location:global.location,addEventListener(){},scrollTo(){}};
const depo={};
global.localStorage={get length(){return Object.keys(depo).length},key(i){return Object.keys(depo)[i]},
  getItem(k){return depo[k]??null},setItem(k,v){depo[k]=String(v)},removeItem(k){delete depo[k]}};
global.navigator={vibrate(){}}; global.fetch=()=>Promise.reject(new Error('x')); global.firebase=undefined;

eval(require('fs').readFileSync(__dirname+'/_combined.tmp.js','utf8'));
showToast=()=>{}; showConfirm=(a,b,cb)=>cb&&cb();
renderAll=()=>{};  /* render kapsam dışı — bu test ekran geçişini ölçüyor */

let pass=0,fail=0;
const t=(l,c,d)=>{ if(c){pass++;console.log('  ✅ '+l);} else {fail++;console.log('  ❌ '+l+(d?' → '+d:''));} };
const ekran=()=>['splash','wizard','results'].filter(k=>reg.get(k)._cls.has('active')).join(',')||'(hiçbiri)';

console.log('\n╔══ MİSAFİR AKIŞI TESTİ ══╗');

console.log('\n▸ 1. "Misafir olarak devam et"');
enterAsGuest();
t('_isGuest true', _isGuest===true);
t('Splash açıldı', ekran()==='splash', ekran());
t('Giriş/Kayıt butonları GÖRÜNÜR', reg.get('splash-guest-actions').style.display==='flex',
  reg.get('splash-guest-actions').style.display||'(boş)');
t('Banner YOK', !reg.has('guest-banner'));

console.log('\n▸ 2. "Analize Başla" → wizard');
startWizard();
t('Wizard açıldı', ekran()==='wizard', ekran());
t('Splash kapandı', !reg.get('splash')._cls.has('active'));
t('Giriş/Kayıt butonları GİZLİ', reg.get('splash-guest-actions').style.display==='none',
  reg.get('splash-guest-actions').style.display);
t('body.wizard-mode eklendi', bodyCls.has('wizard-mode'));

console.log('\n▸ 3. Wizard tamamlandı → sonuç');
U={gender:'male',height:175,weight:80,neck:38,waist:85,age:30};
R={};A={st:'bb',gl:'cut'};selST='bb';selGL='cut';
calcAll();
showResults();
t('Sonuç ekranı açıldı', ekran()==='results', ekran());
t('body.wizard-mode kaldırıldı', !bodyCls.has('wizard-mode'));

console.log('\n▸ 4. "Giriş Yap" ile geri dön');
backToAuth('login');
t('_isGuest false', _isGuest===false);
t('Auth ekranı açıldı', reg.get('auth-screen').style.display==='flex',
  reg.get('auth-screen').style.display||'(boş)');
t('app-main gizlendi', reg.get('app-main').style.display==='none',
  reg.get('app-main').style.display||'(boş)');

console.log('\n▸ 5. Tekrar misafir → veri korundu mu?');
enterAsGuest();
t('Veri korundu (analiz var)', ekran()==='results', ekran());
t('Giriş/Kayıt butonları gizli (splash değil)',
  reg.get('splash-guest-actions').style.display==='none');

console.log('\n'+'─'.repeat(50));
console.log(`📊 MİSAFİR AKIŞI: ${pass}/${pass+fail} geçti`);
if(fail===0) console.log('🎉 Akış sorunsuz!'); else process.exitCode=1;
