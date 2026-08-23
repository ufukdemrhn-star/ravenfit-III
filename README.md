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

> ⚠️ **CSS yol kuralı:** CSS içindeki `url()` yolları **CSS dosyasının** konumuna
> göre çözülür, HTML sayfasına göre değil. `css/calculators.css` içinden logoya
> ulaşmak için `../assets/icons/logo.png` yazılmalı. Bu kural taşıma sırasında
> gözden kaçtı ve arka plan logosu kırıldı; düzeltildi ve `tests/path-check.py`
> ile artık otomatik doğrulanıyor.

### Önbellek yönetimi

`index.html` içindeki CSS ve JS bağlantılarında `?v=0.3.1` sürüm damgası var.
Bir dosyayı güncellediğinde **bu numarayı artır** — aksi halde tarayıcılar
eski sürümü önbellekten sunmaya devam eder.

    <link rel="stylesheet" href="css/base.css?v=0.3.2">
    <script src="js/core/state.js?v=0.3.2"></script>

Tek seferlik çözüm için sert yenileme: `Ctrl + Shift + R` (Mac: `Cmd + Shift + R`)

### Faz D — Denetim altyapısı
- **DOM ID denetimi** eklendi. `adjustRestTime` hatası bir sınıftı, aynı sınıftan
  4 tane daha bulundu ve düzeltildi:
  - `ws-footer` — class olduğu halde `getElementById` ile aranıyordu (ölü satır)
  - `set-count` — eski sistemden kalma, 2 yerde (kaldırıldı)
  - `settings-bg` → `sdw-overlay` (doğru ID)
  - `avatar-display` → `avatar-initials` + `avatar-img`
- `tests/audit.sh` — 8 denetimi tek komutta çalıştıran ana script
- Tarayıcı testi 35 → 41 kontrole çıktı

**Sonuç:** 0 kırık ID referansı, 0 riskli guard'sız erişim.

### Faz E — Depolama dayanıklılığı

Inline stil dönüşümü ölçüldü: 220 riskli düzenleme karşılığında sadece
**3.7 KB (%0.89)** kazanç sağlıyordu. Değmediği için yapılmadı; onun yerine
derin risk taraması yapıldı ve **gerçek bir veri kaybı hatası** bulundu.

**Sorun:** `localStorage` kotası dolduğunda `setItem` istisna fırlatıyor.
`saveData()` içinde bu istisna yakalanmadığı için fonksiyon yarıda kesiliyor
ve hemen ardından gelen `saveToFirebase()` **hiç çalışmıyordu**. Yani depolama
dolduğunda kullanıcı verisini hem yerelde hem bulutta kaybediyordu — sessizce.

Kota gerçekten dolabilir: avatar 2 MB'a kadar base64 olarak saklanıyor ve
antrenman geçmişi sınırsız büyüyor. Tipik tarayıcı sınırı 5 MB.

**Çözüm — güvenli depolama katmanı (`js/core/storage.js`):**
- `_lsSet` / `_lsGet` / `_lsRemove` — asla istisna fırlatmaz
- Kota dolunca kullanıcı bir kez uyarılır, Firebase senkronu devam eder
- 60 doğrudan `localStorage` çağrısı bu katmandan geçirildi
- `_lsKullanim()` — Ayarlar ekranında doluluk çubuğu ve en çok yer kaplayan kayıt

**Yükleme sırası düzeltmesi:** `storage.js` artık `state.js`'ten önce yükleniyor
(state.js `_lsSet` kullanıyor).

### Faz F — Dayanıklılık

Bellek sızıntısı, yarış durumu ve veri doğrulama taraması. Üç gerçek sorun:

**1. Yedekleme eksikti — veri kaybı riski**
`exportData` 10 veri türünden yalnızca **2'sini** yedekliyordu. Kullanıcı
yedek alıp geri yüklediğinde antrenman geçmişi, rozetler, özel programlar,
branş seçimleri ve supplement kayıtları **siliniyordu**.
→ 11 anahtarın tamamı yedekleniyor.

