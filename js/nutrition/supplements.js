/* ══════════════════════════════════════════════════════════
   RavenFit — supplements.js
   Supplement veritabanı ve öneri motoru
   ══════════════════════════════════════════════════════════ */

/* ── SUPPLEMENT ÖNERİ SİSTEMİ ─────────────────────────── */
/* ══════════════════════════════════════════════════════
   💊 SUPPLEMENT SİSTEMİ v2
   ══════════════════════════════════════════════════════ */

var SUPPS={
  protein:{
    name:'Protein Tozu', emoji:'🥛', priority:0,
    dose:'20–40 g/öğün, toplam günlük protein hedefini tamamlayacak kadar',
    timing:'Antrenmandan 1-2 saat içinde veya öğünler arası. Tek başına bir öğün yerine geçmemeli.',
    purpose:'Günlük protein hedefini pratik şekilde karşılamak; özellikle kas onarımı/inşası için.',
    effect:'Whey hızlı sindirilir → kan aminoasit seviyesini hızlı yükseltir. Kas protein sentezini tetikler. Kazein yavaş sindirilir → uzun süreli aminoasit salınımı.',
    evidence:'high',
    sideEffects:'Yüksek dozda sindirim sorunu (şişkinlik, gaz) olabilir. Laktoz intoleransı olanlar için izolat veya bitkisel tercih edilmeli.',
    interactions:null,
    note:'⚠️ Protein tozu iyidir ancak diyetinin yetersiz olduğunun da bir işareti. Önce gerçek gıdalarla proteini karşılamaya çalış!',
    color:'var(--info)'
  },
  kreatin:{
    name:'Kreatin Monohidrat', emoji:'⚡', priority:0,
    dose:'3–5 g/gün (yükleme dönemi gerekmez)',
    timing:'Günün herhangi bir saatinde, tutarlı şekilde. Suda/sütte/protein içeceğinde çözüp iç.',
    purpose:'Kısa süreli, yüksek yoğunluklu performansı (1-30 sn patlamalar) artırmak ve kas hacmini desteklemek.',
    effect:'Kreatin fosfat depolarını artırır → ATP üretimini hızlandırır. Patlayıcı güç, sprint, ağırlık antrenmanı performansı artar. İntrasellüler suyu artırarak hücre hacmini büyütür.',
    evidence:'high',
    sideEffects:'İlk haftalarda 1-2 kg su tutulması (kas içi, yağ değil). Nadiren mide rahatsızlığı (yemekle alınmalı).',
    interactions:null,
    note:'💡 Bütçen kısıtlıysa yalnızca kreatin al — spor yaptığın her gün, geri kalanını sonraya bırak!',
    color:'var(--warn)'
  },
  omega3:{
    name:'Omega-3 (EPA+DHA)', emoji:'🐟', priority:0,
    dose:'1.000–3.000 mg EPA+DHA toplamı/gün',
    timing:'Yağ içeren bir öğünle birlikte (emilim artar). Sabah veya öğlen tercih edilir.',
    purpose:'Anti-enflamatuar etki, kardiyovasküler sağlık, beyin fonksiyonu ve toparlanma desteği.',
    effect:'EPA inflamasyon mediatörlerini (prostaglandin, lökotrien) azaltır. DHA beyin/sinir hücre zarlarının yapı taşı. Triglisrit ve kan basıncını düşürür.',
    evidence:'high',
    sideEffects:'Yüksek dozda balık nefes/geğirme, hafif mide bulantısı. Kan sulandırıcı etki nadiren (3g+/gün).',
    interactions:'Kan sulandırıcı ilaçlar (warfarin, aspirin) ile birlikte kullanılırken doktora danışılmalı.',
    note:'Doz EPA ve DHA toplamına göredir. Etiket "1000 mg balık yağı" yerine "EPA + DHA toplamı" göstermelidir.',
    color:'var(--success)'
  },
  vitD:{
    name:'D Vitamini (D3)', emoji:'☀️', priority:0,
    dose:'1.000–4.000 IU/gün (kan seviyesine göre ayarlanmalı)',
    timing:'Yağ içeren bir öğünle birlikte. Sabah veya öğlen.',
    purpose:'Kemik sağlığı, bağışıklık, kas fonksiyonu, hormon dengesi ve genel sağlık desteği.',
    effect:'İnce bağırsakta kalsiyum emilimini artırır. Kemik mineralizasyonu için kritik. Hücresel düzeyde 200+ gen ifadesini etkiler. Düşük seviye → testosteron, kas gücü ve bağışıklık düşüşü.',
    evidence:'high',
    sideEffects:'Aşırı doz (>10.000 IU/gün uzun süre) kalsiyum birikimi, böbrek taşı riski. Düşük doz güvenli.',
    interactions:'Tiazid diüretikler ile kalsiyum yükselebilir. Doktora danışılmalı.',
    note:'💡 Kan testi (25-OH D) yaptırarak seviyeni öğren — 30-50 ng/mL hedef. Eksiklikte daha yüksek doz gerekebilir.',
    color:'var(--warn)'
  },
  magnezyum:{
    name:'Magnezyum', emoji:'🌙', priority:0,
    dose:'200–400 mg/gün (elementer magnezyum)',
    timing:'Akşam yatmadan 30-60 dk önce (uyku için) veya yemekle.',
    purpose:'Kas-sinir fonksiyonu, uyku kalitesi, stres yönetimi ve kalp ritmi desteği.',
    effect:'300+ enzimde kofaktör. ATP üretimi, sinir iletimi, kas kasılması/gevşemesi için kritik. GABA reseptörlerini destekler → sakinleştirici etki.',
    evidence:'high',
    sideEffects:'Yüksek dozda (>500 mg) ishal yapabilir — özellikle magnezyum oksit. Glisinat veya sitrat formu daha tolere edilebilir.',
    interactions:'Antibiyotikler (kinolon, tetrasiklin) ile en az 2 saat ara verilmeli.',
    note:'💡 Form önemli: Glisinat (uyku/stres), Sitrat (kabızlık), Malat (enerji), L-Threonate (beyin) farklı amaçlar için.',
    color:'var(--success)'
  },
  kafein:{
    name:'Kafein', emoji:'☕', priority:0,
    dose:'3–6 mg/kg vücut ağırlığı (200–400 mg)',
    timing:'Antrenmandan 30-60 dk önce. Öğleden sonra alınması uykuyu bozabilir.',
    purpose:'Performans, odak, dayanıklılık ve algılanan eforu düşürmek için.',
    effect:'Adenosin reseptörlerini bloke eder → yorgunluk algısı azalır. Adrenalin salınımı artar. Yağ oksidasyonu hafif artar. Reaksiyon hızı, güç ve dayanıklılık iyileşir.',
    evidence:'high',
    sideEffects:'Çarpıntı, anksiyete, uyku bozukluğu, sindirim sorunu. Yüksek dozda titreme. Tolerans gelişir.',
    interactions:'Bazı ilaçlarla (efedrin, MAOI) etkileşim. Hipertansiyonda dikkat.',
    note:'Kafein hapı, kahve veya pre-workout içinden alınabilir. Öğleden sonra (15:00+) kullanımdan kaçın — uyku bozulur.',
    color:'var(--accent)'
  },
  betaalanin:{
    name:'Beta-Alanin', emoji:'🔋', priority:0,
    dose:'3.2–6.4 g/gün (2-4 doza bölünmüş)',
    timing:'Günün herhangi bir saatinde, antrenmandan bağımsız. 4-6 hafta yüklenme döneminden sonra etki belirir.',
    purpose:'Yüksek yoğunluklu çabalarda (60-240 sn aralığı) yorgunluğu geciktirmek.',
    effect:'Karnosin sentezinin sınırlayıcısıdır. Karnosin kas asitliğini tamponlar → laktik asit birikimini geciktirir. Özellikle CrossFit, dövüş, sprint için.',
    evidence:'mid',
    sideEffects:'Parestezi (deride karıncalanma/iğne batma) — zararsız, dozu bölmek azaltır. 1.6 g üstünde yaygın.',
    interactions:null,
    note:'Tek doz etki vermez — günlük tutarlı kullanımla 4 haftada karnosin depoları dolar.',
    color:'var(--purple)'
  },
  citrulline:{
    name:'L-Sitrülin Malat', emoji:'💨', priority:0,
    dose:'6–8 g (sitrülin malat) veya 3–5 g (saf sitrülin)',
    timing:'Antrenmandan 30-60 dk önce.',
    purpose:'Pompa (vasküler genişleme), endurance ve antrenman sonrası kas ağrısını azaltmak.',
    effect:'Vücutta arginine dönüşür → nitrik oksit (NO) üretimi artar → damar genişler → kan akışı artar. Amonyak temizliğine yardım → yorgunluk geç.',
    evidence:'mid',
    sideEffects:'Genelde iyi tolere edilir. Çok yüksek dozda hafif sindirim sorunu.',
    interactions:'Tansiyon ilaçları ile kombine kullanımda doktora danışılmalı (tansiyon düşürebilir).',
    note:'Çoğu pre-workout içeriğinde mevcuttur. Saf sitrülin > sitrülin malat dozaj açısından daha standart.',
    color:'var(--info)'
  },
  zma:{
    name:'ZMA (Çinko+Magnezyum+B6)', emoji:'🌙', priority:0,
    dose:'1 ölçek (üretici dozajına göre, genelde Zn 30mg + Mg 450mg + B6 10mg)',
    timing:'Yatmadan 30-60 dk önce, aç karnına. Süt/kalsiyumla almaktan kaçın (emilim düşer).',
    purpose:'Toparlanma, uyku kalitesi ve hormonal sağlık desteği (özellikle testosteron eksikliği olanlarda).',
    effect:'Çinko testosteron üretiminde kofaktör. Magnezyum uyku ve sinir sistemi için. B6 nörotransmitter üretimi.',
    evidence:'mid',
    sideEffects:'Çinko yüksek dozda bakır eksikliğine yol açabilir. Mide bulantısı (yemekle alınırsa azalır).',
    interactions:'Antibiyotik ve diüretiklerle etkileşim. Doktora danışılmalı.',
    note:'Eksikliği olmayanlarda testosteron artışı kanıtı zayıf. Çinko veya magnezyum ayrı ayrı da alınabilir.',
    color:'var(--purple)'
  },
  preworkout:{
    name:'Pre-Workout (kombine)', emoji:'🚀', priority:0,
    dose:'1 ölçek (üretici dozajına göre)',
    timing:'Antrenmandan 20-30 dk önce. Geç saatlerde kullanma — uyku bozulur.',
    purpose:'Enerji, odak, pompa ve performans için birden fazla aktif maddeyi birleştirir.',
    effect:'Genellikle kafein + beta-alanin + sitrülin + tiroin/L-DOPA bileşenleri içerir. Her birinin ayrı etkisi var.',
    evidence:'mid',
    sideEffects:'Aktif maddelere bağlı. Çarpıntı, anksiyete, parestezi. Her gün kullanmak tolerans yaratır.',
    interactions:'Kafein içerdiği için tansiyon/kalp ilaçları ile dikkat.',
    note:'İçeriğine dikkat et — etiket aydınlatıcı olmalı (proprietary blend sakıncalı). Her antrenmanda kullanma, tolerans gelişir.',
    color:'var(--accent)'
  },
  malto:{
    name:'Maltodekstrin', emoji:'⚗️', priority:0,
    dose:'40–80 g (antrenman içi/sonrası)',
    timing:'Antrenmandan 30 dk önce veya antrenman sırasında. Bulk döneminde fazladan kalori için.',
    purpose:'Hızlı sindirilen karbonhidrat — antrenman performansı ve kalori artışı.',
    effect:'Kan şekerini hızlı yükseltir → glikojen depolarını besler. Sürekli enerji sağlar. Antrenman sonrası insülin yanıtı protein sentezini destekler.',
    evidence:'mid',
    sideEffects:'Diyabetliler için uygun değil. Yüksek dozda sindirim sorunu, şişkinlik.',
    interactions:null,
    note:'Sadece bulk ve uzun süreli endurance için gerekli. Cut döneminde tercih edilmez.',
    color:'var(--info)'
  },
  melatonin:{
    name:'Melatonin', emoji:'😴', priority:0,
    dose:'0.5–3 mg (düşük dozdan başla)',
    timing:'Yatmadan 30-60 dk önce. Karanlık ortamda alınmalı.',
    purpose:'Uyku düzeni problemleri, jet lag ve sirkadiyen ritim bozukluklarında yardımcı.',
    effect:'Endojen melatonin hormonunu taklit eder → vücut "uyku zamanı" sinyali algılar. Sirkadiyen ritmi düzenler.',
    evidence:'mid',
    sideEffects:'Sabah uyku hali, baş ağrısı, canlı rüyalar. Yüksek dozda etki azalabilir (paradoks).',
    interactions:'Antikoagülanlar, antidepresanlar, immün bastırıcılarla etkileşim. Doktora danışılmalı.',
    note:'⚕️ Düşük doz (0.5 mg) genelde yeterli — yüksek doz daha etkili DEĞİL. Türkiye\'de reçeteli, diğer ülkelerde değişir.',
    color:'var(--purple)'
  },
  probiyotik:{
    name:'Probiyotik', emoji:'🦠', priority:0,
    dose:'10–50 milyar CFU/gün (ürüne göre)',
    timing:'Aç karnına veya yemekle (etiketteki talimata göre).',
    purpose:'Bağırsak florasını desteklemek, sindirim sağlığı ve bağışıklık.',
    effect:'Faydalı bakteri popülasyonunu artırır → patojenleri baskılar. Kısa zincirli yağ asitleri üretir → bağırsak duvarı sağlığı.',
    evidence:'mid',
    sideEffects:'İlk haftalarda hafif gaz/şişkinlik. Bağışıklığı baskılanmış kişilerde dikkat.',
    interactions:'Antibiyotik kullanırken 2 saat ara ile alınmalı.',
    note:'⚕️ Doktorunuza danışarak almanızı öneririz. Suş çeşitliliği önemli — tek tür yerine çoklu suş tercih edilebilir.',
    color:'var(--success)'
  },
  relax:{
    name:'Ashwagandha (Adaptogen)', emoji:'🌿', priority:0,
    dose:'300–600 mg KSM-66 standardize ekstrakt / gün',
    timing:'Sabah veya öğleden sonra. Yemekle alınabilir.',
    purpose:'Stres yönetimi, kortizol regülasyonu, uyku kalitesi ve anksiyete azaltma.',
    effect:'Adaptojenik bitki — kortizolü baskılayan etki. HPA aksisini düzenler. Uyku kalitesi ve stres tepkisini iyileştirebilir.',
    evidence:'mid',
    sideEffects:'Genelde iyi tolere edilir. Nadiren tiroid uyarısı, sindirim sorunu, uyku hali.',
    interactions:'Tiroid ilaçları, sedatifler ile etkileşim. Doktora danışılmalı.',
    note:'Standardize ekstrakt (KSM-66, Sensoril) tercih edilmeli — kalitesiz tozun etkisi düşük.',
    color:'var(--success)'
  },
  superfoods:{
    name:'Yeşil Karışım / Superfoods', emoji:'🌱', priority:0,
    dose:'1 ölçek (üretici dozajına göre)',
    timing:'Sabah veya öğleden sonra, suya/smoothie\'ye karıştırarak.',
    purpose:'Sebze tüketimi yetersiz olduğunda mikronutrient (vitamin/mineral) desteği.',
    effect:'Spirulina, chlorella, kuru sebze tozları → klorofil, antioksidan, mineral. Gerçek sebzelerin yerini TUTAMAZ ama destekleyebilir.',
    evidence:'low',
    sideEffects:'Yüksek dozda sindirim sorunu. Bazı sportifik tatlar.',
    interactions:'K vitamini içeriği yüksek (warfarin ile etkileşim).',
    note:'⚠️ Pazarlamada abartılır. Gerçek sebze/meyve ASLA yerine geçmez. Eksik diyetin yedek planı.',
    color:'var(--success)'
  },
  bcaa:{
    name:'BCAA / EAA', emoji:'🔗', priority:0,
    dose:'5–10 g BCAA veya EAA tercih edilirse aynı doz',
    timing:'Antrenman sırasında veya öncesinde.',
    purpose:'Yetersiz protein alımında kas korumayı amaçlamak.',
    effect:'Lösin protein sentezini tetikler. Ancak yeterli toplam protein (>1.6 g/kg) alan kişilerde EK fayda kanıtlanmadı. EAA daha geniş aminoasit profili sunar.',
    evidence:'low',
    sideEffects:'Genelde güvenli. Yüksek dozda hafif sindirim sorunu.',
    interactions:null,
    note:'⚠️ Yeterli protein alıyorsan BCAA gereksiz. Proteine yatırım yap.',
    color:'var(--text2)'
  }
};

