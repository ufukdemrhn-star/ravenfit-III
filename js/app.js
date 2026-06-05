// ════════════════════════════════════════════════════════════
//  app.js — GİRİŞ NOKTASI
//  Modülleri birleştirir, OLAY DELEGASYONUNU kurar, öz-testi
//  çalıştırır, service worker'ı kaydeder.
// ════════════════════════════════════════════════════════════
import { U, R } from './state.js';
import {
  calcBF, calcFFMI, calcBMR, calcIdealRange, bfBand,
  calcGoalCalories, calcMacros, calcWaterTarget
} from './calc.js';
import { runSelfTest } from './selftest.js';

const GOAL_LABELS = { cut: 'Cut (yağ ver)', recomp: 'Recomp', maintain: 'Koru', bulk: 'Bulk (kütle al)' };

const v = (id) => document.getElementById(id).value;
function highlight(action, arg) {
  document.querySelectorAll(`[data-action="${action}"]`).forEach(b =>
    b.classList.toggle('on', b.dataset.arg === String(arg)));
}

// ── EYLEM KAYDI (HTML'de onclick yok; data-action var) ──
const actions = {
  setGender(el, arg) { U.gender = arg; highlight('setGender', arg); },
  setAct(el, arg)    { U.actM = parseFloat(arg); highlight('setAct', arg); },
  setGoal(el, arg)   { U.goal = arg; highlight('setGoal', arg); },

  calculate() {
    U.height = +v('in-height'); U.weight = +v('in-weight');
    U.neck = +v('in-neck'); U.waist = +v('in-waist'); U.hip = +v('in-hip');
    const male = U.gender === 'male';

    // vücut kompozisyonu
    R.bf = calcBF(U);
    const f = calcFFMI(U, R.bf);
    R.ffm = f.ffm;
    R.bmr = calcBMR(f.ffm);
    const ideal = calcIdealRange(U.height);

    // enerji
    const tdee = Math.round(R.bmr * U.actM);
    const goalCals = calcGoalCalories(tdee, U.goal, R.bf, male);

    // makro
    const mac = calcMacros(goalCals, U.goal, 'hybrid', f.ffm, U.weight, R.bf, male, null);

    // su (antrenman sıklığı aktiviteden türetilir)
    const freq = U.actM >= 1.725 ? 'high' : U.actM >= 1.55 ? 'mid' : 'low';
    const water = calcWaterTarget(U.weight, freq, 0);

    document.getElementById('out').innerHTML =
      `<div class="grp"><div class="h">VÜCUT</div>` +
        `Yağ oranı: <b>%${R.bf}</b> <span class="muted">(${bfBand(R.bf, male)} bant)</span><br>` +
        `FFMI: <b>${f.ffmi}</b> &nbsp;·&nbsp; Yağsız kütle: <b>${f.ffm} kg</b><br>` +
        `BMR: <b>${R.bmr} kcal</b> &nbsp;·&nbsp; İdeal kilo: <b>${ideal.lo}–${ideal.hi} kg</b>` +
      `</div>` +
      `<div class="grp"><div class="h">ENERJİ — hedef: ${GOAL_LABELS[U.goal]}</div>` +
        `TDEE (BMR × ${U.actM}): <b>${tdee} kcal</b><br>` +
        `Günlük hedef kalori: <b>${goalCals} kcal</b>` +
      `</div>` +
      `<div class="grp"><div class="h">MAKRO</div>` +
        `Protein: <b>${mac.pg} g</b> <span class="muted">(${mac.proteinSource === 'lm' ? 'yağsız kütle bazlı' : 'vücut ağırlığı bazlı'})</span><br>` +
        `Yağ: <b>${mac.fg} g</b> &nbsp;·&nbsp; Karbonhidrat: <b>${mac.cg} g</b>` +
      `</div>` +
      `<div class="grp"><div class="h">SU</div>` +
        `Günlük: <b>${water.cups} bardak</b> &nbsp;(~${water.lt} L)` +
      `</div>`;
  },
};

// ── TEK DİNLEYİCİ — tüm data-action'ları yönetir ──
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-action]');
  if (!t) return;
  const fn = actions[t.dataset.action];
  if (fn) fn(t, t.dataset.arg);
});

// ── AÇILIŞ: öz-test ──
const st = runSelfTest();
const stEl = document.getElementById('selftest');
stEl.textContent = st.failed === 0
  ? `✅ Öz-test geçti (${st.passed}/${st.passed})`
  : `❌ ${st.failed} test kaldı — matematiğe bak!`;
stEl.className = 'status ' + (st.failed === 0 ? 'ok' : 'bad');

// başlangıç seçili durumları
highlight('setGender', U.gender);
highlight('setAct', U.actM);
highlight('setGoal', U.goal);

// ── SERVICE WORKER ──
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => { const el = document.getElementById('pwa'); el.textContent = '✅ Service worker kayıtlı — offline & kurulabilir'; el.className = 'status ok'; })
    .catch(() => { const el = document.getElementById('pwa'); el.textContent = '⚠️ Service worker kaydı başarısız (HTTPS/Pages gerekir)'; el.className = 'status bad'; });
}
