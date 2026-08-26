#!/usr/bin/env python3
"""CSS yerleşim denetimi.

Neden var: themes.css'e eklediğim bir kural
    #settings-drawer{position:relative}
sınıfındaki `position:fixed` değerini eziyordu (ID seçici sınıftan
güçlüdür). Ayarlar çekmecesi sabit katman olmaktan çıkıp sayfa
akışına girdi — her sekmede aşağı kaydırınca görünür oldu.

Ne konsol hatası verdi, ne test yakaladı. Sessiz bir yerleşim
regresyonuydu. Bu denetim onu yakalar:

  • Kritik öğelerin position değeri beklenen mi
  • Sonradan gelen bir kural onu eziyor mu (özgüllük analizi)
  • z-index sıralaması bozulmuş mu
"""
import re, os, sys, glob
os.chdir(os.path.dirname(os.path.abspath(__file__)) + '/..')

gecti = basarisiz = 0
def kontrol(etiket, kosul, detay=''):
    global gecti, basarisiz
    if kosul: gecti += 1
    else:
        basarisiz += 1
        print(f'  ❌ {etiket}' + (f'  → {detay}' if detay else ''))

# ── Tüm CSS kurallarını sırayla topla ───────────────────────
# Yükleme sırası index.html'den okunur — sonraki dosya öncekini ezer
html = open('index.html', encoding='utf-8').read()
sira = [m.split('?')[0] for m in re.findall(r'<link rel="stylesheet" href="(css/[^"]+)"', html)]

kurallar = []   # (dosya, sıra_no, seçici, bildirimler)
for i, f in enumerate(sira):
    if not os.path.isfile(f): continue
    s = re.sub(r'/\*[\s\S]*?\*/', '', open(f, encoding='utf-8').read())
    # @media bloklarını atla (koşullu, ana akışı temsil etmez)
    s = re.sub(r'@media[^{]*\{(?:[^{}]|\{[^{}]*\})*\}', '', s)
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', s):
        secs = [x.strip() for x in m.group(1).split(',')]
        bild = m.group(2)
        for sec in secs:
            if sec: kurallar.append((f, i, sec, bild))

def ozgulluk(sec):
    """CSS özgüllük skoru: (id, sınıf, eleman)"""
    idler   = len(re.findall(r'#[\w-]+', sec))
    siniflar= len(re.findall(r'\.[\w-]+', sec)) + len(re.findall(r'\[[^\]]+\]', sec)) \
              + len(re.findall(r':(?!:)[\w-]+', sec))
    elem    = len(re.findall(r'(?:^|[\s>+~])([a-z]+[a-z0-9]*)', sec))
    return (idler, siniflar, elem)

def etkin_deger(hedef_sec, ozellik):
    """Bir seçici için son geçerli değeri ve onu veren kuralı bul."""
    adaylar = []
    for f, i, sec, bild in kurallar:
        if sec != hedef_sec: continue
        m = re.search(r'\b' + ozellik + r'\s*:\s*([^;]+)', bild)
        if m: adaylar.append((ozgulluk(sec), i, m.group(1).strip(), f, sec))
    if not adaylar: return None
    adaylar.sort(key=lambda x: (x[0], x[1]))
    return adaylar[-1]

print('\n╔══════════════════════════════════════════════════════════════╗')
print('║  CSS YERLEŞİM DENETİMİ                                       ║')
print('╚══════════════════════════════════════════════════════════════╝')

# ── 1. Kritik öğelerin position değeri ──────────────────────
print('\n▸ Sabit katmanların position değeri')

BEKLENEN = {
    '.hdr':                     'fixed',
    '.bottom-nav':              'fixed',
    '.ws-screen':               'fixed',
    '.settings-drawer':         'fixed',
    '.settings-drawer-overlay': 'fixed',
    '.calc-overlay':            'fixed',
    '.warmup-overlay':          'fixed',
    '.ws-rest-overlay':         'fixed',
    '.up-screen':               'fixed',   # kullanıcı profili
    '.pd-screen':               'fixed',   # gönderi detayı
    '.cr-overlay':              'fixed',   # fotoğraf kırpıcı
    '.fd-screen':               'fixed',   # ana akış
}

for sec, beklenen in BEKLENEN.items():
    sonuc = etkin_deger(sec, 'position')
    if not sonuc:
        kontrol(f'{sec}', False, 'position kuralı yok')
        continue
    _, _, deger, dosya, _ = sonuc
    ok = deger == beklenen
    kontrol(f'{sec} → {deger}', ok, f'beklenen {beklenen}, {dosya} içinde')
    if ok:
        print(f'  ✅ {sec:<26} position:{deger:<8} ({dosya})')

# ── 2. ID seçici sınıfı eziyor mu? ──────────────────────────
print('\n▸ ID seçici, sınıf kuralını eziyor mu?')

# Aynı öğeye hem #id hem .class kuralı varsa ve çakışıyorsa uyar
id_kurallari = {}
for f, i, sec, bild in kurallar:
    if sec.startswith('#') and 'position' in bild:
        m = re.search(r'position\s*:\s*([^;]+)', bild)
        if m: id_kurallari[sec] = (m.group(1).strip(), f)