**2. İçe aktarma doğrulamasızdı**
Herhangi bir JSON dosyası, içeriği kontrol edilmeden mevcut verinin üzerine
yazılıyordu — onay bile sorulmuyordu.
→ Format imzası, tip kontrolü, boyut sınırı ve kullanıcı onayı eklendi.

**3. Antrenman timer sızıntısı**
`_doStartSession` önceki oturumun `setInterval`'ini temizlemiyordu. Antrenman
iki kez başlatılırsa eski sayaç arka planda çalışmaya devam ediyordu.
→ Oturum başında temizleniyor.

Ayrıca 3 Firestore çağrısına `.catch` eklendi (yakalanmamış promise reddi).

---

## v0.4.2.1 — Arayüz ve kullanım iyileştirmeleri

| # | Değişiklik |
|---|-----------|
| 1 | Giriş ekranı: logo 92→130px, silüet opaklığı 2 kat, 3 katmanlı radyal gradyan doku |
| 2 | Tarayıcı otomatik doldurmasının alanı beyaza boyaması engellendi |
| 3 | "Misafir olarak devam et" → sade metin bağlantısı |
| 4 | Wizard sırasında başlık ortalanıyor |
| 5 | Versiyon 0.4.2.1 (beta) |
| 6 | Misafir banner'ı artık wizard'da çıkmıyor (Devam butonuyla çakışıyordu) |
| 7 | Splash'e "Giriş Yap / Kayıt Ol" butonları — misafir modundan geri dönülebiliyor |
| 8 | Ölçüm ipuçları belirginleştirildi (punto, renk, sol kenarlık) |
| 9 | 3'lü seçenek satırındaki taşma düzeltildi (`minmax(0,1fr)`) |
| 10 | İlk hafta ölçüleri 6 satır × 2 sütun; "— opsiyonel" kaldırıldı |
| 11 | FFMI: iki ayrı bar birleştirildi, 6 banda çıkarıldı, "Sen: X — Y" satırı eklendi |
| 12 | Vücut tipi grafiği: çubuk ↔ SVG halka geçişi, tercih saklanıyor |
| 13 | Ölçülerim'de boy/yaş artık kaydediliyor + eski kayıtlar için onarım |
| 14 | Alt menü ve misafir banner'ı 640px sütuna hizalandı |
| 15 | Geçmiş kayıtlar: ilk 3 + "daha fazla / daha az göster" |
| 16 | Araçlar: Kronometre ve Set Sayacı hesaplayıcılara taşındı, havuz/geçmiş alta indi |

**Yan bulgu:** FFMI rozeti ile skala farklı etiketler gösteriyordu (skala "İyi" derken
rozet "Atletik" diyordu). Bantlar `_ffmiBands()` altında tek kaynağa taşındı —
skala, rozet ve detay tablosu artık aynı eşikleri kullanıyor.

### v0.4.2.2 — Kritik düzeltme

**Sorun:** v0.4.2.1'de giriş ekranını düzenlerken bir `</div>` eksik kaldı.
`auth-screen` kapanmadığı için `app-main` ve tüm ekranlar onun *içine* girdi.
Uygulama açılmadı — ama tarayıcı hata vermedi, konsol tertemizdi ve
o zamanki testlerin **hepsi geçti**. Sessiz bozulmaydı.

**Kalıcı çözüm:** `tests/html-check.py` eklendi. Denetim listesinin en başında
çalışır ve şunları kontrol eder:
- Etiket açma/kapama dengesi (div, button, span, label…)
- Kritik kapsayıcıların kendi içinde dengeli kapanması
- Ekranların iç içe geçmemesi (`auth-screen` ile `app-main` ayrı olmalı)
- id tekrarı
- Inline handler parantez dengesi

Ayrıca `tests/guest-flow.js` eklendi — misafir akışının tamamını sahte DOM'da
adım adım yürütür (misafir → splash → wizard → sonuç → giriş ekranına dönüş).

