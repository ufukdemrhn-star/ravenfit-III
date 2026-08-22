/* ══════════════════════════════════════════════════════════
   RavenFit — labels.js
   Kas grubu, ekipman ve kategori etiketleri
   ══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   💪 FAZ 3 — EGZERSİZ HAVUZU + ÖZEL ANTRENMAN + PO + ISINMA
   ══════════════════════════════════════════════════════════ */

/* ── Kas grubu etiketleri ────────────────────────────────── */

var MUSCLE_TR={
  /* Yeni anatomik isimler (İngilizce) */
  'neck-flexors':           'Neck Flexors',
  'anterior-deltoid':       'Anterior Deltoid',
  'middle-deltoid':         'Middle Deltoid',
  'posterior-deltoid':      'Posterior Deltoid',
  'traps':                  'Trapezius',
  'lower-traps':            'Lower Trapezius',
  'rotator-cuff':           'Rotator Cuff',
  'lats':                   'Latissimus Dorsi',
  'spinal-erectors':        'Spinal Erectors',
  'biceps':                 'Biceps',
  'triceps-long':           'Triceps Long Head',
  'triceps-lateral':        'Triceps Lateral Head',
  'triceps-medial':         'Triceps Medial Head',
  'forearms':               'Forearms',
  'pectoralis-sternal':     'Pectoralis Sternal',
  'pectoralis-clavicular':  'Pectoralis Clavicular',
  'abs':                    'Abs',
  'obliques':               'Obliques',
  'glute-max':              'Gluteus Maximus',
  'glute-med':              'Gluteus Medius',
  'quads':                  'Quadriceps',
  'hamstrings':             'Hamstrings',
  'adductors':              'Adductors',
  'hip-flexors':            'Hip Flexors',
  'calves':                 'Calves',
  'full-body':              'Full Body',
  /* Eski anahtar fallback (eski JSON kalıntıları için) */
  'chest':'Pectoralis','upper-chest':'Pectoralis Clavicular','lower-chest':'Pectoralis Sternal',
  'front-shoulder':'Anterior Deltoid','mid-shoulder':'Middle Deltoid','rear-shoulder':'Posterior Deltoid',
  'rear-delt':'Posterior Deltoid',
  'forearm-flexors':'Forearms','forearm-extensors':'Forearms','brachioradialis':'Forearms',
  'mid-traps':'Trapezius','upper-traps':'Trapezius','rhomboids':'Trapezius',
  'erector-spinae':'Spinal Erectors','teres-major':'Latissimus Dorsi',
  'abs-upper':'Abs','abs-lower':'Abs','transverse-abs':'Abs',
  'glutes':'Gluteus Maximus','abductors':'Gluteus Medius',
  'gastrocnemius':'Calves','soleus':'Calves','grip':'Forearms'
};

/* Filtre kategori → kas anahtarları mapping */

var MUSCLE_CATEGORY_MAP={
  'chest':     ['pectoralis-sternal','pectoralis-clavicular','chest','upper-chest','lower-chest'],
  'back':      ['lats','traps','lower-traps','spinal-erectors','rotator-cuff','mid-traps','upper-traps','rhomboids','erector-spinae','teres-major'],
  'shoulders': ['anterior-deltoid','middle-deltoid','posterior-deltoid','front-shoulder','mid-shoulder','rear-shoulder','rear-delt'],
  'arms':      ['biceps','triceps-long','triceps-lateral','forearms','triceps-medial','forearm-flexors','forearm-extensors','brachioradialis','grip'],
  'core':      ['abs','obliques','abs-upper','abs-lower','transverse-abs'],
  'glutes':    ['glute-max','glute-med','glutes','abductors'],
  'legs':      ['quads','hamstrings','adductors','hip-flexors','calves','gastrocnemius','soleus'],
  'neck':      ['neck-flexors'],
  'full-body': ['full-body']
};

/* Filtre kategori etiketleri (UI'da gösterilir) */

var MUSCLE_CATEGORY_LABELS={
  'chest':'Chest','back':'Back','shoulders':'Shoulders','arms':'Arms',
  'core':'Core','glutes':'Glutes','legs':'Legs','neck':'Neck','full-body':'Full Body'
};

var CATEGORY_TR={
  'chest':'Göğüs','back':'Sırt','shoulders':'Omuzlar','arms':'Kollar',
  'legs':'Bacaklar','core':'Core / Karın','full-body':'Tüm Vücut',
  'cardio':'Kardiyo','glutes':'Kalça','posture':'Postür',
  /* Yüzme kategorileri */
  'technique':'Teknik','drill':'Drill','kick':'Ayak Vuruşu','pull':'Çekiş',
  'endurance':'Dayanıklılık','speed':'Hız','conditioning':'Kondisyon',
  'dryland':'Kara Antrenmanı',
  /* Postür kategorileri */
  'lower-back':'Bel Ağrısı','neck':'Boyun','kyphosis':'Kifoz (Kambur)',
  'scoliosis-support':'Skolyoz Destek','mobility':'Genel Mobilite'
};

