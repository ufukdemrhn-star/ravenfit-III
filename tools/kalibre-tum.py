# -*- coding: utf-8 -*-
"""Tüm fitness egzersizlerini arketiplere göre kalibre eder."""
import sys, os, json, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import eslestir

KOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
yol = os.path.join(KOK, 'data', 'exercises-fitness.json')

d = json.load(open(yol, encoding='utf-8'))
liste = d if isinstance(d, list) else d['exercises']
tax = json.load(open(os.path.join(KOK,'data','muscles.json'), encoding='utf-8'))
gecerli = {k['id'] for g in tax['gruplar'] for k in g['kaslar']}

# Parti 1'de elle kalibre edilenler korunur
elle = {e['id'] for e in liste if e.get('kalibre') == '2.0'}

MUAF = {'kardiyo-tam-vucut', 'burpee'}   # birincil kas kuralından muaf

say = collections.Counter()
hata = []

for e in liste:
    if e['id'] in elle:
        say['elle (korundu)'] += 1
        continue

    ark = eslestir.arketip_bul(e)
    if not ark:
        hata.append(f"{e['id']}: arketip yok")
        continue

    kaslar = eslestir.degistirici_uygula(eslestir.ARKETIPLER[ark], e)
    kaslar = {k: v for k, v in kaslar.items() if v >= 1}

    for k in kaslar:
        if k not in gecerli:
            hata.append(f"{e['id']}: bilinmeyen kas {k}")

    if ark not in MUAF and not any(p >= 9 for p in kaslar.values()):
        hata.append(f"{e['id']} ({ark}): birincil kas yok")

    e['muscles'] = dict(sorted(kaslar.items(), key=lambda x: -x[1]))
    e['kalibre'] = '2.0'
    e['arketip'] = ark
    say[ark] += 1

if hata:
    print(f"❌ {len(hata)} HATA:")
    for h in hata[:20]: print('  ', h)
else:
    json.dump(d, open(yol,'w',encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f"✅ {sum(v for k,v in say.items() if k != 'elle (korundu)')} hareket kalibre edildi")
    print(f"   {say['elle (korundu)']} hareket elle kalibrasyondan korundu")