/* 9 soru — daha kapsamlı test */

var SUPP_QS=[
  {
    key:'goal',
    title:'Birincil hedefin nedir?',
    opts:[
      {v:'bulk',l:'💪 Kas & Kütle Kazanımı'},
      {v:'cut',l:'🔥 Yağ Yakımı & Definasyon'},
      {v:'recomp',l:'⚖️ Rekompoziyon (Dengeli Form)'},
      {v:'health',l:'❤️ Genel Sağlık & Wellness'},
      {v:'perf',l:'🏆 Performans & Dayanıklılık'}
    ]
  },
  {
    key:'sport',
    title:'Antrenman türün nedir?',
    opts:[
      {v:'bb',l:'🏋️ Vücut Geliştirme / Powerlifting'},
      {v:'cardio',l:'🏃 Kardiyo / Koşu / Bisiklet'},
      {v:'hybrid',l:'⚡ Hibrit (Ağırlık + Kardiyo)'},
      {v:'sport',l:'⚽ Takım / Kombat Sporu'},
      {v:'none',l:'🚶 Aktif ama antrenman yok'}
    ]
  },
  {
    key:'freq',
    title:'Haftada kaç gün antrenman yapıyorsun?',
    opts:[
      {v:'low',l:'1–2 gün'},
      {v:'mid',l:'3–4 gün'},
      {v:'high',l:'5–6 gün'},
      {v:'elite',l:'Her gün / 2 antrenman/gün'}
    ]
  },
  {
    key:'diet',
    title:'Beslenme düzenin nasıl?',
    opts:[
      {v:'clean',l:'🥦 Temiz / Bol protein, az işlenmiş'},
      {v:'normal',l:'🍖 Normal / Karma beslenme'},
      {v:'messy',l:'🍕 Düzensiz / Hazır yemek ağırlıklı'},
      {v:'veje',l:'🥬 Vejetaryen'},
      {v:'vegan',l:'🌱 Vegan'}
    ]
  },
  {
    key:'protein_intake',
    title:'Günlük protein alımın nasıl?',
    opts:[
      {v:'low',l:'😬 Düşük — '+(R.minProt?'< '+Math.round(R.minProt*0.7):'< 100')+'g'},
      {v:'mid',l:'😐 Orta — '+(R.minProt?Math.round(R.minProt*0.7)+'-'+R.minProt:'100-150')+'g'},
      {v:'ok',l:'✅ Yeterli — '+(R.minProt?'>'+R.minProt:'> 150')+'g'},
      {v:'unknown',l:'🤷 Bilmiyorum / Takip etmiyorum'}
    ]
  },
  {
    key:'sleep',
    title:'Uyku kalitenin nasıl?',
    opts:[
      {v:'good',l:'😴 İyi — Düzenli 7-9 saat'},
      {v:'mid',l:'😐 Orta — Sık sık 5-7 saat'},
      {v:'bad',l:'😵 Kötü — Genellikle <5 saat veya bölünmüş'},
      {v:'shift',l:'🌙 Vardiyalı / Düzensiz uyku saatleri'}
    ]
  },
  {
    key:'stress',
    title:'Günlük stres seviyeni nasıl tanımlarsın?',
    opts:[
      {v:'low',l:'😌 Düşük — Genellikle rahat ve stressiz'},
      {v:'mid',l:'😐 Orta — Ara sıra yoğun dönemler'},
      {v:'high',l:'😤 Yüksek — Sürekli baskı altındayım'},
      {v:'burnout',l:'🔥 Çok yüksek — Tükenmişlik hissediyorum'}
    ]
  },
  {
    key:'sun',
    title:'Güneş maruziyetin nasıl?',
    opts:[
      {v:'good',l:'☀️ İyi — Düzenli dışarıda vakit geçiririm'},
      {v:'low',l:'🏢 Az — Çoğunlukla iç mekanda çalışıyorum'},
      {v:'none',l:'🌑 Çok az — Neredeyse hiç güneş görmüyorum'},
      {v:'covered',l:'🧣 Kapalı giyiniyorum / Kuzey iklim'}
    ]
  },
  {
    key:'budget',
    title:'Supplement için aylık bütçen nedir?',
    opts:[
      {v:'min',l:'💰 Minimal — Sadece 1 temel ürün'},
      {v:'low',l:'💰💰 Düşük — 2-3 ürün'},
      {v:'mid',l:'💰💰💰 Orta — 3-5 ürün'},
      {v:'high',l:'💎 Yüksek — Kapsamlı stack'}
    ]
  },
  {
    key:'current_usage',
    title:'Halihazırda supplement kullanıyor musun?',
    opts:[
      {v:'none',l:'🚫 Hiç kullanmıyorum'},
      {v:'basic',l:'💊 1-2 temel supplement'},
      {v:'moderate',l:'💊💊 3-5 supplement'},
      {v:'advanced',l:'🧪 Kapsamlı stack'}
    ]
  }
];

