# -*- coding: utf-8 -*-
"""Egzersizleri arketiplere eşler ve kalibre eder.

Eşleştirme id/isim üzerinden anahtar kelimelerle yapılır.
Sıra ÖNEMLİDİR: özel desenler genel olanlardan önce gelir.
"""
import json, re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'arketipler.py'),
         encoding='utf-8').read())

# (desen, arketip) — ilk eşleşen kazanır
KURALLAR = [
 # ── Boyun ──
 (r'neck', 'boyun'),

 # ── Kardiyo ──
 (r'burpee|devil-press|down-ups', 'burpee'),
 (r'bike-ergo|elliptical|jumping-jack|high-knees|lateral-shuffle|rower|ski-erg|run', 'kardiyo-tam-vucut'),

 # ── Olimpik / patlayıcı ──
 (r'clean|snatch|jerk|thruster|high-pull', 'olimpik-cekis'),
 (r'kettlebell-swing|swing', 'kettlebell-swing'),
 (r'box-jump|jump-squat|squat-jump|jumping-lunge|broad-jump|tuck-jump', 'kutu-sicrama'),

 # ── Taşıma / kavrama ──
 (r'carry|farmer|suitcase', 'tasima'),
 (r'-hold$|barbell-hold|plate-pinch|dead-hang|hang$', 'kavrama-izometrik'),

 # ── Karın ──
 (r'pallof|anti-rotation', 'karin-anti-rotasyon'),
 (r'side-plank|side-bend|suitcase-|windshield|russian-twist|chop|oblique', 'karin-yan'),
 (r'rollout|ab-wheel', 'karin-rollout'),
 (r'leg-raise|knee-raise|knee-tuck|toes-to-bar|hanging-.*raise|v-up|hollow', 'bacak-kaldiris'),
 (r'plank|dead-bug|bird-dog|hollow-hold|bear-crawl|mountain-climber', 'karin-izometrik'),
 (r'crunch|sit-up|situp|curl-up|ab-', 'karin-fleksiyon'),

 # ── Kol ──
 (r'preacher|spider-curl|concentration-curl', 'biceps-destekli'),
 (r'hammer-curl|hammer|reverse-curl|zottman', 'biceps-cekic'),
 (r'wrist-curl|wrist-|forearm|reverse-wrist', 'onkol-izolasyon'),
 (r'pushdown|press-down|kickback.*tricep|tricep.*kickback', 'triceps-pushdown'),
 (r'skull|overhead.*extension|tricep.*extension|extension.*tricep|french-press', 'triceps-uzatma'),
 (r'close-grip', 'dar-tutus-itis'),
 (r'curl', 'biceps-curl'),

 # ── Omuz ──
 (r'arnold', 'arnold-press'),
 (r'external-rotation|internal-rotation|cuban|scarecrow', 'rotator-manset'),
 (r'face-pull|pull-apart|rear-delt|reverse-fly|rear-fly|reverse-pec', 'ters-fly'),
 (r'lateral-raise|side-raise|lateral-lateral|upright-row', 'yan-kaldiris'),
 (r'front-raise', 'on-kaldiris'),
 (r'shrug', 'shrug'),
 (r'overhead-press|shoulder-press|military|strict-press|push-press|z-press|landmine-press|pike-push|handstand', 'dikey-itis'),

 # ── Sırt ──
 (r'pullover', 'pullover'),
 (r'pendlay|bent-over-row|barbell-row|t-bar|meadows', 'yatay-cekis-katı'),
 (r'row', 'yatay-cekis'),
 (r'chin-up|supinated|underhand.*pull', 'dikey-cekis-supin'),
 (r'pull-up|pullup|pulldown|lat-pull|muscle-up|rope-climb', 'dikey-cekis'),
 (r'back-extension|hyperextension|good-morning|reverse-hyper', 'hiperekstansiyon'),
 (r'sumo-deadlift|sumo', 'sumo-menteşe'),
 (r'romanian|rdl|stiff-leg|stiff-legged', 'menteşe-hamstring'),
 (r'deadlift', 'menteşe-agir'),

 # ── Göğüs ──
 (r'incline.*press|incline.*push|low-to-high.*fly|incline.*fly', 'yatay-itis-egimli'),
 (r'decline.*press|decline.*push|high-to-low.*fly|decline.*fly', 'yatay-itis-ters-egimli'),
 (r'\bfly\b|flye|pec-deck|cable-cross|chest-cross', 'gogus-izolasyon'),
 (r'dips|dip$', 'dips'),
 (r'bench-press|chest-press|floor-press|push-up|pushup|larsen', 'yatay-itis'),

 # ── Kalça ──
 (r'hip-thrust|glute-bridge|bridge', 'hip-thrust'),
 (r'kickback|glute-extension|pull-through|donkey', 'glute-kickback'),
 (r'abduction|clamshell|side-lying.*raise|monster-walk|banded-walk', 'kalca-abduksiyon'),
 (r'adduction|copenhagen', 'kalca-adduksiyon'),

 # ── Bacak ──
 (r'leg-curl|hamstring-curl|nordic|glute-ham|ghr', 'leg-curl'),
 (r'leg-extension|knee-extension', 'leg-extension'),
 (r'calf|heel-raise|toe-raise', 'calf-raise'),
 (r'leg-press|hack-squat|hack|pendulum|belt-squat|sissy', 'squat-makine'),
 (r'split-squat|bulgarian|rear-foot|front-foot', 'split-squat'),
 (r'step-up|stepup|box-step', 'step-up'),
 (r'lunge', 'lunge'),
 (r'front-squat|goblet|overhead-squat|zercher|front-rack', 'squat-on-yuk'),
 (r'squat', 'squat'),

 # ── Elle eşlenen özel durumlar ──
 (r'banded-overhead-iso-hold', 'dikey-itis'),
 (r'cable-glute-pullthrough|frog-pump', 'hip-thrust'),
 (r'countermovement-jump|diagonal-jump|pogo-jump|lateral-jump-over|liftover', 'kutu-sicrama'),
 (r'deadbugs|flutter-kicks|l-sit|superman|windmill', 'karin-izometrik'),
 (r'rack-pull', 'menteşe-agir'),
 (r'wall-sit', 'squat-makine'),

 # ── Genel yedekler ──
 (r'press', 'dikey-itis'),
 (r'raise', 'yan-kaldiris'),
]

