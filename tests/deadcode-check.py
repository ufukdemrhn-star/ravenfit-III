#!/usr/bin/env python3
"""Erişilebilirlik analizi — kök kümeden ulaşılamayan fonksiyonları bulur.

Kök küme:
  1. index.html'deki inline handler'lar (onclick vb.)
  2. window load / DOMContentLoaded listener'ları
  3. Firebase SDK'nın çağırdığı initFirebase
  4. Konsoldan çağrılması amaçlanan araçlar (_ravenfitSelfTest)

Yorumlar ve string'ler maskelenir — sadece GERÇEK kod referansları sayılır.
Ama dinamik HTML string'lerindeki onclick="fn()" ayrıca taranır.
"""
import re, glob, sys, json
from collections import defaultdict, deque

BUILD = '.'

def strip_comments(s):
    out=[]; i=0; n=len(s)
    while i<n:
        c=s[i]
        if c=='/' and i+1<n and s[i+1]=='*':
            j=s.find('*/',i+2); j=n if j<0 else j+2
            out.append(' '*(j-i)); i=j; continue
        if c=='/' and i+1<n and s[i+1]=='/':
            j=s.find('\n',i); j=n if j<0 else j
            out.append(' '*(j-i)); i=j; continue
        out.append(c); i+=1
    return ''.join(out)

def js_files():
    return sorted(glob.glob(f'{BUILD}/js/**/*.js', recursive=True))

def main():
    sources = {f: open(f,encoding='utf-8').read() for f in js_files()}
    html = open(f'{BUILD}/index.html', encoding='utf-8').read()

    # ── Tanımlar ──
    fn_def = {}
    for f, s in sources.items():
        for m in re.finditer(r'^function\s+(\w+)\s*\(', s, re.M):
            fn_def[m.group(1)] = f
    all_fns = set(fn_def)

    # ── Her fonksiyonun gövdesini çıkar ──
    bodies = {}
    for f, s in sources.items():
        for m in re.finditer(r'^function\s+(\w+)\s*\(', s, re.M):
            name = m.group(1)
            b = s.find('{', m.start()); d=0; i=b
            while i < len(s):
                if s[i]=='{': d+=1
                elif s[i]=='}':
                    d-=1
                    if d==0: break
                i+=1
            bodies[name] = s[m.start():i+1]

    # ── Bir gövdedeki referansları bul ──
    def refs_in(text):
        code = strip_comments(text)
        found = set()
        # Gerçek kod referansları (string'ler dahil değil ama pratikte
        # dinamik HTML string'leri de kod içinde, o yüzden hepsini tara)
        for m in re.finditer(r'\b([A-Za-z_]\w*)\s*\(', code):
            if m.group(1) in all_fns: found.add(m.group(1))
        # Referans olarak geçirme: setTimeout(fn, setInterval(fn,
        for m in re.finditer(r'(?:setTimeout|setInterval|then|catch|forEach|map|filter)\s*\(\s*([A-Za-z_]\w*)\s*[,)]', code):
            if m.group(1) in all_fns: found.add(m.group(1))
        # onclick="fn(  içinde (dinamik HTML string)
        for m in re.finditer(r'on\w+\s*=\s*\\?["\']([^"\'\\]+)', code):
            for c in re.findall(r'\b([A-Za-z_]\w*)\s*\(', m.group(1)):
                if c in all_fns: found.add(c)
        # Çıplak referans: argüman olarak geçirme  fn(a, otherFn)  veya  = otherFn;
        for m in re.finditer(r'[(,=:]\s*([A-Za-z_]\w*)\s*[,);\]]', code):
            if m.group(1) in all_fns: found.add(m.group(1))
        return found

    # ── Kök küme ──
    roots = set()
    # index.html inline handler'lar
    for m in re.finditer(r'\bon\w+\s*=\s*"([^"]+)"', html):
        for c in re.findall(r'\b([A-Za-z_]\w*)\s*\(', m.group(1)):
            if c in all_fns: roots.add(c)
    # index.html içindeki <script> blokları
    for m in re.finditer(r'<script>(.*?)</script>', html, re.S):
        for c in refs_in(m.group(1)): roots.add(c)
    # app.js tamamı kök (load listener)
    roots |= refs_in(sources.get(f'{BUILD}/js/app.js',''))
    # Konsol araçları
    roots |= {'_ravenfitSelfTest'} & all_fns

    # ── state.js'teki load listener de kök (şimdilik, duplicate olsa da) ──
    st = sources.get(f'{BUILD}/js/core/state.js','')
    m = re.search(r"window\.addEventListener\('load'.*?\}\);", st, re.S)
    if m: roots |= refs_in(m.group(0))

    # ── BFS ──
    reachable = set()
    q = deque(roots)
    while q:
        fn = q.popleft()
        if fn in reachable: continue
        reachable.add(fn)
        for r in refs_in(bodies.get(fn,'')):
            if r not in reachable: q.append(r)

    dead = sorted(all_fns - reachable)

    print(f"Toplam fonksiyon : {len(all_fns)}")
    print(f"Kök küme         : {len(roots)}")
    print(f"Erişilebilir     : {len(reachable)}")
    print(f"ULAŞILAMAYAN     : {len(dead)}")
    print()
    print("═"*70)
    print("ÖLÜ FONKSİYONLAR (kök kümeden erişilemiyor)")
    print("═"*70)
    # Gruplama: hangi dosyada
    by_file = defaultdict(list)
    for d in dead: by_file[fn_def[d]].append(d)
    for f in sorted(by_file):
        print(f"\n  {f.replace(BUILD+'/','')}")
        for d in sorted(by_file[f]):
            # Kim çağırıyor (ölü olanlar dahil)?
            callers = [k for k,v in bodies.items() if k!=d and d in refs_in(v)]
            live_callers = [c for c in callers if c in reachable]
            note = ''
            if live_callers: note = f'  ⚠️ canlıdan çağrılıyor: {live_callers}'
            elif callers: note = f'  (sadece ölülerden: {callers[:3]})'
            print(f"     {d:<30}{note}")

    json.dump({'dead':dead,'reachable':sorted(reachable)}, open('reachability.json','w'), indent=1)

if __name__ == '__main__':
    main()
