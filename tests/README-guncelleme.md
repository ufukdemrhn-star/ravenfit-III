# Güncelleme Paketleri

GitHub tek seferde 100 dosya yükleme sınırı koyuyor. Bu yüzden her
güncellemede tüm proje değil, **yalnızca değişen dosyalar** verilir.

## Nasıl yüklenir

1. `ravenfit-guncelleme-X.X.X.zip` dosyasını indir ve aç
2. İçindeki `YUKLE.txt` dosyasını oku — ne değişti yazıyor
3. Klasör yapısını **koruyarak** depona yükle
   (`js/social/discover.js` → depoda da `js/social/discover.js`)
4. Aynı yoldaki dosyaların üzerine yaz
5. Tarayıcıda `Ctrl + Shift + R`

## GitHub web arayüzünde

- **Add file → Upload files** ekranına klasörü sürükle-bırak
- Alt klasörler otomatik oluşur, elle klasör açmana gerek yok
- Var olan dosyaların üzerine yazılır

## Tam paket ne zaman gerekir

Sadece sıfırdan kurulum yaparken. Mevcut depo güncelken delta yeterli.