catisma = []
for idsec, (iddeg, iddosya) in id_kurallari.items():
    eid = idsec[1:]
    # HTML'de bu id'ye sahip elemanın sınıfları
    m = re.search(r'<[^>]*id="' + re.escape(eid) + r'"[^>]*>', html)
    if not m: continue
    cm = re.search(r'class="([^"]+)"', m.group(0))
    if not cm: continue
    for cls in cm.group(1).split():
        sonuc = etkin_deger('.' + cls, 'position')
        if sonuc and sonuc[2] != iddeg:
            catisma.append((idsec, iddeg, iddosya, '.'+cls, sonuc[2], sonuc[3]))

kontrol('ID/sınıf position çakışması yok', not catisma)
for i, iv, idf, c, cv, cf in catisma:
    print(f'     🔴 {i} position:{iv} ({idf})')
    print(f'        {c} position:{cv} ({cf})  ← ID bunu eziyor!')

# ── 3. z-index sıralaması ───────────────────────────────────
print('\n▸ Katman sıralaması (z-index)')

SIRA = [
    ('.hdr',                   200),
    ('.bottom-nav',            300),
    ('.ws-screen',             400),
    ('.settings-drawer-overlay',599),
    ('.settings-drawer',       600),
    ('.calc-overlay',          800),
    ('.fd-screen',             810),   # ana akış
    ('.up-screen',             820),   # kullanıcı profili
    ('.pd-screen',             840),   # gönderi detayı — profilin üstünde
    ('.sp-overlay',            850),   # paylaşımlı pencereler
    ('.cr-overlay',            900),   # kırpıcı en üstte
]
onceki = -1
bozuk = []
for sec, beklenen in SIRA:
    sonuc = etkin_deger(sec, 'z-index')
    deger = int(sonuc[2]) if sonuc and sonuc[2].isdigit() else None
    if deger is None:
        bozuk.append(f'{sec}: z-index yok'); continue
    if deger != beklenen:
        bozuk.append(f'{sec}: {deger} (beklenen {beklenen})')
    if deger < onceki:
        bozuk.append(f'{sec}: sıralama bozuk ({deger} < {onceki})')
    onceki = deger
kontrol('Katman sıralaması doğru', not bozuk, '; '.join(bozuk[:3]))
if not bozuk:
    for sec, b in SIRA:
        print(f'  ✅ {sec:<26} z-index:{b}')

# ── 3b. Yığın bağlamı tuzağı ────────────────────────────────
print('\n▸ Yığın bağlamı (stacking context) tuzağı')
print('  Bir kapsayıcıya z-index verilirse içindeki tüm katmanlar')
print('  o bağlama hapsolur ve dışarıdaki öğelerle yarışamaz.\n')

# Overlay'leri barındıran kapsayıcılar z-index ALMAMALI
KAPSAYICILAR = ['#app-main', '#auth-screen', '.main', 'body']
tuzak = []
for kap in KAPSAYICILAR:
    z = etkin_deger(kap, 'z-index')
    if z and z[2] not in ('auto', '0'):
        tuzak.append(f'{kap}: z-index:{z[2]} ({z[3]})')
kontrol('Kapsayıcılar yığın bağlamı yaratmıyor', not tuzak, '; '.join(tuzak))
if not tuzak:
    for kap in KAPSAYICILAR:
        print(f'  ✅ {kap:<20} z-index yok')

# Diğer yığın bağlamı yaratıcıları
RISKLI_OZELLIK = ['transform', 'filter', 'opacity', 'isolation', 'will-change',
                  'backdrop-filter', 'contain', 'mix-blend-mode']
riskli = []
for kap in ['#app-main', '.main']:
    for oz in RISKLI_OZELLIK:
        v = etkin_deger(kap, oz)
        if v and v[2] not in ('none', 'normal', '1', 'auto'):
            riskli.append(f'{kap}: {oz}:{v[2]}')
kontrol('Kapsayıcılarda riskli özellik yok', not riskli, '; '.join(riskli))

# ── 4. Doku katmanı arayüzü kapatmıyor mu? ──────────────────
print('\n▸ Doku katmanı')
tema = open('css/themes.css', encoding='utf-8').read()
grain_z = re.search(r'body::before\{[^}]*z-index:(\d+)', tema)
isik_z  = re.search(r'body::after\{[^}]*z-index:(\d+)', tema)
gz = int(grain_z.group(1)) if grain_z else None
iz = int(isik_z.group(1)) if isik_z else None
kontrol('Grain arayüzün altında', gz is not None and gz < 2, f'z-index:{gz}')
kontrol('Zemin ışığı en altta', iz is not None and iz < (gz or 1), f'z-index:{iz}')
kontrol('Grain tıklamayı engellemiyor',
        'pointer-events:none' in (grain_z.string[grain_z.start():grain_z.start()+300] if grain_z else ''))

# ── Özet ────────────────────────────────────────────────────
print('\n' + '─'*62)
print(f'📊 CSS YERLEŞİMİ: {gecti}/{gecti+basarisiz} geçti')
if basarisiz:
    print(f'⚠️  {basarisiz} sorun — arayüz bozulmuş olabilir!')
    sys.exit(1)
print('🎉 Yerleşim sağlam!')
