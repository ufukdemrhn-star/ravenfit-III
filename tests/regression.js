/* Faz A düzeltmelerinin ÇALIŞMA ANI kanıtı.
   Sahte DOM ile gerçek fonksiyonları çalıştırır. */

// ── Sahte DOM ─────────────────────────────────────────────
const registry = new Map();
let fetchCount = 0;
let missingIdAccess = [];

function mkEl(id) {
  return {
    id,
    textContent: '',
    innerHTML: '',
    style: { _p: {}, setProperty(k,v){this._p[k]=v}, removeProperty(k){delete this._p[k]},
             get display(){return this._p.display||''}, set display(v){this._p.display=v} },
    classList: { _s:new Set(), add(c){this._s.add(c)}, remove(c){this._s.delete(c)},
                 contains(c){return this._s.has(c)}, toggle(c,f){f?this._s.add(c):this._s.delete(c)} },
    querySelectorAll: () => [], querySelector: () => null,
    appendChild(){}, remove(){}, addEventListener(){}, scrollIntoView(){},
    setAttribute(){}, getAttribute(){return null}, focus(){},
  };
}

global.document = {
  getElementById(id) {
    if (registry.has(id)) return registry.get(id);
    missingIdAccess.push(id);
    return null;
  },
  querySelectorAll: () => [],
  querySelector: () => null,
  createElement: (t) => mkEl('_new_' + t),
  addEventListener(){}, removeEventListener(){},
  body: { style:{}, appendChild(){}, classList:{add(){},remove(){}} },
  documentElement: { setAttribute(){}, style:{ setProperty(){}, removeProperty(){} } },
  readyState: 'complete',
};

const loadHandlers = [];
global.window = {
  location: { protocol:'https:', origin:'https://x.io', pathname:'/app/' },
  addEventListener(ev, fn) { if (ev === 'load') loadHandlers.push(fn); },
  scrollTo(){}, matchMedia: () => ({matches:false, addListener(){}}),
};
global.localStorage = { _d:{}, getItem(k){return this._d[k]??null},
  setItem(k,v){this._d[k]=String(v)}, removeItem(k){delete this._d[k]} };
global.navigator = { vibrate(){}, userAgent:'test' };
global.fetch = (url) => { fetchCount++; return Promise.reject(new Error('offline')); };
global.firebase = undefined;
global.AudioContext = function(){ return {
  createOscillator:()=>({connect(){},start(){},stop(){},frequency:{value:0},type:''}),
  createGain:()=>({connect(){},gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}}}),
  destination:{}, currentTime:0, close(){} }; };

// ── Kodu yükle ────────────────────────────────────────────
const src = require('fs').readFileSync(__dirname+'/_combined.tmp.js','utf8');
eval(src);

// ── Test altyapısı ────────────────────────────────────────
let pass=0, fail=0;
function t(label, cond, detail='') {
  if (cond) { pass++; console.log(`  ✅ ${label}`); }
  else { fail++; console.log(`  ❌ ${label}${detail?'  → '+detail:''}`); }
}

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║  FAZ A — ÇALIŞMA ANI REGRESYON TESTİ                      ║');
console.log('╚═══════════════════════════════════════════════════════════╝');

// ═══ A1: load listener tek mi? ═══
console.log('\n▸ A1 — Başlatma kodu tek kez çalışmalı');
t(`window load listener sayısı = 1`, loadHandlers.length === 1,
  `bulunan: ${loadHandlers.length}`);

// Gerçekten çalıştır, fetch sayısını ölç
missingIdAccess = []; fetchCount = 0;   // registry korunur — applyTheme çalışsın
loadHandlers.forEach(fn => { try { fn(); } catch(e){} });
t(`Açılışta fetch sayısı = 8 (16 değil)`, fetchCount === 8,
  `atılan istek: ${fetchCount}`);