# Zorluk/ekipman değiştiricileri
def degistirici_uygula(kaslar, e):
    k = dict(kaslar)
    eid = e['id']
    ekip = e.get('equipment', []) or []

    # Birincil kas ASLA düşürülmez — hareketin amacıdır.
    # Bu koruma olmadan makine değiştiricisi oblique-9 olan bir
    # kablo chop hareketinde birinciliği yok ediyordu.
    birincil = max(k.values()) if k else 0
    korunan = {kas for kas, p in k.items() if p == birincil}

    # Makine ve kablo: gövde desteklenir, STABİLİZATÖRLER düşer
    if any(x in ekip for x in ('machine','cable')) or 'machine' in eid or 'cable' in eid:
        for kas in ('spinal-erectors','abs','obliques','glute-med'):
            if kas in k and k[kas] > 1 and kas not in korunan:
                k[kas] = max(1, k[kas] - 2)

    # Tek taraflı: karın/oblik stabilizasyonu artar
    if re.search(r'single-arm|single-leg|one-arm|one-leg|alternating|unilateral|suitcase', eid):
        for kas, art in (('obliques',2), ('abs',1), ('glute-med',1)):
            if kas in k and kas not in korunan:
                k[kas] = min(birincil - 1, k[kas] + art)

    # Bant: direnç eğrisi tepede zorlaşır, temel profil aynı kalır
    # Duraklamalı/eksantrik: profil aynı, zorluk farkı difficulty'de

    # Vücut ağırlığı çekişlerde ön kol payı artar (kavrama)
    if 'bodyweight' in ekip and 'forearms' in k and 'forearms' not in korunan:
        k['forearms'] = min(birincil - 1, k['forearms'] + 1)

    return k

def arketip_bul(e):
    metin = e['id'].lower() + ' ' + e.get('name_en','').lower()
    for desen, ark in KURALLAR:
        if re.search(desen, metin):
            return ark
    return None