/* Son analiz sonuçlarını sakla — "Geçmiş Analiz" butonu için */

var _lastSuppResults=null;

function openSuppModal(){
  _suppStep=0;_suppAnswers={};_suppMaxStep=SUPP_QS.length-1;
  /* Uygulama verilerinden otomatik doldur */
  var gl=selGL||R.recGoal;
  /* Eski + yeni isimler */
  var glMap={yag:'cut', idame:'maintain', kutle:'bulk', cut:'cut', recomp:'recomp', maintain:'maintain', bulk:'bulk'};
  if(glMap[gl]) _suppAnswers.goal=glMap[gl];
  if(selST==='bb')_suppAnswers.sport='bb';
  else if(selST==='cardio')_suppAnswers.sport='cardio';
  else if(selST==='hybrid')_suppAnswers.sport='hybrid';
  /* Kayıtlı supplementlerden current_usage otomatik doldur */
  var usedCount=getUserSupplements().length;
  if(usedCount===0) _suppAnswers.current_usage='none';
  else if(usedCount<=2) _suppAnswers.current_usage='basic';
  else if(usedCount<=5) _suppAnswers.current_usage='moderate';
  else _suppAnswers.current_usage='advanced';
  /* Nav'ı her açılışta sıfırla */
  var nav=document.getElementById('supp-nav');
  if(nav)nav.style.display='flex';
  document.getElementById('supp-modal').classList.add('active');
  renderSuppStep();
}

