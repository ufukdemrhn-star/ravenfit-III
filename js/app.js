// ════════════════════════════════════════════════════════════
//  app.js — GİRİŞ NOKTASI
//  Wizard + sekmeli dashboard + kalıcılık + EGZERSİZ HAVUZU.
// ════════════════════════════════════════════════════════════
import { U, R } from './state.js';
import {
  calcBF, calcFFMI, calcBMR, calcIdealRange, bfBand,
  calcGoalCalories, calcMacros, calcWaterTarget
} from './calc.js';
import { recGoalDetailed, gateWarning, checkRedsRisk } from './goals.js';
import { calcSuppScores, SUPP_QS } from './supplements.js';
import { determineBodyProfile, getDietTipByProfile } from './profile.js';
import { loadExercises, filterExercises, uniqueEquipment, uniqueCategories, CAT_TR, BRANCHES } from './exercises.js';
import { PROGRAMS } from './programs.js';
import { summarizeProgress, goalNote } from './progress.js';
import { THEMES, applyTheme } from './themes.js';
import { formulaEpley, formulaBrzycki, formulaLombardi, formulaWathen, ONE_RM_PCTS, ONE_RM_REP_MAP, calcWorkingSet, calcSleep, fmtTime } from './tools.js';
import { showScreen } from './ui.js';
import { saveUser, loadUser, clearUser, saveJSON, loadJSON, setSyncHandler, exportAll, importAll, clearAll } from './storage.js';
import { runSelfTest } from './selftest.js';

const APP_VERSION = '0.0.18';
const GOAL_LABELS = { cut: 'Cut (yağ ver)', recomp: 'Recomp', maintain: 'Koru', bulk: 'Bulk (kütle al)' };
const EV = { high: '🟢 Yüksek kanıt', mid: '🟡 Orta kanıt', low: '🔴 Sınırlı kanıt' };

const v = (id) => document.getElementById(id).value;
function highlight(action, arg) {
  document.querySelectorAll(`[data-action="${action}"]`).forEach(b =>
    b.classList.toggle('on', b.dataset.arg === String(arg)));
}
function applyHighlights() {
  highlight('setGender', U.gender); highlight('setAct', U.actM);
  highlight('setGoal', U.goal); highlight('setTrain', U.trainingAge);
}
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── GİRDİ ↔ DURUM ────────────────────────────────────────────
function readInputs() {
  U.age = +v('in-age'); U.height = +v('in-height'); U.weight = +v('in-weight');
  U.neck = +v('in-neck'); U.waist = +v('in-waist'); U.hip = +v('in-hip');
  U.shoulder = +v('in-shoulder') || 0;
}
function fillInputs() {
  document.getElementById('in-age').value = U.age;
  document.getElementById('in-height').value = U.height;
  document.getElementById('in-weight').value = U.weight;
  document.getElementById('in-neck').value = U.neck;
  document.getElementById('in-waist').value = U.waist;
  document.getElementById('in-hip').value = U.hip;
  document.getElementById('in-shoulder').value = U.shoulder || '';
}

// ── WIZARD ───────────────────────────────────────────────────
const STEPS = ['scr-welcome', 'scr-basic', 'scr-measure', 'scr-activity', 'scr-goal'];
let step = 0;
function goStep(i) {
  if (i >= STEPS.length) { finishWizard(); return; }
  step = Math.max(0, i);
  showScreen(STEPS[step]);
}
function finishWizard() { readInputs(); saveUser(U); enterDashboard(); }
function enterDashboard() {
  compute();
  activeTab = 'vucudum'; activeVsub = 'analiz';
  showScreen('scr-dashboard');
  renderDashboard();
}

