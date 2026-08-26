#!/usr/bin/env python3
"""Giriş sonrası kancaların doğru yerde olduğunu doğrular.

Neden var: yoneticiKontrolEt ve _onayDurumunuEsitle çağrıları
yanlışlıkla "eski kullanıcı adı" hata bloğunun içine yerleşti.
O blok yalnızca giriş REDDEDİLİRSE çalışır — yani kancalar
normal girişte hiç tetiklenmiyordu. Sözdizimi geçerliydi,
hiçbir test yakalamadı.
"""
import re, os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)) + '/..')

gecti = basarisiz = 0
def kontrol(etiket, kosul, detay=''):
    global gecti, basarisiz
    if kosul:
        gecti += 1; print(f'  ✅ {etiket}')
    else:
        basarisiz += 1; print(f'  ❌ {etiket}' + (f'  → {detay}' if detay else ''))

s = open('js/auth/firebase.js', encoding='utf-8').read()

print('\n╔══════════════════════════════════════════════════════════╗')
print('║  GİRİŞ KANCALARI                                         ║')
print('╚══════════════════════════════════════════════════════════╝')

KANCALAR = ['avatarOnar', 'yoneticiKontrolEt', '_onayDurumunuEsitle', 'yayinlaProfil']

print('\n▸ Kancalar mevcut mu?')
for k in KANCALAR:
    kontrol(f'{k} çağrılıyor', f'setTimeout({k}' in s, 'çağrı yok')

print('\n▸ Erken çıkış bloğunun İÇİNDE mi?')
# "Eski kullanıcı adı" bloğunun sınırlarını bul
i = s.find('_yanlisAd = _denenenNick')
if i < 0:
    kontrol('Kullanıcı adı doğrulaması mevcut', False, 'blok bulunamadı')
else:
    # Bloğun sonu: "return;\n        }" 
    son = s.find('          return;\n        }', i)
    blok = s[i:son] if son > 0 else ''
    for k in KANCALAR:
        icinde = f'setTimeout({k}' in blok
        kontrol(f'{k} hata bloğu DIŞINDA', not icinde,
                'yalnızca giriş reddedilince çalışır')

print('\n▸ Doğru sırada mı?')
konumlar = {}
for k in KANCALAR:
    m = re.search(r'setTimeout\(' + re.escape(k), s)
    if m: konumlar[k] = m.start()
if len(konumlar) == len(KANCALAR):
    # yayinlaProfil en son olmalı — diğerleri veriyi hazırlar
    enSon = max(konumlar, key=konumlar.get)
    kontrol('yayinlaProfil en sonda', enSon == 'yayinlaProfil', f'en son: {enSon}')

print('\n' + '─'*58)
print(f'📊 GİRİŞ KANCALARI: {gecti}/{gecti+basarisiz} geçti')
if basarisiz:
    print(f'⚠️  {basarisiz} sorun — kancalar tetiklenmiyor olabilir!')
    sys.exit(1)
print('🎉 Kancalar doğru yerde!')
