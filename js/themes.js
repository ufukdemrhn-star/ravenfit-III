// ════════════════════════════════════════════════════════════
//  themes.js — 6 RENK TEMASI (RavenFit2'den)
//  applyTheme CSS değişkenlerini documentElement'e yazar.
// ════════════════════════════════════════════════════════════
export const THEMES = [
  { key: 'dark',    name: 'Kömür',   dot: '#E63946', vars: { bg: '#080809', card: '#161618', line: '#2A2A2F', accent: '#E63946', text: '#F2F2F4', muted: '#9090A0', surface: '#0F0F11', btn: '#23232b' } },
  { key: 'crimson', name: 'Kızıl',   dot: '#C0392B', vars: { bg: '#0A0204', card: '#1A080B', line: '#3D1418', accent: '#C0392B', text: '#FFF4F2', muted: '#C49A94', surface: '#110508', btn: '#230B0F' } },
  { key: 'violet',  name: 'Menekşe', dot: '#9B72FF', vars: { bg: '#09070F', card: '#171320', line: '#2E2840', accent: '#9B72FF', text: '#EEEAFF', muted: '#8A84B8', surface: '#0F0C18', btn: '#1F1829' } },
  { key: 'forest',  name: 'Orman',   dot: '#22A857', vars: { bg: '#060D08', card: '#111C14', line: '#253428', accent: '#22A857', text: '#E8F5EC', muted: '#8DB898', surface: '#0B1410', btn: '#182419' } },
  { key: 'rose',    name: 'Gül',     dot: '#F472B6', vars: { bg: '#0F090D', card: '#1E1118', line: '#382030', accent: '#F472B6', text: '#FFECF4', muted: '#C48AAA', surface: '#170D12', btn: '#261520' } },
  { key: 'light',   name: 'Açık',    dot: '#E8E4DC', vars: { bg: '#E8E4DC', card: '#F5F2EC', line: '#C4BFB6', accent: '#B8202C', text: '#17171A', muted: '#4A4A56', surface: '#FFFFFF', btn: '#DDD9D0' } },
];
export function applyTheme(key) {
  const t = THEMES.find(x => x.key === key) || THEMES[0];
  const r = document.documentElement.style;
  for (const [k, v] of Object.entries(t.vars)) r.setProperty('--' + k, v);
  return t.key;
}