// ── HESAP (U → R) ────────────────────────────────────────────
function compute() {
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
function miniChart(values) {
  if (values.length < 2) return '<div class="muted" style="font-size:12px">Grafik için en az 2 ölçüm gerekir.</div>';
  const w = 320, h = 120, pad = 8;
  const min = Math.min(...values), max = Math.max(...values), range = (max - min) || 1;
  const pts = values.map((v, i) => [
    pad + (i / (values.length - 1)) * (w - 2 * pad),
    pad + (1 - (v - min) / range) * (h - 2 * pad),
  ]);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const dots = pts.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="var(--accent)"/>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" style="display:block">` +
    `<path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2"/>${dots}</svg>`;
}
function renderMeasureForm() {
  const female = U.gender === 'female';
  return grp('YENİ ÖLÇÜM',
    `<label>Kilo (kg)</label><input id="m-weight" type="number" value="${U.weight}">` +
    `<div class="row"><div><label>Bel (cm)</label><input id="m-waist" type="number" value="${U.waist}"></div>` +
    `<div><label>Boyun (cm)</label><input id="m-neck" type="number" value="${U.neck}"></div></div>` +
    (female ? `<label>Kalça (cm)</label><input id="m-hip" type="number" value="${U.hip}">` : '')) +
    `<div class="nav"><button data-action="cancelMeasure">İptal</button><button class="go" data-action="saveMeasure">Kaydet</button></div>`;
}
function renderHistory() {
  if (!workoutHistory.length) return '';
  const rows = [...workoutHistory].reverse().slice(0, 25).map(w =>
    `<div class="wkrow"><div><div class="exname">${esc(w.program)} — ${esc(w.day)}</div>` +
    `<div class="exmeta">${new Date(w.date).toLocaleDateString('tr-TR')} &nbsp;·&nbsp; ${w.sets}/${w.total} set</div></div></div>`).join('');
  return grp(`ANTRENMAN GEÇMİŞİ (${workoutHistory.length})`, rows);
}
function renderIlerleme() {
  if (measureForm) return renderMeasureForm();
  if (!measurements.length) {
    return grp('İLERLEME', `<span class="muted">Henüz ölçüm kaydın yok. Düzenli ölçüm ekleyerek kilo ve yağ oranı değişimini takip et.</span>`) +
      `<button class="go" style="width:100%" data-action="openMeasure">İlk Ölçümü Ekle</button>` + renderHistory();
  }
  const s = summarizeProgress(measurements);
  const arrow = (d) => d > 0.05 ? `<span style="color:#fca5a5">▲ ${d.toFixed(1)}</span>` : d < -0.05 ? `<span style="color:#4ade80">▼ ${Math.abs(d).toFixed(1)}</span>` : '<span class="muted">–</span>';
  const weights = measurements.map(m => m.weight);
  let h = grp(`ÖZET (${s.count} ölçüm)`,
    `İlk → Son kilo: <b>${s.first.weight}</b> → <b>${s.last.weight} kg</b> &nbsp; ${arrow(s.dW)}<br>` +
    `İlk → Son yağ: <b>%${s.first.bf}</b> → <b>%${s.last.bf}</b> &nbsp; ${arrow(s.dB)}<br>` +
    `<span class="muted">${goalNote(U.goal, s.dW)}</span>`);
  h += grp('KİLO DEĞİŞİMİ', miniChart(weights) +
    `<div class="muted" style="font-size:11px;margin-top:4px">en düşük ${Math.min(...weights)} – en yüksek ${Math.max(...weights)} kg</div>`);
  let rows = '';
  [...measurements].reverse().forEach(m => {
    rows += `<div class="wkrow"><div><div class="exname">${new Date(m.date).toLocaleDateString('tr-TR')}</div>` +
      `<div class="exmeta">${m.weight} kg &nbsp;·&nbsp; %${m.bf} yağ</div></div>` +
      `<button data-action="deleteMeasure" data-arg="${m.date}">Sil</button></div>`;
  });
  h += grp('KAYITLAR', rows) + `<button class="go" style="width:100%" data-action="openMeasure">+ Ölçüm Ekle</button>`;
  h += renderHistory();
  return h;
}
function renderVucudum() {
  const subs = [['analiz', 'Analiz'], ['olculer', 'Ölçüler'], ['ilerleme', 'İlerleme']];
  const bar = '<div class="subtabs">' + subs.map(([k, l]) =>
    `<button data-action="vsub" data-arg="${k}" class="${activeVsub === k ? 'on' : ''}">${l}</button>`).join('') + '</div>';
  const body = activeVsub === 'olculer' ? renderOlculer() : activeVsub === 'ilerleme' ? renderIlerleme() : renderAnaliz();
  return bar + body;
}
function renderSuppSurvey() {
  const answered = SUPP_QS.filter(q => suppDraft[q.key]).length;
  let h = `<button data-action="cancelSuppSurvey">← İptal</button>` +
    `<h3 style="margin:12px 0 4px">Supplement Anketi</h3>` +
    `<div class="muted" style="font-size:12px;margin-bottom:8px">${answered}/${SUPP_QS.length} yanıtlandı</div>`;
  SUPP_QS.forEach(q => {
    h += `<div class="qblock"><div class="qtitle">${q.title}</div><div class="pills qopts">` +
      q.opts.map(o => `<button data-action="suppAns" data-arg="${q.key}:${o.v}" class="${suppDraft[q.key] === o.v ? 'on' : ''}">${o.l}</button>`).join('') +
      `</div></div>`;
  });
  return h + `<button class="go" style="width:100%;margin-top:8px" data-action="submitSuppSurvey">Sonuçları Gör →</button>`;
}
function suppSection() {
  if (!suppAnswers) {
    return grp('SUPPLEMENT', `<span class="muted">Sana özel supplement önerisi için kısa bir anket var (10 soru).</span>`) +
      `<button class="go" style="width:100%" data-action="startSuppSurvey">Ankete Başla</button>`;
  }
  const max = BUDGET_MAX[suppAnswers.budget] || 6;
  const list = calcSuppScores(suppAnswers, { age: U.age, gender: U.gender }, R.profileName)
    .filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, max);
  let h = `<div class="ph">SANA ÖNERİLEN SUPPLEMENTLER (${list.length})</div>`;
  list.forEach(s => {
    const open = openSupp === s.id;
    h += `<div class="suppcard"><div class="supphead" data-action="suppToggle" data-arg="${s.id}">` +
      `<span>${s.emoji} <b>${esc(s.name)}</b></span><span class="ev">${EV[s.evidence] || ''} ${open ? '▲' : '▼'}</span></div>`;
    if (open) {
      h += `<div class="suppbody">` +
        `<div><b>Doz:</b> ${esc(s.dose)}</div>` +
        `<div><b>Zamanlama:</b> ${esc(s.timing)}</div>` +
        `<div><b>Amaç:</b> ${esc(s.purpose)}</div>` +
        `<div><b>Etki:</b> ${esc(s.effect)}</div>` +
        (s.sideEffects ? `<div><b>Yan etki:</b> ${esc(s.sideEffects)}</div>` : '') +
        (s.interactions ? `<div><b>Etkileşim:</b> ${esc(s.interactions)}</div>` : '') +
        (s.note ? `<div class="muted">${esc(s.note)}</div>` : '') +
        (s.reasons && s.reasons.length ? `<div class="reasons">${s.reasons.map(r => '• ' + esc(r)).join('<br>')}</div>` : '') +
        `</div>`;
    }
    h += `</div>`;
  });
  h += `<div class="legal">⚕️ Bu bilgiler yalnızca eğitim amaçlıdır, tıbbi tavsiye değildir. Bir supplemente başlamadan önce doktoruna/eczacına danış. Hamilelik, kronik hastalık veya ilaç kullanımı varsa mutlaka hekime sor.</div>`;
  return h + `<button data-action="startSuppSurvey" style="width:100%">Anketi Yenile</button>`;
}
function renderBeslenme() {
  if (suppSurvey) return renderSuppSurvey();
  let h = grp(`ENERJİ — hedef: ${GOAL_LABELS[U.goal]}`,
        `TDEE (BMR × ${U.actM}): <b>${R.tdee} kcal</b><br>Günlük hedef: <b>${R.goalCals} kcal</b>`) +
      grp('MAKRO',
        `Protein: <b>${R.mac.pg} g</b> <span class="muted">(${R.mac.proteinSource === 'lm' ? 'yağsız kütle bazlı' : 'vücut ağırlığı bazlı'})</span><br>` +
        `Yağ: <b>${R.mac.fg} g</b> &nbsp;·&nbsp; Karbonhidrat: <b>${R.mac.cg} g</b>`) +
      grp('SU', `Günlük: <b>${R.water.cups} bardak</b> &nbsp;(~${R.water.lt} L)`) +
      grp('ÖNERİ', `Önerilen: <b>${GOAL_LABELS[R.recPrimary]}</b>` +
        (R.recAlt ? ` <span class="muted">· alternatif: ${GOAL_LABELS[R.recAlt]}</span>` : '') +
        `<br><span class="muted">${R.recReason}</span>`);
  h += suppSection();
  if (R.gw) h += `<div class="warn">${R.gw}</div>`;
  if (R.reds) h += `<div class="warn reds">⚠️ <strong>RED-S riski:</strong> Yağ oranın çok düşükken cut yapmak hormonal sağlığı, kemik yoğunluğunu ve performansı olumsuz etkileyebilir. <strong>Maintain</strong> veya <strong>bulk</strong> önerilir.</div>`;
  return h;
}

