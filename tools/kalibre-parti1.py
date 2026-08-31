# -*- coding: utf-8 -*-
"""İlk kalibrasyon partisi — 32 temel hareket.

Kaynak: referans uygulamanın 10 hareketi + ExRx işlevsel sınıflandırması
        + %MVIC bantları (JOSPT). Bant kuralı:
        10 kusursuz · 9 çok yüksek · 7-8 yüksek
        5-6 sinerjist · 3-4 kısmi · 1-2 düşük
Puanlama GÖRECELİDİR: puan, bu harekette kasın aldığı payı
gösterir; mutlak yükü değil. Yük `difficulty` alanındadır.
Bu yüzden incline push-up'ta da göğüs birincildir (9) —
hareket kolaydır ama amacı yine göğüstür.

Kural: her harekette en az bir kas 9-10 olmalı.
"""
import json

K = {

# ══ SQUAT AİLESİ ══
'barbell-squat': {
  'quads':10, 'glute-max':8, 'adductors':7, 'spinal-erectors':6,
  'hamstrings':4, 'abs':4, 'glute-med':4, 'calves':3, 'obliques':2},
'air-squat': {
  'quads':9, 'glute-max':6, 'adductors':5, 'spinal-erectors':3,
  'hamstrings':3, 'abs':3, 'calves':2},
'barbell-front-squat': {
  'quads':10, 'glute-max':7, 'adductors':6, 'spinal-erectors':7,
  'abs':5, 'upper-traps':4, 'hamstrings':3, 'calves':3},
'goblet-squat': {
  'quads':9, 'glute-max':7, 'adductors':6, 'abs':5,
  'spinal-erectors':5, 'upper-traps':3, 'hamstrings':3, 'calves':2},

# ══ DEADLIFT AİLESİ ══
'conventional-deadlift': {
  'spinal-erectors':10, 'glute-max':9, 'adductors':9, 'hamstrings':8,
  'upper-traps':6, 'forearms':6, 'quads':4, 'lats':4, 'abs':4,
  'middle-traps':4, 'calves':3, 'obliques':2, 'lower-traps':2, 'hip-flexors':1},
'barbell-romanian-deadlift': {
  'hamstrings':10, 'glute-max':8, 'spinal-erectors':8, 'adductors':6,
  'forearms':5, 'upper-traps':4, 'lats':4, 'abs':3, 'calves':2},
'barbell-sumo-deadlift': {
  'adductors':10, 'glute-max':9, 'quads':8, 'spinal-erectors':8,
  'hamstrings':7, 'forearms':6, 'upper-traps':5, 'abs':4,
  'glute-med':4, 'lats':3, 'calves':2},

# ══ İTİŞ — YATAY ══
'bench-press': {
  'pectoralis-sternal':10, 'triceps-lateral':8, 'anterior-deltoid':7,
  'pectoralis-clavicular':6, 'triceps-long':5, 'forearms':3,
  'middle-deltoid':2, 'lats':2},
'incline-bench-press': {
  'pectoralis-clavicular':10, 'anterior-deltoid':8, 'triceps-lateral':7,
  'pectoralis-sternal':6, 'triceps-long':5, 'middle-deltoid':3, 'forearms':3},
'push-up-classic': {
  'pectoralis-sternal':9, 'triceps-lateral':7, 'anterior-deltoid':6,
  'pectoralis-clavicular':5, 'abs':5, 'triceps-long':4,
  'obliques':3, 'glute-max':3, 'forearms':2},
'incline-push-up': {
  'pectoralis-sternal':9, 'triceps-lateral':6, 'anterior-deltoid':5,
  'pectoralis-clavicular':5, 'abs':4, 'triceps-long':4,
  'glute-max':2, 'obliques':2},
'decline-push-up': {
  'pectoralis-clavicular':9, 'anterior-deltoid':8, 'pectoralis-sternal':7,
  'triceps-lateral':7, 'abs':5, 'triceps-long':5, 'obliques':3},
'cable-fly': {
  'pectoralis-sternal':10, 'pectoralis-clavicular':6, 'anterior-deltoid':5,
  'biceps':2, 'forearms':2},
'dips': {
  'pectoralis-sternal':9, 'triceps-lateral':9, 'anterior-deltoid':8,
  'pectoralis-clavicular':6, 'triceps-long':5, 'abs':3,
  'lats':3, 'middle-deltoid':2, 'forearms':2},

# ══ İTİŞ — DİKEY ══
'strict-press': {
  'anterior-deltoid':9, 'middle-deltoid':8, 'triceps-lateral':7,
  'upper-traps':6, 'pectoralis-clavicular':5, 'triceps-long':5,
  'abs':4, 'spinal-erectors':4, 'obliques':3, 'forearms':2},
'machine-shoulder-press': {
  'anterior-deltoid':9, 'middle-deltoid':7, 'triceps-lateral':7,
  'upper-traps':5, 'pectoralis-clavicular':4, 'triceps-long':4, 'forearms':2},
'handstand-push-up': {
  'anterior-deltoid':10, 'triceps-lateral':8, 'middle-deltoid':7,
  'upper-traps':6, 'abs':6, 'triceps-long':5, 'pectoralis-clavicular':4,
  'spinal-erectors':4, 'obliques':3},

# ══ ÇEKİŞ — DİKEY ══
'pull-up-classic': {
  'lats':10, 'biceps':7, 'lower-traps':7, 'forearms':6,
  'rhomboids':5, 'middle-traps':5, 'posterior-deltoid':5,
  'abs':4, 'obliques':2, 'pectoralis-sternal':2},
'chin-up': {
  'lats':9, 'biceps':8, 'lower-traps':6, 'forearms':6,
  'pectoralis-sternal':4, 'abs':4, 'middle-traps':4, 'rhomboids':4},
'lat-pulldown-narrow-grip': {
  'lats':9, 'biceps':6, 'lower-traps':6, 'rhomboids':5,
  'middle-traps':5, 'posterior-deltoid':4, 'forearms':4, 'abs':2},

# ══ ÇEKİŞ — YATAY ══
'barbell-row': {
  'lats':8, 'middle-traps':9, 'rhomboids':9, 'lower-traps':7,
  'posterior-deltoid':6, 'biceps':6, 'forearms':5, 'upper-traps':5,
  'spinal-erectors':5, 'abs':4, 'rotator-cuff':4, 'hamstrings':3, 'glute-max':2},
'seated-cable-row': {
  'middle-traps':9, 'rhomboids':9, 'lats':8, 'lower-traps':6,
  'posterior-deltoid':6, 'biceps':6, 'forearms':4, 'rotator-cuff':4,
  'spinal-erectors':3, 'upper-traps':3},
'inverted-row': {
  'middle-traps':9, 'rhomboids':9, 'lats':7, 'biceps':6,
  'posterior-deltoid':6, 'lower-traps':5, 'abs':5, 'forearms':4,
  'glute-max':3, 'spinal-erectors':3},
'banded-face-pull': {
  'posterior-deltoid':9, 'rotator-cuff':8, 'middle-traps':7,
  'rhomboids':7, 'lower-traps':6, 'upper-traps':3, 'biceps':2},

# ══ OMUZ İZOLASYON ══
'banded-lateral-raise': {
  'middle-deltoid':10, 'anterior-deltoid':5, 'posterior-deltoid':5,
  'upper-traps':4, 'rotator-cuff':3, 'forearms':2},

# ══ KOL İZOLASYON ══
'barbell-curl': {
  'biceps':10, 'forearms':5, 'anterior-deltoid':2},
'ez-bar-curl': {
  'biceps':10, 'forearms':4, 'anterior-deltoid':2},
'dumbbell-skull-crusher': {
  'triceps-long':9, 'triceps-lateral':8, 'anterior-deltoid':2, 'forearms':2},

# ══ BACAK ══
'leg-press': {
  'quads':9, 'adductors':8, 'glute-max':6, 'hamstrings':3,
  'calves':3, 'glute-med':3, 'hip-flexors':1},
'walking-lunge': {
  'glute-max':9, 'quads':8, 'adductors':8, 'glute-med':6,
  'hamstrings':4, 'abs':4, 'obliques':4, 'calves':3, 'spinal-erectors':3},
'reverse-lunge': {
  'glute-max':9, 'quads':7, 'adductors':7, 'glute-med':6,
  'hamstrings':4, 'abs':4, 'obliques':3, 'calves':3},
'lying-leg-curl': {
  'hamstrings':10, 'calves':4, 'glute-max':3},
'leg-extension': {
  'quads':10, 'hip-flexors':3},

# ══ KARIN ══
'plank': {
  'abs':9, 'obliques':6, 'spinal-erectors':4, 'glute-max':3,
  'anterior-deltoid':3, 'quads':2},
'side-plank': {
  'obliques':9, 'abs':6, 'glute-med':6, 'spinal-erectors':4,
  'middle-deltoid':3, 'adductors':3},
}

