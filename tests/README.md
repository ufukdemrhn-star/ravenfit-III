# Test Araçları

## 🌐 Tarayıcıda test (program kurmaya gerek yok)

Uygulamayı aç → F12 → Console sekmesi → şunu yapıştır:

    fetch('tests/browser-test.js').then(r=>r.text()).then(eval)

23 kontrol çalışır: modüller yüklü mü, JSON'lar çift yükleniyor mu,
set sayacı çalışıyor mu, logo yolu doğru mu, kronometre temiz mi.

Sonra hesaplama testini çalıştır:

    _ravenfitSelfTest()

38 test: yağ oranı, FFMI, BMR, kalori hedefleri, makrolar, RED-S riski.

## 💻 Bilgisayarda test (Node.js / Python gerekir)

Geliştirici araçları — zorunlu değil.

    sh tests/run.sh                    # regresyon testi
    python3 tests/deadcode-check.py    # ölü kod taraması