// ── EGZERSİZ HAVUZU ──────────────────────────────────────────
let exData = null, exLoading = false;
let currentBranch = 'fitness';
const exCache = {};
let exFilters = { cat: '', equip: '', q: '' };
let exDetail = null;
let antrenSub = 'havuz';      // havuz | programlar | araclar
let activeCalc = null, calcState = {};
let selectedProgram = null;
let activeWorkout = null;      // { program, dayIdx, done:{exIdx:setSayısı} }
let builder = null;            // { name, items:[{ex,sets,reps}] }
let exSelectMode = false;      // havuzdan egzersiz seçme modu
const PROG_KEY = 'ravenfit_programs_v1';
let customPrograms = loadJSON(PROG_KEY) || [];
const MEAS_KEY = 'ravenfit_measurements_v1';
let measurements = loadJSON(MEAS_KEY) || [];
let measureForm = false;
const SUPP_KEY = 'ravenfit_supp_v1';
let suppAnswers = loadJSON(SUPP_KEY) || null;
let suppSurvey = false;
let suppDraft = {};
let openSupp = null;
const BUDGET_MAX = { min: 3, low: 5, mid: 8, high: 99 };
const HIST_KEY = 'ravenfit_history_v1';
let workoutHistory = loadJSON(HIST_KEY) || [];
const allPrograms = () => customPrograms.concat(PROGRAMS);
// dinlenme sayacı
let restRemaining = 0, restInterval = null;
const mmss = (s) => Math.floor(Math.max(0, s) / 60) + ':' + String(Math.max(0, s) % 60).padStart(2, '0');
function updateRestDisplay() { const el = document.getElementById('rest-timer'); if (el) el.textContent = mmss(restRemaining); }
function startRest(sec) {
  clearInterval(restInterval); restRemaining = sec; updateRestDisplay();
  restInterval = setInterval(() => {
    restRemaining--;
    if (restRemaining <= 0) { clearInterval(restInterval); restInterval = null; restRemaining = 0; restAlarm(); }
    updateRestDisplay();
  }, 1000);
}
function stopRest() { clearInterval(restInterval); restInterval = null; restRemaining = 0; updateRestDisplay(); }
function restAlarm() {
  try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination); o.frequency.value = 880;
    g.gain.setValueAtTime(0.2, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
    o.start(); o.stop(ac.currentTime + 0.5);
  } catch (e) {}
}
const diffDots = (d) => '●'.repeat(d) + '○'.repeat(Math.max(0, 3 - d));
const prettyMuscle = (m) => m.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

