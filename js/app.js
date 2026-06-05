// ════════════════════════════════════════════════════════════
//  app.js — GİRİŞ NOKTASI
//  Wizard + sekme sistemli dashboard. Hesap motorları aynen kullanılır.
// ════════════════════════════════════════════════════════════
import { U, R } from './state.js';
import {
  calcBF, calcFFMI, calcBMR, calcIdealRange, bfBand,
  calcGoalCalories, calcMacros, calcWaterTarget
} from './calc.js';
import { recGoalDetailed, gateWarning, checkRedsRisk } from './goals.js';
import { calcSuppScores } from './supplements.js';
import { determineBodyProfile, getDietTipByProfile } from './profile.js';
import { showScreen } from './ui.js';
import { runSelfTest } from './selftest.js';

const APP_VERSION = '0.0.7';
const GOAL_LABELS = { cut: 'Cut (yağ ver)', recomp: 'Recomp', maintain: 'Koru', bulk: 'Bulk (kütle al)' };
const EV = { high: '🟢 Yüksek kanıt', mid: '🟡 Orta kanıt', low: '🔴 Sınırlı kanıt' };

const v = (id) => document.getElementById(id).value;
function highlight(action, arg) {
  document.querySelectorAll(`[data-action="${action}"]`).forEach(b =>
    b.classList.toggle('on', b.dataset.arg === String(arg)));
}

// ── WIZARD ───────────────────────────────────────────────────
const STEPS = ['scr-welcome', 'scr-basic', 'scr-measure', 'scr-activity', 'scr-goal'];
let step = 0;
function goStep(i) {
  if (i >= STEPS.length) { enterDashboard(); return; }
  step = Math.max(0, i);
  showScreen(STEPS[step]);
}
function enterDashboard() {
  compute();
  activeTab = 'vucudum'; activeVsub = 'analiz';
  showScreen('scr-dashboard');
  renderDashboard();
}

// ── HESAP → R'ye yaz ─────────────────────────────────────────
function compute() {
  U.height = +v('in-height'); U.weight = +v('in-weight'); U.age = +v('in-age');
  U.neck = +v('in-neck'); U.waist = +v('in-waist'); U.hip = +v('in-hip');
  U.shoulder = +v('in-shoulder') || 0;
  const male = U.gender === 'male';
  R.male = male;
  R.bf = calcBF(U);
  const f = calcFFMI(U, R.bf);
  R.ffm = f.ffm; R.ffmi = f.ffmi;
  R.bmr = calcBMR(f.ffm);
  R.bmi = U.weight / Math.pow(U.height / 100, 2);
  const ideal = calcIdealRange(U.height); R.idealLo = ideal.lo; R.idealHi = ideal.hi;
  const profile = determineBodyProfile(R.bf, f.ffmi, R.bmi, U);
  R.profileName = profile.n; R.profileTip = getDietTipByProfile(profile.n);
  R.band = bfBand(R.bf, male);
  R.tdee = Math.round(R.bmr * U.actM);
  R.goalCals = calcGoalCalories(R.tdee, U.goal, R.bf, male);
  R.mac = calcMacros(R.goalCals, U.goal, 'hybrid', f.ffm, U.weight, R.bf, male, null);
  const freq = U.actM >= 1.725 ? 'high' : U.actM >= 1.55 ? 'mid' : 'low';
  R.water = calcWaterTarget(U.weight, freq, 0);
  const rec = recGoalDetailed(R.bf, f.ffmi, male, U.trainingAge);
  R.recPrimary = rec.primary; R.recAlt = rec.alternative; R.recReason = rec.reason;
  R.gw = rec.gates[U.goal] === 'risky' ? gateWarning(U.goal, R.bf, male) : null;
  R.reds = checkRedsRisk(U.goal, R.bf, male);
  const suppGoal = U.goal === 'maintain' ? 'health' : U.goal;
  const suppFreq = U.actM >= 1.9 ? 'elite' : U.actM >= 1.725 ? 'high' : 'mid';
  R.supps = calcSuppScores({ goal: suppGoal, freq: suppFreq }, { age: U.age, gender: U.gender }, profile.n)
    .filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 4);
}

