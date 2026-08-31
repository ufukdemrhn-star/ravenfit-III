#!/usr/bin/env python3
"""Kas verisi bütünlük denetimi.

Kas aktivasyon verisi uygulamanın bilimsel iddiasının temeli.
Bozulursa kullanıcı yanlış bilgi alır ve fark edilmesi zordur.
Bu denetim veriyi taksonomiye ve puanlama kurallarına karşı doğrular.
"""
import json, os, sys, collections
os.chdir(os.path.dirname(os.path.abspath(__file__)) + '/..')

gecti = basarisiz = 0
def kontrol(etiket, kosul, detay=''):
    global gecti, basarisiz
    if kosul:
        gecti += 1; print(f'  ✅ {etiket}')
    else:
        basarisiz += 1; print(f'  ❌ {etiket}' + (f'  → {detay}' if detay else ''))

print('\n╔══════════════════════════════════════════════════════════╗')
print('║  KAS VERİSİ BÜTÜNLÜĞÜ                                    ║')
print('╚══════════════════════════════════════════════════════════╝')

tax = json.load(open('data/muscles.json', encoding='utf-8'))
gecerli = {k['id'] for g in tax['gruplar'] for k in g['kaslar']}
labels = open('js/workout/labels.js', encoding='utf-8').read()

print('\n▸ Taksonomi')
kontrol('muscles.json okunuyor', len(tax['gruplar']) > 0)
kontrol('26 kas tanımlı', len(gecerli) == 26, f'{len(gecerli)} bulundu')
kontrol('Kas kimlikleri benzersiz',
        len(gecerli) == sum(len(g['kaslar']) for g in tax['gruplar']))
eksik = [k for k in gecerli if f"'{k}':" not in labels]
kontrol('Her kasın arayüz etiketi var', not eksik, ', '.join(eksik[:5]))

print('\n▸ Kaldırılan etiketler geri gelmemiş')
DOSYALAR = ['exercises-fitness','exercises-posture','exercises-swimming']
for dosya in DOSYALAR:
    yol = f'data/{dosya}.json'
    if not os.path.exists(yol): continue
    d = json.load(open(yol, encoding='utf-8'))
    l = d if isinstance(d, list) else d.get('exercises', [])
    kotu = collections.Counter()
    for e in l:
        for kas in (e.get('muscles') or {}):
            if kas not in gecerli: kotu[kas] += 1
    kontrol(f'{dosya}: geçersiz kas yok', not kotu,
            ', '.join(f'{k}×{v}' for k, v in kotu.most_common(4)))

print('\n▸ Puanlama kuralları (fitness)')
d = json.load(open('data/exercises-fitness.json', encoding='utf-8'))
l = d if isinstance(d, list) else d['exercises']

kontrol('Tüm hareketler kalibre', all(e.get('kalibre') == '2.0' for e in l),
        f"{sum(1 for e in l if e.get('kalibre') != '2.0')} kalibresiz")

MUAF = {'kardiyo-tam-vucut', 'burpee'}
birincilsiz = [e['id'] for e in l
               if e.get('arketip') not in MUAF
               and e.get('muscles')
               and not any(p >= 9 for p in e['muscles'].values())]
kontrol('Her harekette birincil kas (9-10)', not birincilsiz,
        f'{len(birincilsiz)} eksik: ' + ', '.join(birincilsiz[:3]))

araligi_asan = [(e['id'], k, p) for e in l
                for k, p in (e.get('muscles') or {}).items()
                if not (1 <= p <= 10)]
kontrol('Puanlar 1-10 aralığında', not araligi_asan, str(araligi_asan[:3]))

bos = [e['id'] for e in l if not e.get('muscles')]
kontrol('Kassız hareket yok', not bos, ', '.join(bos[:5]))

print('\n▸ Dağılım sağlığı')
tum = [p for e in l for p in (e.get('muscles') or {}).values()]
ort = sum(tum) / len(tum) if tum else 0
kontrol('Ortalama 4.5-6.0 arası (çan eğrisi değil)',
        4.5 <= ort <= 6.0, f'{ort:.2f}')

dusuk_oran = sum(1 for p in tum if p <= 3) / len(tum) if tum else 0
kontrol('Düşük puanlar %20+ (gerçekçi taban)',
        dusuk_oran >= 0.20, f'%{dusuk_oran*100:.0f}')

kas_basina = len(tum) / len(l) if l else 0
kontrol('Hareket başına 5-9 kas', 5 <= kas_basina <= 9, f'{kas_basina:.1f}')

print('\n▸ Kas kapsama')
kullanilan = {k for e in l for k in (e.get('muscles') or {})}
kullanilmayan = gecerli - kullanilan
kontrol('Her kas en az bir harekette', not kullanilmayan,
        ', '.join(kullanilmayan))

print('\n' + '─'*58)
print(f'📊 KAS VERİSİ: {gecti}/{gecti+basarisiz} geçti')
if basarisiz:
    print(f'⚠️  {basarisiz} sorun — veri bozulmuş olabilir!')
    sys.exit(1)
print('🎉 Kas verisi tutarlı!')