function exListHTML(selectMode) {
  const list = filterExercises(exData, exFilters);
  if (!list.length) return `<div class="muted" style="padding:14px 2px">Eşleşen egzersiz yok.</div>`;
  let h = `<div class="excount">${list.length} egzersiz</div>`;
  const act = selectMode ? 'exPick' : 'exOpen';
  list.forEach(e => {
    h += `<div class="excard" data-action="${act}" data-arg="${e.id}">` +
      `<div class="exname">${esc(e.name_tr)}</div>` +
      `<div class="exmeta">${CAT_TR[e.category] || e.category} · ${(e.equipment || []).join(', ')} · ${diffDots(e.difficulty)}</div>` +
      `</div>`;
  });
  return h;
}
function renderExercisePool() {
  const brPills = '<div class="pills exf">' + BRANCHES.map(b =>
    `<button data-action="exBranch" data-arg="${b.key}" class="${currentBranch === b.key ? 'on' : ''}">${b.label}</button>`).join('') + '</div>';
  const cats = uniqueCategories(exData);
  const pills = '<div class="pills exf">' +
    `<button data-action="exCat" data-arg="" class="${exFilters.cat === '' ? 'on' : ''}">Hepsi</button>` +
    cats.map(c => `<button data-action="exCat" data-arg="${c}" class="${exFilters.cat === c ? 'on' : ''}">${CAT_TR[c] || c}</button>`).join('') +
    '</div>';
  const equips = uniqueEquipment(exData);
  const sel = `<select data-action-change="exEquip" class="exsel"><option value="">Tüm ekipman</option>` +
    equips.map(q => `<option value="${q}" ${exFilters.equip === q ? 'selected' : ''}>${q}</option>`).join('') + `</select>`;
  const search = `<input data-action-input="exSearch" class="exsearch" type="text" placeholder="Egzersiz ara…" value="${esc(exFilters.q)}">`;
  return brPills + `<div class="exbar">${pills}<div class="exrow">${sel}${search}</div></div><div id="ex-list">${exListHTML(false)}</div>`;
}
function renderExerciseSelect() {
  const cats = uniqueCategories(exData);
  const pills = '<div class="pills exf">' +
    `<button data-action="exCat" data-arg="" class="${exFilters.cat === '' ? 'on' : ''}">Hepsi</button>` +
    cats.map(c => `<button data-action="exCat" data-arg="${c}" class="${exFilters.cat === c ? 'on' : ''}">${CAT_TR[c] || c}</button>`).join('') + '</div>';
  const equips = uniqueEquipment(exData);
  const sel = `<select data-action-change="exEquip" class="exsel"><option value="">Tüm ekipman</option>` +
    equips.map(q => `<option value="${q}" ${exFilters.equip === q ? 'selected' : ''}>${q}</option>`).join('') + `</select>`;
  const search = `<input data-action-input="exSearch" class="exsearch" type="text" placeholder="Egzersiz ara…" value="${esc(exFilters.q)}">`;
  const n = builder ? builder.items.length : 0;
  return `<button class="go" style="width:100%" data-action="doneSelecting">✓ Bitti (<span id="sel-count">${n}</span> egzersiz)</button>` +
    `<div class="muted" style="font-size:12px;margin:8px 2px">Eklemek için egzersize dokun</div>` +
    `<div class="exbar">${pills}<div class="exrow">${sel}${search}</div></div><div id="ex-list">${exListHTML(true)}</div>`;
}
function renderBuilder() {
  const rows = builder.items.length
    ? builder.items.map((it, i) =>
        `<div class="wkrow"><div><div class="exname">${esc(exName(it.ex))}</div>` +
        `<div class="exmeta">Set: <button class="mini" data-action="bSetMinus" data-arg="${i}">−</button> <b>${it.sets}</b> <button class="mini" data-action="bSetPlus" data-arg="${i}">+</button>` +
        ` &nbsp; Tekrar: <input class="repsin" data-action-input="bReps" data-arg="${i}" value="${esc(it.reps)}"></div></div>` +
        `<button data-action="bRemove" data-arg="${i}">Sil</button></div>`).join('')
    : `<div class="muted" style="padding:10px 2px">Henüz egzersiz yok. "Egzersiz Ekle" ile havuzdan seç.</div>`;
  return `<button data-action="cancelBuilder">← İptal</button>` +
    `<h3 style="margin:12px 0 8px">Yeni Program</h3>` +
    `<input class="exsearch" style="width:100%;margin-bottom:10px" data-action-input="builderName" placeholder="Program adı" value="${esc(builder.name)}">` +
    rows +
    `<button style="width:100%;margin-top:10px" data-action="addExercise">+ Egzersiz Ekle</button>` +
    `<button class="go" style="width:100%;margin-top:8px" data-action="saveProgram">Programı Kaydet</button>`;
}
function renderExerciseDetail(e) {
  const muscles = Object.entries(e.muscles || {}).sort((a, b) => b[1] - a[1]);
  const mus = muscles.map(([m, w]) =>
    `<div class="mrow"><span class="mname">${prettyMuscle(m)}</span><div class="mbar"><div class="mfill" style="width:${Math.min(100, w * 10)}%"></div></div></div>`).join('') || '<span class="muted">—</span>';
  const li = (arr) => Array.isArray(arr)
    ? (arr.length ? '<ul class="exul">' + arr.map(x => `<li>${esc(x)}</li>`).join('') + '</ul>' : '<span class="muted">—</span>')
    : (arr ? `<div>${esc(arr)}</div>` : '<span class="muted">—</span>');
  const badges = [CAT_TR[e.category] || e.category, (e.equipment || []).join(', ') || '—', 'Zorluk ' + diffDots(e.difficulty)];
  if (e.is_compound !== undefined) badges.push(e.is_compound ? 'Bileşik' : 'İzolasyon');
  if (e.force_type) badges.push(esc(e.force_type));
  if (e.stroke) badges.push('Stil: ' + esc(e.stroke));
  if (e.distance_m) badges.push(e.distance_m + ' m');
  if (e.condition_target) badges.push('Hedef: ' + esc(e.condition_target));
  if (e.duration_sec) badges.push(e.duration_sec + ' sn');
  if (e.pain_safe !== undefined) badges.push(e.pain_safe ? '✅ Ağrıya güvenli' : '⚠️ Dikkatli yap');
  return `<button data-action="exBack">← Havuza dön</button>` +
    `<h3 style="margin:12px 0 0">${esc(e.name_tr)}</h3>` +
    `<div class="muted" style="font-size:13px">${esc(e.name_en || '')}</div>` +
    `<div class="exbadges">${badges.join(' · ')}</div>` +
    grp('HEDEF KASLAR', mus) + grp('TALİMATLAR', li(e.instructions_tr)) +
    grp('İPUÇLARI', li(e.tips_tr)) +
    (e.caution_tr ? grp('⚠️ UYARI', li(e.caution_tr)) : '') +
    grp('SIK HATALAR', li(e.common_mistakes_tr));
}
const exName = (id) => { for (const arr of Object.values(exCache)) { const e = arr && arr.find(x => x.id === id); if (e) return e.name_tr; } const e = exData && exData.find(x => x.id === id); return e ? e.name_tr : id; };
function antrenBar() {
  const subs = [['havuz', 'Havuz'], ['programlar', 'Programlar'], ['araclar', 'Araçlar']];
  return '<div class="subtabs">' + subs.map(([k, l]) =>
    `<button data-action="antrenTab" data-arg="${k}" class="${antrenSub === k ? 'on' : ''}">${l}</button>`).join('') + '</div>';
}
function progCard(p, isCustom) {
  return `<div class="wkrow">` +
    `<div data-action="openProgram" data-arg="${p.id}" style="flex:1;cursor:pointer">` +
    `<div class="exname">${esc(p.name)}</div>` +
    `<div class="exmeta">${p.level} · ${p.days.length} gün · ${esc(p.desc)}</div></div>` +
    (isCustom ? `<button data-action="deleteProgram" data-arg="${p.id}">Sil</button>` : '') + `</div>`;
}
function renderProgramList() {
  let h = `<button class="go" style="width:100%;margin-bottom:12px" data-action="newProgram">+ Yeni Program Oluştur</button>`;
  if (customPrograms.length) {
    h += `<div class="ph">PROGRAMLARIM</div>` + customPrograms.map(p => progCard(p, true)).join('');
  }
  h += `<div class="ph muted">HAZIR PROGRAMLAR</div>` + PROGRAMS.map(p => progCard(p, false)).join('');
  return h;
}
function renderProgramDetail(p) {
  let h = `<button data-action="backToPrograms">← Programlar</button>` +
    `<h3 style="margin:12px 0 0">${p.name}</h3><div class="muted" style="font-size:13px">${p.desc}</div>`;
  p.days.forEach((d, di) => {
    const rows = d.items.map(it =>
      `<div class="excard" data-action="exOpen" data-arg="${it.ex}"><div class="exname">${esc(exName(it.ex))}</div>` +
      `<div class="exmeta">${it.sets} set × ${it.reps}</div></div>`).join('');
    h += `<div class="grp"><div class="h">${d.name}</div>${rows}` +
      `<button class="go" style="width:100%;margin-top:8px" data-action="startWorkout" data-arg="${p.id}:${di}">▶ ${d.name} — Başla</button></div>`;
  });
  return h;
}
function renderActiveWorkout() {
  const { program, dayIdx, done } = activeWorkout;
  const d = program.days[dayIdx];
  let totalSets = 0, doneSets = 0, rows = '';
  d.items.forEach((it, i) => {
    const dn = done[i] || 0; totalSets += it.sets; doneSets += Math.min(dn, it.sets);
    const complete = dn >= it.sets;
    rows += `<div class="wkrow ${complete ? 'done' : ''}">` +
      `<div><div class="exname" data-action="exOpen" data-arg="${it.ex}" style="cursor:pointer">${esc(exName(it.ex))} ${complete ? '✓' : ''}</div>` +
      `<div class="exmeta">Set ${Math.min(dn, it.sets)} / ${it.sets} &nbsp;·&nbsp; ${it.reps} tekrar</div></div>` +
      `<button data-action="workoutSet" data-arg="${i}" ${complete ? 'disabled' : ''}>+1 set</button></div>`;
  });
  return `<div class="wkhead"><div><b>${program.name}</b><div class="muted" style="font-size:13px">${d.name}</div></div>` +
    `<button data-action="cancelWorkout">Vazgeç</button></div>` +
    `<div class="restbar">⏱️ Dinlenme <span id="rest-timer">${mmss(restRemaining)}</span>` +
      `<span class="restbtns"><button data-action="rest" data-arg="60">60</button><button data-action="rest" data-arg="90">90</button><button data-action="rest" data-arg="120">120</button><button data-action="restStop">⨯</button></span></div>` +
    `<div class="excount">${doneSets} / ${totalSets} set tamamlandı</div>` + rows +
    `<button class="go" style="width:100%;margin-top:12px" data-action="finishWorkout">Antrenmanı Bitir ✓</button>`;
}
// ══ ANTRENMAN ARAÇLARI — HESAPLAYICILAR (RavenFit2 formülleri birebir) ══
function renderTools() {
  if (activeCalc) return renderCalc(activeCalc);
  const card = (id, icon, label, sub) => `<div class="calc-card" data-action="calcOpen" data-arg="${id}"><div class="calc-ic">${icon}</div><div class="calc-lb">${label}</div><div class="calc-sb">${sub}</div></div>`;
  return `<div class="calc-grid">` +
    card('1rm', '💪', '1RM', 'Max Tahmini') +
    card('ws', '⚙️', 'Çalışma Seti', '%1RM × Rep') +
    card('sleep', '😴', 'Uyku', 'REM Döngüsü') +
    `</div>` +
    `<div class="status">🧮 Formüller RavenFit2'den birebir taşındı; sonuçlar tahmin amaçlıdır.</div>`;
}
function renderCalc(id) {
  const back = `<button data-action="calcBack">← Araçlar</button>`;
  if (id === '1rm') return back + render1RM();
  if (id === 'ws') return back + renderWS();
  if (id === 'sleep') return back + renderSleep();
  return back;
}
function calcResultHTML(id) {
  if (id === '1rm') {
    const kg = parseFloat(calcState.kg) || 0, reps = parseInt(calcState.reps) || 0;
    if (!kg || !reps || reps < 1 || reps > 12) return `<div class="cres muted">Yük ve tekrar gir (1-12 rep)</div>`;
    const wa = formulaWathen(kg, reps), ep = formulaEpley(kg, reps), br = formulaBrzycki(kg, reps), lo = formulaLombardi(kg, reps);
    let dist = '';
    ONE_RM_PCTS.forEach(p => { dist += `<div class="crow"><span>%${p}</span><span>${(wa * p / 100).toFixed(1)} kg</span><span class="muted">${ONE_RM_REP_MAP[p]} rep</span></div>`; });
    return `<div class="cres"><div class="cres-sub">TAHMİNİ 1RM</div><div class="cres-val">${wa.toFixed(1)}</div><div class="cres-unit">kg · Wathen (ana hesap)</div></div>` +
      `<div class="cgrid4">` +
        `<div class="ccell" style="border-color:var(--accent)"><div class="ccell-val" style="color:var(--accent)">${wa.toFixed(1)}</div><div class="ccell-lbl">Wathen ★</div></div>` +
        `<div class="ccell"><div class="ccell-val">${ep.toFixed(1)}</div><div class="ccell-lbl">Epley</div></div>` +
        `<div class="ccell"><div class="ccell-val">${br.toFixed(1)}</div><div class="ccell-lbl">Brzycki</div></div>` +
        `<div class="ccell"><div class="ccell-val">${lo.toFixed(1)}</div><div class="ccell-lbl">Lombardi</div></div>` +
      `</div>` + grp('% 1RM DAĞILIMI', dist);
  }
  if (id === 'ws') {
    const r = calcWorkingSet(calcState.wsTarget, calcState.wsSets, calcState.wsReps, calcState.wsDiff, calcState.wsFixed);
    if (r.error) return `<div class="cres muted">${r.error}</div>`;
    const diffLabel = { easy: '😌 Kolay', medium: '💪 Orta', hard: '🔥 Zor' }[r.diff];
    let plan = '';
    r.weights.forEach((w, i) => { const pct = Math.round(w / r.target * 100); plan += `<div class="crow"><span>Set ${i + 1}</span><span>${w} kg × ${r.reps}</span><span class="muted">%${pct}</span></div>`; });
    return `<div class="cres"><div class="cres-sub">${diffLabel} · ${r.fixed ? 'SABİT' : 'PİRAMİT'}</div><div class="cres-val">${r.volume}</div><div class="cres-unit">birim toplam hacim</div><div class="cres-sub">💤 ${r.rest} dk dinlenme</div></div>` +
      grp('SET PLANI', plan);
  }
  if (id === 'sleep') {
    const mode = calcState.sleepMode || 'wake';
    const timeStr = mode === 'wake' ? (calcState.wakeHour || '07:00') : (calcState.bedHour || '23:00');
    const fmt24 = calcState.sleep24 === true;
    const times = calcSleep(mode, timeStr, { includeFall: calcState.sleepFall, isWorkoutDay: calcState.sleepWorkout });
    if (!times) return `<div class="cres muted">Saat gir</div>`;
    const tp = { h: parseInt(timeStr.split(':')[0]) || 0, m: parseInt(timeStr.split(':')[1]) || 0 };
    const label = mode === 'wake' ? `Saat ${fmtTime(tp, fmt24)} kalkacaksın → şu saatlerde YAT:` : `Saat ${fmtTime(tp, fmt24)} yatacaksın → şu saatlerde UYAN:`;
    const isW = calcState.sleepWorkout === true;
    const tags = isW ? ['⚠️ Minimum', '👍 İyi', '💪 Optimal', '💤 Uzun'] : ['⚠️ Minimum', '👍 İyi', '✨ Optimal', '💤 Uzun'];
    let rows = '';
    times.forEach((tt, i) => { rows += `<div class="crow"><span style="font-size:22px;font-weight:800;color:var(--accent)">${fmtTime(tt.time, fmt24)}</span><span class="muted">${tt.cycles} döngü · ${tt.sleep} sa</span><span style="font-weight:700">${tags[i]}</span></div>`; });
    return `<div class="cres" style="text-align:left"><div class="cres-sub" style="margin-bottom:8px">${label}</div>${rows}</div>`;
  }
  return '';
}
function render1RM() {
  return `<div class="card">` +
    `<label>Kaldırdığın Yük (kg)</label>` +
    `<input type="number" inputmode="decimal" step="0.5" placeholder="örn. 80" value="${calcState.kg || ''}" data-action-input="calcInput" data-arg="kg">` +
    `<label>Tekrar Sayısı (1-12)</label>` +
    `<input type="number" inputmode="numeric" min="1" max="12" placeholder="örn. 8" value="${calcState.reps || ''}" data-action-input="calcInput" data-arg="reps">` +
    `</div>` +
    `<div id="calc-result">${calcResultHTML('1rm')}</div>` +
    `<div class="status">💡 1RM = 1 tekrar yapabileceğin tahmini maksimum. Wathen ana hesaptır; diğerleri referans.</div>`;
}
function renderWS() {
  const sets = calcState.wsSets || 3, diff = calcState.wsDiff || 'medium', fixed = calcState.wsFixed === true;
  const dbtn = (idv, l) => `<button data-action="calcWsDiff" data-arg="${idv}" class="${diff === idv ? 'on' : ''}">${l}</button>`;
  return `<div class="card">` +
    `<label>Hedef Ağırlık (kg)</label>` +
    `<input type="number" inputmode="decimal" step="0.5" placeholder="örn. 100" value="${calcState.wsTarget || ''}" data-action-input="calcInput" data-arg="wsTarget">` +
    `<div style="display:flex;gap:10px">` +
      `<div style="flex:1"><label>Set (1-5)</label><input type="number" inputmode="numeric" min="1" max="5" value="${sets}" data-action-input="calcInput" data-arg="wsSets"></div>` +
      `<div style="flex:1"><label>Tekrar (1-10)</label><input type="number" inputmode="numeric" min="1" max="10" placeholder="örn. 5" value="${calcState.wsReps || ''}" data-action-input="calcInput" data-arg="wsReps"></div>` +
    `</div>` +
    `<label>Zorluk</label><div class="cdiff">${dbtn('easy', '😌 Kolay')}${dbtn('medium', '💪 Orta')}${dbtn('hard', '🔥 Zor')}</div>` +
    `<div class="ctoggle" data-action="calcWsFixed"><div><b style="font-size:13px">Sabit Ağırlık</b><div class="muted" style="font-size:11px">Kapalı: piramit · Açık: tüm setler aynı</div></div>` +
      `<div class="csw" style="background:${fixed ? 'var(--accent)' : 'var(--line)'}"><i style="left:${fixed ? '22px' : '3px'}"></i></div></div>` +
    `</div>` +
    `<div id="calc-result">${calcResultHTML('ws')}</div>`;
}
function renderSleep() {
  const mode = calcState.sleepMode || 'wake';
  const mbtn = (m, l) => `<button data-action="calcSleepMode" data-arg="${m}" class="${mode === m ? 'on' : ''}">${l}</button>`;
  const tog = (key, title, sub) => { const on = calcState[key] === true; return `<div class="ctoggle" data-action="calcSleepToggle" data-arg="${key}"><div><b style="font-size:13px">${title}</b><div class="muted" style="font-size:11px">${sub}</div></div><div class="csw" style="background:${on ? 'var(--accent)' : 'var(--line)'}"><i style="left:${on ? '22px' : '3px'}"></i></div></div>`; };
  return `<div class="card">` +
    `<label>Hangisine göre?</label><div class="cdiff">${mbtn('wake', '⏰ Kalkışıma')}${mbtn('bed', '🛏️ Yatışıma')}</div>` +
    (mode === 'wake'
      ? `<label>Kalkış saatin</label><input type="time" value="${calcState.wakeHour || '07:00'}" data-action-input="calcInput" data-arg="wakeHour">`
      : `<label>Yatış saatin</label><input type="time" value="${calcState.bedHour || '23:00'}" data-action-input="calcInput" data-arg="bedHour">`) +
    tog('sleep24', '🕐 24 Saat Biçimi', 'Kapalı: AM/PM') +
    tog('sleepFall', '⏱️ Uykuya Dalma', '+15 dk ekler') +
    tog('sleepWorkout', '💪 Antrenman Günü', 'Açık: +30 dk') +
    `</div>` +
    `<div id="calc-result">${calcResultHTML('sleep')}</div>` +
    `<div class="status">💡 Uyku ~90 dk döngüler halinde gelir; döngü sonunda uyanmak daha dinç hissettirir.</div>`;
}

