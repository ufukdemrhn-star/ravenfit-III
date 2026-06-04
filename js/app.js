// ════════════════════════════════════════════════════════════
//  app.js — GİRİŞ NOKTASI
//  Modülleri birleştirir, OLAY DELEGASYONUNU kurar (268 onclick'in
//  yerine tek dinleyici), öz-testi çalıştırır, service worker'ı kaydeder.
// ════════════════════════════════════════════════════════════

import { U, R } from './state.js';
import { calcBF, calcFFMI, calcBMR, calcIdealRange, bfBand } from './calc.js';
import { runSelfTest } from './selftest.js';

// ── EYLEM KAYDI ──────────────────────────────────────────────
// HTML'de onclick yok. Bunun yerine elemanlar data-action="..." der,
// fonksiyonlar burada, kendi modül kapsamında, kapalı yaşar.
const actions = {
  setGender(el, arg) {
    U.gender = arg;
    document.querySelectorAll('[data-action="setGender"]').forEach(b =>
      b.classList.toggle('on', b.dataset.arg === arg));
  },

  calculate() {
    // inputları durum objesine al
    U.height = +document.getElementById('in-height').value;
    U.weight = +document.getElementById('in-weight').value;
    U.neck   = +document.getElementById('in-neck').value;
    U.waist  = +document.getElementById('in-waist').value;
    U.hip    = +document.getElementById('in-hip').value;

    // hesapla
    R.bf = calcBF(U);
    const f = calcFFMI(U, R.bf);
    R.bmr = calcBMR(f.ffm);
    const ideal = calcIdealRange(U.height);

    // göster
    document.getElementById('out').innerHTML =
      `Yağ oranı: <b>%${R.bf}</b> &nbsp;<span class="muted">(${bfBand(R.bf, U.gender === 'male')} bant)</span><br>` +
      `FFMI: <b>${f.ffmi}</b> &nbsp;·&nbsp; Yağsız kütle: <b>${f.ffm} kg</b><br>` +
      `BMR: <b>${R.bmr} kcal</b><br>` +
      `İdeal kilo: <b>${ideal.lo}–${ideal.hi} kg</b>`;
  },
};

// ── TEK DİNLEYİCİ — tüm uygulamadaki her data-action'ı yönetir ──
// Sonradan üretilen butonlar bile otomatik çalışır (yeniden bağlama yok).
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-action]');
  if (!trigger) return;
  const fn = actions[trigger.dataset.action];
  if (fn) fn(trigger, trigger.dataset.arg);
});

// ── AÇILIŞ: öz-test ──────────────────────────────────────────
const st = runSelfTest();
const stEl = document.getElementById('selftest');
stEl.textContent = st.failed === 0
  ? `✅ Öz-test geçti (${st.passed}/${st.passed})`
  : `❌ ${st.failed} test kaldı — matematiğe bak!`;
stEl.className = 'status ' + (st.failed === 0 ? 'ok' : 'bad');

// başlangıç cinsiyetini işaretle
actions.setGender(null, U.gender);

// ── SERVICE WORKER (PWA / offline) ───────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => {
      const el = document.getElementById('pwa');
      el.textContent = '✅ Service worker kayıtlı — offline & kurulabilir';
      el.className = 'status ok';
    })
    .catch(() => {
      const el = document.getElementById('pwa');
      el.textContent = '⚠️ Service worker kaydı başarısız (HTTPS/Pages gerekir)';
      el.className = 'status bad';
    });
}
