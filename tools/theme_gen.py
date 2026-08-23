#!/usr/bin/env python3
"""RavenFit tema üreteci.

Araştırmaya dayalı kurallar (Material Design, WCAG 2.2, Toptal dark UI):
  • Saf siyah (#000) kullanma — halation ve göz yorgunluğu yapar.
    Taban #101014–#141418 aralığında, hafif renk tonlu.
  • Saf beyaz metin kullanma — #E8E8F0 civarı "beyaz" okunur, parlamaz.
  • Koyu temada doygun renk kullanma — göz titremesi yapar, desatüre et.
  • Yükseklik gölgeyle değil, YÜZEY AÇILIĞIYLA anlatılır.
    4 katman: bg → bg2 → card → card2
  • WCAG AA: normal metin 4.5:1, büyük metin ve UI öğesi 3:1
"""
import colorsys, json

# ─── Renk yardımcıları ──────────────────────────────────────
def hex2rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def rgb2hex(rgb):
    return '#' + ''.join(f'{max(0,min(255,round(c))):02X}' for c in rgb)

def hsl2hex(h, s, l):
    r, g, b = colorsys.hls_to_rgb(h/360, l, s)
    return rgb2hex((r*255, g*255, b*255))

def hex2hsl(hx):
    r, g, b = [c/255 for c in hex2rgb(hx)]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return h*360, s, l

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

def hedef_kontrast(zemin, hue, sat, hedef, koyudan=False):
    """Verilen hue/sat'ta, zemine karşı hedef kontrastı sağlayan en yakın
       açıklığı (lightness) ikili arama ile bulur."""
    lo, hi = (0.0, 1.0)
    en_iyi = None
    for _ in range(40):
        mid = (lo+hi)/2
        c = hsl2hex(hue, sat, mid)
        k = kontrast(c, zemin)
        if k >= hedef:
            en_iyi = c
            if koyudan: lo = mid      # daha koyu ara (light tema)
            else:       hi = mid      # daha açık ara (dark tema)
        else:
            if koyudan: hi = mid
            else:       lo = mid
    return en_iyi or hsl2hex(hue, sat, 0.5 if koyudan else 0.9)


# ─── Tema tanımları ─────────────────────────────────────────
# hue: ana renk tonu · tint: yüzeylere karışan ton miktarı
# marka: kullanıcının bildiği renk. Kontrastı yetersizse otomatik açılır.
KOYU_TEMALAR = {
    'dark':    {'hue': 228, 'tint': 0.06, 'marka': '#E63946', 'ad': 'Gece'},
    'crimson': {'hue': 356, 'tint': 0.16, 'marka': '#E5484D', 'ad': 'Kızıl'},
    'violet':  {'hue': 262, 'tint': 0.16, 'marka': '#9B72FF', 'ad': 'Menekşe'},
    'forest':  {'hue': 152, 'tint': 0.14, 'marka': '#2ECC71', 'ad': 'Orman'},
    'rose':    {'hue': 335, 'tint': 0.14, 'marka': '#F472B6', 'ad': 'Gül'},
    'ocean':   {'hue': 205, 'tint': 0.15, 'marka': '#38BDF8', 'ad': 'Okyanus'},
}

# Koyu temada yüzey merdiveni — açıklık değerleri
KOYU_YUZEY = {'bg': 0.055, 'bg2': 0.082, 'card': 0.108, 'card2': 0.145, 'border': 0.225}

def koyu_tema(cfg):
    h, tint = cfg['hue'], cfg['tint']
    y = {k: hsl2hex(h, tint, v) for k, v in KOYU_YUZEY.items()}

    bg = y['bg']
    # ÖNEMLİ: Metin en koyu zemine (bg) göre değil, EN AÇIK yüzeye (card2)
    # göre hesaplanır. Aksi halde metin bg üzerinde geçer ama iç kartlarda
    # (card2) kalır — ilk denetimde tam bu hata çıkmıştı.
    ref = y['card2']
    text  = hsl2hex(h, 0.10, 0.94)                          # ana metin, off-white
    text2 = hedef_kontrast(ref, h, 0.14, 4.8)               # ikincil, pay bırakılmış
    text3 = hedef_kontrast(ref, h, 0.13, 3.2)               # üçüncül
    # Marka rengi önce olduğu gibi denenir — kimlik korunur.
    # Kontrast yetmiyorsa aynı ton/doygunlukta açılarak düzeltilir.
    marka = cfg['marka']
    if kontrast(marka, bg) >= 4.5:
        accent = marka
    else:
        mh, ms, _ = hex2hsl(marka)
        accent = hedef_kontrast(bg, mh, ms, 4.6)

    ar, ag, ab = hex2rgb(accent)
    return {
        'bg': bg, 'bg2': y['bg2'], 'card': y['card'], 'card2': y['card2'],
        'border': y['border'], 'text': text, 'text2': text2, 'text3': text3,
        'accent': accent,
        'ag': f'rgba({ar},{ag},{ab},0.16)',
        'hbg': f'rgba({hex2rgb(bg)[0]},{hex2rgb(bg)[1]},{hex2rgb(bg)[2]},0.90)',
        # Anlam renkleri — koyu zeminde AÇIK tonlar kullanılır.
        # Material rehberi: koyu temada 200-50 aralığı (açık tonlar),
        # 900-500 (doygun tonlar) değil. Yüksek hedef kontrast otomatik
        # olarak daha açık ve canlı bir renk seçtirir.
        'success': hedef_kontrast(ref, 172, 0.62, 5.5),
        'warn':    hedef_kontrast(ref,  36, 0.92, 6.0),
        'info':    hedef_kontrast(ref, 210, 0.80, 5.0),
        'purple':  hedef_kontrast(ref, 265, 0.78, 4.6),
        'danger':  hedef_kontrast(ref, 354, 0.78, 4.6),
    }