function renderAntrenman() {
  if (antrenSub === 'araclar') return antrenBar() + renderTools();
  if (exData === null) {
    if (!exLoading) {
      exLoading = true;
      loadExercises(currentBranch).then(d => { exCache[currentBranch] = d; exData = d; exLoading = false; if (activeTab === 'antrenman') renderTab(); })
        .catch(() => { exLoading = false; if (activeTab === 'antrenman') document.getElementById('tab-content').innerHTML = grp('ANTRENMAN', '<span class="muted">Egzersizler yüklenemedi. (https/Pages üzerinde çalışır, file:// ile değil.)</span>'); });
    }
    return grp('ANTRENMAN', '<span class="muted">Egzersizler yükleniyor…</span>');
  }
  if (exDetail) return renderExerciseDetail(exDetail);
  if (antrenSub === 'programlar') {
    if (builder !== null) return exSelectMode ? renderExerciseSelect() : renderBuilder();
    if (activeWorkout) return renderActiveWorkout();
    if (selectedProgram) return antrenBar() + renderProgramDetail(selectedProgram);
    return antrenBar() + renderProgramList();
  }
  return antrenBar() + renderExercisePool();
}

function renderProfil() {
  return grp('HESABIM',
      `Cinsiyet: <b>${R.male ? 'Erkek' : 'Kadın'}</b><br>` +
      `Yaş: <b>${U.age}</b> &nbsp;·&nbsp; Boy: <b>${U.height} cm</b> &nbsp;·&nbsp; Kilo: <b>${U.weight} kg</b><br>` +
      `Aktivite: <b>×${U.actM}</b> &nbsp;·&nbsp; Deneyim: <b>${U.trainingAge}</b> &nbsp;·&nbsp; Hedef: <b>${GOAL_LABELS[U.goal]}</b>`) +
    grp('TEMA', `<div class="tdots">${THEMES.map(t => `<span class="tdot ${U.theme === t.key ? 'on' : ''}" data-action="setTheme" data-arg="${t.key}" style="background:${t.dot}" title="${t.name}"></span>`).join('')}</div>`) +
    `<button class="go" style="width:100%;margin-top:4px" data-action="editInfo">Bilgileri Düzenle</button>` +
    `<button style="width:100%;margin-top:8px" data-action="logOut">Çıkış Yap</button>` +
    `<div class="ver">Raven Fit · v${APP_VERSION}${accountLine()}</div>`;
}
function renderTab() {
  const map = { vucudum: renderVucudum, beslenme: renderBeslenme, antrenman: renderAntrenman, profil: renderProfil };
  document.getElementById('tab-content').innerHTML = (map[activeTab] || renderVucudum)();
}
function renderDashboard() {
  document.querySelectorAll('.bottomnav button').forEach(b => b.classList.toggle('on', b.dataset.arg === activeTab));
  renderTab();
}

