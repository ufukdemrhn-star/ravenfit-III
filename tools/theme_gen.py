#!/usr/bin/env python3
"""RavenFit tema üreteci v2 — OKLCH tabanlı.

NEDEN OKLCH?
  HSL'de aynı "lightness" farklı renklerde farklı parlaklıkta görünür.
  hsl(60,80%,50%) sarı ile hsl(240,80%,50%) mavi aynı L değerinde ama
  sarı çok daha parlak algılanır. Bu yüzden HSL ile üretilen temalar
  "aynı ama hue döndürülmüş" hissi verir — filtre gibi.

  OKLCH algısal olarak uniform: aynı L = aynı algılanan parlaklık.
  Bu sayede her tema kendi karakterine sahip olabilir.

TASARIM İLKESİ
  Her tema FARKLI bir yüzey eğrisi ve doygunluk profili kullanır.
  Sadece hue değişmez — kontrast seviyesi, chroma miktarı ve
  nötr sıcaklığı da temaya özgüdür.
"""
import math, json

# ═══════════════════════════════════════════════════════════
#  OKLCH ↔ sRGB dönüşümü
# ═══════════════════════════════════════════════════════════

def _srgb_gamma(c):
    return 12.92*c if c <= 0.0031308 else 1.055*(c**(1/2.4)) - 0.055

def _srgb_ungamma(c):
    return c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4

def oklch_to_rgb(L, C, H):
    """OKLCH → sRGB (0-255). Gamut dışıysa chroma azaltılarak sığdırılır."""
    for adim in range(101):
        c = C * (1 - adim/100)
        a_ = c * math.cos(math.radians(H))
        b_ = c * math.sin(math.radians(H))

        l_ = L + 0.3963377774*a_ + 0.2158037573*b_
        m_ = L - 0.1055613458*a_ - 0.0638541728*b_
        s_ = L - 0.0894841775*a_ - 1.2914855480*b_
        l, m, s = l_**3, m_**3, s_**3

        r = +4.0767416621*l - 3.3077115913*m + 0.2309699292*s
        g = -1.2684380046*l + 2.6097574011*m - 0.3413193965*s
        b = -0.0041960863*l - 0.7034186147*m + 1.7076147010*s

        if all(-0.0005 <= x <= 1.0005 for x in (r, g, b)):
            return tuple(round(max(0, min(255, _srgb_gamma(max(0, min(1, x)))*255)))
                         for x in (r, g, b))
    return (0, 0, 0)

def oklch(L, C, H):
    return '#' + ''.join(f'{v:02X}' for v in oklch_to_rgb(L, C, H))

def hex2rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def luminans(hx):
    r, g, b = [_srgb_ungamma(c/255) for c in hex2rgb(hx)]
    return 0.2126*r + 0.7152*g + 0.0722*b

def kontrast(a, b):
    l1, l2 = luminans(a), luminans(b)
    if l1 < l2: l1, l2 = l2, l1
    return (l1+0.05)/(l2+0.05)

def L_icin_kontrast(zemin, C, H, hedef, yukari=True):
    """Verilen chroma/hue'da hedef kontrastı sağlayan OKLCH L değerini bul."""
    lo, hi = (0.0, 1.0)
    en_iyi = None
    for _ in range(50):
        mid = (lo+hi)/2
        renk = oklch(mid, C, H)
        if kontrast(renk, zemin) >= hedef:
            en_iyi = renk
            if yukari: hi = mid     # daha koyu dene (en yakın geçen)
            else:      lo = mid
        else:
            if yukari: lo = mid
            else:      hi = mid
    return en_iyi or oklch(0.9 if yukari else 0.2, C, H)


# ═══════════════════════════════════════════════════════════
#  TEMA TANIMLARI — her biri kendi karakterine sahip
# ═══════════════════════════════════════════════════════════
# yuzey  : 5 kademe OKLCH L değeri (temaya özgü eğri)
# chroma : yüzeylerdeki renk miktarı (temaya özgü)
# hue    : nötr yüzeylerin ton açısı
# marka  : accent OKLCH (L, C, H)

