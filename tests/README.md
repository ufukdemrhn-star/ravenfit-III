# Test Araçları

## 🌐 Tarayıcıda test — program kurmaya gerek yok

Uygulamayı aç → **F12** → **Console** sekmesi.

### 1. Sağlık Testi (34 kontrol)

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

**Toplam 72 otomatik kontrol — hepsi tarayıcıda.**

---

## 💻 Bilgisayarda test — Node.js / Python gerekir

Zorunlu değil, tarayıcı testleri aynı alanları kapsar.
Bunlar geliştirme sırasında dosya bazlı derin kontrol içindir.

    sh tests/run.sh                    # 18 regresyon + 23 uç durum testi
    python3 tests/deadcode-check.py    # erişilemeyen fonksiyon taraması

**Uç durum testi** özellikle değerli: bel ≤ boyun, boy 0 gibi
imkânsız girdilerde hesaplamaların NaN/Infinity üretmediğini doğrular.