// ── SEKMELER ─────────────────────────────────────────────────
let activeTab = 'vucudum', activeVsub = 'analiz';
const grp = (title, body) => `<div class="grp"><div class="h">${title}</div>${body}</div>`;

function renderAnaliz() {
  return grp('VÜCUT',
      `Yağ oranı: <b>%${R.bf}</b> <span class="muted">(${R.band} bant)</span><br>` +
      `FFMI: <b>${R.ffmi}</b> &nbsp;·&nbsp; Yağsız kütle: <b>${R.ffm} kg</b><br>` +
      `BMR: <b>${R.bmr} kcal</b> &nbsp;·&nbsp; İdeal kilo: <b>${R.idealLo}–${R.idealHi} kg</b>`) +
    grp('PROFİL', `Vücut profilin: <b>${R.profileName}</b><br><span class="muted">${R.profileTip}</span>`);
}
function renderOlculer() {
  return grp('GÜNCEL ÖLÇÜLER',
    `Cinsiyet: <b>${R.male ? 'Erkek' : 'Kadın'}</b> &nbsp;·&nbsp; Yaş: <b>${U.age}</b><br>` +
    `Boy: <b>${U.height} cm</b> &nbsp;·&nbsp; Kilo: <b>${U.weight} kg</b> &nbsp;·&nbsp; BMI: <b>${R.bmi.toFixed(1)}</b><br>` +
    `Boyun: <b>${U.neck}</b> &nbsp; Bel: <b>${U.waist}</b> &nbsp; Kalça: <b>${U.hip}</b>` +
    (U.shoulder ? ` &nbsp; Omuz: <b>${U.shoulder}</b>` : ''));
}
function renderIlerleme() {
  return grp('İLERLEME',
    `<span class="muted">Haftalık ölçüm kaydı ve değişim grafiği sonraki fazlarda eklenecek. ` +
    `Şu an baz ölçülerin alındı; zamanla yağ/kilo/ölçü değişimini buradan takip edeceksin.</span>`);
}
function renderVucudum() {
  const subs = [['analiz', 'Analiz'], ['olculer', 'Ölçüler'], ['ilerleme', 'İlerleme']];
  const bar = '<div class="subtabs">' + subs.map(([k, l]) =>
    `<button data-action="vsub" data-arg="${k}" class="${activeVsub === k ? 'on' : ''}">${l}</button>`).join('') + '</div>';
  const body = activeVsub === 'olculer' ? renderOlculer()
             : activeVsub === 'ilerleme' ? renderIlerleme()
             : renderAnaliz();
  return bar + body;
}
function renderBeslenme() {
  let h = grp(`ENERJİ — hedef: ${GOAL_LABELS[U.goal]}`,
        `TDEE (BMR × ${U.actM}): <b>${R.tdee} kcal</b><br>Günlük hedef: <b>${R.goalCals} kcal</b>`) +
      grp('MAKRO',
        `Protein: <b>${R.mac.pg} g</b> <span class="muted">(${R.mac.proteinSource === 'lm' ? 'yağsız kütle bazlı' : 'vücut ağırlığı bazlı'})</span><br>` +
        `Yağ: <b>${R.mac.fg} g</b> &nbsp;·&nbsp; Karbonhidrat: <b>${R.mac.cg} g</b>`) +
      grp('SU', `Günlük: <b>${R.water.cups} bardak</b> &nbsp;(~${R.water.lt} L)`) +
      grp('ÖNERİ',
        `Önerilen: <b>${GOAL_LABELS[R.recPrimary]}</b>` +
        (R.recAlt ? ` <span class="muted">· alternatif: ${GOAL_LABELS[R.recAlt]}</span>` : '') +
        `<br><span class="muted">${R.recReason}</span>`);
  let supp = `<div class="grp"><div class="h">SUPPLEMENT</div>`;
  if (R.supps.length) R.supps.forEach((s, i) => {
    supp += `${['🥇', '🥈', '🥉', '•'][i] || '•'} ${s.emoji} <b>${s.name}</b> <span class="ev">${EV[s.evidence] || ''}</span><br>`;
  });
  else supp += `<span class="muted">—</span>`;
  supp += `</div>`;
  h += supp;
  if (R.gw) h += `<div class="warn">${R.gw}</div>`;
  if (R.reds) h += `<div class="warn reds">⚠️ <strong>RED-S riski:</strong> Yağ oranın çok düşükken cut yapmak hormonal sağlığı, kemik yoğunluğunu ve performansı olumsuz etkileyebilir. <strong>Maintain</strong> veya <strong>bulk</strong> önerilir.</div>`;
  return h;
}
function renderAntrenman() {
  return grp('ANTRENMAN',
    `<span class="muted">Egzersiz havuzu (344 egzersiz), fitness filtre sistemi, egzersiz detayları, ` +
    `programlar ve antrenman motoru sonraki fazlarda gelecek. Branşlar zamanla genişleyecek.</span>`);
}
function renderProfil() {
  return grp('HESABIM',
      `Cinsiyet: <b>${R.male ? 'Erkek' : 'Kadın'}</b><br>` +
      `Yaş: <b>${U.age}</b> &nbsp;·&nbsp; Boy: <b>${U.height} cm</b> &nbsp;·&nbsp; Kilo: <b>${U.weight} kg</b><br>` +
      `Aktivite: <b>×${U.actM}</b> &nbsp;·&nbsp; Deneyim: <b>${U.trainingAge}</b> &nbsp;·&nbsp; Hedef: <b>${GOAL_LABELS[U.goal]}</b>`) +
    `<button class="go" style="width:100%;margin-top:4px" data-action="editInfo">Bilgileri Düzenle</button>` +
    `<div class="ver">Raven Fit · v${APP_VERSION}</div>`;
}
function renderTab() {
  const map = { vucudum: renderVucudum, beslenme: renderBeslenme, antrenman: renderAntrenman, profil: renderProfil };
  document.getElementById('tab-content').innerHTML = (map[activeTab] || renderVucudum)();
}
function renderDashboard() {
  document.querySelectorAll('.bottomnav button').forEach(b =>
    b.classList.toggle('on', b.dataset.arg === activeTab));
  renderTab();
}