// ═══ A2: adjustRestTime ═══
console.log('\n▸ A2 — Set sayacı +/− butonları');
const restEl = mkEl('tools-rest-time-val');
registry.set('tools-rest-time-val', restEl);
_restTime = 60;
missingIdAccess = [];
let threw = false;
try { adjustRestTime(15); } catch(e) { threw = true; }
t('adjustRestTime(+15) hata fırlatmıyor', !threw);
t('_restTime 60 → 75', _restTime === 75, `değer: ${_restTime}`);
t('Ekrandaki metin güncellendi', restEl.textContent === '75s',
  `metin: "${restEl.textContent}"`);
try { adjustRestTime(-15); } catch(e) { threw = true; }
t('adjustRestTime(-15) çalışıyor', _restTime === 60 && restEl.textContent === '60s',
  `${_restTime} / "${restEl.textContent}"`);
// Sınır kontrolleri
_restTime = 20; adjustRestTime(-15);
t('Alt sınır 15sn korunuyor', _restTime === 15, `değer: ${_restTime}`);
_restTime = 295; adjustRestTime(15);
t('Üst sınır 300sn korunuyor', _restTime === 300, `değer: ${_restTime}`);
// Element yokken çökmemeli
registry.delete('tools-rest-time-val');
threw = false;
try { adjustRestTime(15); } catch(e) { threw = true; }
t('Element yokken çökmüyor (null-guard)', !threw);
t('Eski "rest-time-val" ID\'si aranmıyor', !missingIdAccess.includes('rest-time-val'),
  `aranan: ${missingIdAccess.filter(x=>x.includes('rest')).join(', ')}`);

// ═══ A3: logo yolu ═══
console.log('\n▸ A3 — PR ekranı logo yolu');
const fs = require('fs');
const prJs  = fs.readFileSync(__dirname+'/../js/calculators/pr-test.js','utf8');
const calcCss = fs.readFileSync(__dirname+'/../css/calculators.css','utf8');
// Faz C: stil kuralları JS'ten CSS'e taşındı
t('PR stilleri CSS dosyasında', calcCss.includes('.pr-feel-bg::before'));
// CSS'teki url() CSS dosyasının konumuna göre çözülür → ../assets/ olmalı
t('Logo yolu CSS-göreli (../assets/)', calcCss.includes('url("../assets/icons/logo.png")'));
t('Kök-göreli yanlış yol kullanılmıyor', !calcCss.includes('url("assets/icons/logo.png")'));
t('Çıplak "logo.png" kalmadı (CSS)', !/url\(["']?logo\.png/.test(calcCss));
t('JS artık <style> enjekte etmiyor', !prJs.includes('<style>'));

// ═══ A4: ölü timer ═══
console.log('\n▸ A4 — Kronometre tek timer kullanmalı');
const timers = new Set();
let timerSeq = 0;
global.setInterval = (fn, ms) => { const id = ++timerSeq; timers.add(id); return id; };
global.clearInterval = (id) => { timers.delete(id); };

registry.set('tools-chrono-toggle', mkEl('tools-chrono-toggle'));
registry.set('tools-chrono-display', mkEl('tools-chrono-display'));
_chronoRunning = false; _chronoMs = 0;
missingIdAccess = [];
timers.clear(); timerSeq = 0;

_toolsChronoToggle();   // başlat
t('Kronometre başlatınca 1 timer kuruluyor', timers.size === 1,
  `kurulan: ${timers.size}`);
t('Kronometre çalışıyor', _chronoRunning === true);

_toolsChronoToggle();   // durdur
t('Durdurunca tüm timer temizleniyor', timers.size === 0,
  `kalan: ${timers.size}`);

_toolsChronoReset();
t('Reset sonrası ölü ID aranmıyor',
  !missingIdAccess.includes('chrono-display') && !missingIdAccess.includes('chrono-toggle'),
  `aranan: ${[...new Set(missingIdAccess)].filter(x=>x.startsWith('chrono')).join(', ')}`);

// ═══ Özet ═══
console.log('\n' + '─'.repeat(60));
console.log(`📊 FAZ A SONUÇ: ${pass}/${pass+fail} test geçti`);
if (fail === 0) console.log('🎉 Tüm Faz A düzeltmeleri doğrulandı!');
else { console.log(`⚠️  ${fail} test başarısız`); process.exitCode = 1; }
