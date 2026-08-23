# Test Araçları

Bu klasör geliştirme içindir — yayına yüklemek zorunda değilsin.

## 1. Tarayıcıda hesaplama testi

Uygulamayı aç, konsola yaz:

```
_ravenfitSelfTest()
```

38 test çalışır. Yağ oranı, FFMI, BMR, kalori hedefleri, makrolar, RED-S
riski ve girdi sınırlamalarını doğrular. Matematik bozulursa hemen yakalar.

## 2. Regresyon testi (Node.js gerekir)

Düzeltilen hataların geri gelmediğini doğrular.

```
node tests/regression.js
```

Kontrol ettikleri:
- Başlatma kodu tek kez çalışıyor mu (çift fetch var mı)
- Set sayacı +/− butonları çalışıyor mu
- PR ekranı logo yolu doğru mu
- Kronometre gereksiz timer kuruyor mu

## 3. Ölü kod taraması

```
python3 tests/deadcode-check.py
```

Kök kümeden (inline onclick + app.js) erişilemeyen fonksiyonları listeler.