// ── EYLEM KAYDI ──────────────────────────────────────────────
const actions = {
  setGender(el, a) { U.gender = a; highlight('setGender', a); },
  setAct(el, a)    { U.actM = parseFloat(a); highlight('setAct', a); },
  setGoal(el, a)   { U.goal = a; highlight('setGoal', a); },
  setTrain(el, a)  { U.trainingAge = a; highlight('setTrain', a); },
  wizNext() { goStep(step + 1); },
  wizBack() { goStep(step - 1); },
  tab(el, a)  { activeTab = a; renderDashboard(); },
  vsub(el, a) { activeVsub = a; renderTab(); },
  editInfo()  { step = 1; showScreen('scr-basic'); },
};

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-action]');
  if (!t) return;
  const fn = actions[t.dataset.action];
  if (fn) fn(t, t.dataset.arg);
});

// ── AÇILIŞ ──
const st = runSelfTest();
const stEl = document.getElementById('selftest');
stEl.textContent = st.failed === 0 ? `✅ Öz-test geçti (${st.passed}/${st.passed})` : `❌ ${st.failed} test kaldı`;
stEl.className = 'status ' + (st.failed === 0 ? 'ok' : 'bad');
document.getElementById('ver-welcome').textContent = `Raven Fit · v${APP_VERSION}`;

highlight('setGender', U.gender);
highlight('setAct', U.actM);
highlight('setGoal', U.goal);
highlight('setTrain', U.trainingAge);
showScreen(STEPS[0]);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => { const el = document.getElementById('pwa'); el.textContent = '✅ Service worker kayıtlı — offline & kurulabilir'; el.className = 'status ok'; })
    .catch(() => { const el = document.getElementById('pwa'); el.textContent = '⚠️ Service worker kaydı başarısız (HTTPS/Pages gerekir)'; el.className = 'status bad'; });
}