TEMALAR = {
 'gece': {
   'ad':'Gece', 'tip':'koyu',
   'aciklama':'nötr soğuk, orta kontrast — varsayılan',
   'hue':255, 'chroma':[.006,.008,.010,.013,.020],
   'yuzey':[.175,.212,.245,.288,.375],      # yumuşak, dengeli merdiven
   'marka':(.615,.205,22),                   # marka kırmızısı
   'metin':(.965,.010),                      # (L, C)
   'veri_hue':255, 'veri_yay':300,
 },
 'okyanus': {
   'ad':'Okyanus', 'tip':'koyu',
   'aciklama':'derin mavi-turkuaz, yüksek kontrast',
   'hue':232, 'chroma':[.022,.028,.034,.042,.055],
   'yuzey':[.160,.200,.238,.285,.382],      # daha derin taban, geniş aralık
   'marka':(.735,.135,225),                  # açık gök mavisi
   'metin':(.968,.014),
   'veri_hue':225, 'veri_yay':290,
 },
 'menekse': {
   'ad':'Menekşe', 'tip':'koyu',
   'aciklama':'mor, yumuşak kontrast — sıcak koyu',
   'hue':300, 'chroma':[.016,.022,.028,.036,.048],
   'yuzey':[.185,.222,.256,.300,.388],      # daha açık taban, yumuşak
   'marka':(.680,.175,300),
   'metin':(.962,.012),
   'veri_hue':300, 'veri_yay':280,
 },
 'bakir': {
   'ad':'Bakır', 'tip':'koyu',
   'aciklama':'sıcak amber-bakır, toprak tonlu',
   'hue':55, 'chroma':[.014,.020,.026,.034,.046],
   'yuzey':[.180,.216,.250,.293,.380],
   'marka':(.740,.150,62),                   # amber
   'metin':(.964,.016),
   'veri_hue':62, 'veri_yay':300,
 },
 'aydinlik': {
   'ad':'Aydınlık', 'tip':'acik',
   'aciklama':'nötr yumuşak — kartlar beyaz, zemin gri',
   'hue':255, 'chroma':[.004,.006,.003,.006,.014],
   # zemin gri, kart BEYAZ → gölgeyle ayrışır (kullanıcı tercihi C)
   'yuzey':[.960,.935,1.000,.972,.885],
   'marka':(.540,.190,25),
   'metin':(.235,.020),
   'veri_hue':255, 'veri_yay':300,
 },
}


def tema_uret(k, cfg):
    koyu = (cfg['tip'] == 'koyu')
    H, ch, yz = cfg['hue'], cfg['chroma'], cfg['yuzey']

    bg    = oklch(yz[0], ch[0], H)
    bg2   = oklch(yz[1], ch[1], H)
    card  = oklch(yz[2], ch[2], H)
    card2 = oklch(yz[3], ch[3], H)
    border= oklch(yz[4], ch[4], H)

    # Metin: en zor yüzeye göre ölçülür
    ref = card2 if koyu else bg2
    mL, mC = cfg['metin']
    text  = oklch(mL, mC, H)
    text2 = L_icin_kontrast(ref, mC*1.6, H, 4.9, yukari=koyu)
    text3 = L_icin_kontrast(ref, mC*1.4, H, 3.3, yukari=koyu)

    # Marka
    aL, aC, aH = cfg['marka']
    accent = oklch(aL, aC, aH)
    if kontrast(accent, bg) < 3.2:
        accent = L_icin_kontrast(bg, aC, aH, 3.4, yukari=koyu)
    # Dolu buton — beyaz metinle 4.6:1
    accent_btn = L_icin_kontrast('#FFFFFF', aC, aH, 4.6, yukari=False)

    ar, ag, ab = hex2rgb(accent)
    br, bgc, bb = hex2rgb(bg)

    # Anlam renkleri — SADECE durum bildirimi için
    anlam_hedef = 4.8
    success = L_icin_kontrast(ref, .120, 158, anlam_hedef, yukari=koyu)
    warn    = L_icin_kontrast(ref, .150,  75, anlam_hedef, yukari=koyu)
    danger  = L_icin_kontrast(ref, .165,  25, anlam_hedef, yukari=koyu)
    info    = L_icin_kontrast(ref, .130, 245, anlam_hedef, yukari=koyu)

    return {
        'ad': cfg['ad'], 'tip': cfg['tip'], 'aciklama': cfg['aciklama'],
        'bg':bg, 'bg2':bg2, 'card':card, 'card2':card2, 'border':border,
        'text':text, 'text2':text2, 'text3':text3,
        'accent':accent, 'accent_btn':accent_btn, 'on_accent':'#FFFFFF',
        'ag':f'rgba({ar},{ag},{ab},{0.14 if koyu else 0.10})',
        'hbg':f'rgba({br},{bgc},{bb},{0.88 if koyu else 0.90})',
        'success':success, 'warn':warn, 'danger':danger, 'info':info,
        'purple': L_icin_kontrast(ref, .140, 305, anlam_hedef, yukari=koyu),
        '_ref': ref, '_koyu': koyu, '_cfg': cfg,
    }


