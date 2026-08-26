#!/bin/sh
# ══════════════════════════════════════════════════════════════
#  RavenFit — TAM DENETİM
#  Her değişiklikten sonra çalıştır:   sh tests/audit.sh
# ══════════════════════════════════════════════════════════════
cd "$(dirname "$0")/.."

YESIL='\033[0;32m'; KIRMIZI='\033[0;31m'; SARI='\033[0;33m'; MOR='\033[0;35m'; SIFIR='\033[0m'
HATA=0

baslik() { printf "\n${MOR}▸ %s${SIFIR}\n" "$1"; }
sonuc()  { if [ "$1" -eq 0 ]; then printf "  ${YESIL}✅ %s${SIFIR}\n" "$2";
           else printf "  ${KIRMIZI}❌ %s${SIFIR}\n" "$2"; HATA=$((HATA+1)); fi; }

printf "${MOR}╔══════════════════════════════════════════════════════╗${SIFIR}\n"
printf "${MOR}║   RAVENFIT — TAM DENETİM                             ║${SIFIR}\n"
printf "${MOR}╚══════════════════════════════════════════════════════╝${SIFIR}\n"

# ── 0. HTML yapısı ─────────────────────────────────────────
baslik "0. HTML yapısı"
python3 tests/html-check.py > /tmp/rf_html.log 2>&1
! grep -q "❌" /tmp/rf_html.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_html.log | head -1)"
grep "❌" /tmp/rf_html.log | head -6

# ── 0b. Tema denetimi ──────────────────────────────────────
baslik "0b. Tema denetimi (WCAG AA)"
python3 tests/theme-check.py > /tmp/rf_theme.log 2>&1
! grep -q "❌" /tmp/rf_theme.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_theme.log | head -1)"
grep "❌\|✗" /tmp/rf_theme.log | head -8

# ── 0b2. CSS yerleşimi ─────────────────────────────────────
baslik "0b2. CSS yerleşimi"
python3 tests/layout-check.py > /tmp/rf_layout.log 2>&1
! grep -q "❌" /tmp/rf_layout.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_layout.log | head -1)"
grep "❌\|🔴" /tmp/rf_layout.log | head -6

# ── 0c. Tema göçü ──────────────────────────────────────────
baslik "0c. Tema göçü"
node -e "
const fs=require('fs');
const idx=fs.readFileSync('index.html','utf8');
const files=[...idx.matchAll(/<script src=\"(js\/[^\"?]+)[^\"]*\"/g)].map(m=>m[1]);
fs.writeFileSync('tests/_combined.tmp.js', files.map(f=>fs.readFileSync(f,'utf8')).join('\n'));
" 2>/dev/null
node tests/theme-migration.js > /tmp/rf_goc.log 2>&1
! grep -q "❌" /tmp/rf_goc.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_goc.log | head -1)"
grep "❌" /tmp/rf_goc.log | head -5

# ── 0d. Giriş kancaları ────────────────────────────────────
baslik "0d. Giriş kancaları"
python3 tests/login-hooks.py > /tmp/rf_hook.log 2>&1
! grep -q "❌" /tmp/rf_hook.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_hook.log | head -1)"
grep "❌" /tmp/rf_hook.log | head -5

# ── 1. JS sözdizimi ────────────────────────────────────────
baslik "1. JavaScript sözdizimi"
GECERLI=0; TOPLAM=0
for f in $(find js -name "*.js" | sort); do
  TOPLAM=$((TOPLAM+1))
  if node --check "$f" 2>/dev/null; then GECERLI=$((GECERLI+1));
  else printf "  ${KIRMIZI}❌ %s${SIFIR}\n" "$f"; node --check "$f" 2>&1 | head -2; fi
done
[ "$GECERLI" -eq "$TOPLAM" ]; sonuc $? "$GECERLI/$TOPLAM dosya geçerli"