// ── EYLEM KAYDI ──────────────────────────────────────────────
const actions = {
  setGender(el, a) { U.gender = a; highlight('setGender', a); },
  setAct(el, a) { U.actM = parseFloat(a); highlight('setAct', a); },
  setGoal(el, a) { U.goal = a; highlight('setGoal', a); },
  setTrain(el, a) { U.trainingAge = a; highlight('setTrain', a); },
  wizNext() { goStep(step + 1); },
  wizBack() { goStep(step - 1); },
  tab(el, a) { activeTab = a; exDetail = null; renderDashboard(); },
  vsub(el, a) { activeVsub = a; renderTab(); },
  editInfo() { fillInputs(); applyHighlights(); step = 1; showScreen('scr-basic'); },
  resetAll() { if (confirm('Tüm bilgilerin silinecek ve baştan başlayacaksın. Emin misin?')) { clearUser(); location.reload(); } },
  // egzersiz
  exCat(el, a) { exFilters.cat = a; highlight('exCat', a); document.getElementById('ex-list').innerHTML = exListHTML(exSelectMode); },
  exEquip(el, val) { exFilters.equip = val; document.getElementById('ex-list').innerHTML = exListHTML(exSelectMode); },
  exSearch(el, val) { exFilters.q = val; document.getElementById('ex-list').innerHTML = exListHTML(exSelectMode); },
  exOpen(el, id) { let f = null; for (const arr of Object.values(exCache)) { const e = arr && arr.find(x => x.id === id); if (e) { f = e; break; } } exDetail = f || (exData && exData.find(e => e.id === id)) || null; renderTab(); window.scrollTo(0, 0); },
  exBranch(el, b) { if (b === currentBranch) return; currentBranch = b; exFilters = { cat: '', equip: '', q: '' }; exDetail = null; exData = exCache[b] || null; renderTab(); },
  exBack() { exDetail = null; renderTab(); },
  // programlar
  antrenTab(el, a) { antrenSub = a; selectedProgram = null; exDetail = null; activeCalc = null; renderTab(); },
  openProgram(el, id) { selectedProgram = allPrograms().find(p => p.id === id) || null; renderTab(); window.scrollTo(0, 0); },
  backToPrograms() { selectedProgram = null; renderTab(); },
  startWorkout(el, arg) { const [pid, di] = arg.split(':'); const p = allPrograms().find(x => x.id === pid); if (p) { activeWorkout = { program: p, dayIdx: +di, done: {} }; stopRest(); renderTab(); window.scrollTo(0, 0); } },
  workoutSet(el, i) { if (!activeWorkout) return; const k = +i; activeWorkout.done[k] = (activeWorkout.done[k] || 0) + 1; startRest(90); renderTab(); },
  finishWorkout() {
    if (activeWorkout) {
      const { program, dayIdx, done } = activeWorkout;
      const d = program.days[dayIdx];
      let total = 0, doneN = 0;
      d.items.forEach((it, i) => { total += it.sets; doneN += Math.min(done[i] || 0, it.sets); });
      workoutHistory.push({ date: Date.now(), program: program.name, day: d.name, sets: doneN, total });
      saveJSON(HIST_KEY, workoutHistory);
    }
    stopRest(); activeWorkout = null; renderTab(); alert('Tebrikler! Antrenman tamamlandı 💪');
  },
  cancelWorkout() { if (confirm('Antrenmanı bitirmeden çıkmak istiyor musun?')) { stopRest(); activeWorkout = null; renderTab(); } },
  // dinlenme sayacı
  rest(el, a) { startRest(+a); },
  restStop() { stopRest(); },
  // program oluşturucu
  newProgram() { builder = { name: '', items: [] }; exSelectMode = false; renderTab(); window.scrollTo(0, 0); },
  cancelBuilder() { builder = null; exSelectMode = false; renderTab(); },
  builderName(el, val) { if (builder) builder.name = val; },
  addExercise() { exSelectMode = true; renderTab(); window.scrollTo(0, 0); },
  doneSelecting() { exSelectMode = false; renderTab(); window.scrollTo(0, 0); },
  exPick(el, id) { if (!builder) return; builder.items.push({ ex: id, sets: 3, reps: '10' }); document.getElementById('ex-list').innerHTML = exListHTML(true); const cc = document.getElementById('sel-count'); if (cc) cc.textContent = builder.items.length; },
  bSetPlus(el, i) { builder.items[+i].sets++; renderTab(); },
  bSetMinus(el, i) { const it = builder.items[+i]; if (it.sets > 1) it.sets--; renderTab(); },
  bReps(el, val) { const i = +el.dataset.arg; if (builder && builder.items[i]) builder.items[i].reps = val; },
  bRemove(el, i) { builder.items.splice(+i, 1); renderTab(); },
  saveProgram() {
    if (!builder.name.trim()) { alert('Programa bir ad ver.'); return; }
    if (!builder.items.length) { alert('En az bir egzersiz ekle.'); return; }
    const p = { id: 'custom-' + Date.now(), name: builder.name.trim(), desc: 'Özel program', level: 'Özel', custom: true, days: [{ name: 'Antrenman', items: builder.items }] };
    customPrograms.push(p); saveJSON(PROG_KEY, customPrograms);
    builder = null; exSelectMode = false; renderTab(); alert('Program kaydedildi 💪');
  },
  deleteProgram(el, id) { if (confirm('Bu programı sil?')) { customPrograms = customPrograms.filter(p => p.id !== id); saveJSON(PROG_KEY, customPrograms); renderTab(); } },
  // ilerleme / ölçüm
  openMeasure() { measureForm = true; renderTab(); window.scrollTo(0, 0); },
  cancelMeasure() { measureForm = false; renderTab(); },
  saveMeasure() {
    const w = +document.getElementById('m-weight').value;
    if (!w || w < 20 || w > 400) { alert('Geçerli bir kilo gir.'); return; }
    const waist = +document.getElementById('m-waist').value || U.waist;
    const neck = +document.getElementById('m-neck').value || U.neck;
    const hipEl = document.getElementById('m-hip');
    const hip = hipEl ? (+hipEl.value || U.hip) : U.hip;
    const bf = calcBF({ gender: U.gender, height: U.height, neck, waist, hip });
    U.weight = w; U.waist = waist; U.neck = neck; U.hip = hip; saveUser(U); compute();
    measurements.push({ date: Date.now(), weight: w, bf, waist, neck, hip });
    saveJSON(MEAS_KEY, measurements);
    measureForm = false; renderTab();
  },
  deleteMeasure(el, arg) { if (confirm('Bu ölçümü sil?')) { measurements = measurements.filter(m => String(m.date) !== arg); saveJSON(MEAS_KEY, measurements); renderTab(); } },
  // supplement anketi
  startSuppSurvey() { suppSurvey = true; suppDraft = suppAnswers ? { ...suppAnswers } : {}; openSupp = null; renderTab(); window.scrollTo(0, 0); },
  cancelSuppSurvey() { suppSurvey = false; renderTab(); },
  suppAns(el, arg) { const [k, v] = arg.split(':'); suppDraft[k] = v; renderTab(); },
  submitSuppSurvey() { suppAnswers = { ...suppDraft }; saveJSON(SUPP_KEY, suppAnswers); suppSurvey = false; openSupp = null; renderTab(); window.scrollTo(0, 0); },
  suppToggle(el, id) { openSupp = openSupp === id ? null : id; renderTab(); },
  // hesap / auth
  authLogin() { doAuth('login'); },
  authSignup() { doAuth('signup'); },
  authGuest() { doAuth('guest'); },
  logOut() { didLogout = true; if (FB) FB.logOut(); },
  setTheme(el, key) { U.theme = applyTheme(key); saveUser(U); renderTab(); },
  calcOpen(el, id) { activeCalc = id; if (id === 'ws') calcState = { wsSets: 3, wsDiff: 'medium', wsFixed: false }; else if (id === 'sleep') calcState = { sleepMode: 'wake', wakeHour: '07:00', bedHour: '23:00', sleep24: true, sleepFall: true, sleepWorkout: false }; else calcState = {}; renderTab(); },
  calcBack() { activeCalc = null; renderTab(); },
  calcInput(el, val) { const key = el.dataset.arg; calcState[key] = val; const r = document.getElementById('calc-result'); if (r) r.innerHTML = calcResultHTML(activeCalc); },
  calcWsDiff(el, dd) { calcState.wsDiff = dd; renderTab(); },
  calcWsFixed() { calcState.wsFixed = !calcState.wsFixed; renderTab(); },
  calcSleepMode(el, m) { calcState.sleepMode = m; renderTab(); },
  calcSleepToggle(el, key) { calcState[key] = !calcState[key]; renderTab(); },
};

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-action]');
  if (!t) return;
  const fn = actions[t.dataset.action];
  if (fn) fn(t, t.dataset.arg);
});
document.addEventListener('input', (e) => {
  const t = e.target.closest('[data-action-input]');
  if (t && actions[t.dataset.actionInput]) actions[t.dataset.actionInput](t, t.value);
});
document.addEventListener('change', (e) => {
  const t = e.target.closest('[data-action-change]');
  if (t && actions[t.dataset.actionChange]) actions[t.dataset.actionChange](t, t.value);
});

