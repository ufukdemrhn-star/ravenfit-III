#!/usr/bin/env python3
"""HTML yapı denetimi.

Neden var: v0.4.2.1'de bir `</div>` eksik kaldı. Ekranlar iç içe geçti,
uygulama açılmadı — ama tarayıcı hata vermedi, konsol temizdi ve
mevcut testlerin HEPSİ geçti. Sessiz bozulmaydı.

Bu denetim onu yakalar:
  • Etiket açma/kapama dengesi
  • Kritik kapsayıcıların kendi içinde dengeli kapanması
  • Ekran elemanlarının doğru kardeş seviyesinde olması
"""
import re, os, sys

os.chdir(os.path.dirname(os.path.abspath(__file__)) + '/..')

gecti = basarisiz = 0
def kontrol(etiket, kosul, detay=''):
    global gecti, basarisiz
    if kosul:
        gecti += 1; print(f'  ✅ {etiket}')
    else:
        basarisiz += 1; print(f'  ❌ {etiket}' + (f'  → {detay}' if detay else ''))

html = open('index.html', encoding='utf-8').read()

print('\n╔══════════════════════════════════════════════════════════╗')
print('║  HTML YAPI DENETİMİ                                      ║')
print('╚══════════════════════════════════════════════════════════╝')

# ── 1. Genel etiket dengesi ────────────────────────────────
print('\n▸ Etiket dengesi')
CIFT_ETIKETLER = ['div', 'button', 'span', 'main', 'header', 'nav', 'form', 'label', 'select']
for et in CIFT_ETIKETLER:
    ac = len(re.findall(r'<' + et + r'[\s>]', html))
    kapa = html.count('</' + et + '>')
    kontrol(f'<{et}> {ac} / </{et}> {kapa}', ac == kapa, f'fark: {ac - kapa}')

# ── 2. Kritik kapsayıcılar kendi içinde dengeli mi? ────────
print('\n▸ Kritik kapsayıcılar')

def dengeli_mi(kaynak, elem_id):
    """id'li div'in dengeli kapanıp kapanmadığını ve satır aralığını döndürür."""
    i = kaynak.find('id="' + elem_id + '"')
    if i < 0: return None
    bas = kaynak.rfind('<div', 0, i)
    if bas < 0: return None
    d = 0; j = bas
    while j < len(kaynak):
        if kaynak.startswith('<div', j) and j + 4 < len(kaynak) and kaynak[j+4] in ' >':
            d += 1; j += 4; continue
        if kaynak.startswith('</div>', j):
            d -= 1; j += 6
            if d == 0:
                return (kaynak[:bas].count('\n') + 1, kaynak[:j].count('\n') + 1)
            continue
        j += 1
    return False   # dengesiz

KRITIK = ['auth-screen', 'app-main', 'splash', 'wizard', 'results',
          'ws-screen', 'warmup-overlay', 'settings-drawer', 'supp-modal',
          'reds-warning-overlay', 'bulk-warning-overlay', 'ffmi-detail-overlay']

araliklar = {}
for eid in KRITIK:
    r = dengeli_mi(html, eid)
    if r is None:
        kontrol(f'#{eid}', False, 'bulunamadı')
    elif r is False:
        kontrol(f'#{eid}', False, 'DENGESİZ — kapanış etiketi eksik/fazla')
    else:
        araliklar[eid] = r
        kontrol(f'#{eid}  (L{r[0]}–L{r[1]})', True)

# ── 3. Ekranlar iç içe geçmiş mi? ──────────────────────────
print('\n▸ Ekran yerleşimi')
# auth-screen, app-main'in DIŞINDA olmalı
if 'auth-screen' in araliklar and 'app-main' in araliklar:
    a = araliklar['auth-screen']; m = araliklar['app-main']
    kontrol('auth-screen, app-main dışında', a[1] < m[0],
            f'auth L{a[0]}-{a[1]}, app-main L{m[0]}-{m[1]}')

# splash / wizard / results app-main içinde ve birbirinden ayrık olmalı
if all(k in araliklar for k in ['splash','wizard','results','app-main']):
    m = araliklar['app-main']
    for eid in ['splash','wizard','results']:
        r = araliklar[eid]
        kontrol(f'{eid}, app-main içinde', m[0] < r[0] and r[1] < m[1])
    s, w, res = araliklar['splash'], araliklar['wizard'], araliklar['results']
    kontrol('splash ve wizard ayrık', s[1] < w[0], f'{s[1]} vs {w[0]}')
    kontrol('wizard ve results ayrık', w[1] < res[0], f'{w[1]} vs {res[0]}')

# ── 4. id tekrarı var mı? ──────────────────────────────────
print('\n▸ Benzersiz id kontrolü')
idler = re.findall(r'\bid="([^"]+)"', html)
from collections import Counter
tekrar = {k: v for k, v in Counter(idler).items() if v > 1}
kontrol(f'{len(idler)} id, tekrar yok', not tekrar,
        ', '.join(f'{k}×{v}' for k, v in list(tekrar.items())[:5]))

# ── 5. Kapatılmamış tırnak / bozuk onclick ─────────────────
print('\n▸ Inline handler bütünlüğü')
bozuk = []
for m in re.finditer(r'\bon\w+="([^"]*)"', html):
    kod = m.group(1)
    if kod.count('(') != kod.count(')'):
        ln = html[:m.start()].count('\n') + 1
        bozuk.append(f'L{ln}: {kod[:40]}')
kontrol('Tüm handler parantezleri dengeli', not bozuk, '; '.join(bozuk[:3]))

# ── Özet ───────────────────────────────────────────────────
print('\n' + '─' * 58)
print(f'📊 HTML YAPISI: {gecti}/{gecti + basarisiz} geçti')
if basarisiz:
    print(f'⚠️  {basarisiz} sorun — uygulama açılmayabilir!')
    sys.exit(1)
print('🎉 HTML yapısı sağlam!')
