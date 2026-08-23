#!/usr/bin/env python3
"""Tema denetimi.

Her temanın WCAG 2.2 AA uyumunu ve sistem bütünlüğünü doğrular.
Renk değiştirdiğinde bunu çalıştır — bozulan kombinasyonu anında görürsün.
"""
import re, os, sys, glob
os.chdir(os.path.dirname(os.path.abspath(__file__)) + '/..')

# ─── Renk matematiği ────────────────────────────────────────
def hex2rgb(h):
    h = h.lstrip('#')
    if len(h) == 3: h = ''.join(c*2 for c in h)
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def luminans(hx):
    def k(c):
        c /= 255
        return c/12.92 if c <= 0.03928 else ((c+0.055)/1.055)**2.4
    r, g, b = map(k, hex2rgb(hx))
    return 0.2126*r + 0.7152*g + 0.0722*b

def kontrast(a, b):
    l1, l2 = luminans(a), luminans(b)
    if l1 < l2: l1, l2 = l2, l1
    return (l1+0.05)/(l2+0.05)

# ─── Temaları oku ───────────────────────────────────────────
css = open('css/themes.css', encoding='utf-8').read()
temalar = {}
for m in re.finditer(r'(?::root,)?\[data-theme="(\w+)"\]\s*\{([^}]*)\}', css):
    ad = m.group(1)
    d = {}
    for dm in re.finditer(r'--([\w-]+)\s*:\s*([^;]+);', m.group(2)):
        d[dm.group(1)] = dm.group(2).strip()
    temalar[ad] = d

gecti = basarisiz = 0
def kontrol(etiket, kosul, detay=''):
    global gecti, basarisiz
    if kosul: gecti += 1
    else:
        basarisiz += 1
        print(f'  ❌ {etiket}' + (f'  → {detay}' if detay else ''))

print('\n╔══════════════════════════════════════════════════════════════╗')
print('║  TEMA DENETİMİ — WCAG 2.2 AA                                 ║')
print('╚══════════════════════════════════════════════════════════════╝')

BEKLENEN = ['dark','crimson','violet','forest','rose','ocean','light']
print(f'\n▸ Tema sayısı')
kontrol(f'{len(BEKLENEN)} tema tanımlı', len(temalar) == len(BEKLENEN),
        f'bulunan: {sorted(temalar)}')

# Her temada bulunması gereken değişkenler
GEREKLI = ['bg','bg2','card','card2','border','text','text2','text3',
           'accent','accent-btn','on-accent','ag','success','warn','info',
           'purple','danger','hbg','shadow-sm','shadow-md','overlay']

print(f'\n▸ Değişken bütünlüğü')
for ad in BEKLENEN:
    if ad not in temalar:
        kontrol(f'#{ad} teması', False, 'tanımlı değil'); continue
    eksik = [v for v in GEREKLI if v not in temalar[ad]]
    kontrol(f'{ad}: {len(GEREKLI)} değişken', not eksik, f'eksik: {eksik}')

# ─── Kontrast denetimleri ───────────────────────────────────
DENETIMLER = [
    ('text',    'bg',    4.5, 'ana metin/zemin'),
    ('text',    'bg2',   4.5, 'ana metin/zemin2'),
    ('text',    'card',  4.5, 'ana metin/kart'),
    ('text',    'card2', 4.5, 'ana metin/iç kart'),
    ('text2',   'bg',    4.5, 'ikincil/zemin'),
    ('text2',   'card',  4.5, 'ikincil/kart'),
    ('text2',   'card2', 4.5, 'ikincil/iç kart'),
    ('text3',   'bg',    3.0, 'üçüncül/zemin'),
    ('text3',   'card',  3.0, 'üçüncül/kart'),
    ('accent',  'bg',    3.0, 'vurgu/zemin'),
    ('accent',  'card',  3.0, 'vurgu/kart'),
    ('accent',  'card2', 3.0, 'vurgu/iç kart'),
    ('on-accent','accent-btn', 4.5, 'buton metni/buton'),
    ('success', 'card',  3.0, 'başarı/kart'),
    ('warn',    'card',  3.0, 'uyarı/kart'),
    ('info',    'card',  3.0, 'bilgi/kart'),
    ('purple',  'card',  3.0, 'mor/kart'),
    ('danger',  'card',  3.0, 'tehlike/kart'),
    ('border',  'bg',    1.15,'kenarlık/zemin'),
    ('border',  'card',  1.10,'kenarlık/kart'),
]

