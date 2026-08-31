# -*- coding: utf-8 -*-
"""Hareket arketipleri — kas aktivasyon şablonları.

20 referans hareketten çıkarılan desenler. Her arketip bir
hareket kalıbını temsil eder; tek tek 344 kayıt yazmak yerine
hareketler arketiplere eşlenir ve değiştiricilerle ayarlanır.

Puanlama GÖRECELİDİR: kasın bu harekette aldığı payı gösterir.
Mutlak yük `difficulty` alanındadır.
"""

ARKETIPLER = {

# ══════════════ İTİŞ — YATAY ══════════════
'yatay-itis': {
  'pectoralis-sternal':10, 'triceps-lateral':8, 'anterior-deltoid':7,
  'pectoralis-clavicular':6, 'triceps-long':5, 'forearms':3,
  'middle-deltoid':2, 'lats':2},
'yatay-itis-egimli': {   # incline — üst göğüs
  'pectoralis-clavicular':10, 'anterior-deltoid':8, 'triceps-lateral':7,
  'pectoralis-sternal':6, 'triceps-long':5, 'middle-deltoid':3, 'forearms':3},
'yatay-itis-ters-egimli': {  # decline — alt göğüs
  'pectoralis-sternal':10, 'triceps-lateral':7, 'anterior-deltoid':5,
  'pectoralis-clavicular':4, 'triceps-long':5, 'forearms':2},
'gogus-izolasyon': {     # fly, pec deck
  'pectoralis-sternal':10, 'pectoralis-clavicular':6, 'anterior-deltoid':5,
  'biceps':2, 'forearms':2},
'dar-tutus-itis': {      # close grip — triceps ağırlıklı
  'triceps-lateral':9, 'triceps-long':8, 'pectoralis-sternal':7,
  'anterior-deltoid':6, 'pectoralis-clavicular':4, 'forearms':3},
'dips': {
  'pectoralis-sternal':9, 'triceps-lateral':9, 'anterior-deltoid':8,
  'pectoralis-clavicular':6, 'triceps-long':5, 'abs':3,
  'lats':3, 'middle-deltoid':2, 'forearms':2},

# ══════════════ İTİŞ — DİKEY ══════════════
'dikey-itis': {          # overhead press
  'anterior-deltoid':9, 'middle-deltoid':8, 'triceps-lateral':7,
  'upper-traps':6, 'pectoralis-clavicular':5, 'triceps-long':5,
  'abs':4, 'spinal-erectors':4, 'obliques':3, 'forearms':2},
'arnold-press': {        # ekran görüntüsünden — rotasyon rear delt ekler
  'anterior-deltoid':10, 'middle-deltoid':8, 'posterior-deltoid':7,
  'upper-traps':4, 'triceps-lateral':2, 'forearms':2},

# ══════════════ ÇEKİŞ — DİKEY ══════════════
'dikey-cekis': {         # pull-up, pulldown — lat baskın
  'lats':10, 'biceps':7, 'lower-traps':7, 'forearms':6,
  'rhomboids':5, 'middle-traps':5, 'posterior-deltoid':5,
  'abs':4, 'obliques':2, 'pectoralis-sternal':2},
'dikey-cekis-supin': {   # chin-up — biceps artar
  'lats':9, 'biceps':8, 'lower-traps':6, 'forearms':6,
  'pectoralis-sternal':4, 'abs':4, 'middle-traps':4, 'rhomboids':4},
'pullover': {            # ekran görüntüsünden
  'lats':9, 'pectoralis-sternal':6, 'triceps-long':5, 'abs':3,
  'obliques':2, 'forearms':2, 'posterior-deltoid':2, 'upper-traps':1},

# ══════════════ ÇEKİŞ — YATAY ══════════════
# ⚠️ Referans: satır hareketleri LAT değil, ORTA TRAPEZ/RHOMBOID baskın
'yatay-cekis': {
  'middle-traps':9, 'rhomboids':9, 'lats':7, 'lower-traps':6,
  'posterior-deltoid':6, 'biceps':6, 'forearms':5, 'upper-traps':5,
  'spinal-erectors':4, 'abs':4, 'rotator-cuff':4},
'yatay-cekis-katı': {    # pendlay — daha yatay, lat payı düşer
  'middle-traps':9, 'rhomboids':9, 'upper-traps':8, 'lats':6,
  'posterior-deltoid':6, 'biceps':5, 'forearms':5, 'abs':3,
  'spinal-erectors':2, 'glute-max':2, 'hamstrings':2, 'obliques':1},
'ters-fly': {            # rear delt fly, face pull
  'posterior-deltoid':9, 'rotator-cuff':8, 'middle-traps':7,
  'rhomboids':7, 'lower-traps':6, 'upper-traps':3, 'biceps':2},
'shrug': {               # ekran görüntüsünden
  'upper-traps':9, 'forearms':5, 'spinal-erectors':5, 'abs':2},

# ══════════════ KALÇA MENTEŞE ══════════════
'menteşe-agir': {        # deadlift
  'spinal-erectors':10, 'glute-max':9, 'adductors':9, 'hamstrings':8,
  'upper-traps':6, 'forearms':6, 'quads':4, 'lats':4, 'abs':4,
  'middle-traps':4, 'calves':3, 'obliques':2, 'lower-traps':2, 'hip-flexors':1},
'menteşe-hamstring': {   # RDL, good morning — hamstring baskın
  'hamstrings':10, 'glute-max':8, 'spinal-erectors':8, 'adductors':6,
  'forearms':5, 'upper-traps':4, 'lats':4, 'abs':3, 'calves':2},
'hiperekstansiyon': {    # ekran görüntüsünden
  'hamstrings':9, 'spinal-erectors':8, 'glute-max':6, 'adductors':5,
  'calves':2},
'sumo-menteşe': {        # sumo deadlift — adduktör baskın
  'adductors':10, 'glute-max':9, 'quads':8, 'spinal-erectors':8,
  'hamstrings':7, 'forearms':6, 'upper-traps':5, 'abs':4,
  'glute-med':4, 'lats':3, 'calves':2},

# ══════════════ SQUAT ══════════════
'squat': {
  'quads':10, 'glute-max':8, 'adductors':7, 'spinal-erectors':6,
  'hamstrings':4, 'abs':4, 'glute-med':4, 'calves':3, 'obliques':2},
'squat-on-yuk': {        # front/goblet/overhead — gövde dik, quad+core artar
  'quads':10, 'glute-max':7, 'adductors':6, 'spinal-erectors':7,
  'abs':5, 'upper-traps':4, 'hamstrings':3, 'calves':3},
'squat-makine': {        # hack squat, leg press — gövde desteklenir
  # Not: abs 5 verildi çünkü makine değiştiricisi 2 düşürüp
  # referanstaki 3 değerine indirir.
  'quads':10, 'adductors':8, 'glute-max':4, 'abs':5,
  'hamstrings':2, 'calves':2, 'spinal-erectors':3, 'obliques':1},

# ══════════════ TEK BACAK ══════════════
'lunge': {
  'glute-max':9, 'quads':8, 'adductors':8, 'glute-med':6,
  'hamstrings':4, 'abs':4, 'obliques':4, 'calves':3, 'spinal-erectors':3},
'split-squat': {         # bulgarian, split — quad payı artar
  'quads':9, 'glute-max':8, 'adductors':7, 'glute-med':6,
  'hamstrings':4, 'abs':4, 'calves':3, 'obliques':3},
'step-up': {
  'glute-max':9, 'quads':8, 'adductors':6, 'glute-med':6,
  'hamstrings':4, 'calves':4, 'abs':3, 'obliques':3},

# ══════════════ KALÇA İZOLASYON ══════════════
'hip-thrust': {          # ekran görüntüsünden — en saf glute hareketi
  'glute-max':10, 'adductors':6, 'hamstrings':4, 'quads':2,
  'abs':2, 'spinal-erectors':2, 'calves':1},
'glute-kickback': {
  'glute-max':10, 'hamstrings':5, 'spinal-erectors':3, 'abs':3},
'kalca-abduksiyon': {
  'glute-med':10, 'glute-max':6, 'obliques':3, 'abs':2},
'kalca-adduksiyon': {
  'adductors':10, 'glute-max':3, 'abs':2},

# ══════════════ BACAK İZOLASYON ══════════════
'leg-curl': {
  'hamstrings':10, 'calves':4, 'glute-max':3},
'leg-extension': {
  'quads':10, 'hip-flexors':3},
'calf-raise': {
  'calves':9},

# ══════════════ OMUZ İZOLASYON ══════════════
'yan-kaldiris': {        # lateral raise
  # Referans: dambılda arka omuz sinerjist, kabloda yüksek.
  # Ortalama alındı; kablo değiştiricisi ayrıca düşürmez.
  'middle-deltoid':10, 'posterior-deltoid':6, 'anterior-deltoid':5,
  'upper-traps':4, 'rotator-cuff':3, 'forearms':2},
'on-kaldiris': {
  'anterior-deltoid':10, 'pectoralis-clavicular':5, 'middle-deltoid':4,
  'upper-traps':3, 'forearms':2},
'rotator-manset': {      # external/internal rotation
  'rotator-cuff':10, 'posterior-deltoid':5, 'middle-traps':3, 'rhomboids':3},

# ══════════════ KOL İZOLASYON ══════════════
'biceps-curl': {
  'biceps':10, 'forearms':5, 'anterior-deltoid':2},
'biceps-destekli': {     # preacher — ekran görüntüsünden, en izole
  'biceps':10, 'forearms':2},
'biceps-cekic': {        # hammer curl — brachialis/forearm artar
  'biceps':9, 'forearms':7},
'triceps-uzatma': {      # skull crusher, overhead ext
  'triceps-long':9, 'triceps-lateral':8, 'anterior-deltoid':2, 'forearms':2},
'triceps-pushdown': {    # dirsek sabit, lateral baskın
  'triceps-lateral':10, 'triceps-long':6, 'forearms':3},
'onkol-izolasyon': {
  'forearms':10, 'biceps':3},

# ══════════════ KARIN ══════════════
'karin-fleksiyon': {     # crunch, sit-up
  'abs':10, 'obliques':5, 'hip-flexors':4},
'karin-izometrik': {     # plank
  'abs':9, 'obliques':6, 'spinal-erectors':4, 'glute-max':3,
  'anterior-deltoid':3, 'quads':2},
'karin-yan': {           # side plank, oblique work
  'obliques':9, 'abs':6, 'glute-med':6, 'spinal-erectors':4,
  'middle-deltoid':3, 'adductors':3},
'karin-anti-rotasyon': { # pallof
  'obliques':9, 'abs':7, 'glute-med':4, 'spinal-erectors':4},
'bacak-kaldiris': {      # leg raise, knee raise
  'hip-flexors':9, 'abs':8, 'obliques':5, 'quads':3},
'karin-rollout': {
  'abs':10, 'obliques':6, 'lats':5, 'spinal-erectors':4, 'triceps-long':3},

# ══════════════ TAŞIMA / DURUŞ ══════════════
'tasima': {              # farmer carry
  'forearms':9, 'upper-traps':8, 'abs':6, 'obliques':6,
  'spinal-erectors':6, 'glute-med':5, 'quads':4, 'calves':4},
'kavrama-izometrik': {   # barbell hold, plate pinch
  'forearms':10, 'upper-traps':5, 'abs':3},

# ══════════════ PATLAYICI / OLİMPİK ══════════════
'olimpik-cekis': {       # clean, snatch
  'quads':9, 'glute-max':9, 'upper-traps':8, 'hamstrings':7,
  'spinal-erectors':7, 'adductors':6, 'middle-deltoid':5, 'forearms':5,
  'calves':5, 'abs':4, 'middle-traps':4, 'anterior-deltoid':4},
'kettlebell-swing': {
  'glute-max':9, 'hamstrings':8, 'spinal-erectors':7, 'adductors':6,
  'abs':5, 'upper-traps':4, 'forearms':4, 'quads':3, 'anterior-deltoid':3},
'kutu-sicrama': {
  'quads':9, 'glute-max':8, 'calves':7, 'adductors':5,
  'hamstrings':4, 'abs':3},

# ══════════════ KARDİYO / METABOLİK ══════════════
'kardiyo-tam-vucut': {
  'quads':6, 'glute-max':5, 'calves':5, 'abs':4, 'hamstrings':4,
  'anterior-deltoid':3, 'spinal-erectors':3},
'burpee': {
  'quads':7, 'pectoralis-sternal':6, 'glute-max':6, 'abs':6,
  'triceps-lateral':5, 'anterior-deltoid':5, 'calves':5,
  'hamstrings':4, 'spinal-erectors':3},

# ══════════════ BOYUN ══════════════
'boyun': {
  'neck-flexors':10, 'upper-traps':4},
}