function closeSuppModal(){document.getElementById('supp-modal').classList.remove('active');}

function openLastSuppResults(){
  if(!_lastSuppResults){showToast('Henüz analiz yapılmadı.','warn');return;}
  var nav=document.getElementById('supp-nav');
  if(nav)nav.style.display='none';
  document.getElementById('supp-progress').innerHTML='';
  document.getElementById('supp-body').innerHTML=_lastSuppResults;
  var body=document.getElementById('supp-body');
  if(body)body.scrollTop=0;
  document.getElementById('supp-modal').classList.add('active');
}

function renderSuppStep(){
  var q=SUPP_QS[_suppStep];
  var total=SUPP_QS.length;
  var progHtml='';
  for(var i=0;i<total;i++){progHtml+='<div class="supp-ps'+(i<_suppStep?' done':i===_suppStep?' act':'')+'"></div>';}
  document.getElementById('supp-progress').innerHTML=progHtml;
  var preSelected=_suppAnswers[q.key];
  var html='<div class="supp-q-title">'+(_suppStep+1)+'/'+total+' — '+q.title+'</div><div class="opts">';
  q.opts.forEach(function(o){
    var sel=preSelected===o.v?' sel':'';
    html+='<div class="oc compact'+sel+'" onclick="suppSelectOpt(\''+q.key+'\',\''+o.v+'\',this)"><div class="ot"><div class="on">'+o.l+'</div></div><div class="orad"></div></div>';
  });
  html+='</div>';
  document.getElementById('supp-body').innerHTML=html;
  document.getElementById('supp-back').style.display=_suppStep>0?'inline-flex':'none';
  document.getElementById('supp-next').textContent=_suppStep===_suppMaxStep?'Sonuçları Gör ✓':'Devam →';
}

function suppSelectOpt(key,val,el){
  _suppAnswers[key]=val;
  el.parentNode.querySelectorAll('.oc').forEach(function(e){e.classList.remove('sel');});
  el.classList.add('sel');
  /* Son soruysa otomatik ilerleme */
  if(_suppStep===_suppMaxStep){ setTimeout(renderSuppResults,300); }
}

function suppNext(){
  var q=SUPP_QS[_suppStep];
  if(!_suppAnswers[q.key]){showToast('Lütfen bir seçenek seç.','warn');return;}
  if(_suppStep<_suppMaxStep){_suppStep++;renderSuppStep();}
  else{renderSuppResults();}
}

function suppBack(){if(_suppStep>0){_suppStep--;renderSuppStep();}}

