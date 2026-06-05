// ════════════════════════════════════════════════════════════
//  supplements.js — SUPPLEMENT VERİSİ + ÖNERİ PUANLAMA MOTORU
//  RavenFit2'den birebir. SUPPS verisi + calcSuppScores.
//  'Vücut profili' bonusu profileName parametresiyle gelir
//  (determineBodyProfile kendi aşamasında bağlanacak; şimdilik null).
// ════════════════════════════════════════════════════════════

export const SUPPS = {
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

// ── Önerilen supplementleri puanla (RavenFit2'den birebir) ──
export function calcSuppScores(a, user, profileName){
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
  var age=(user&&user.age)||25;
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
  if(user&&user.gender==='female'){
    scores.vitD+=10;reasons.vitD.push('Kadınlarda D vitamini eksikliği daha yaygın');
    scores.omega3+=5;reasons.omega3.push('Hormonal denge desteği');
    scores.zma+=5;reasons.zma.push('Magnezyum kadınlarda önemli');
  }

  /* ── VÜCUT PROFİLİ ─────────────────────────────── */
  if(profileName){
    if(profileName.includes('Skinny')){
      scores.kreatin+=10;reasons.kreatin.push('Düşük kas kütlesi — kreatin destekler');
      scores.malto+=15;reasons.malto.push('Kalori artışı için');
    }
    if(profileName.includes('Skinny-fat')){
      scores.kreatin+=15;reasons.kreatin.push('Skinny-fat profilinde kas inşası');
      scores.vitD+=10;reasons.vitD.push('Vücut kompozisyonu iyileştirme');
    }
    if(profileName.includes('Obez')||profileName.includes('Kilolu')){
      scores.omega3+=15;reasons.omega3.push('Yüksek yağ oranında anti-enflamasyon');
      scores.vitD+=15;reasons.vitD.push('Obezitede D vitamini emilimi bozulur');
      scores.probiyotik+=10;reasons.probiyotik.push('Metabolizma desteği');
    }
  }

  /* Negatife düşmesin */
  ids.forEach(function(id){if(scores[id]<0)scores[id]=0;});

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

// ── Supplement anketi soruları (RavenFit2'den; protein etiketleri sabitlendi) ──
export const SUPP_QS = [
  { key: 'goal', title: 'Birincil hedefin nedir?', opts: [
    { v: 'bulk', l: '💪 Kas & Kütle Kazanımı' },
    { v: 'cut', l: '🔥 Yağ Yakımı & Definasyon' },
    { v: 'recomp', l: '⚖️ Rekompozisyon (Dengeli Form)' },
    { v: 'health', l: '❤️ Genel Sağlık & Wellness' },
    { v: 'perf', l: '🏆 Performans & Dayanıklılık' },
  ] },
  { key: 'sport', title: 'Antrenman türün nedir?', opts: [
    { v: 'bb', l: '🏋️ Vücut Geliştirme / Powerlifting' },
    { v: 'cardio', l: '🏃 Kardiyo / Koşu / Bisiklet' },
    { v: 'hybrid', l: '⚡ Hibrit (Ağırlık + Kardiyo)' },
    { v: 'sport', l: '⚽ Takım / Kombat Sporu' },
    { v: 'none', l: '🚶 Aktif ama antrenman yok' },
  ] },
  { key: 'freq', title: 'Haftada kaç gün antrenman yapıyorsun?', opts: [
    { v: 'low', l: '1–2 gün' },
    { v: 'mid', l: '3–4 gün' },
    { v: 'high', l: '5–6 gün' },
    { v: 'elite', l: 'Her gün / 2 antrenman/gün' },
  ] },
  { key: 'diet', title: 'Beslenme düzenin nasıl?', opts: [
    { v: 'clean', l: '🥦 Temiz / Bol protein, az işlenmiş' },
    { v: 'normal', l: '🍖 Normal / Karma beslenme' },
    { v: 'messy', l: '🍕 Düzensiz / Hazır yemek ağırlıklı' },
    { v: 'veje', l: '🥬 Vejetaryen' },
    { v: 'vegan', l: '🌱 Vegan' },
  ] },
  { key: 'protein_intake', title: 'Günlük protein alımın nasıl?', opts: [
    { v: 'low', l: '😬 Düşük — < 100 g' },
    { v: 'mid', l: '😐 Orta — 100–150 g' },
    { v: 'ok', l: '✅ Yeterli — > 150 g' },
    { v: 'unknown', l: '🤷 Bilmiyorum / Takip etmiyorum' },
  ] },
  { key: 'sleep', title: 'Uyku kalitenin nasıl?', opts: [
    { v: 'good', l: '😴 İyi — Düzenli 7-9 saat' },
    { v: 'mid', l: '😐 Orta — Sık sık 5-7 saat' },
    { v: 'bad', l: '😵 Kötü — Genellikle <5 saat veya bölünmüş' },
    { v: 'shift', l: '🌙 Vardiyalı / Düzensiz uyku saatleri' },
  ] },
  { key: 'stress', title: 'Günlük stres seviyeni nasıl tanımlarsın?', opts: [
    { v: 'low', l: '😌 Düşük — Genellikle rahat' },
    { v: 'mid', l: '😐 Orta — Ara sıra yoğun dönemler' },
    { v: 'high', l: '😤 Yüksek — Sürekli baskı altındayım' },
    { v: 'burnout', l: '🔥 Çok yüksek — Tükenmişlik' },
  ] },
  { key: 'sun', title: 'Güneş maruziyetin nasıl?', opts: [
    { v: 'good', l: '☀️ İyi — Düzenli dışarıda' },
    { v: 'low', l: '🏢 Az — Çoğunlukla iç mekanda' },
    { v: 'none', l: '🌑 Çok az — Neredeyse hiç güneş yok' },
    { v: 'covered', l: '🧣 Kapalı giyiniyorum / Kuzey iklim' },
  ] },
  { key: 'budget', title: 'Supplement için aylık bütçen nedir?', opts: [
    { v: 'min', l: '💰 Minimal — Sadece 1 temel ürün' },
    { v: 'low', l: '💰💰 Düşük — 2-3 ürün' },
    { v: 'mid', l: '💰💰💰 Orta — 3-5 ürün' },
    { v: 'high', l: '💎 Yüksek — Kapsamlı stack' },
  ] },
  { key: 'current_usage', title: 'Halihazırda supplement kullanıyor musun?', opts: [
    { v: 'none', l: '🚫 Hiç kullanmıyorum' },
    { v: 'basic', l: '💊 1-2 temel supplement' },
    { v: 'moderate', l: '💊💊 3-5 supplement' },
    { v: 'advanced', l: '🧪 Kapsamlı stack' },
  ] },
];
