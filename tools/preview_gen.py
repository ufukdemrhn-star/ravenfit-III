#!/usr/bin/env python3
"""Tema önizleme sayfası üretici."""
import json

t = json.load(open('themes_v2.json'))

# ── Tema CSS blokları ──────────────────────────────────────
def tema_css(kod, d):
    sec = ':root,[data-theme="gece"]' if kod == 'gece' else f'[data-theme="{kod}"]'
    koyu = d['tip'] == 'koyu'
    sm = 'rgba(12,16,24,.08)'  if not koyu else 'rgba(0,0,0,.28)'
    md = 'rgba(12,16,24,.10)'  if not koyu else 'rgba(0,0,0,.42)'
    lg = 'rgba(12,16,24,.14)'  if not koyu else 'rgba(0,0,0,.55)'
    ov = 'rgba(18,22,30,.42)'  if not koyu else 'rgba(0,0,0,.66)'
    # Cam efekti: koyu temada beyaz, aydınlıkta beyaz ama daha güçlü
    cam      = 'rgba(255,255,255,.045)' if koyu else 'rgba(255,255,255,.70)'
    isik     = 'rgba(255,255,255,.075)' if koyu else 'rgba(255,255,255,.95)'
    grain_op = '.030' if koyu else '.020'
    kat = ' '.join(f'--c{i+1}:{c};' for i, c in enumerate(d['kategorik']))
    sir = ' '.join(f'--s{i+1}:{c};' for i, c in enumerate(d['sirali']))
    return f"""/* ── {d['ad'].upper()} — {d['aciklama']} */
{sec}{{
  --bg:{d['bg']}; --bg2:{d['bg2']}; --card:{d['card']}; --card2:{d['card2']};
  --border:{d['border']};
  --text:{d['text']}; --text2:{d['text2']}; --text3:{d['text3']};
  --accent:{d['accent']}; --accent-btn:{d['accent_btn']}; --on-accent:{d['on_accent']};
  --ag:{d['ag']}; --hbg:{d['hbg']};
  --success:{d['success']}; --warn:{d['warn']}; --danger:{d['danger']};
  --info:{d['info']}; --purple:{d['purple']};
  /* Veri renkleri — anlam renklerinden AYRI */
  {kat}
  {sir}
  /* Doku katmanları */
  --cam:{cam}; --isik:{isik}; --grain-op:{grain_op};
  --shadow-sm:0 1px 2px {sm}; --shadow-md:0 4px 12px {md}; --shadow-lg:0 12px 32px {lg};
  --overlay:{ov};
}}"""

css_temalar = '\n\n'.join(tema_css(k, d) for k, d in t.items())

# Tema seçici kartları
kartlar = ''
for k, d in t.items():
    kartlar += (f'<button class="tc" data-t="{k}" onclick="setT(\'{k}\')">'
                f'<span class="tc-sw" style="background:{d["bg"]}">'
                f'<i style="background:{d["card"]}"></i>'
                f'<b style="background:{d["accent"]}"></b></span>'
                f'<span class="tc-n">{d["ad"]}</span></button>')