function calcSuppScores(a){
  /* Her supplement için başlangıç skoru: 0 */
  var ids=Object.keys(SUPPS);
  var scores={};var reasons={};
  ids.forEach(function(id){scores[id]=0;reasons[id]=[];});

  /* ── HEDEF ─────────────────────────────────────── */
  if(a.goal==='bulk'){
    scores.kreatin+=35;reasons.kreatin.push('Kas kazanımı — en kritik supplement');
    scores.protein+=25;reasons.protein.push('Hacim döneminde protein desteği');
    scores.malto+=20;reasons.malto.push('Kalori artışı için hızlı karbonhidrat');
    scores.vitD+=10;reasons.vitD.push('Hormon desteği');
  }
  if(a.goal==='cut'){
    scores.kreatin+=20;reasons.kreatin.push('Cut döneminde kas koruma');
    scores.protein+=30;reasons.protein.push('Yağ yakımında kas koruma kritik');
    scores.kafein+=25;reasons.kafein.push('Yağ yakımını ve metabolizmayı hızlandırır');
    scores.omega3+=15;reasons.omega3.push('Cut döneminde anti-enflamasyon');
    scores.vitD+=10;reasons.vitD.push('Metabolizma desteği');
  }
  if(a.goal==='recomp'){
    scores.kreatin+=25;reasons.kreatin.push('Rekomp döneminde güç ve kas desteği');
    scores.protein+=20;reasons.protein.push('Rekomp için yüksek protein şart');
    scores.omega3+=15;reasons.omega3.push('Genel sağlık ve toparlanma');
    scores.vitD+=15;reasons.vitD.push('Hormon ve metabolizma dengesi');
  }
  if(a.goal==='health'){
    scores.omega3+=30;reasons.omega3.push('Kalp ve beyin sağlığı temel ihtiyacı');
    scores.vitD+=30;reasons.vitD.push('Bağışıklık ve genel sağlık için kritik');
    scores.probiyotik+=25;reasons.probiyotik.push('Bağırsak sağlığı = genel sağlık');
    scores.superfoods+=20;reasons.superfoods.push('Mikro besin eksikliklerini tamamlar');
  }
  if(a.goal==='perf'){
    scores.kreatin+=30;reasons.kreatin.push('Performans ve patlayıcı güç');
    scores.kafein+=25;reasons.kafein.push('Performans ve dayanıklılık artışı');
    scores.malto+=15;reasons.malto.push('Antrenman sırasında enerji');
    scores.omega3+=15;reasons.omega3.push('Dayanıklılık sporlarında kritik');
  }

  /* ── SPOR TÜRÜ ─────────────────────────────────── */
  if(a.sport==='bb'){
    scores.kreatin+=25;reasons.kreatin.push('Ağırlık antrenmanı için #1 supplement');
    scores.protein+=15;reasons.protein.push('Hipertrofi için yüksek protein');
    scores.preworkout+=15;reasons.preworkout.push('Ağırlık antrenmanında performans');
    scores.zma+=10;reasons.zma.push('Yoğun antrenman sonrası toparlanma');
  }
  if(a.sport==='cardio'){
    scores.omega3+=15;reasons.omega3.push('Kardiyo atletlerde anti-enflamasyon');
    scores.malto+=10;reasons.malto.push('Uzun kardiyo seanslarında enerji');
    scores.vitD+=10;reasons.vitD.push('Dış mekanda spor yapanlarda bile eksik olabilir');
  }
  if(a.sport==='hybrid'){
    scores.kreatin+=20;reasons.kreatin.push('Hibrit antrenman performansı');
    scores.omega3+=10;reasons.omega3.push('Toparlanma desteği');
    scores.preworkout+=10;reasons.preworkout.push('Ağır antrenman günlerinde');
  }
  if(a.sport==='sport'){
    scores.kreatin+=20;reasons.kreatin.push('Patlayıcı güç ve sprint performansı');
    scores.kafein+=15;reasons.kafein.push('Odak ve reaksiyon hızı');
    scores.omega3+=15;reasons.omega3.push('Darbe sporlarında anti-enflamasyon');
  }
  if(a.sport==='none'){
    scores.vitD+=20;reasons.vitD.push('Hareketsiz yaşamda eksiklik riski');
    scores.superfoods+=15;reasons.superfoods.push('Hareketsiz yaşamda temel destek');
    scores.omega3+=15;reasons.omega3.push('Sedanter bireylerde genel sağlık');
  }

  /* ── ANTRENMAN SIKLIĞI ─────────────────────────── */
  if(a.freq==='high'||a.freq==='elite'){
    scores.kreatin+=15;reasons.kreatin.push('Yüksek antrenman sıklığı');
    scores.zma+=15;reasons.zma.push('Toparlanma kapasitesi kritik');
    scores.omega3+=10;reasons.omega3.push('Yoğun antrenman sonrası iltihap kontrolü');
  }
  if(a.freq==='elite'){
    scores.malto+=15;reasons.malto.push('Günde 2 antrenman — enerji ihtiyacı yüksek');
    scores.preworkout+=10;reasons.preworkout.push('Yoğun program için');
  }

  /* ── DİYET ─────────────────────────────────────── */
  if(a.diet==='vegan'){
    scores.protein+=35;reasons.protein.push('Vegan beslenmede protein eksikliği riski');
    scores.omega3+=30;reasons.omega3.push('Vegan beslenmede balık yağı eksikliği');
    scores.vitD+=20;reasons.vitD.push('Vegan beslenmede D vitamini eksikliği');
    scores.zma+=15;reasons.zma.push('Çinko bitkisel kaynaklardan iyi emilmez');
    scores.kreatin+=15;reasons.kreatin.push('Vegan beslenmede kreatin sentezi düşük');
  }
  if(a.diet==='veje'){
    scores.protein+=20;reasons.protein.push('Vejetaryen beslenmede protein desteği');
    scores.omega3+=20;reasons.omega3.push('Balık tüketimi yok veya az');
    scores.vitD+=15;reasons.vitD.push('Hayvansal D vitamini kaynağı sınırlı');
    scores.kreatin+=10;reasons.kreatin.push('Et tüketimi yoksa kreatin sentezi az');
  }
  if(a.diet==='messy'){
    scores.probiyotik+=25;reasons.probiyotik.push('Düzensiz beslenme bağırsak florasını bozar');
    scores.vitD+=15;reasons.vitD.push('Besin eksikliği riski');
    scores.omega3+=15;reasons.omega3.push('Düzensiz beslenmede yağ asidi eksikliği');
    scores.superfoods+=20;reasons.superfoods.push('Mikro besin eksikliklerini tamamlar');
  }
  if(a.diet==='clean'){
    /* Temiz besleniyorsa bazı supplementler daha az kritik */
    scores.protein-=10; /* Gıdadan alıyor */
  }

  /* ── PROTEİN ALIMI ─────────────────────────────── */
  if(a.protein_intake==='low'){
    scores.protein+=30;reasons.protein.push('Protein alımın yetersiz — acil destek');
  }
  if(a.protein_intake==='mid'){
    scores.protein+=15;reasons.protein.push('Protein alımın hedefe yakın ama destek iyi olur');
  }
  if(a.protein_intake==='ok'||a.protein_intake==='unknown'){
    /* Yeterli protein alıyorsa protein tozu daha az kritik */
  }

  /* ── UYKU ──────────────────────────────────────── */
  if(a.sleep==='bad'){
    scores.zma+=35;reasons.zma.push('Kötü uyku — magnezyum eksikliği olabilir');
    scores.melatonin+=30;reasons.melatonin.push('Uyku düzeni bozuk');
    scores.relax+=20;reasons.relax.push('Uyku kalitesini artırmak için');
    scores.omega3+=10;reasons.omega3.push('Uyku kalitesini destekler');
  }
  if(a.sleep==='mid'){
    scores.zma+=20;reasons.zma.push('Orta uyku — magnezyum desteği faydalı');
    scores.melatonin+=15;reasons.melatonin.push('Uyku kalitesini iyileştirebilir');
  }
  if(a.sleep==='shift'){
    scores.melatonin+=35;reasons.melatonin.push('Vardiyalı çalışmada uyku düzeni bozuk');
    scores.zma+=20;reasons.zma.push('Düzensiz uyku toparlanmayı etkiler');
    scores.relax+=15;reasons.relax.push('Vardiyalı çalışmada stres yönetimi');
  }

  /* ── STRES ─────────────────────────────────────── */
  if(a.stress==='high'||a.stress==='burnout'){
    scores.relax+=30;reasons.relax.push('Yüksek stres — adaptogen ve relax formülü');
    scores.omega3+=15;reasons.omega3.push('Kortizol düzenlemesinde destek');
    scores.vitD+=10;reasons.vitD.push('Stres D vitamini tüketimini artırır');
    scores.zma+=10;reasons.zma.push('Stres magnezyum tüketimini artırır');
  }
  if(a.stress==='burnout'){
    scores.melatonin+=15;reasons.melatonin.push('Tükenmişlikte uyku kritik');
    scores.superfoods+=15;reasons.superfoods.push('Antioksidan desteği');
  }

  /* ── GÜNEŞ MARUZIYETI ──────────────────────────── */
  if(a.sun==='low'){scores.vitD+=20;reasons.vitD.push('Az güneş maruziyeti — D vitamini eksikliği riski');}
  if(a.sun==='none'||a.sun==='covered'){
    scores.vitD+=35;reasons.vitD.push('Güneş yok — D vitamini eksikliği neredeyse kesin');
  }
  if(a.sun==='good'){scores.vitD-=5; /* Güneşten alıyor olabilir */}

  /* ── YAŞ FAKTÖRÜ ───────────────────────────────── */
  var age=U.age||25;
  if(age>=30){
    scores.omega3+=10;reasons.omega3.push('30+ yaşta anti-enflamasyon daha önemli');
    scores.vitD+=10;reasons.vitD.push('30+ yaşta D vitamini emilimi azalır');
  }
  if(age>=35){
    scores.probiyotik+=15;reasons.probiyotik.push('35+ yaşta sindirim sağlığı');
    scores.kreatin+=5;reasons.kreatin.push('35+ yaşta kas kaybı (sarkopeni) riski');
    scores.omega3+=5;reasons.omega3.push('35+ yaşta kardiyovasküler sağlık');
  }
  if(age>=45){
    scores.vitD+=15;reasons.vitD.push('45+ yaşta D vitamini emilimi çok azalır');
    scores.omega3+=10;reasons.omega3.push('45+ yaşta kalp sağlığı kritik');
  }

  /* ── CİNSİYET FAKTÖRÜ ──────────────────────────── */
  if(U.gender==='female'){
    scores.vitD+=10;reasons.vitD.push('Kadınlarda D vitamini eksikliği daha yaygın');
    scores.omega3+=5;reasons.omega3.push('Hormonal denge desteği');
    scores.zma+=5;reasons.zma.push('Magnezyum kadınlarda önemli');
  }

  /* ── VÜCUT PROFİLİ ─────────────────────────────── */
  if(R.bf){
    var bp=determineBodyProfile(R.bf,R.ffmi,R.bmi);
    if(bp.n.includes('Skinny')){
      scores.kreatin+=10;reasons.kreatin.push('Düşük kas kütlesi — kreatin destekler');
      scores.malto+=15;reasons.malto.push('Kalori artışı için');
    }
    if(bp.n.includes('Skinny-fat')){
      scores.kreatin+=15;reasons.kreatin.push('Skinny-fat profilinde kas inşası');
      scores.vitD+=10;reasons.vitD.push('Vücut kompozisyonu iyileştirme');
    }
    if(bp.n.includes('Obez')||bp.n.includes('Kilolu')){
      scores.omega3+=15;reasons.omega3.push('Yüksek yağ oranında anti-enflamasyon');
      scores.vitD+=15;reasons.vitD.push('Obezitede D vitamini emilimi bozulur');
      scores.probiyotik+=10;reasons.probiyotik.push('Metabolizma desteği');
    }
  }

  /* Negatife düşmesin */
  ids.forEach(function(id){if(scores[id]<0)scores[id]=0;});

  /* ══════════════════════════════════════════════════
     YENİ SUPPLEMENTLER — KANIT BAZLI SKORLAMA
     magnezyum / betaalanin / citrulline / bcaa
     ══════════════════════════════════════════════════ */

  /* ── MAGNEZYUM (kanıt: yüksek) ───────────────────────
     Uyku kalitesi, kas-sinir fonksiyonu, stres yönetimi.
     Terle kaybedilir → yoğun antrenman yapanlarda eksiklik yaygın. */
  if(a.sleep==='bad'){
    scores.magnezyum+=35;reasons.magnezyum.push('Kötü uyku — magnezyum GABA reseptörlerini destekler');
  } else if(a.sleep==='mid'){
    scores.magnezyum+=22;reasons.magnezyum.push('Uyku kalitesini iyileştirmek için');
  } else if(a.sleep==='shift'){
    scores.magnezyum+=25;reasons.magnezyum.push('Vardiyalı düzende uyku desteği');
  }
  if(a.stress==='high'||a.stress==='burnout'){
    scores.magnezyum+=20;reasons.magnezyum.push('Stres magnezyum tüketimini hızlandırır');
  }
  if(a.freq==='high'||a.freq==='elite'){
    scores.magnezyum+=15;reasons.magnezyum.push('Yoğun antrenmanda terle magnezyum kaybı artar');
  }
  if(a.diet==='messy'){
    scores.magnezyum+=15;reasons.magnezyum.push('Düzensiz beslenmede mineral eksikliği riski');
  }
  if(a.sport==='cardio'||a.sport==='hybrid'){
    scores.magnezyum+=10;reasons.magnezyum.push('Dayanıklılık sporlarında elektrolit kaybı');
  }

  /* ── BETA-ALANİN (kanıt: orta) ───────────────────────
     60-240 sn süren yüksek yoğunluklu çabalarda karnosin
     tamponlaması sağlar. Sedanter veya saf dayanıklılıkta faydasız. */
  if(a.goal==='perf'){
    scores.betaalanin+=30;reasons.betaalanin.push('Performans hedefi — yüksek yoğunlukta yorgunluğu geciktirir');
  }
  if(a.sport==='sport'){
    scores.betaalanin+=30;reasons.betaalanin.push('Dövüş/takım sporunda tekrarlı sprint kapasitesi');
  }
  if(a.sport==='bb'){
    scores.betaalanin+=18;reasons.betaalanin.push('Yüksek tekrarlı setlerde asit tamponlaması');
  }
  if(a.sport==='hybrid'){
    scores.betaalanin+=20;reasons.betaalanin.push('Hibrit antrenmanda yüksek yoğunluk blokları');
  }
  if(a.freq==='high'||a.freq==='elite'){
    scores.betaalanin+=12;reasons.betaalanin.push('Yüksek antrenman hacmi');
  }
  /* Sedanter veya sadece kardiyoda anlamlı fayda yok */
  if(a.sport==='none'){ scores.betaalanin=0; }

  /* ── L-SİTRÜLİN (kanıt: orta) ────────────────────────
     Nitrik oksit yolağı → kan akışı, pompa, DOMS azalması.
     Pre-workout içinde zaten varsa çift alım gereksiz. */
  if(a.sport==='bb'){
    scores.citrulline+=28;reasons.citrulline.push('Vücut geliştirmede pompa ve kan akışı');
  }
  if(a.goal==='perf'){
    scores.citrulline+=22;reasons.citrulline.push('Dayanıklılık ve amonyak temizliği');
  }
  if(a.sport==='hybrid'){
    scores.citrulline+=15;reasons.citrulline.push('Antrenman içi performans desteği');
  }
  if(a.freq==='high'||a.freq==='elite'){
    scores.citrulline+=12;reasons.citrulline.push('Yoğun programda toparlanma ve kas ağrısı azaltma');
  }
  if(a.sport==='none'){ scores.citrulline=0; }

  /* ── BCAA / EAA (kanıt: düşük) ───────────────────────
     Yeterli toplam protein alan kişilerde EK fayda kanıtlanmadı.
     SADECE protein alımı yetersizse öneriliyor — bilimsel dürüstlük. */
  if(a.protein_intake==='low'){
    scores.bcaa+=25;reasons.bcaa.push('Protein alımın düşük — geçici kas koruma desteği');
    if(a.diet==='vegan'){
      scores.bcaa+=12;reasons.bcaa.push('Vegan beslenmede lösin alımı sınırlı olabilir');
    }
    if(a.goal==='cut'){
      scores.bcaa+=10;reasons.bcaa.push('Kalori açığında kas kaybını sınırlamak için');
    }
  }
  /* Protein yeterliyse BCAA gereksizdir — literatür net */
  if(a.protein_intake==='ok'){ scores.bcaa=0; }

  /* ── MEVCUT KULLANIM ─────────────────────────────── */
  if(a.current_usage==='none'){
    /* Hiç kullanmıyor — temel supplementler biraz daha önerili */
    scores.kreatin+=5;reasons.kreatin.push('Henüz supplement kullanmıyorsun — başlamak için ideal');
    scores.omega3+=5;reasons.omega3.push('Temel sağlık desteği olarak ilk adım');
  }
  if(a.current_usage==='advanced'){
    /* Zaten kapsamlı kullanıyor — düşük skorlu olanları biraz düşür */
    ids.forEach(function(id){
      if(scores[id]>0&&scores[id]<15) scores[id]=Math.max(0,scores[id]-5);
    });
  }

  return ids.map(function(id){
    return Object.assign({},SUPPS[id],{id:id,score:scores[id],reasons:reasons[id]});
  });
}