def acik_tema():
    """Aydınlık tema — nötr, hafif soğuk beyaz. Bej değil."""
    h = 220
    bg     = hsl2hex(h, 0.20, 0.975)   # neredeyse beyaz, hafif soğuk
    bg2    = hsl2hex(h, 0.18, 0.945)
    card   = '#FFFFFF'                 # kartlar SAF beyaz → yükselmiş görünür
    card2  = hsl2hex(h, 0.22, 0.965)
    border = hsl2hex(h, 0.16, 0.875)
    text   = hsl2hex(h, 0.22, 0.13)    # neredeyse siyah, saf değil
    # Aydınlık temada en KOYU yüzey bg2 — metin ona göre hesaplanır
    ref_a  = bg2
    text2  = hedef_kontrast(ref_a, h, 0.14, 4.8, koyudan=True)
    text3  = hedef_kontrast(ref_a, h, 0.12, 3.2, koyudan=True)
    # Aydınlık temada marka kırmızısı beyaz üzerinde yetersiz kalır —
    # aynı tonun koyulaştırılmış hâli kullanılır (kimlik korunur).
    mh, ms, _ = hex2hsl('#E63946')
    accent = hedef_kontrast(bg, mh, min(0.85, ms+0.06), 4.6, koyudan=True)
    ar, ag, ab = hex2rgb(accent)
    return {
        'bg': bg, 'bg2': bg2, 'card': card, 'card2': card2, 'border': border,
        'text': text, 'text2': text2, 'text3': text3, 'accent': accent,
        'ag': f'rgba({ar},{ag},{ab},0.12)',
        'hbg': 'rgba(255,255,255,0.92)',
        'success': hedef_kontrast(bg, 168, 0.85, 4.6, koyudan=True),
        'warn':    hedef_kontrast(bg,  32, 0.90, 4.6, koyudan=True),
        'info':    hedef_kontrast(bg, 214, 0.80, 4.6, koyudan=True),
        'purple':  hedef_kontrast(bg, 265, 0.70, 4.6, koyudan=True),
        'danger':  hedef_kontrast(bg, 354, 0.75, 4.6, koyudan=True),
    }


# ─── Doğrulama ──────────────────────────────────────────────
DENETIMLER = [
    ('text',   'bg',    4.5, 'Ana metin / zemin'),
    ('text',   'card',  4.5, 'Ana metin / kart'),
    ('text',   'card2', 4.5, 'Ana metin / iç kart'),
    ('text2',  'bg',    4.5, 'İkincil metin / zemin'),
    ('text2',  'card',  4.5, 'İkincil metin / kart'),
    ('text3',  'bg',    3.0, 'Üçüncül metin / zemin'),
    ('accent', 'bg',    3.0, 'Vurgu / zemin'),
    ('accent', 'card',  3.0, 'Vurgu / kart'),
    ('success','card',  3.0, 'Başarı / kart'),
    ('warn',   'card',  3.0, 'Uyarı / kart'),
    ('info',   'card',  3.0, 'Bilgi / kart'),
    ('border', 'bg',    1.2, 'Kenarlık görünürlüğü'),
]

def dogrula(ad, t):
    hatalar = []
    for f, b, esik, aciklama in DENETIMLER:
        k = kontrast(t[f], t[b])
        if k < esik:
            hatalar.append((aciklama, round(k, 2), esik))
    return hatalar


if __name__ == '__main__':
    temalar = {ad: koyu_tema(cfg) for ad, cfg in KOYU_TEMALAR.items()}
    temalar['light'] = acik_tema()

    print('╔════════════════════════════════════════════════════════════════╗')
    print('║  TEMA DOĞRULAMA — WCAG AA                                      ║')
    print('╚════════════════════════════════════════════════════════════════╝\n')

    print(f"{'TEMA':<10} {'txt/bg':>7} {'txt2/bg':>8} {'txt3/bg':>8} {'acc/bg':>7} {'txt/card':>9} {'DURUM':>8}")
    print('─' * 64)
    tum_gecti = True
    for ad, t in temalar.items():
        h = dogrula(ad, t)
        if h: tum_gecti = False
        print(f"{ad:<10} "
              f"{kontrast(t['text'],t['bg']):>7.1f} "
              f"{kontrast(t['text2'],t['bg']):>8.1f} "
              f"{kontrast(t['text3'],t['bg']):>8.1f} "
              f"{kontrast(t['accent'],t['bg']):>7.1f} "
              f"{kontrast(t['text'],t['card']):>9.1f} "
              f"{'✅' if not h else '❌ '+str(len(h)):>8}")
        for a, k, e in h:
            print(f"           ✗ {a}: {k} (≥{e})")

    print()
    print('🎉 Tüm temalar WCAG AA geçti!' if tum_gecti else '⚠️ Bazı temalar başarısız')

    json.dump(temalar, open('themes_generated.json', 'w'), indent=1)
    print(f'\n→ themes_generated.json ({len(temalar)} tema)')
