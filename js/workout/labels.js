/* ══════════════════════════════════════════════════════════
   RavenFit — labels.js
   Kas grubu, ekipman ve kategori etiketleri
   ══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   💪 FAZ 3 — EGZERSİZ HAVUZU + ÖZEL ANTRENMAN + PO + ISINMA
   ══════════════════════════════════════════════════════════ */

/* ── Kas grubu etiketleri ────────────────────────────────── */

var MUSCLE_TR={
  /* Göğüs */
  'pectoralis-clavicular':   'Pectoralis Major (Clavicular)',
  'pectoralis-sternal':      'Pectoralis Major (Sternal)',
  /* Omuz */
  'anterior-deltoid':        'Deltoideus Anterior',
  'middle-deltoid':          'Deltoideus Medialis',
  'posterior-deltoid':       'Deltoideus Posterior',
  /* Kol */
  'biceps':                  'Biceps Brachii + Brachialis',
  'triceps-long':            'Triceps Brachii (Long Head)',
  'triceps-lateral':         'Triceps Brachii (Lateral + Medial Head)',
  'forearms':                'Forearm Flexors/Extensors',
  /* Sırt */
  'upper-traps':             'Trapezius (Upper)',
  'middle-traps':            'Trapezius (Middle)',
  'lower-traps':             'Trapezius (Lower)',
  'rhomboids':               'Rhomboideus Major/Minor',
  'lats':                    'Latissimus Dorsi + Teres Major',
  'rotator-cuff':            'Supraspinatus, Infraspinatus, Teres Minor, Subscapularis',
  'spinal-erectors':         'Erector Spinae',
  /* Karın */
  'abs':                     'Rectus Abdominis',
  'obliques':                'Obliquus Externus/Internus',
  /* Kalça */
  'glute-max':               'Gluteus Maximus',
  'glute-med':               'Gluteus Medius/Minimus',
  'hip-flexors':             'Iliopsoas, Rectus Femoris',
  'adductors':               'Adductor Magnus/Longus/Brevis',
  /* Bacak */
  'quads':                   'Quadriceps Femoris',
  'hamstrings':              'Biceps Femoris, Semitendinosus, Semimembranosus',
  'calves':                  'Gastrocnemius, Soleus',
  /* Diğer */
  'neck-flexors':            'Sternocleidomastoid, Scalenes',

  /* ── ESKİ ANAHTAR YEDEĞİ ──────────────────────────────
     Eski JSON kalıntıları ve kullanıcının kaydettiği özel
     programlar bu anahtarları içerebilir. Kaldırılırsa
     etiketler boş görünür. */
  'traps':'Trapezius (Upper)', 'triceps-medial':'Triceps Brachii (Lateral + Medial Head)',
  'full-body':'Tüm Vücut',
  'chest':'Pectoralis','upper-chest':'Pectoralis Major (Clavicular)','lower-chest':'Pectoralis Major (Sternal)',
  'front-shoulder':'Deltoideus Anterior','mid-shoulder':'Deltoideus Medialis',
  'rear-shoulder':'Deltoideus Posterior','rear-delt':'Deltoideus Posterior',
  'forearm-flexors':'Forearm Flexors/Extensors','forearm-extensors':'Forearm Flexors/Extensors',
  'brachioradialis':'Forearm Flexors/Extensors','grip':'Forearm Flexors/Extensors',
  'mid-traps':'Trapezius (Middle)','erector-spinae':'Erector Spinae',
  'teres-major':'Latissimus Dorsi + Teres Major',
  'abs-upper':'Rectus Abdominis','abs-lower':'Rectus Abdominis','transverse-abs':'Rectus Abdominis',
  'glutes':'Gluteus Maximus','abductors':'Gluteus Medius/Minimus',
  'gastrocnemius':'Gastrocnemius, Soleus','soleus':'Gastrocnemius, Soleus'
};

/* Filtre kategori → kas anahtarları mapping */

var MUSCLE_CATEGORY_MAP={
  'chest':     ['pectoralis-sternal','pectoralis-clavicular','chest','upper-chest','lower-chest'],
  'back':      ['lats','upper-traps','middle-traps','lower-traps','rhomboids','rotator-cuff',
                'spinal-erectors','traps','mid-traps','erector-spinae','teres-major'],
  'shoulders': ['anterior-deltoid','middle-deltoid','posterior-deltoid',
                'front-shoulder','mid-shoulder','rear-shoulder','rear-delt'],
  'arms':      ['biceps','triceps-long','triceps-lateral','forearms',
                'triceps-medial','forearm-flexors','forearm-extensors','brachioradialis','grip'],
  'core':      ['abs','obliques','abs-upper','abs-lower','transverse-abs'],
  'glutes':    ['glute-max','glute-med','hip-flexors','adductors','glutes','abductors'],
  'legs':      ['quads','hamstrings','calves','gastrocnemius','soleus'],
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
