#!/usr/bin/env python3
"""Yol çözümleme testi.

CSS içindeki url(), HTML içindeki src/href ve JS içindeki görsel
yollarının GERÇEKTEN var olan dosyalara işaret ettiğini doğrular.

Kritik nokta: CSS'teki url() CSS DOSYASININ konumuna göre çözülür,
HTML sayfasına göre değil. Bu testi yazma sebebimiz tam olarak
o hatayı bir kez yapmış olmamız.
"""
import re, os, glob, sys

KOK = os.path.dirname(os.path.abspath(__file__)) + '/..'
os.chdir(KOK)

gecti = basarisiz = 0

def temizle(yol):
    """?v=... ve #... eklerini atar — bunlar dosya adının parçası değildir."""
    return yol.split('?')[0].split('#')[0].strip()

def kontrol(etiket, kosul, detay=''):
    global gecti, basarisiz
    if kosul:
        gecti += 1
        print(f'  ✅ {etiket}')
    else:
        basarisiz += 1
        print(f'  ❌ {etiket}' + (f'  → {detay}' if detay else ''))

print('\n╔══════════════════════════════════════════════════════════╗')
print('║  YOL ÇÖZÜMLEME TESTİ                                     ║')
print('╚══════════════════════════════════════════════════════════╝')

# ── 1. CSS içindeki url() ──────────────────────────────────
print('\n▸ CSS dosyalarındaki url() yolları')
css_bulundu = 0
for f in sorted(glob.glob('css/*.css')):
    icerik = open(f, encoding='utf-8').read()
    css_dizin = os.path.dirname(f)
    for m in re.finditer(r'url\((["\']?)([^"\')]+)\1\)', icerik):
        yol = temizle(m.group(2))
        if yol.startswith(('http', '//', 'data:', '#')):
            continue
        css_bulundu += 1
        # CSS url'i CSS dosyasının konumuna göre çözülür
        cozulmus = os.path.normpath(os.path.join(css_dizin, yol))
        kontrol(f'{f} → {yol}', os.path.isfile(cozulmus),
                f'çözülen: {cozulmus} (yok)')
if css_bulundu == 0:
    print('  (CSS içinde göreli url() yok)')

# ── 2. HTML içindeki src / href ────────────────────────────
print('\n▸ index.html içindeki src / href')
html = open('index.html', encoding='utf-8').read()
for m in re.finditer(r'(?:src|href)="([^"]+)"', html):
    yol = temizle(m.group(1))
    if yol.startswith(('http', '//', 'data:', '#', 'mailto:')):
        continue
    kontrol(f'index.html → {yol}', os.path.isfile(yol), 'dosya yok')

# ── 3. JS içindeki görsel yolları ──────────────────────────
print('\n▸ JS dosyalarındaki görsel yolları')
js_bulundu = 0
for f in sorted(glob.glob('js/**/*.js', recursive=True)):
    icerik = open(f, encoding='utf-8').read()
    # url(...) veya src="..." veya 'assets/...'
    adaylar = set()
    for m in re.finditer(r'url\((["\']?)([^"\')]+)\1\)', icerik):
        adaylar.add(m.group(2))
    for m in re.finditer(r'["\']((?:assets|data|css|js)/[\w./-]+\.\w{2,4})["\']', icerik):
        adaylar.add(m.group(1))
    for ham in adaylar:
        yol = temizle(ham)
        # url(#id) → SVG filtre/gradyan referansı, dosya değil
        if not yol or yol.startswith(('http', '//', 'data:', '#')):
            continue
        js_bulundu += 1
        # JS'ten enjekte edilen yollar HTML sayfasına göre çözülür (kök)
        kontrol(f'{f} → {yol}', os.path.isfile(yol), 'dosya yok')
if js_bulundu == 0:
    print('  (JS içinde doğrudan görsel yolu yok)')

# ── 4. manifest.json ───────────────────────────────────────
print('\n▸ manifest.json ikon yolları')
import json
try:
    mf = json.load(open('manifest.json', encoding='utf-8'))
    for ic in mf.get('icons', []):
        yol = temizle(ic.get('src', ''))
        kontrol(f'manifest → {yol}', os.path.isfile(yol), 'dosya yok')
except Exception as e:
    kontrol('manifest.json okunabildi', False, str(e))

# ── 5. data/ dosyaları JS'ten çağrılıyor mu ────────────────
print('\n▸ data-loader.js içindeki JSON yolları')
dl = open('js/core/data-loader.js', encoding='utf-8').read()
for m in re.finditer(r"'data/([\w-]+\.json)'", dl):
    yol = 'data/' + m.group(1)
    kontrol(f'{yol}', os.path.isfile(yol), 'dosya yok')

# ── Özet ───────────────────────────────────────────────────
print('\n' + '─' * 60)
toplam = gecti + basarisiz
print(f'📊 YOL TESTİ: {gecti}/{toplam} geçti')
if basarisiz == 0:
    print('🎉 Tüm yollar doğru çözülüyor!')
else:
    print(f'⚠️  {basarisiz} yol kırık')
    sys.exit(1)