/* Supplement detay akordiyonu aç/kapa */

function _toggleSuppAcc(accId){
  var el = document.getElementById(accId);
  if(!el) return;
  el.classList.toggle('open');
}

function renderSuppResults(){
  var results=calcSuppScores(_suppAnswers);
  results.sort(function(a,b){return b.score-a.score;});
  var userSupps=getUserSupplements();

  var maxShow={min:1,low:2,mid:4,high:7}[_suppAnswers.budget]||3;
  var shown=results.filter(function(s){return s.score>0;}).slice(0,maxShow);

  var html='<div style="font-size:13px;font-weight:700;margin-bottom:4px">📋 '+shown.length+' supplement önerisi</div>'+
    '<div style="font-size:11px;color:var(--text2);margin-bottom:14px">Bütçe ve profiline göre optimize edildi. Detaylı bilgi için her supplementin altındaki "Detayları Gör" butonuna tık.</div>';

  /* Kanıt seviyesi rozet HTML üretici */
  function _evRosette(ev){
    if(ev === 'high') return '<span class="evidence-rosette evidence-high">🟢 Yüksek Kanıt</span>';
    if(ev === 'mid')  return '<span class="evidence-rosette evidence-mid">🟡 Orta Kanıt</span>';
    if(ev === 'low')  return '<span class="evidence-rosette evidence-low">🔴 Sınırlı Kanıt</span>';
    return '';
  }

  shown.forEach(function(s,i){
    var priority=i===0?'🥇 En Öncelikli':i===1?'🥈 İkinci Öncelik':i===2?'🥉 Üçüncü Öncelik':'Destekleyici';
    var pCls=i===0?'bg':i<=2?'by':'bb';
    var alreadyUsing=userSupps.indexOf(s.id)>=0;
    /* Geriye dönük uyum: s.desc yoksa s.purpose veya s.effect kullan */
    var summary = s.desc || s.purpose || s.effect || '';
    
    html+='<div class="supp-result" style="border-left:3px solid '+s.color+(alreadyUsing?';background:color-mix(in srgb, var(--success) 5%, transparent)':'')+'">';
    html+='<div class="supp-result-head"><span class="supp-result-ico">'+s.emoji+'</span>';
    html+='<div style="flex:1"><span class="supp-result-name">'+s.name+'</span>';
    if(alreadyUsing){
      html+='<span style="display:inline-block;margin-left:6px;font-size:9px;font-weight:700;color:var(--success);background:color-mix(in srgb, var(--success) 15%, transparent);border-radius:5px;padding:2px 6px;vertical-align:middle">✓ Zaten Kullanıyorsun</span>';
    }
    /* Doz + Kanıt rozet aynı satırda */
    html+='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:4px">';
    html+='<div style="font-size:10px;color:var(--text3)">💊 '+(s.dose||'—')+'</div>';
    if(s.evidence) html+=_evRosette(s.evidence);
    html+='</div></div>';
    html+='<span class="badge '+pCls+'" style="margin:0 0 0 auto;white-space:nowrap;flex-shrink:0">'+priority+'</span></div>';
    
    /* Kısa açıklama (purpose/effect/desc) */
    html+='<div style="font-size:11px;color:var(--text2);margin:8px 0 4px;line-height:1.5">'+summary+'</div>';
    
    /* Neden seçildi? */
    if(s.reasons&&s.reasons.length){
      html+='<div style="font-size:10px;color:var(--text3);margin-bottom:6px">📊 <strong style="color:var(--text2)">Neden:</strong> '+s.reasons.slice(0,3).join(' · ')+'</div>';
    }
    
    /* Accordion: Detayları Gör */
    var accId = 'acc-supp-'+s.id+'-'+i;
    html+='<div class="supp-acc" id="'+accId+'">';
    html+='<button type="button" class="supp-acc-trigger" onclick="_toggleSuppAcc(\''+accId+'\')">';
    html+='<span>📖 Detayları Gör</span><span class="supp-acc-chev">▶</span>';
    html+='</button>';
    html+='<div class="supp-acc-body">';
    
    /* 7 alan içeriği — sırasıyla */
    /* 1. Doz */
    if(s.dose){
      html+='<div class="supp-acc-row"><div class="supp-acc-label">💊 Doz</div><div class="supp-acc-val">'+s.dose+'</div></div>';
    }
    /* 2. Zamanlama */
    if(s.timing){
      html+='<div class="supp-acc-row"><div class="supp-acc-label">⏰ Zamanlama</div><div class="supp-acc-val">'+s.timing+'</div></div>';
    }
    /* 3. Amaç */
    if(s.purpose){
      html+='<div class="supp-acc-row"><div class="supp-acc-label">🎯 Neden Alınmalı</div><div class="supp-acc-val">'+s.purpose+'</div></div>';
    }
    /* 4. Etki */
    if(s.effect){
      html+='<div class="supp-acc-row"><div class="supp-acc-label">⚙️ Ne İşe Yarar (Mekanizma)</div><div class="supp-acc-val">'+s.effect+'</div></div>';
    }
    /* 5. Kanıt seviyesi (detaylı açıklama) */
    if(s.evidence){
      var evDescMap = {
        high: 'Birden fazla iyi tasarlanmış randomize kontrollü çalışma (RCT) ve meta-analizle desteklenir. Spor bilimi camiasında geniş kabul görür.',
        mid:  'Sınırlı sayıda RCT veya karışık sonuçlar. Bazı kullanıcılarda etkili, bazılarında etkisiz. Bireysel yanıt değişebilir.',
        low:  'Yetersiz veya karışık kanıt. Üretici iddiası ağırlıklı. Yararı tartışmalı, plasebo etkisi de olabilir.'
      };
      html+='<div class="supp-acc-row"><div class="supp-acc-label">🔬 Kanıt Seviyesi '+_evRosette(s.evidence)+'</div><div class="supp-acc-val">'+(evDescMap[s.evidence]||'')+'</div></div>';
    }
    /* 6. Yan etkiler */
    if(s.sideEffects){
      html+='<div class="supp-acc-row"><div class="supp-acc-label" style="color:var(--warn)">⚠️ Yan Etkiler</div><div class="supp-acc-val">'+s.sideEffects+'</div></div>';
    }
    /* 7. İlaç etkileşimleri */
    if(s.interactions){
      html+='<div class="supp-acc-row"><div class="supp-acc-label" style="color:var(--danger)">💊 İlaç Etkileşimleri</div><div class="supp-acc-val">'+s.interactions+'</div></div>';
    }
    /* Ekstra not (varsa) */
    if(s.note){
      html+='<div class="supp-acc-row"><div class="supp-acc-label">💡 Pratik Not</div><div class="supp-acc-val">'+s.note+'</div></div>';
    }
    
    html+='</div></div>'; /* /supp-acc-body /supp-acc */
    
    html+='</div>'; /* /supp-result */
  });

  /* MEDICO-LEGAL DISCLAIMER */
  html+='<div style="margin-top:18px;padding:14px;background:color-mix(in srgb, var(--accent) 5%, transparent);border:1px solid color-mix(in srgb, var(--accent) 25%, transparent);border-left:4px solid var(--danger);border-radius:10px">';
  html+='<div style="font-size:12px;font-weight:700;color:var(--danger);margin-bottom:6px;display:flex;align-items:center;gap:6px">⚕️ Önemli Sağlık Uyarısı</div>';
  html+='<div style="font-size:11px;color:var(--text2);line-height:1.55">';
  html+='Bu öneriler <strong style="color:var(--text)">genel bilgilendirme</strong> amacıyla sunulmuştur ve <strong style="color:var(--text)">tıbbi tavsiye yerine geçmez</strong>. Supplement kullanımı; mevcut sağlık durumun, kullandığın ilaçlar, gebelik/emzirme durumu ve bireysel ihtiyaçlar değerlendirilerek belirlenmelidir.';
  html+='<br><br><strong style="color:var(--text)">Mutlaka bir doktor, diyetisyen veya spor hekimine danışın:</strong>';
  html+='<ul style="margin:6px 0 6px 18px;padding:0">';
  html+='<li>Düzenli ilaç kullanıyorsan</li>';
  html+='<li>Kronik bir hastalığın varsa (kalp, böbrek, karaciğer, tiroid, diyabet vb.)</li>';
  html+='<li>Gebelik veya emzirme döneminde isen</li>';
  html+='<li>18 yaşından küçüksen</li>';
  html+='<li>Herhangi bir yeni belirti veya yan etki yaşıyorsan</li>';
  html+='</ul>';
  html+='Supplementler dengeli beslenmenin <strong style="color:var(--text)">yerine geçmez</strong>; sadece destek olabilirler.';
  html+='</div></div>';

  html+='<div style="margin-top:14px;display:flex;gap:8px">'+
    '<button class="btn btn-s btn-full" onclick="resetSuppSurvey()">🔄 Tekrar Analiz Et</button>'+
    '</div>';

  /* Tam sonucu kaydet (geçmiş analiz için) */
  _lastSuppResults=html;

  document.getElementById('supp-body').innerHTML=html;
  var nav=document.getElementById('supp-nav');
  if(nav)nav.style.display='none';
  document.getElementById('supp-progress').innerHTML='';
  var body=document.getElementById('supp-body');
  if(body)body.scrollTop=0;

  /* Inline özet — son 4'ü listele + "Geçmiş Analiz" butonu */
  var inlineEl=document.getElementById('supp-inline-result');
  if(inlineEl){
    var short='<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">';
    short+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">';
    short+='<div style="font-size:11px;color:var(--text2)">✅ Son analiz sonuçların:</div>';
    short+='<button onclick="openLastSuppResults()" style="background:var(--card2);border:1px solid var(--border);border-radius:7px;padding:4px 10px;font-size:10px;font-weight:600;color:var(--text2);cursor:pointer;font-family:\'Outfit\',sans-serif">📋 Tamamını Gör</button>';
    short+='</div>';
    shown.forEach(function(s){
      short+='<div style="font-size:12px;margin-bottom:5px;display:flex;align-items:center;gap:6px">'+
        '<span style="font-size:16px">'+s.emoji+'</span>'+
        '<div><strong>'+s.name+'</strong> <span style="color:var(--text3);font-size:10px">'+s.dose+'</span></div>';
      short+='</div>';
    });
    short+='</div>';
    inlineEl.innerHTML=short;
  }
}