HTML = f"""<!DOCTYPE html>
<html lang="tr" data-theme="gece">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RavenFit — Tema Önizleme</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Bebas+Neue&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{{box-sizing:border-box;margin:0;padding:0}}

{css_temalar}

/* ══ DOKU KATMANLARI ══════════════════════════════════════
   1. Grain  — SVG gürültü, çok hafif film greni
   2. Cam    — kartlarda hafif şeffaflık + blur
   3. Işık   — kart üst kenarında 1px iç aydınlık çizgi
   ═══════════════════════════════════════════════════════ */
body{{
  font-family:'Outfit',sans-serif;background:var(--bg);color:var(--text);
  min-height:100vh;padding:0 0 60px;transition:background .3s,color .3s;
  position:relative}}
/* Grain katmanı — tüm sayfaya ince doku */
body::before{{
  content:'';position:fixed;inset:0;pointer-events:none;z-index:1;
  opacity:var(--grain-op);
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}}
/* Zemin derinliği — çok soluk radyal ışık */
body::after{{
  content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
  background:
    radial-gradient(ellipse 80% 50% at 50% -10%, var(--ag), transparent 60%),
    radial-gradient(ellipse 60% 40% at 100% 100%, var(--ag), transparent 65%)}}

.wrap{{max-width:640px;margin:0 auto;padding:16px;position:relative;z-index:2}}
.hdr{{position:sticky;top:0;background:var(--hbg);backdrop-filter:blur(20px);
  -webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border);
  padding:12px 16px;z-index:50;margin:0 -16px 16px}}
h1{{font-family:'Bebas Neue',cursive;font-size:26px;letter-spacing:1px}}
h1 span{{color:var(--accent)}}
.sub{{font-size:11px;color:var(--text3);margin-top:1px}}

/* ── Tema seçici ── */
.tg{{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:20px}}
.tc{{display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 4px;
  background:var(--card2);border:1.5px solid var(--border);border-radius:11px;
  cursor:pointer;font-family:inherit;transition:.18s}}
.tc:hover{{border-color:var(--text3)}}
.tc.on{{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent) inset}}
.tc-sw{{position:relative;width:100%;aspect-ratio:1.4;border-radius:7px;
  border:1px solid var(--border);overflow:hidden;display:block}}
.tc-sw i{{position:absolute;left:5px;top:5px;width:52%;height:46%;border-radius:3px}}
.tc-sw b{{position:absolute;right:5px;bottom:5px;width:11px;height:11px;border-radius:50%}}
.tc-n{{font-size:10px;font-weight:600;color:var(--text2)}}
.tc.on .tc-n{{color:var(--text)}}

/* ── Kart — cam + iç ışık ── */
.c{{background:var(--card);border:1px solid var(--border);border-radius:15px;
  padding:16px;margin-bottom:12px;position:relative;overflow:hidden;
  box-shadow:var(--shadow-sm)}}
/* İç ışık çizgisi — üst kenarda, yükseklik hissi verir */
.c::before{{content:'';position:absolute;top:0;left:12px;right:12px;height:1px;
  background:linear-gradient(90deg,transparent,var(--isik),transparent)}}
.c.glass{{background:var(--cam);backdrop-filter:blur(14px);
  -webkit-backdrop-filter:blur(14px)}}
.ct{{font-size:11px;font-weight:600;color:var(--text2);text-transform:uppercase;
  letter-spacing:.7px;margin-bottom:12px}}

/* ── Tipografi ── */
.t1{{font-size:15px;color:var(--text);margin-bottom:5px}}
.t2{{font-size:13px;color:var(--text2);margin-bottom:5px}}
.t3{{font-size:12px;color:var(--text3)}}
.big{{font-family:'Bebas Neue',cursive;font-size:40px;line-height:1;color:var(--accent)}}

/* ── Butonlar ── */
.row{{display:flex;gap:8px;flex-wrap:wrap}}
.b{{padding:11px 18px;border-radius:11px;border:none;font-family:inherit;
  font-size:14px;font-weight:600;cursor:pointer;transition:.18s}}
.bp{{background:var(--accent-btn);color:var(--on-accent);box-shadow:0 4px 14px var(--ag)}}
.bs{{background:var(--card2);color:var(--text);border:1px solid var(--border)}}
.bg_{{background:transparent;color:var(--accent);border:1.5px solid var(--accent)}}
.b:active{{transform:scale(.97)}}

/* ── Rozetler ── */
.bd{{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:20px;
  font-size:11px;font-weight:600;margin:0 5px 5px 0}}
.bd-a{{background:var(--ag);color:var(--accent)}}
.bd-s{{background:color-mix(in srgb,var(--success) 15%,transparent);color:var(--success)}}
.bd-w{{background:color-mix(in srgb,var(--warn) 15%,transparent);color:var(--warn)}}
.bd-d{{background:color-mix(in srgb,var(--danger) 15%,transparent);color:var(--danger)}}
.bd-i{{background:color-mix(in srgb,var(--info) 15%,transparent);color:var(--info)}}

/* ── Grafikler ── */
.bars{{display:flex;flex-direction:column;gap:11px}}
.bar-r{{display:flex;align-items:center;gap:10px}}
.bar-l{{font-size:12px;color:var(--text2);width:78px;flex-shrink:0}}
.bar-t{{flex:1;height:9px;background:var(--card2);border-radius:5px;overflow:hidden}}
.bar-f{{height:100%;border-radius:5px;transition:width .8s}}
.bar-v{{font-size:12px;font-weight:700;width:44px;text-align:right}}

/* Sıralı ölçek (FFMI) */
.seq{{position:relative;height:6px;margin:14px 0 0}}
.seq-s{{display:flex;height:6px;border-radius:3px;overflow:hidden}}
.seq-s i{{height:100%;flex:1}}
.seq-d{{position:absolute;top:50%;transform:translate(-50%,-50%);width:13px;height:13px;
  border-radius:50%;background:var(--bg);border:2.5px solid var(--accent);
  box-shadow:0 0 0 3px var(--ag)}}
.seq-y{{text-align:center;margin-top:12px;font-size:12px;color:var(--text2)}}

/* Girdi */
.fi{{width:100%;padding:12px 14px;background:var(--card2);border:1.5px solid var(--border);
  border-radius:11px;font-family:inherit;font-size:15px;color:var(--text);outline:none}}
.fi:focus{{border-color:var(--accent);box-shadow:0 0 0 3px var(--ag)}}
.fi::placeholder{{color:var(--text3)}}
.fl{{font-size:12px;color:var(--text2);margin-bottom:6px;display:block}}

/* Liste */
.li{{display:flex;justify-content:space-between;padding:10px 0;
  border-bottom:1px solid var(--border);font-size:13px}}
.li:last-child{{border:none}}
.li b{{font-weight:600}}
.note{{font-size:11px;color:var(--text3);margin-top:10px;line-height:1.6}}
</style>
</head>
<body>

<div class="hdr">
  <div class="wrap" style="padding:0">
    <h1>RAVEN<span>FIT</span> — Tema Önizleme</h1>
    <div class="sub">Kartları tıklayarak temalar arasında geç</div>
  </div>
</div>

<div class="wrap">

  <div class="tg">{kartlar}</div>

  <!-- Tipografi -->
  <div class="c">
    <div class="ct">Tipografi & Okunabilirlik</div>
    <div class="t1">Ana metin — vücut yağ oranın %14.2 olarak hesaplandı.</div>
    <div class="t2">İkincil metin — bu değer atletik aralığın içinde yer alıyor.</div>
    <div class="t3">Üçüncül metin — son ölçüm 3 gün önce kaydedildi.</div>
    <div class="big" style="margin-top:12px">2 480 kcal</div>
    <div class="note">Üç metin katmanı da WCAG AA eşiğini geçer. Üçüncül metin
      en açık yüzeyde bile 3.3:1 üzerindedir.</div>
  </div>

  <!-- Butonlar -->
  <div class="c">
    <div class="ct">Butonlar</div>
    <div class="row">
      <button class="b bp">Analize Başla</button>
      <button class="b bs">Geri</button>
      <button class="b bg_">Düzenle</button>
    </div>
    <div style="margin-top:14px">
      <span class="bd bd-a">● Marka</span><span class="bd bd-s">● Başarılı</span>
      <span class="bd bd-w">● Uyarı</span><span class="bd bd-d">● Tehlike</span>
      <span class="bd bd-i">● Bilgi</span>
    </div>
    <div class="note">Dolu buton zemini <code>--accent-btn</code> kullanır —
      beyaz metinle 4.6:1 sağlar. Marka rengi çizgi ve ikonlarda kalır.</div>
  </div>

  <!-- Cam kart -->
  <div class="c glass">
    <div class="ct">Cam Efektli Kart</div>
    <div class="t2">Bu kart yarı saydam ve arkasını bulanıklaştırır.
      Modal ve üst katman öğeleri için kullanılır.</div>
  </div>

  <!-- Kategorik grafik -->
  <div class="c">
    <div class="ct">Kategorik Grafik — Veri Paleti</div>
    <div class="bars">
      <div class="bar-r"><div class="bar-l">Ektomorf</div>
        <div class="bar-t"><div class="bar-f" style="width:28%;background:var(--c1)"></div></div>
        <div class="bar-v" style="color:var(--c1)">28%</div></div>
      <div class="bar-r"><div class="bar-l">Mezomorf</div>
        <div class="bar-t"><div class="bar-f" style="width:52%;background:var(--c2)"></div></div>
        <div class="bar-v" style="color:var(--c2)">52%</div></div>
      <div class="bar-r"><div class="bar-l">Endomorf</div>
        <div class="bar-t"><div class="bar-f" style="width:20%;background:var(--c3)"></div></div>
        <div class="bar-v" style="color:var(--c3)">20%</div></div>
    </div>
    <div style="display:flex;gap:6px;margin-top:16px">
      <div style="flex:1;height:30px;border-radius:6px;background:var(--c1)"></div>
      <div style="flex:1;height:30px;border-radius:6px;background:var(--c2)"></div>
      <div style="flex:1;height:30px;border-radius:6px;background:var(--c3)"></div>
      <div style="flex:1;height:30px;border-radius:6px;background:var(--c4)"></div>
      <div style="flex:1;height:30px;border-radius:6px;background:var(--c5)"></div>
      <div style="flex:1;height:30px;border-radius:6px;background:var(--c6)"></div>
    </div>
    <div class="note">Kategorik renkler her temaya özel üretilir ve tümü aynı
      algısal ağırlıktadır — hiçbiri diğerinden öne çıkmaz. Anlam renklerinden
      (başarı/uyarı) tamamen ayrıdır, çünkü "mezomorf" iyi ya da kötü değildir.</div>
  </div>

  <!-- Sıralı ölçek -->
  <div class="c">
    <div class="ct">Sıralı Ölçek — FFMI</div>
    <div class="seq">
      <div class="seq-s">
        <i style="background:var(--s1)"></i><i style="background:var(--s2)"></i>
        <i style="background:var(--s3)"></i><i style="background:var(--s4)"></i>
        <i style="background:var(--s5)"></i><i style="background:var(--s6)"></i>
      </div>
      <div class="seq-d" style="left:58%"></div>
    </div>
    <div class="seq-y">Sen: <b style="color:var(--text)">21.4</b> —
      <b style="color:var(--s4)">İyi</b></div>
    <div class="note">Sıralı ölçekler tüm temalarda aynı gradyanı kullanır —
      soğuktan sıcağa. Böylece "düşük/yüksek" algısı tema değişse de bozulmaz.</div>
  </div>

  <!-- Form -->
  <div class="c">
    <div class="ct">Form Alanları</div>
    <label class="fl">Vücut Ağırlığı</label>
    <input class="fi" placeholder="80.5" style="margin-bottom:12px">
    <label class="fl">Bel Çevresi</label>
    <input class="fi" placeholder="85">
  </div>

  <!-- Liste -->
  <div class="c">
    <div class="ct">Veri Listesi</div>
    <div class="li"><span style="color:var(--text2)">Bazal metabolizma</span><b>1 780 kcal</b></div>
    <div class="li"><span style="color:var(--text2)">Aktivite çarpanı</span><b>1.55</b></div>
    <div class="li"><span style="color:var(--text2)">Günlük hedef</span>
      <b style="color:var(--accent)">2 480 kcal</b></div>
    <div class="li"><span style="color:var(--text2)">Protein</span>
      <b style="color:var(--c1)">176 g</b></div>
    <div class="li"><span style="color:var(--text2)">Karbonhidrat</span>
      <b style="color:var(--c2)">248 g</b></div>
    <div class="li"><span style="color:var(--text2)">Yağ</span>
      <b style="color:var(--c3)">69 g</b></div>
  </div>

  <!-- Yüzey merdiveni -->
  <div class="c">
    <div class="ct">Yüzey Merdiveni</div>
    <div style="display:flex;gap:0;border-radius:10px;overflow:hidden;border:1px solid var(--border)">
      <div style="flex:1;height:56px;background:var(--bg);display:flex;align-items:flex-end;
        justify-content:center;padding-bottom:5px;font-size:9px;color:var(--text3)">bg</div>
      <div style="flex:1;height:56px;background:var(--bg2);display:flex;align-items:flex-end;
        justify-content:center;padding-bottom:5px;font-size:9px;color:var(--text3)">bg2</div>
      <div style="flex:1;height:56px;background:var(--card);display:flex;align-items:flex-end;
        justify-content:center;padding-bottom:5px;font-size:9px;color:var(--text3)">card</div>
      <div style="flex:1;height:56px;background:var(--card2);display:flex;align-items:flex-end;
        justify-content:center;padding-bottom:5px;font-size:9px;color:var(--text3)">card2</div>
    </div>
    <div class="note">Yükseklik gölgeyle değil yüzey açıklığıyla anlatılır.
      Her temanın kendi merdiven eğrisi vardır — bu yüzden temalar birbirinin
      renk filtresi gibi görünmez.</div>
  </div>

</div>

<script>
function setT(k){{
  document.documentElement.setAttribute('data-theme',k);
  document.documentElement.style.colorScheme = (k==='aydinlik')?'light':'dark';
  document.querySelectorAll('.tc').forEach(function(c){{
    c.classList.toggle('on', c.dataset.t===k);
  }});
  try{{ localStorage.setItem('rf_preview_theme',k); }}catch(e){{}}
}}
setT(localStorage.getItem('rf_preview_theme')||'gece');
</script>
</body>
</html>"""

open('/mnt/user-data/outputs/tema-onizleme.html','w',encoding='utf-8').write(HTML)
print(f'✅ tema-onizleme.html — {HTML.count(chr(10))} satır, {len(HTML)/1024:.0f} KB')
print(f'   {len(t)} tema · doku: grain + cam + iç ışık')
