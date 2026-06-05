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
import { recGoalDetailed, gateWarning, checkRedsRisk } from './goals.js';
import { calcSuppScores } from './supplements.js';
import { runSelfTest } from './selftest.js';

const GOAL_LABELS = { cut: 'Cut (yağ ver)', recomp: 'Recomp', maintain: 'Koru', bulk: 'Bulk (kütle al)' };
const EV = { high: '🟢 Yüksek kanıt', mid: '🟡 Orta kanıt', low: '🔴 Sınırlı kanıt' };

const v = (id) => document.getElementById(id).value;
function highlight(action, arg) {
  document.querySelectorAll(`[data-action="${action}"]`).forEach(b =>
    b.classList.toggle('on', b.dataset.arg === String(arg)));
}

const actions = {
  setGender(el, arg) { U.gender = arg; highlight('setGender', arg); },
  setAct(el, arg)    { U.actM = parseFloat(arg); highlight('setAct', arg); },
  setGoal(el, arg)   { U.goal = arg; highlight('setGoal', arg); },
  setTrain(el, arg)  { U.trainingAge = arg; highlight('setTrain', arg); },

  calculate() {
    U.height = +v('in-height'); U.weight = +v('in-weight'); U.age = +v('in-age');
    U.neck = +v('in-neck'); U.waist = +v('in-waist'); U.hip = +v('in-hip');
    const male = U.gender === 'male';

    // vücut
    R.bf = calcBF(U);
    const f = calcFFMI(U, R.bf);
    R.ffm = f.ffm;
    R.bmr = calcBMR(f.ffm);
    const ideal = calcIdealRange(U.height);

    // enerji + makro + su
    const tdee = Math.round(R.bmr * U.actM);
    const goalCals = calcGoalCalories(tdee, U.goal, R.bf, male);
    const mac = calcMacros(goalCals, U.goal, 'hybrid', f.ffm, U.weight, R.bf, male, null);
    const freq = U.actM >= 1.725 ? 'high' : U.actM >= 1.55 ? 'mid' : 'low';
    const water = calcWaterTarget(U.weight, freq, 0);

    // öneri + uyarılar
    const rec = recGoalDetailed(R.bf, f.ffmi, male, U.trainingAge);
    const gw = rec.gates[U.goal] === 'risky' ? gateWarning(U.goal, R.bf, male) : null;
    const reds = checkRedsRisk(U.goal, R.bf, male);

    // supplement önerisi (mevcut seçimlerden türetilir; tam anket A2'de)
    const suppGoal = U.goal === 'maintain' ? 'health' : U.goal;
    const suppFreq = U.actM >= 1.9 ? 'elite' : U.actM >= 1.725 ? 'high' : 'mid';
    const supps = calcSuppScores({ goal: suppGoal, freq: suppFreq }, { age: U.age, gender: U.gender }, null)
      .filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 4);

    let html =
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
      `<div class="grp"><div class="h">SU</div>Günlük: <b>${water.cups} bardak</b> &nbsp;(~${water.lt} L)</div>` +
      `<div class="grp"><div class="h">ÖNERİ</div>` +
        `Sana önerilen: <b>${GOAL_LABELS[rec.primary]}</b>` +
        (rec.alternative ? ` <span class="muted">· alternatif: ${GOAL_LABELS[rec.alternative]}</span>` : ``) +
        `<br><span class="muted">${rec.reason}</span>` +
      `</div>`;

    // supplement bölümü
    html += `<div class="grp"><div class="h">SUPPLEMENT ÖNERİSİ <span class="muted" style="text-transform:none;letter-spacing:0">(temel — tam anket A2'de)</span></div>`;
    if (supps.length) {
      supps.forEach((s, i) => {
        const rank = ['🥇', '🥈', '🥉', '•'][i] || '•';
        html += `${rank} ${s.emoji} <b>${s.name}</b> <span class="ev">${EV[s.evidence] || ''}</span><br>`;
      });
    } else {
      html += `<span class="muted">Bu seçimlerle belirgin öneri yok.</span>`;
    }
    html += `</div>`;

    if (gw)   html += `<div class="warn">${gw}</div>`;
    if (reds) html += `<div class="warn reds">⚠️ <strong>RED-S riski:</strong> Yağ oranın çok düşükken cut yapmak hormonal sağlığı, kemik yoğunluğunu ve performansı olumsuz etkileyebilir. <strong>Maintain</strong> veya <strong>bulk</strong> önerilir.</div>`;

    document.getElementById('out').innerHTML = html;
  },
};

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-action]');
  if (!t) return;
  const fn = actions[t.dataset.action];
  if (fn) fn(t, t.dataset.arg);
});

// açılış: öz-test
const st = runSelfTest();
const stEl = document.getElementById('selftest');
stEl.textContent = st.failed === 0 ? `✅ Öz-test geçti (${st.passed}/${st.passed})` : `❌ ${st.failed} test kaldı — matematiğe bak!`;
stEl.className = 'status ' + (st.failed === 0 ? 'ok' : 'bad');

highlight('setGender', U.gender);
highlight('setAct', U.actM);
highlight('setGoal', U.goal);
highlight('setTrain', U.trainingAge);

// service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => { const el = document.getElementById('pwa'); el.textContent = '✅ Service worker kayıtlı — offline & kurulabilir'; el.className = 'status ok'; })
    .catch(() => { const el = document.getElementById('pwa'); el.textContent = '⚠️ Service worker kaydı başarısız (HTTPS/Pages gerekir)'; el.className = 'status bad'; });
}