function resetSuppSurvey(){
  _suppStep=0;_suppAnswers={};_suppMaxStep=SUPP_QS.length-1;
  var gl=selGL||R.recGoal;
  var glMap={yag:'cut', idame:'maintain', kutle:'bulk', cut:'cut', recomp:'recomp', maintain:'maintain', bulk:'bulk'};
  if(glMap[gl]) _suppAnswers.goal=glMap[gl];
  if(selST)_suppAnswers.sport=selST;
  /* Kayıtlı supplementlerden current_usage otomatik doldur */
  var usedCount=getUserSupplements().length;
  if(usedCount===0) _suppAnswers.current_usage='none';
  else if(usedCount<=2) _suppAnswers.current_usage='basic';
  else if(usedCount<=5) _suppAnswers.current_usage='moderate';
  else _suppAnswers.current_usage='advanced';
  var nav=document.getElementById('supp-nav');
  if(nav){nav.style.display='flex';nav.style.removeProperty('display');}
  var body=document.getElementById('supp-body');
  if(body)body.scrollTop=0;
  renderSuppStep();
}

/* ══════════════════════════════════════════════════════════
   💊 KULLANILAN SUPPLEMENTLER (Kayıt + Su Entegrasyonu)
   ══════════════════════════════════════════════════════════ */

