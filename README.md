# RavenFit — Modüler Yapı

Versiyon 0.3.0.1 (beta)

## Klasör Yapısı

```
/
├── index.html              Uygulama iskeleti (HTML + modül bağlantıları)
├── manifest.json           PWA tanımı
│
├── css/                    8 stil dosyası
│   ├── themes.css          6 tema değişkeni
│   ├── base.css            Header, ekranlar, splash
│   ├── components.css      Buton, form, kart, modal
│   ├── profile.css         Avatar, ayarlar çekmecesi
│   ├── workout.css         Antrenman ekranı ve grid
│   ├── misc.css            Animasyon, tema noktaları, rozet
│   ├── supplements.css     Supplement akordiyon
│   └── calculators.css     Hesaplayıcılar, PR testi
│
├── js/                     44 modül
│   ├── core/               Durum, yardımcılar, tema, depolama
│   ├── ui/                 Bildirim, ekran, sihirbaz, grafik
│   ├── health/             Hesaplama, hedef, RED-S, özel durum
│   ├── tabs/               Sekme içerikleri
│   ├── profile/            Avatar, ayarlar, profil
│   ├── nutrition/          Supplement, panel, su
│   ├── workout/            Branş, havuz, program, motor, araç
│   ├── calculators/        1RM, çalışma seti, uyku, PR
│   ├── badges/             Rozet sistemi
│   ├── auth/               Firebase
│   ├── admin/              Self-test (geliştirme)
│   └── app.js              Başlatıcı — en son yüklenir
│
├── data/                   8 JSON veri dosyası
│   ├── exercises-*.json    Egzersiz havuzları (fitness/yüzme/postür)
│   ├── workouts-*.json     Hazır programlar
│   ├── conditions.json     Özel sağlık durumları
│   └── badges.json         Rozet tanımları
│
└── assets/
    ├── icons/              logo, favicon, PWA ikonları
    ├── gif/                Egzersiz GIF'leri (boş — ileride)
    └── video/              Egzersiz videoları (boş — ileride)
```

## Yükleme Sırası

`index.html` içindeki `<script>` etiketleri **sırayla** yüklenir. Sıra önemlidir:

1. `js/core/*` — global durum ve yardımcılar
2. `js/ui/*` → `js/health/*` → ... — özellik modülleri
3. `js/app.js` — başlatıcı, **en son**
4. Firebase SDK → `initFirebase()`

Yeni modül eklerken `js/app.js`'ten **önce** ekleyin.

## Geliştirme

**Yeni egzersiz eklemek:** `data/exercises-fitness.json` içindeki `exercises` dizisine yeni blok ekleyin. Dosyanın başındaki `_README` alanı alan açıklamalarını içerir.

**Hesaplama doğrulama:** Tarayıcı konsoluna `_ravenfitSelfTest()` yazın. 38 test çalışır, matematik bozulmuşsa yakalar.

**GIF/video eklemek:** Dosyayı `assets/gif/` altına koyun, JSON'daki ilgili egzersizin `gif` alanına yolu yazın.

## Test Etme

Değişiklik yaptıktan sonra üç kontrolü çalıştır:

**1. Tarayıcı konsolu** — hesaplamalar doğru mu

    _ravenfitSelfTest()

**2. Regresyon testi** — düzeltilen hatalar geri geldi mi

    sh tests/run.sh

**3. Ölü kod taraması** — erişilemeyen fonksiyon var mı

    python3 tests/deadcode-check.py

---

## Değişiklik Geçmişi

### Faz A — Kırık işlevler
- Başlatma kodu iki yerde çalışıyordu → JSON'lar çift yükleniyordu (16 istek → 8)
- Set sayacı `+/−` butonları olmayan bir element arıyordu → çalışmıyordu
- PR ekranı logo yolu modülerleşmede kırılmıştı
- Kronometre boşa çalışan ikinci bir timer kuruyordu

### Faz B — Ölü kod temizliği
- 16 erişilemeyen fonksiyon silindi (eski kronometre nesli, boş stub'lar, kullanılmayan yardımcılar)
- 3 ölü durum değişkeni silindi
- `closeWarmup` içindeki aynı işi yapan iki dal birleştirildi
- `_safeRound` / `_safeDiv` güvenlik yardımcıları hesaplamalara bağlandı:
  - `calcBF` — Navy formülünde `log10` negatif argüman koruması (bel ≤ boyun durumu)
  - `calcFFMI` — boy 0 olduğunda `Infinity` koruması
  - `calcBT`, BMI, yağ kütlesi — sıfıra bölme ve yuvarlama hassasiyeti

**Sonuç:** 326 fonksiyonun tamamı erişilebilir, ölü kod yok.

### Faz C — CSS düzeni
- `.mlist-*` kuralları iki dosyada birebir tekrarlanıyordu → `components.css`'te tek kaldı
- PR testi "nasıl hissettirdi" ekranının 20 stil kuralı `pr-test.js` içinde çalışma
  anında `<style>` olarak enjekte ediliyordu → `calculators.css`'e taşındı
- Tam CSS taraması yapıldı: başka birebir tekrar yok
  (13 "aynı seçici" bulgusu `@media` override'ı ve keyframe yüzdesi — kasıtlı)

**Sonuç:** JavaScript artık hiç `<style>` enjekte etmiyor, tüm stiller `css/` altında.