var EQUIPMENT_TR={
  'bodyweight':       'Vücut Ağırlığı',
  'barbell':          'Barbell',
  'dumbbell':         'Dumbbell',
  'kettlebell':       'Kettlebell',
  'ez-bar':           'EZ Bar',
  'trap-bar':         'Trap Bar',
  'cable':            'Kablo',
  'machine':          'Makine',
  'smith-machine':    'Smith Machine',
  'med-ball':         'Sağlık Topu',
  'resistance-band':  'Bant',
  'pullup-bar':       'Barfiks',
  'bench':            'Bench',
  'dip-bar':          'Dip Bar',
  'ab-wheel':         'Ab Wheel',
  /* Yüzme ekipmanları */
  'kickboard':'Tahta','pull-buoy':'Şamandıra','fins':'Palet',
  'paddles':'El Paleti','snorkel':'Şnorkel','band':'Bant',
  'none':'Ekipmansız'
};

/* Filtre UI'sinde gösterilecek ekipmanlar (sıralı) */

var EQUIPMENT_FILTER_LIST=[
  {id:'bodyweight',      label:'Vücut Ağırlığı',  icon:'🧍'},
  {id:'barbell',         label:'Barbell',          icon:'🏋️'},
  {id:'dumbbell',        label:'Dumbbell',         icon:'💪'},
  {id:'kettlebell',      label:'Kettlebell',       icon:'⚫'},
  {id:'ez-bar',          label:'EZ Bar',           icon:'〰️'},
  {id:'trap-bar',        label:'Trap Bar',         icon:'⬡'},
  {id:'cable',           label:'Kablo',            icon:'🔗'},
  {id:'machine',         label:'Makine',           icon:'⚙️'},
  {id:'smith-machine',   label:'Smith Machine',    icon:'🔧'},
  {id:'med-ball',        label:'Sağlık Topu',      icon:'🏐'},
  {id:'resistance-band', label:'Bant',             icon:'➰'},
  {id:'pullup-bar',      label:'Barfiks',          icon:'─'},
  {id:'bench',           label:'Bench',            icon:'🪑'},
  {id:'dip-bar',         label:'Dip Bar',          icon:'⫼'},
  {id:'ab-wheel',        label:'Ab Wheel',         icon:'🎡'}
];

var CATEGORY_EMOJI={
  'chest':'💪','back':'🦅','shoulders':'🏋️','arms':'💪',
  'legs':'🦵','core':'⚡','full-body':'🔥','glutes':'🍑','cardio':'🏃','posture':'🧘',
  /* Yüzme */
  'technique':'🏊','drill':'🔄','kick':'🦶','pull':'💪',
  'endurance':'🫀','speed':'⚡','conditioning':'🔥','dryland':'🏋️',
  /* Postür */
  'lower-back':'🔧','neck':'🦴','kyphosis':'🧘','scoliosis-support':'🏥','mobility':'🔄'
};

/* ── Yüzme stil çevirileri ────────────────────────────────── */

var STROKE_TR={
  'freestyle':'Serbest Stil','backstroke':'Sırt Üstü',
  'breaststroke':'Kurbağalama','butterfly':'Kelebek',
  'im':'Bireysel Karışık','general':'Genel','mixed':'Karışık'
};

var SWIM_CATEGORY_GROUPS=[
  {id:'all',label:'Tümü'},
  {id:'technique',label:'🏊 Teknik'},
  {id:'drill',label:'🔄 Drill'},
  {id:'kick',label:'🦶 Kick & Pull',match:['kick','pull']},
  {id:'endurance',label:'🫀 Dayanıklılık',match:['endurance','speed']},
  {id:'conditioning',label:'🔥 Kondisyon',match:['conditioning','dryland']}
];

var SWIM_STROKE_FILTERS=[
  {id:'all',label:'Tüm Stiller'},
  {id:'freestyle',label:'Serbest'},
  {id:'backstroke',label:'Sırt Üstü'},
  {id:'breaststroke',label:'Kurbağa'},
  {id:'butterfly',label:'Kelebek'},
  {id:'general',label:'Genel'}
];

var POSTURE_CATEGORY_GROUPS=[
  {id:'all',label:'Tümü'},
  {id:'lower-back',label:'🔧 Bel Ağrısı'},
  {id:'neck',label:'🦴 Boyun'},
  {id:'kyphosis',label:'🧘 Kifoz'},
  {id:'scoliosis-support',label:'🏥 Skolyoz'},
  {id:'mobility',label:'🔄 Mobilite'}
];