var SUPP_USED_LIST=[
  {id:'protein',    label:'Protein Tozu',  emoji:'🥛', waterExtra:1},
  {id:'kreatin',    label:'Kreatin',       emoji:'⚡', waterExtra:2},
  {id:'omega3',     label:'Omega-3',       emoji:'🐟', waterExtra:0},
  {id:'vitD',       label:'D Vitamini',    emoji:'☀️', waterExtra:0},
  {id:'kafein',     label:'Kafein',        emoji:'☕', waterExtra:1},
  {id:'zma',        label:'ZMA',           emoji:'🌙', waterExtra:0},
  {id:'preworkout', label:'Pre-Workout',   emoji:'🚀', waterExtra:1},
  {id:'malto',      label:'Maltodekstrin', emoji:'⚗️', waterExtra:1},
  {id:'melatonin',  label:'Melatonin',     emoji:'😴', waterExtra:0},
  {id:'probiyotik', label:'Probiyotik',    emoji:'🦠', waterExtra:0},
  {id:'relax',      label:'Relax',         emoji:'🌿', waterExtra:0},
  {id:'superfoods', label:'Superfoods',    emoji:'🌱', waterExtra:0}
];

function getUserSupplements(){
  try{return JSON.parse(_lsGet('rf_supplements_used')||'[]');}catch(e){return[];}
}

function saveUserSupplements(arr){
  _lsSet('rf_supplements_used',JSON.stringify(arr));
  saveToFirebase();
}

function toggleSuppUsed(id){
  var list=getUserSupplements();
  var idx=list.indexOf(id);
  if(idx>=0) list.splice(idx,1);
  else list.push(id);
  saveUserSupplements(list);
  renderSuppsUsed();
  renderWaterTracker();
  setTimeout(checkAndAwardBadges,400);
}

function renderSuppsUsed(){
  /* Eski standalone versiyonu — artık panel içinde render ediliyor */
  /* renderBeslenmeToolsGrid otomatik çağırıyor */
  if(_activeBesPanel==='supps') renderBeslenmeToolsGrid();
}