Tarayıcı testine de aynı yapı kontrolü **en başa** eklendi.

### v0.4.2.3 — Görsel düzeltmeler

- **FFMI barı** yağ oranı barıyla aynı görsel dile getirildi: 6px yükseklik,
  3px köşe, 13px accent renkli işaretçi. Nokta artık tam ortada.
  (Eski `.ffmi-scale` kuralı dosyada kalmıştı ve `gap:2px` ile bantları
  ayırıyordu — temizlendi.)
- **Grafik değiştirme butonu** emoji yerine SVG ikon kullanıyor. Emoji'ye
  filtre uygulandığında beyaza dönüyordu; SVG `currentColor` ile temanın
  accent rengini doğrudan miras alıyor.
- **Egzersiz havuzu geri butonu** geldiği yeri hatırlıyor:
  Araçlar → Araçlar'a, Branş detayı → Branş detayına, Özel program → oluşturucuya.
  Inline `onclick` içindeki kırılgan tırnak kaçışı yerine
  `openExerciseLibraryFrom(branş, nereden)` yardımcısı kullanıldı.
- **Wizard ölçü etiketlerindeki** renk vurgusu kaldırıldı (Omuz/Kalça artık sade).

---

## v0.5.0.0 — Tema sistemi yeniden kuruldu

### Sorun

- **297 sabit renk** tema değişkenlerini bypass ediyordu. Tema değiştirince
  kartların yarısı eski renkte kalıyordu.
- **Tüm temalarda `--text3` WCAG'i geçmiyordu** (1.7–2.25, gereken ≥3.0).
- **Aydınlık tema bej zeminliydi** (`#E8E4DC`) — kirli görünüyor, kartlar
  zeminden ayrışmıyordu.
- Taban renkleri neredeyse saf siyahtı (`#080809`) — araştırmaya göre
  halation ve göz yorgunluğu yapar.

### Çözüm

Temalar `tools/theme_gen.py` ile **hesaplanarak** üretildi. Her renk,
hedef kontrast oranını sağlayana kadar ikili aramayla bulunur.

**Uygulanan kurallar** (Material Design + WCAG 2.2 araştırması):

| Kural | Uygulama |
|---|---|
| Saf siyah kullanma | Tabanlar `#0C`–`#10` aralığında, tema tonuyla renklendirilmiş |
| Saf beyaz metin kullanma | `#EE`–`#F1` aralığı — "beyaz" okunur, parlamaz |
| Yükseklik gölgeyle değil yüzeyle | `bg → bg2 → card → card2` açıklık merdiveni |
| Koyu temada açık anlam renkleri | Material 200-50 aralığı, doygun koyu tonlar değil |
| Metin en açık yüzeye göre ölçülür | `card2` referans alınır — yoksa iç kartlarda kontrast düşüyordu |

**7 tema:** Gece · Kızıl · Menekşe · Orman · Gül · **Okyanus (yeni)** · Aydınlık

Marka renkleri korundu — hepsi zaten kontrastı geçiyordu. Yalnızca dolu
butonlar için `--accent-btn` türetildi (beyaz metinle 4.6:1).

**Yeni değişkenler:** `--accent-btn` `--on-accent` `--danger`
`--shadow-sm/md/lg` `--overlay` `--shadow-sm-c/md-c`

**`color-scheme`** ayarlanıyor — kaydırma çubuğu, tarih seçici ve otomatik
doldurma da temaya uyuyor.

### Tema seçici

Küçük dairelerden **kare kartlara** geçildi. Her kart temanın gerçek zemin
rengini ve marka rengini birlikte gösteriyor, altında adı yazıyor.
Çekmece genişliğince 4 sütunlu ızgara (dar ekranda 3).

### Doğrulama

`tests/theme-check.py` — 7 tema × 20 kontrast kombinasyonu, yüzey merdiveni
sıralaması ve sabit renk kaçağı taraması. Denetim listesinde otomatik çalışır.

**Sabit renk: 297 → 29** (kalanlar rozet/dekoratif renkler).
