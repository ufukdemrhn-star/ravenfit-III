#!/bin/sh
# Tüm testleri sırayla çalıştırır.  Kullanım:  sh tests/run.sh
cd "$(dirname "$0")/.."
echo "▸ JS dosyalarını birleştiriyorum..."
node -e "
const fs=require('fs');
const idx=fs.readFileSync('index.html','utf8');
const files=[...idx.matchAll(/<script src=\"(js\/[^\"?]+)[^\"]*\"/g)].map(m=>m[1]);
fs.writeFileSync('tests/_combined.tmp.js', files.map(f=>fs.readFileSync(f,'utf8')).join('\n'));
console.log('  '+files.length+' dosya birleştirildi');
"
echo "▸ Sözdizimi kontrolü..."
node --check tests/_combined.tmp.js && echo "  ✅ geçerli"
echo "▸ Regresyon testi..."
node tests/regression.js
echo ""
echo "▸ Uç durum testi..."
node tests/edge-cases.js
echo ""
echo "▸ Yol çözümleme testi..."
python3 tests/path-check.py 2>/dev/null | tail -3 || echo "  (python3 yok, atlandı)"
rm -f tests/_combined.tmp.js
