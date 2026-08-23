#!/usr/bin/env python3
"""DOM ID denetimi.

`adjustRestTime` hatası şu sınıftandı: JS olmayan bir element ID'sini
arıyordu. Bu araç TÜM getElementById çağrılarını, hem index.html'deki
statik ID'lerle hem de JS'in dinamik ürettiği ID'lerle karşılaştırır.

Ayrıca null-guard olmadan erişilen yerleri de bulur:
    document.getElementById('x').textContent = ...   ← 'x' yoksa çöker
"""
import re, glob, os, sys, json

KOK = os.path.dirname(os.path.abspath(__file__)) + '/..'
os.chdir(KOK)

def yorumsuz(s):
    out=[]; i=0; n=len(s)
    while i<n:
        c=s[i]
        if c=='/' and i+1<n and s[i+1]=='*':
            j=s.find('*/',i+2); j=n if j<0 else j+2
            out.append(' '*(j-i)); i=j; continue
        if c=='/' and i+1<n and s[i+1]=='/':
            j=s.find('\n',i); j=n if j<0 else j
            out.append(' '*(j-i)); i=j; continue
        out.append(c); i+=1
    return ''.join(out)

js_dosyalar = sorted(glob.glob('js/**/*.js', recursive=True))
kaynak = {f: open(f, encoding='utf-8').read() for f in js_dosyalar}
html = open('index.html', encoding='utf-8').read()

# ── 1. MEVCUT ID'LER ───────────────────────────────────────
# a) index.html'deki statik id="..."
statik = set(re.findall(r'\bid="([^"]+)"', html))

# b) JS'in ürettiği HTML string'lerindeki id="..." ve id=\"...\"
dinamik = set()
for f, s in kaynak.items():
    dinamik |= set(re.findall(r'id="([^"\'+$]+)"', s))
    dinamik |= set(re.findall(r'id=\\"([^"\\+$]+)\\"', s))
    dinamik |= set(re.findall(r"id='([^'\"+$]+)'", s))

# c) createElement + .id = 'x'
for f, s in kaynak.items():
    dinamik |= set(re.findall(r"\.id\s*=\s*['\"]([^'\"]+)['\"]", s))

mevcut = statik | dinamik

# ── 2. ARANAN ID'LER ───────────────────────────────────────
aranan = {}   # id -> [(dosya, satır, guard_var_mi)]
for f, s in kaynak.items():
    kod = yorumsuz(s)
    for m in re.finditer(r"document\.getElementById\(\s*['\"]([^'\"]+)['\"]\s*\)", kod):
        eid = m.group(1)
        satir = kod[:m.start()].count('\n') + 1
        # Guard var mı? Hemen ardından . geliyorsa guard YOK
        sonrasi = kod[m.end():m.end()+3]
        guardsiz = sonrasi.startswith('.')
        aranan.setdefault(eid, []).append((f, satir, guardsiz))

# ── RAPOR ──────────────────────────────────────────────────
print('╔══════════════════════════════════════════════════════════════╗')
print('║  DOM ID DENETİMİ                                             ║')
print('╚══════════════════════════════════════════════════════════════╝')
print(f'\nindex.html statik ID   : {len(statik)}')
print(f'JS dinamik ID          : {len(dinamik)}')
print(f'Toplam mevcut ID       : {len(mevcut)}')
print(f'JS\'in aradığı ID       : {len(aranan)}')

# ── A. KIRIK REFERANSLAR ───────────────────────────────────
kirik = {k: v for k, v in aranan.items() if k not in mevcut}
print('\n' + '═'*64)
print(f'A. KIRIK ID REFERANSLARI  ({len(kirik)})')
print('═'*64)
if not kirik:
    print('  ✅ Yok — her aranan ID bir yerde tanımlı')
else:
    for eid in sorted(kirik):
        tehlike = any(g for _,_,g in kirik[eid])
        isaret = '🔴 ÇÖKER' if tehlike else '🟡 sessiz'
        print(f'\n  {isaret}  #{eid}')
        for f, ln, g in kirik[eid]:
            print(f'      {f}:{ln}' + ('   ← guard yok!' if g else ''))

# ── B. GUARD'SIZ ERİŞİMLER ─────────────────────────────────
guardsizlar = []
for eid, yerler in aranan.items():
    for f, ln, g in yerler:
        if g:
            guardsizlar.append((eid, f, ln, eid in mevcut))

riskli = [x for x in guardsizlar if not x[3]]
print('\n' + '═'*64)
print(f'B. NULL-GUARD OLMADAN ERİŞİM  ({len(guardsizlar)} toplam, {len(riskli)} riskli)')
print('═'*64)
if not riskli:
    print(f'  ✅ Guard\'sız {len(guardsizlar)} erişim var ama hepsinin ID\'si mevcut')
else:
    for eid, f, ln, _ in riskli:
        print(f'  🔴 {f}:{ln}  #{eid}')

# ── C. KULLANILMAYAN ID'LER (bilgi) ────────────────────────
# HTML'de tanımlı ama JS hiç aramıyor + querySelector'da da geçmiyor
tum_js = ' '.join(kaynak.values())
kullanilmayan = []
for eid in sorted(statik):
    if eid in aranan: continue
    if eid in tum_js: continue      # querySelector veya başka şekilde geçiyor olabilir
    kullanilmayan.append(eid)
print('\n' + '═'*64)
print(f'C. HTML\'de TANIMLI AMA JS HİÇ KULLANMIYOR  ({len(kullanilmayan)})')
print('═'*64)
if not kullanilmayan:
    print('  ✅ Yok')
else:
    print('  (CSS ile veya inline onclick ile kullanılıyor olabilir — bilgi amaçlı)')
    for eid in kullanilmayan[:20]:
        print(f'     #{eid}')

# ── SONUÇ ──────────────────────────────────────────────────
print('\n' + '─'*64)
hata = len(kirik)
if hata == 0:
    print('🎉 DOM ID denetimi temiz — kırık referans yok!')
else:
    print(f'⚠️  {hata} kırık ID referansı bulundu')
    sys.exit(1)
