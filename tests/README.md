# Test Araçları

## 🌐 Tarayıcıda test — program kurmaya gerek yok

Uygulamayı aç → **F12** → **Console** sekmesi.

### 1. Sağlık Testi (35 kontrol)

    fetch('tests/browser-test.js').then(r=>r.text()).then(eval)

Kontrol ettikleri:
- 16 modül yüklendi mi
- JSON dosyaları çift yükleniyor mu
- Set sayacı +/− butonları çalışıyor mu
- PR stilleri CSS'te mi, logo yolu doğru mu
- Kronometre gereksiz timer kuruyor mu
- Ölü kod temizlendi mi, güvenlik yardımcıları bağlı mı
- CSS duplicate var mı, 8 modül yüklü mü
- 8 veri dosyası ve 4 görsel erişilebilir mi

### 2. Hesaplama Testi (38 kontrol)

    _ravenfitSelfTest()

Yağ oranı, FFMI, BMR, TDEE, kalori hedefleri, makrolar,
girdi sınırlaması, RED-S ve Bulk risk kontrolü.

**Toplam 73 otomatik kontrol — hepsi tarayıcıda.**

---

## 💻 Bilgisayarda test — Node.js / Python gerekir

Zorunlu değil, tarayıcı testleri aynı alanları kapsar.
Bunlar geliştirme sırasında dosya bazlı derin kontrol içindir.

    sh tests/run.sh                    # 19 regresyon + 23 uç durum + 85 yol testi
    python3 tests/deadcode-check.py    # erişilemeyen fonksiyon taraması
    python3 tests/path-check.py        # kırık dosya yolu taraması

**Uç durum testi** özellikle değerli: bel ≤ boyun, boy 0 gibi
imkânsız girdilerde hesaplamaların NaN/Infinity üretmediğini doğrular.

---

## 🔍 Logo görünmüyorsa

    fetch('tests/diagnose-logo.js?v='+Date.now()).then(r=>r.text()).then(eval)

Dosyanın sunucuda olup olmadığını, CSS'in hangi yolu aradığını ve
tarayıcının bunu neye çözdüğünü adım adım gösterir; sonunda net teşhis verir.