# ── 2. Modülleri birleştir ─────────────────────────────────
baslik "2. Modül birleştirme"
node -e "
const fs=require('fs');
const idx=fs.readFileSync('index.html','utf8');
const files=[...idx.matchAll(/<script src=\"(js\/[^\"?]+)[^\"]*\"/g)].map(m=>m[1]);
fs.writeFileSync('tests/_combined.tmp.js', files.map(f=>fs.readFileSync(f,'utf8')).join('\n'));
console.log('  '+files.length+' dosya birleştirildi');
" && node --check tests/_combined.tmp.js
sonuc $? "Birleşik kod geçerli"

# ── 3. Regresyon ───────────────────────────────────────────
baslik "3. Regresyon testi"
node tests/regression.js > /tmp/rf_reg.log 2>&1
grep -q "test geçti" /tmp/rf_reg.log && ! grep -q "❌" /tmp/rf_reg.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* test geçti' /tmp/rf_reg.log | head -1)"
grep "❌" /tmp/rf_reg.log | head -5

# ── 4. Uç durum ────────────────────────────────────────────
baslik "4. Uç durum testi"
node tests/edge-cases.js > /tmp/rf_edge.log 2>&1
! grep -q "❌" /tmp/rf_edge.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_edge.log | head -1)"
grep "❌" /tmp/rf_edge.log | head -5

# ── 4b. Depolama kota testi ────────────────────────────────
baslik "4b. Depolama kota testi"
node tests/storage-quota.js > /tmp/rf_quota.log 2>&1
! grep -q "❌" /tmp/rf_quota.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_quota.log | head -1)"
grep "❌" /tmp/rf_quota.log | head -5

# ── 4c. Yedekleme / geri yükleme ───────────────────────────
baslik "4c. Yedekleme / geri yükleme"
node tests/backup-restore.js > /tmp/rf_backup.log 2>&1
! grep -q "❌" /tmp/rf_backup.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_backup.log | head -1)"
grep "❌" /tmp/rf_backup.log | head -5

# ── 4d. Misafir akışı ──────────────────────────────────────
baslik "4d. Misafir akışı"
node tests/guest-flow.js > /tmp/rf_guest.log 2>&1
! grep -q "❌" /tmp/rf_guest.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_guest.log | head -1)"
grep "❌" /tmp/rf_guest.log | head -5

# ── 4e. Gizlilik kilidi ────────────────────────────────────
baslik "4e. Gizlilik kilidi"
node tests/privacy-lock.js > /tmp/rf_kilit.log 2>&1
! grep -q "❌" /tmp/rf_kilit.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_kilit.log | head -1)"
grep "❌" /tmp/rf_kilit.log | head -5

# ── 4f. Biyografi sınırı ───────────────────────────────────
baslik "4f. Biyografi sınırı"
node tests/bio-limit.js > /tmp/rf_bio.log 2>&1
! grep -q "❌" /tmp/rf_bio.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_bio.log | head -1)"
grep "❌" /tmp/rf_bio.log | head -5

# ── 4g. Kullanıcı adı değiştirme ───────────────────────────
baslik "4g. Kullanıcı adı değiştirme"
node tests/nickname-change.js > /tmp/rf_nick.log 2>&1
! grep -q "❌" /tmp/rf_nick.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_nick.log | head -1)"
grep "❌" /tmp/rf_nick.log | head -5

# ── 4h. Sosyal çekirdek ────────────────────────────────────
baslik "4h. Sosyal çekirdek"
node tests/social-core.js > /tmp/rf_sosyal.log 2>&1
! grep -q "❌" /tmp/rf_sosyal.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_sosyal.log | head -1)"
grep "❌" /tmp/rf_sosyal.log | head -5

# ── 4i. Gönderi sistemi ────────────────────────────────────
baslik "4i. Gönderi sistemi"
node tests/posts.js > /tmp/rf_post.log 2>&1
! grep -q "❌" /tmp/rf_post.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_post.log | head -1)"
grep "❌" /tmp/rf_post.log | head -5

# ── 4j. Fotoğraf kırpıcı ───────────────────────────────────
baslik "4j. Fotoğraf kırpıcı"
node tests/cropper.js > /tmp/rf_crop.log 2>&1
! grep -q "❌" /tmp/rf_crop.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_crop.log | head -1)"
grep "❌" /tmp/rf_crop.log | head -5

# ── 4k. Beğeni ve yorum ────────────────────────────────────
baslik "4k. Beğeni ve yorum"
node tests/interactions.js > /tmp/rf_inter.log 2>&1
! grep -q "❌" /tmp/rf_inter.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_inter.log | head -1)"
grep "❌" /tmp/rf_inter.log | head -5

# ── 4l. Ana akış ───────────────────────────────────────────
baslik "4l. Ana akış"
node tests/feed.js > /tmp/rf_feed.log 2>&1
! grep -q "❌" /tmp/rf_feed.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_feed.log | head -1)"
grep "❌" /tmp/rf_feed.log | head -5

# ── 4m. Profesyonel başvurusu ──────────────────────────────
baslik "4m. Profesyonel başvurusu"
node tests/pro-application.js > /tmp/rf_pro.log 2>&1
! grep -q "❌" /tmp/rf_pro.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_pro.log | head -1)"
grep "❌" /tmp/rf_pro.log | head -5

