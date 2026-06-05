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
import { calcSuppScores } from './supplements.js';
import { determineBodyProfile, getDietTipByProfile } from './profile.js';
import { loadExercises, filterExercises, uniqueEquipment, CAT_TR, CATEGORIES } from './exercises.js';
import { PROGRAMS } from './programs.js';
import { showScreen } from './ui.js';
import { saveUser, loadUser, clearUser, saveJSON, loadJSON } from './storage.js';
import { runSelfTest } from './selftest.js';

const APP_VERSION = '0.0.11';
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
function renderIlerleme() {
  return grp('İLERLEME', `<span class="muted">Haftalık ölçüm kaydı ve değişim grafiği sonraki fazlarda eklenecek.</span>`);
}
function renderVucudum() {
  const subs = [['analiz', 'Analiz'], ['olculer', 'Ölçüler'], ['ilerleme', 'İlerleme']];
  const bar = '<div class="subtabs">' + subs.map(([k, l]) =>
    `<button data-action="vsub" data-arg="${k}" class="${activeVsub === k ? 'on' : ''}">${l}</button>`).join('') + '</div>';
  const body = activeVsub === 'olculer' ? renderOlculer() : activeVsub === 'ilerleme' ? renderIlerleme() : renderAnaliz();
  return bar + body;
}
function renderBeslenme() {
  let h = grp(`ENERJİ — hedef: ${GOAL_LABELS[U.goal]}`,
        `TDEE (BMR × ${U.actM}): <b>${R.tdee} kcal</b><br>Günlük hedef: <b>${R.goalCals} kcal</b>`) +
      grp('MAKRO',
        `Protein: <b>${R.mac.pg} g</b> <span class="muted">(${R.mac.proteinSource === 'lm' ? 'yağsız kütle bazlı' : 'vücut ağırlığı bazlı'})</span><br>` +
        `Yağ: <b>${R.mac.fg} g</b> &nbsp;·&nbsp; Karbonhidrat: <b>${R.mac.cg} g</b>`) +
      grp('SU', `Günlük: <b>${R.water.cups} bardak</b> &nbsp;(~${R.water.lt} L)`) +
      grp('ÖNERİ', `Önerilen: <b>${GOAL_LABELS[R.recPrimary]}</b>` +
        (R.recAlt ? ` <span class="muted">· alternatif: ${GOAL_LABELS[R.recAlt]}</span>` : '') +
        `<br><span class="muted">${R.recReason}</span>`);
  let supp = `<div class="grp"><div class="h">SUPPLEMENT</div>`;
  if (R.supps.length) R.supps.forEach((s, i) => {
    supp += `${['🥇', '🥈', '🥉', '•'][i] || '•'} ${s.emoji} <b>${s.name}</b> <span class="ev">${EV[s.evidence] || ''}</span><br>`;
  });
  else supp += `<span class="muted">—</span>`;
  supp += `</div>`; h += supp;
  if (R.gw) h += `<div class="warn">${R.gw}</div>`;
  if (R.reds) h += `<div class="warn reds">⚠️ <strong>RED-S riski:</strong> Yağ oranın çok düşükken cut yapmak hormonal sağlığı, kemik yoğunluğunu ve performansı olumsuz etkileyebilir. <strong>Maintain</strong> veya <strong>bulk</strong> önerilir.</div>`;
  return h;
}

