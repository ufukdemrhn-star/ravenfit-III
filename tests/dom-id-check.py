#!/usr/bin/env python3
"""DOM ID denetimi — A2'deki hata sınıfını tüm uygulamada yakalar.

Sorun: getElementById('x') çağrılıyor ama 'x' hiçbir yerde üretilmiyor
       → null döner → .textContent yazınca çöker.

Tarar:
  ÜRETİLEN ID'ler : index.html'deki id="..."  +  JS string'lerindeki id="..."
  ERİŞİLEN ID'ler : getElementById('...') çağrıları
  RİSK            : erişilen ama üretilmeyen + null-guard'sız olanlar
"""
import re, glob, os, sys

BUILD = os.environ.get('RF_BUILD', 'build')

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

def main():
    js_files = sorted(glob.glob(f'{BUILD}/js/**/*.js', recursive=True))
    html = open(f'{BUILD}/index.html', encoding='utf-8').read()
    sources = {f: strip_comments(open(f,encoding='utf-8').read()) for f in js_files}

    # ── ÜRETİLEN ID'ler ──
    uretilen = set()
    # index.html statik
    uretilen |= set(re.findall(r'\bid="([^"]+)"', html))
    # JS string'lerinde:  id="x"   id=\"x\"   id=\'x\'
    for s in sources.values():
        uretilen |= set(re.findall(r'\bid=\\?["\']([\w\-]+)\\?["\']', s))
        # Dinamik:  id="ws-ex-'+i+'"  → kök kısmı al
        uretilen |= set(re.findall(r'\bid=\\?["\']([\w\-]+)\'?\+', s))
        # createElement sonrası .id = 'x'
        uretilen |= set(re.findall(r'\.id\s*=\s*["\']([\w\-]+)["\']', s))

    # ── ERİŞİLEN ID'ler ──
    erisim = []   # (id, dosya, satır, guard_var_mi, satir_metni)
    for f, s in sources.items():
        for m in re.finditer(r"getElementById\(\s*['\"]([\w\-]+)['\"]\s*\)", s):
            ln = s[:m.start()].count('\n') + 1
            satir = s.split('\n')[ln-1]
            after = s[m.end():m.end()+90]
            # Guard tipleri:  var x=...;if(x)   |  ...)&&  |  ...)?  |  atama
            atama = bool(re.match(r'\s*[;,)]|\s*$', after)) or \
                    bool(re.search(r'^\s*[;\n]', after))
            zincir = bool(re.match(r'\s*\.', after))   # doğrudan .textContent gibi
            guard = (not zincir)
            erisim.append((m.group(1), f, ln, guard, satir.strip()[:88]))

    erisim_idler = {e[0] for e in erisim}

    # ── RAPOR ──
    print(f"Üretilen ID : {len(uretilen)}")
    print(f"Erişilen ID : {len(erisim_idler)}")
    print(f"Erişim noktası: {len(erisim)}")
    print()

    hayalet = sorted(erisim_idler - uretilen)
    print('═'*74)
    print(f"HAYALET ID'LER — erişiliyor ama hiçbir yerde üretilmiyor  ({len(hayalet)})")
    print('═'*74)
    if not hayalet:
        print("  ✅ Yok")
    kritik = 0
    for hid in hayalet:
        noktalar = [e for e in erisim if e[0]==hid]
        korumasiz = [e for e in noktalar if not e[3]]
        isaret = '🔴 ÇÖKER' if korumasiz else '🟡 guard var'
        if korumasiz: kritik += 1
        print(f"\n  {isaret}  '{hid}'  ({len(noktalar)} erişim)")
        for _, f, ln, g, txt in noktalar[:4]:
            mark = '  ⚠️ ' if not g else '     '
            print(f"{mark}{f.replace(BUILD+'/','')}:{ln}")
            print(f"        {txt}")

    print()
    print('═'*74)
    if kritik:
        print(f"🔴 {kritik} hayalet ID null-guard'sız erişiliyor — ÇÖKME RİSKİ")
        sys.exit(1)
    elif hayalet:
        print(f"🟡 {len(hayalet)} hayalet ID var ama hepsi guard'lı — çökmez")
    else:
        print("✅ Tüm erişilen ID'ler bir yerde üretiliyor")

if __name__ == '__main__':
    main()
