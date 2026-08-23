let indirilen=null, toastlar=[], confirmCb=null, confirmMsg='';
const depo={};
global.localStorage={
  get length(){return Object.keys(depo).length}, key(i){return Object.keys(depo)[i]},
  getItem(k){return depo[k]??null}, setItem(k,v){depo[k]=String(v)}, removeItem(k){delete depo[k]}
};
global.Blob=function(parts){ this._t=parts.join(''); this.size=this._t.length; };
global.URL={createObjectURL:(b)=>{indirilen=b._t; return 'blob:x';}, revokeObjectURL(){}};
let fileInput=null;
global.document={
  createElement:(t)=>{
    const el={style:{},click(){ if(t==='a'){} else if(t==='input'){ fileInput=el; } },
      classList:{add(){},remove(){}},appendChild(){},setAttribute(){}};
    return el;
  },
  getElementById:()=>null, querySelectorAll:()=>[], querySelector:()=>null,
  body:{appendChild(){},style:{}}, documentElement:{setAttribute(){},style:{setProperty(){}}},
  addEventListener(){}
};
global.location={protocol:'https:',origin:'',pathname:'/',reload(){}};
global.window={location:global.location,addEventListener(){},scrollTo(){}};
global.navigator={vibrate(){}}; global.fetch=()=>Promise.reject(new Error('x')); global.firebase=undefined;
global.FileReader=function(){ this.readAsText=(f)=>{ setTimeout(()=>this.onload({target:{result:f._icerik}}),0); }; };

eval(require('fs').readFileSync(__dirname+'/_combined.tmp.js','utf8'));
showToast=(m)=>toastlar.push(m);
showConfirm=(baslik,mesaj,cb)=>{ confirmMsg=mesaj; confirmCb=cb; };
saveToFirebase=()=>{};

let pass=0,fail=0;
const t=(l,c,d)=>{ if(c){pass++;console.log('  ✅ '+l);} else {fail++;console.log('  ❌ '+l+(d?' → '+d:''));} };

console.log('\n╔══ YEDEKLEME / GERİ YÜKLEME TESTİ ══╗');

// Gerçekçi kullanıcı verisi
depo['rf_data']='{"U":{"weight":80}}';
depo['rf_entries']='[{"date":"01.01.2026"}]';
depo['rf_workout_logs']='[{"id":"log_1","kcal":420}]';
depo['rf_badges']='["first_workout","streak_7"]';
depo['rf_custom_workouts']='[{"id":"custom_1"}]';
depo['rf_branches']='["fitness","swimming"]';
depo['rf_supplements_used']='["kreatin"]';
depo['rf_theme']='violet';
depo['rf_unit']='kg';

console.log('\n▸ Dışa aktarma');
exportData();
const yedek=JSON.parse(indirilen);
t('Yedek oluşturuldu', !!indirilen);
t('Format imzası var', yedek._format==='ravenfit-backup');
t('Antrenman geçmişi yedekte', 'rf_workout_logs' in yedek);
t('Rozetler yedekte', 'rf_badges' in yedek);
t('Özel programlar yedekte', 'rf_custom_workouts' in yedek);
t('Branşlar yedekte', 'rf_branches' in yedek);
t('Supplementler yedekte', 'rf_supplements_used' in yedek);
t('Tema yedekte', 'rf_theme' in yedek);
const sayi=Object.keys(yedek).filter(k=>k.startsWith('rf_')).length;
t('9 veri türü yedeklendi', sayi===9, sayi+' bulundu');

console.log('\n▸ Geri yükleme — geçerli dosya');
Object.keys(depo).forEach(k=>delete depo[k]);  // her şeyi sil
importData();
fileInput.onchange({target:{files:[{size:1000,_icerik:indirilen}]}});
setTimeout(()=>{
  t('Onay istendi', confirmCb!==null);
  t('Onay mesajı bilgilendirici', confirmMsg.indexOf('veri türü')>-1);
  confirmCb();  // kullanıcı onayladı
  t('Antrenman geçmişi geri geldi', depo['rf_workout_logs']==='[{"id":"log_1","kcal":420}]');
  t('Rozetler geri geldi', depo['rf_badges']==='["first_workout","streak_7"]');
  t('Tema geri geldi', depo['rf_theme']==='violet');
  t('9 anahtar geri yüklendi', Object.keys(depo).length===9, Object.keys(depo).length+' adet');

  console.log('\n▸ Geri yükleme — bozuk dosyalar');
  toastlar=[]; confirmCb=null;
  importData(); fileInput.onchange({target:{files:[{size:100,_icerik:'{bozuk json'}]}});
  setTimeout(()=>{
    t('Geçersiz JSON reddedildi', (toastlar[0]||'').indexOf('Geçersiz')>-1, toastlar[0]);
    t('Onay istenmedi', confirmCb===null);

    toastlar=[];
    importData(); fileInput.onchange({target:{files:[{size:100,_icerik:'{"baska":"veri"}'}]}});
    setTimeout(()=>{
      t('İlgisiz JSON reddedildi', (toastlar[0]||'').indexOf('bulunamadı')>-1, toastlar[0]);

      toastlar=[];
      importData(); fileInput.onchange({target:{files:[{size:100,_icerik:'{"rf_data":{"obje":1}}'}]}});
      setTimeout(()=>{
        t('Yanlış tipli veri reddedildi', (toastlar[0]||'').indexOf('bozuk')>-1, toastlar[0]);

        toastlar=[];
        importData(); fileInput.onchange({target:{files:[{size:30*1024*1024,_icerik:'{}'}]}});
        setTimeout(()=>{
          t('Çok büyük dosya reddedildi', (toastlar[0]||'').indexOf('büyük')>-1, toastlar[0]);
          console.log('\n'+'─'.repeat(50));
          console.log(`📊 YEDEKLEME TESTİ: ${pass}/${pass+fail} geçti`);
          if(fail===0) console.log('🎉 Yedekleme güvenli ve eksiksiz!'); else process.exitCode=1;
        },10);
      },10);
    },10);
  },10);
},10);