# ═══════════════════════════════════════════════════════════
#  VERİ PALETLERİ — anlam renklerinden AYRI
# ═══════════════════════════════════════════════════════════

def kategorik_palet(t, adet=6):
    """Grafik kategorileri için eşit ağırlıklı renkler.
       Hepsi aynı OKLCH L ve C değerinde → hiçbiri öne çıkmaz.
       Hue'lar marka renginden başlayarak eşit aralıkla dağıtılır."""
    cfg = t['_cfg']
    koyu = t['_koyu']
    bas, yay = cfg['veri_hue'], cfg['veri_yay']

    # Zemine göre sabit bir kontrast seviyesi seç, tüm renkler orada dursun
    hedef = 4.4
    renkler = []
    for i in range(adet):
        h = (bas + (yay * i / adet)) % 360
        renkler.append(L_icin_kontrast(t['_ref'], .128, h, hedef, yukari=koyu))
    return renkler


def sirali_palet(t, adet=6):
    """Sıralı ölçekler (FFMI gibi) için tek gradyan.
       Kullanıcı tercihi: sıralı ölçekler tema-bağımsız TEK gradyan.
       Soğuktan sıcağa, algısal olarak eşit adımlarla."""
    koyu = t['_koyu']
    # Mavi → turkuaz → yeşil → sarı → turuncu → kırmızı
    hue_yol = [248, 205, 158, 100, 62, 28]
    L_taban = 0.700 if koyu else 0.560
    return [oklch(L_taban, .135, hue_yol[i]) for i in range(adet)]


if __name__ == '__main__':
    cikti = {}
    print('╔═══════════════════════════════════════════════════════════════════╗')
    print('║  TEMA ÜRETİCİ v2 — OKLCH                                          ║')
    print('╚═══════════════════════════════════════════════════════════════════╝\n')

    for k, cfg in TEMALAR.items():
        t = tema_uret(k, cfg)
        t['kategorik'] = kategorik_palet(t)
        t['sirali'] = sirali_palet(t)
        cikti[k] = {kk: vv for kk, vv in t.items() if not kk.startswith('_')}

        print(f"── {t['ad'].upper():<10} {t['aciklama']}")
        print(f"   yüzey  {t['bg']} → {t['bg2']} → {t['card']} → {t['card2']}")
        print(f"   metin  {t['text']} / {t['text2']} / {t['text3']}")
        print(f"   marka  {t['accent']}   buton {t['accent_btn']}")
        print(f"   veri   {' '.join(t['kategorik'])}")
        print(f"   kont.  txt {kontrast(t['text'],t['bg']):.1f} · "
              f"txt2 {kontrast(t['text2'],t['_ref']):.1f} · "
              f"txt3 {kontrast(t['text3'],t['_ref']):.1f} · "
              f"acc {kontrast(t['accent'],t['bg']):.1f}")
        print()

    json.dump(cikti, open('themes_v2.json','w'), ensure_ascii=False, indent=1)
    print(f'→ themes_v2.json ({len(cikti)} tema)')
