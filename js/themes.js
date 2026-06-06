// ════════════════════════════════════════════════════════════
//  themes.js — GERÇEK TEMA SİSTEMİ
//  Felsefe: zeminler nötr/temiz kalır (filtre/jel hissi YOK),
//  kimliği VURGU rengi taşır (butonlar, aktif sekmeler, başlıklar,
//  grafik, parıltı, telefon durum çubuğu). Açık tema gerçek açıktır.
// ════════════════════════════════════════════════════════════

// Koyu temalar için ortak nötr tuval — sadece accent + glow değişir
const DARK = { bg: '#0B0B0D', card: '#161619', line: '#26262C', text: '#F4F4F6', muted: '#9A9AA5', surface: '#101013', btn: '#1F1F24' };
const d = (accent, glow) => ({ ...DARK, accent, glow });

export const THEMES = [
  { key: 'dark',    name: 'Kömür',   dot: '#FF4D5A', vars: d('#FF4D5A', 'rgba(255,77,90,.30)') },
  { key: 'ocean',   name: 'Okyanus', dot: '#2E9BFF', vars: d('#2E9BFF', 'rgba(46,155,255,.30)') },
  { key: 'emerald', name: 'Zümrüt',  dot: '#1FD17F', vars: d('#1FD17F', 'rgba(31,209,127,.30)') },
  { key: 'violet',  name: 'Menekşe', dot: '#9D7BFF', vars: d('#9D7BFF', 'rgba(157,123,255,.30)') },
  { key: 'amber',   name: 'Amber',   dot: '#FFB02E', vars: d('#FFB02E', 'rgba(255,176,46,.30)') },
  { key: 'light',   name: 'Açık',    dot: '#FFFFFF', vars: { bg: '#F1F2F5', card: '#FFFFFF', line: '#E1E4E9', text: '#17191E', muted: '#5A6270', surface: '#F6F7F9', btn: '#ECEEF1', accent: '#E5394A', glow: 'rgba(229,57,74,.20)' } },
];

export function applyTheme(key) {
  const t = THEMES.find(x => x.key === key) || THEMES[0];
  const r = document.documentElement.style;
  for (const [k, v] of Object.entries(t.vars)) r.setProperty('--' + k, v);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t.vars.accent);
  return t.key;
}