// ── AÇILIŞ + AUTH ─────────────────────────────────────────────
let FB = null, currentUid = null, didLogout = false, syncTimer = null;

const st = runSelfTest();
const stEl = document.getElementById('selftest');
if (stEl) { stEl.textContent = st.failed === 0 ? `✅ Öz-test geçti (${st.passed}/${st.passed})` : `❌ ${st.failed} test kaldı`; stEl.className = 'status ' + (st.failed === 0 ? 'ok' : 'bad'); }
const VER_TXT = `Raven Fit · v${APP_VERSION}`;
['ver-welcome', 'ver-auth'].forEach(id => { const e = document.getElementById(id); if (e) e.textContent = VER_TXT; });

function accountLine() {
  if (FB && FB.auth && FB.auth.currentUser) {
    const u = FB.auth.currentUser;
    return u.isAnonymous ? ' · misafir (bulut)' : ' · ' + (u.email || '').split('@')[0];
  }
  return ' · yerel mod';
}
function reloadFromStorage() {
  const saved = loadUser();
  if (saved) Object.assign(U, saved);
  customPrograms = loadJSON(PROG_KEY) || [];
  measurements = loadJSON(MEAS_KEY) || [];
  suppAnswers = loadJSON(SUPP_KEY) || null;
  workoutHistory = loadJSON(HIST_KEY) || [];
  return !!saved;
}
function resetMemory() {
  Object.assign(U, { gender: 'male', age: 25, height: 180, neck: 40, shoulder: 0, waist: 85, hip: 95, weight: 80, actM: 1.55, goal: 'maintain', trainingAge: 'intermediate', theme: 'dark' });
  customPrograms = []; measurements = []; suppAnswers = null; workoutHistory = [];
  step = 0; activeTab = 'vucudum'; activeVsub = 'analiz'; antrenSub = 'havuz';
  selectedProgram = null; activeWorkout = null; builder = null; exSelectMode = false; activeCalc = null; calcState = {};
  suppSurvey = false; exDetail = null; openSupp = null;
}
function initAppUI(hasData) { applyTheme(U.theme || 'dark'); fillInputs(); applyHighlights(); if (hasData) enterDashboard(); else showScreen('scr-welcome'); }
function localOnlyStart() { initAppUI(reloadFromStorage()); }

