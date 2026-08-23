# Test Araçları

## 🌐 Tarayıcıda — program kurmaya gerek yok

Uygulamayı aç → **F12** → **Console**.

### 1. Sağlık Testi (48 kontrol)

    fetch('tests/browser-test.js?v='+Date.now()).then(r=>r.text()).then(eval)

Modüller, çift yükleme, set sayacı, logo yolu, kronometre, ölü kod,
CSS düzeni, DOM elementleri, veri dosyaları, görseller.

### 2. Hesaplama Testi (38 kontrol)

    _ravenfitSelfTest()

Yağ oranı, FFMI, BMR, TDEE, kalori hedefleri, makrolar,
girdi sınırlaması, RED-S ve Bulk risk kontrolü.

**Toplam 86 otomatik kontrol.**

### Logo/görsel sorunu olursa

    fetch('tests/diagnose-logo.js?v='+Date.now()).then(r=>r.text()).then(eval)

---

## 💻 Bilgisayarda — Node.js + Python gerekir

### Tam denetim (tek komut)

    sh tests/audit.sh

8 denetimi sırayla çalıştırır:

| # | Denetim | Ne arar |
|---|---------|---------|
| 1 | JS sözdizimi | 44 dosyada hata |
| 2 | Modül birleştirme | Yükleme sırası sorunu |
| 3 | Regresyon | Düzeltilen hataların geri gelmesi |
| 4 | Uç durum | NaN / Infinity üreten hesaplama |
| 4b | Depolama kotası | Kota dolunca veri kaybı |
| 5 | DOM ID | Olmayan elemente erişim |
| 6 | Yol çözümleme | Kırık dosya yolu |
| 7 | Ölü kod | Erişilemeyen fonksiyon |
| 8 | CSS tekrar | Birebir aynı kural |

### Tek tek

    node tests/regression.js         # 19 test
    node tests/edge-cases.js         # 23 test
    node tests/storage-quota.js      # 14 test
    python3 tests/dom-check.py       # DOM ID denetimi
    python3 tests/path-check.py      # 85 yol
    python3 tests/deadcode-check.py  # ölü kod