print(f'\n▸ Kontrast oranları')
print(f"  {'TEMA':<9} {'txt/bg':>7} {'txt2/bg':>8} {'txt3/bg':>8} {'acc/bg':>7} {'btn':>6} {'DURUM':>7}")
print('  ' + '─'*54)

for ad in BEKLENEN:
    if ad not in temalar: continue
    t = temalar[ad]
    hatalar = []
    for f, b, esik, aciklama in DENETIMLER:
        if f not in t or b not in t: continue
        if not t[f].startswith('#') or not t[b].startswith('#'): continue
        k = kontrast(t[f], t[b])
        if k < esik: hatalar.append(f'{aciklama} {k:.2f}<{esik}')
    durum = '✅' if not hatalar else f'❌{len(hatalar)}'
    print(f"  {ad:<9} "
          f"{kontrast(t['text'],t['bg']):>7.1f} "
          f"{kontrast(t['text2'],t['bg']):>8.1f} "
          f"{kontrast(t['text3'],t['bg']):>8.1f} "
          f"{kontrast(t['accent'],t['bg']):>7.1f} "
          f"{kontrast(t['on-accent'],t['accent-btn']):>6.1f} "
          f"{durum:>7}")
    for h in hatalar:
        print(f"           ✗ {h}")
    kontrol(f'{ad} kontrast', not hatalar, '; '.join(hatalar[:2]))

# ─── Yüzey merdiveni ────────────────────────────────────────
print(f'\n▸ Yüzey merdiveni (yükseklik hiyerarşisi)')
for ad in BEKLENEN:
    if ad not in temalar: continue
    t = temalar[ad]
    l = [luminans(t[k]) for k in ['bg','bg2','card','card2']]
    if ad == 'light':
        # Aydınlık temada kart zeminden AÇIK olmalı (yükselmiş = daha beyaz)
        artan = l[2] >= l[0]
        kontrol(f'{ad}: kart zeminden açık', artan,
                f"bg {l[0]:.3f} → card {l[2]:.3f}")
    else:
        # Koyu temada her katman bir öncekinden AÇIK olmalı
        artan = all(l[i] < l[i+1] for i in range(len(l)-1))
        kontrol(f'{ad}: bg<bg2<card<card2', artan,
                ' → '.join(f'{x:.3f}' for x in l))

# ─── Sabit renk kaçağı ──────────────────────────────────────
print(f'\n▸ Tema dışı sabit renk')
sabit = 0
kacak = []
for f in sorted(glob.glob('css/*.css')) + sorted(glob.glob('js/**/*.js', recursive=True)):
    if f.endswith('themes.css') or 'self-test' in f or '/tests/' in f: continue
    s = re.sub(r'/\*[\s\S]*?\*/', '', open(f, encoding='utf-8').read())
    n = len(re.findall(r'#[0-9a-fA-F]{3,6}\b', s))
    if n:
        sabit += n
        kacak.append((f, n))
kacak.sort(key=lambda x: -x[1])
print(f'  Toplam sabit hex: {sabit} (başlangıçta 297 idi)')
for f, n in kacak[:5]:
    print(f'     {n:>3}  {f}')
kontrol('Sabit renk sayısı makul (<40)', sabit < 40, f'{sabit} adet')

# ─── Özet ───────────────────────────────────────────────────
print('\n' + '─'*62)
print(f'📊 TEMA DENETİMİ: {gecti}/{gecti+basarisiz} geçti')
if basarisiz:
    print(f'⚠️  {basarisiz} sorun var')
    sys.exit(1)
print('🎉 Tüm temalar WCAG AA uyumlu ve tutarlı!')