// ── EGZERSİZ HAVUZU ──────────────────────────────────────────
let exData = null, exLoading = false;
let exFilters = { cat: '', equip: '', q: '' };
let exDetail = null;
let antrenSub = 'havuz';      // havuz | programlar
let selectedProgram = null;
let activeWorkout = null;      // { program, dayIdx, done:{exIdx:setSayısı} }
let builder = null;            // { name, items:[{ex,sets,reps}] }
let exSelectMode = false;      // havuzdan egzersiz seçme modu
const PROG_KEY = 'ravenfit_programs_v1';
let customPrograms = loadJSON(PROG_KEY) || [];
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
  const pills = '<div class="pills exf">' +
    `<button data-action="exCat" data-arg="" class="${exFilters.cat === '' ? 'on' : ''}">Hepsi</button>` +
    CATEGORIES.map(c => `<button data-action="exCat" data-arg="${c}" class="${exFilters.cat === c ? 'on' : ''}">${CAT_TR[c]}</button>`).join('') +
    '</div>';
  const equips = uniqueEquipment(exData);
  const sel = `<select data-action-change="exEquip" class="exsel"><option value="">Tüm ekipman</option>` +
    equips.map(q => `<option value="${q}" ${exFilters.equip === q ? 'selected' : ''}>${q}</option>`).join('') + `</select>`;
  const search = `<input data-action-input="exSearch" class="exsearch" type="text" placeholder="Egzersiz ara…" value="${esc(exFilters.q)}">`;
  return `<div class="exbar">${pills}<div class="exrow">${sel}${search}</div></div><div id="ex-list">${exListHTML(false)}</div>`;
}
function renderExerciseSelect() {
  const pills = '<div class="pills exf">' +
    `<button data-action="exCat" data-arg="" class="${exFilters.cat === '' ? 'on' : ''}">Hepsi</button>` +
    CATEGORIES.map(c => `<button data-action="exCat" data-arg="${c}" class="${exFilters.cat === c ? 'on' : ''}">${CAT_TR[c]}</button>`).join('') + '</div>';
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
  const li = (arr) => (arr && arr.length) ? '<ul class="exul">' + arr.map(x => `<li>${esc(x)}</li>`).join('') + '</ul>' : '<span class="muted">—</span>';
  return `<button data-action="exBack">← Havuza dön</button>` +
    `<h3 style="margin:12px 0 0">${esc(e.name_tr)}</h3>` +
    `<div class="muted" style="font-size:13px">${esc(e.name_en || '')}</div>` +
    `<div class="exbadges">${CAT_TR[e.category] || e.category} · ${(e.equipment || []).join(', ')} · Zorluk ${diffDots(e.difficulty)} · ${e.is_compound ? 'Bileşik' : 'İzolasyon'} · ${esc(e.force_type)}</div>` +
    grp('HEDEF KASLAR', mus) + grp('TALİMATLAR', li(e.instructions_tr)) +
    grp('İPUÇLARI', li(e.tips_tr)) + grp('SIK HATALAR', li(e.common_mistakes_tr));
}
const exName = (id) => { const e = exData && exData.find(x => x.id === id); return e ? e.name_tr : id; };
function antrenBar() {
  const subs = [['havuz', 'Havuz'], ['programlar', 'Programlar']];
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
function renderAntrenman() {
  if (exData === null) {
    if (!exLoading) {
      exLoading = true;
      loadExercises().then(d => { exData = d; exLoading = false; if (activeTab === 'antrenman') renderTab(); })
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
    `<button class="go" style="width:100%;margin-top:4px" data-action="editInfo">Bilgileri Düzenle</button>` +
    `<button style="width:100%;margin-top:8px" data-action="resetAll">Sıfırla</button>` +
    `<div class="ver">Raven Fit · v${APP_VERSION} · veriler bu cihazda kayıtlı</div>`;
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
  exOpen(el, id) { exDetail = exData.find(e => e.id === id) || null; renderTab(); window.scrollTo(0, 0); },
  exBack() { exDetail = null; renderTab(); },
  // programlar
  antrenTab(el, a) { antrenSub = a; selectedProgram = null; exDetail = null; renderTab(); },
  openProgram(el, id) { selectedProgram = allPrograms().find(p => p.id === id) || null; renderTab(); window.scrollTo(0, 0); },
  backToPrograms() { selectedProgram = null; renderTab(); },
  startWorkout(el, arg) { const [pid, di] = arg.split(':'); const p = allPrograms().find(x => x.id === pid); if (p) { activeWorkout = { program: p, dayIdx: +di, done: {} }; stopRest(); renderTab(); window.scrollTo(0, 0); } },
  workoutSet(el, i) { if (!activeWorkout) return; const k = +i; activeWorkout.done[k] = (activeWorkout.done[k] || 0) + 1; startRest(90); renderTab(); },
  finishWorkout() { stopRest(); activeWorkout = null; renderTab(); alert('Tebrikler! Antrenman tamamlandı 💪'); },
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

// ── AÇILIŞ ──
const st = runSelfTest();
const stEl = document.getElementById('selftest');
stEl.textContent = st.failed === 0 ? `✅ Öz-test geçti (${st.passed}/${st.passed})` : `❌ ${st.failed} test kaldı`;
stEl.className = 'status ' + (st.failed === 0 ? 'ok' : 'bad');
document.getElementById('ver-welcome').textContent = `Raven Fit · v${APP_VERSION}`;

const saved = loadUser();
if (saved) Object.assign(U, saved);
fillInputs();
applyHighlights();
if (saved) enterDashboard();
else showScreen('scr-welcome');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => { const el = document.getElementById('pwa'); el.textContent = '✅ Service worker kayıtlı — offline & kurulabilir'; el.className = 'status ok'; })
    .catch(() => { const el = document.getElementById('pwa'); el.textContent = '⚠️ Service worker kaydı başarısız (HTTPS/Pages gerekir)'; el.className = 'status bad'; });
}
