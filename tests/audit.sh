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