function scheduleSync() {
  if (!FB || !currentUid) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => { FB.pushUserData(currentUid, exportAll()).catch(() => {}); }, 800);
}
function authMsg(text, ok) { const m = document.getElementById('au-msg'); if (!m) return; m.style.display = 'block'; m.textContent = text; m.className = 'status ' + (ok ? 'ok' : 'bad'); }
function authErr(e) {
  const x = (e && e.code) || '';
  if (x.includes('invalid-email')) return 'Geçersiz e-posta.';
  if (x.includes('weak-password')) return 'Şifre en az 6 karakter olmalı.';
  if (x.includes('email-already-in-use')) return 'Bu kullanıcı adı zaten alınmış — Giriş Yap.';
  if (x.includes('invalid-credential') || x.includes('wrong-password') || x.includes('user-not-found')) return 'Kullanıcı adı veya şifre hatalı.';
  if (x.includes('operation-not-allowed')) return 'Bu giriş yöntemi Firebase\'de açık değil.';
  if (x.includes('network')) return 'Ağ hatası. İnterneti kontrol et.';
  return 'Hata: ' + (x || 'bilinmeyen');
}
async function doAuth(mode) {
  if (!FB) { authMsg('Bağlantı yok (yerel mod).', false); return; }
  if (mode === 'guest') { try { authMsg('İşleniyor…', true); await FB.signInGuest(); } catch (e) { authMsg(authErr(e), false); } return; }
  const uname = (document.getElementById('au-user').value || '').trim().toLowerCase();
  const pass = document.getElementById('au-pass').value || '';
  if (!/^[a-z0-9._-]{3,20}$/.test(uname)) { authMsg('Kullanıcı adı 3-20 karakter; harf, rakam, . _ - olabilir.', false); return; }
  const email = uname + '@ravenfit3.app';   // dahili sahte e-posta
  try {
    authMsg('İşleniyor…', true);
    if (mode === 'signup') await FB.signUp(email, pass);
    else await FB.signIn(email, pass);
  } catch (e) { authMsg(authErr(e), false); }
}

async function boot() {
  setSyncHandler(scheduleSync);
  try { FB = await import('./firebase.js'); } catch (e) { FB = null; }
  if (!FB) { localOnlyStart(); return; }   // Firebase yüklenemedi → yerel mod
  FB.onAuth(async (user) => {
    if (!user) {
      currentUid = null;
      if (didLogout) { clearAll(); resetMemory(); didLogout = false; }
      showScreen('scr-auth');
      return;
    }
    currentUid = user.uid;
    try { const cloud = await FB.pullUserData(user.uid); if (cloud) importAll(cloud); } catch (e) {}
    initAppUI(reloadFromStorage());
  });
}
boot();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => { const el = document.getElementById('pwa'); if (el) { el.textContent = '✅ Service worker kayıtlı'; el.className = 'status ok'; } })
    .catch(() => { const el = document.getElementById('pwa'); if (el) { el.textContent = '⚠️ Service worker kaydı başarısız'; el.className = 'status bad'; } });
}