d = json.load(open('data/exercises-fitness.json', encoding='utf-8'))
liste = d if isinstance(d, list) else d['exercises']
idx = {e['id']: e for e in liste}
tax = json.load(open('data/muscles.json', encoding='utf-8'))
gecerli = {k['id'] for g in tax['gruplar'] for k in g['kaslar']}

guncel, atlanan, hata = 0, [], []
for eid, kaslar in K.items():
    if eid not in idx:
        atlanan.append(eid); continue
    for kas in kaslar:
        if kas not in gecerli:
            hata.append(f'{eid}: bilinmeyen kas {kas}')
    if not any(p >= 9 for p in kaslar.values()):
        hata.append(f'{eid}: birincil kas yok (9-10 puan)')
    idx[eid]['muscles'] = dict(sorted(kaslar.items(), key=lambda x: -x[1]))
    idx[eid]['kalibre'] = '2.0'
    guncel += 1

if hata:
    print("❌ HATALAR:")
    for h in hata: print('  ', h)
else:
    json.dump(d, open('data/exercises-fitness.json','w',encoding='utf-8'),
              ensure_ascii=False, indent=1)
    print(f"✅ {guncel} hareket kalibre edildi")
    if atlanan:
        print(f"⚠️  Bulunamadı: {', '.join(atlanan)}")