# ── 4n. Yönetici paneli ────────────────────────────────────
baslik "4n. Yönetici paneli"
node tests/admin-panel.js > /tmp/rf_admin.log 2>&1
! grep -q "❌" /tmp/rf_admin.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_admin.log | head -1)"
grep "❌" /tmp/rf_admin.log | head -5

# ── 4o. Rozet geri alma ────────────────────────────────────
baslik "4o. Rozet geri alma"
node tests/badge-revoke.js > /tmp/rf_rozet.log 2>&1
! grep -q "❌" /tmp/rf_rozet.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_rozet.log | head -1)"
grep "❌" /tmp/rf_rozet.log | head -5

# ── 4p. Fiyat hesaplayıcı ──────────────────────────────────
baslik "4p. Fiyat hesaplayıcı"
node tests/pricing.js > /tmp/rf_fiyat.log 2>&1
! grep -q "❌" /tmp/rf_fiyat.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_fiyat.log | head -1)"
grep "❌" /tmp/rf_fiyat.log | head -5

# ── 4r. Engelleme ve gizlilik ──────────────────────────────
baslik "4r. Engelleme ve gizlilik"
node tests/privacy.js > /tmp/rf_gizlilik.log 2>&1
! grep -q "❌" /tmp/rf_gizlilik.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_gizlilik.log | head -1)"
grep "❌" /tmp/rf_gizlilik.log | head -5

# ── 5. DOM ID denetimi ─────────────────────────────────────
baslik "5. DOM ID denetimi"
python3 tests/dom-check.py > /tmp/rf_dom.log 2>&1
KIRIK=$(grep -o 'KIRIK ID REFERANSLARI  ([0-9]*)' /tmp/rf_dom.log | grep -o '[0-9]*')
[ "$KIRIK" = "0" ]
sonuc $? "$KIRIK kırık ID referansı"
[ "$KIRIK" != "0" ] && sed -n '/A. KIRIK/,/B. NULL/p' /tmp/rf_dom.log | head -14

# ── 6. Yol çözümleme ───────────────────────────────────────
baslik "6. Yol çözümleme"
python3 tests/path-check.py > /tmp/rf_path.log 2>&1
! grep -q "❌" /tmp/rf_path.log
sonuc $? "$(grep -o '[0-9]*/[0-9]* geçti' /tmp/rf_path.log | head -1)"
grep "❌" /tmp/rf_path.log | head -5

# ── 7. Ölü kod ─────────────────────────────────────────────
baslik "7. Ölü kod taraması"
python3 tests/deadcode-check.py > /tmp/rf_dead.log 2>&1
OLU=$(grep -o 'ULAŞILAMAYAN     : [0-9]*' /tmp/rf_dead.log | grep -o '[0-9]*$')
[ "$OLU" = "0" ]
sonuc $? "$OLU ulaşılamayan fonksiyon"
[ "$OLU" != "0" ] && sed -n '/ÖLÜ FONKSİYONLAR/,$p' /tmp/rf_dead.log | head -20

# ── 8. CSS duplicate ───────────────────────────────────────
baslik "8. CSS tekrar taraması"
DUP=$(python3 - <<'PYEOF'
import re,glob,os
from collections import defaultdict
k=defaultdict(list)
for f in sorted(glob.glob('css/*.css')):
    s=re.sub(r'/\*[\s\S]*?\*/','',open(f,encoding='utf-8').read())
    for m in re.finditer(r'([^{}@]+)\{([^{}]*)\}',s):
        sel=' '.join(m.group(1).split()); body=''.join(m.group(2).split())
        if sel: k[sel].append((os.path.basename(f),body))
n=sum(1 for s,h in k.items() if len(h)>1 and len({x[1] for x in h})==1 and len({x[0] for x in h})>1)
print(n)
PYEOF
)
[ "$DUP" = "0" ]; sonuc $? "$DUP birebir tekrar eden kural"

rm -f tests/_combined.tmp.js

# ── ÖZET ───────────────────────────────────────────────────
printf "\n${MOR}%s${SIFIR}\n" "──────────────────────────────────────────────────────"
if [ "$HATA" -eq 0 ]; then
  printf "${YESIL}🎉 TÜM DENETİMLER GEÇTİ — kod temiz!${SIFIR}\n"
else
  printf "${KIRMIZI}⚠️  %s denetim başarısız — yukarıya bak${SIFIR}\n" "$HATA"
  exit 1
fi
