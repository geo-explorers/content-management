#!/usr/bin/env python3
"""Gallery covers for the 5 new layer-0 proposition claims. 2364x640 each, NO TEXT,
single CENTERED hero (survives the homepage gallery center-crop), house style:
deep navy gradient bg + radial glow + coin/disc metaphors. -> cover-<key>.png"""
import math, random, subprocess

W, H = 2364, 640
CX, CY = W / 2, H / 2

def svg_open(g1="#070b16", g2="#0a1020", g3="#0e1230", glow="#f7931a", gop=0.30):
    return [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
        '<defs>',
        f'<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{g1}"/>'
        f'<stop offset="0.55" stop-color="{g2}"/><stop offset="1" stop-color="{g3}"/></linearGradient>',
        f'<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="{glow}" stop-opacity="{gop}"/>'
        f'<stop offset="1" stop-color="{glow}" stop-opacity="0"/></radialGradient>',
        '</defs>',
        f'<rect width="{W}" height="{H}" fill="url(#bg)"/>',
        f'<ellipse cx="{CX:.0f}" cy="{CY:.0f}" rx="640" ry="420" fill="url(#glow)"/>',
    ]

def coin(s, cx, cy, R, edge, face1, face2, tick, rot=0):
    s.append(f'<g transform="rotate({rot} {cx:.0f} {cy:.0f})">')
    s.append(f'<radialGradient id="cf{cx:.0f}{cy:.0f}" cx="0.42" cy="0.38" r="0.78">'
             f'<stop offset="0" stop-color="{face1}"/><stop offset="1" stop-color="{face2}"/></radialGradient>')
    s.append(f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{R}" fill="url(#cf{cx:.0f}{cy:.0f})" stroke="{edge}" stroke-width="{max(3,R*0.035):.0f}" opacity="0.97"/>')
    s.append(f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{R*0.86:.0f}" fill="none" stroke="{tick}" stroke-width="2" opacity="0.5"/>')
    n = max(24, int(R * 0.4))
    for i in range(n):
        a = i * math.tau / n
        x1, y1 = cx + math.cos(a)*(R-4), cy + math.sin(a)*(R-4)
        x2, y2 = cx + math.cos(a)*(R-4-R*0.06), cy + math.sin(a)*(R-4-R*0.06)
        s.append(f'<line x1="{x1:.0f}" y1="{y1:.0f}" x2="{x2:.0f}" y2="{y2:.0f}" stroke="{tick}" stroke-width="2" opacity="0.32"/>')
    s.append(f'<path d="M {cx-R*0.6:.0f} {cy-R*0.55:.0f} A {R*0.82:.0f} {R*0.82:.0f} 0 0 1 {cx+R*0.28:.0f} {cy-R*0.8:.0f}" fill="none" stroke="{tick}" stroke-width="6" opacity="0.3" stroke-linecap="round"/>')
    s.append('</g>')

def write(key, s):
    s.append('</svg>')
    open(f"cover-{key}.svg", "w").write("\n".join(s))
    subprocess.run(["rsvg-convert", f"cover-{key}.svg", "-o", f"cover-{key}.png"], check=True)
    print(f"wrote cover-{key}.png")

# ── 1. SBR: gold coin held inside a classical government portico, dead centre ──
random.seed(4)
s = svg_open(glow="#f7931a", gop=0.26)
# portico: pediment + columns, slate-blue
px, pw, ph = CX, 760, 470
top = CY - ph/2
s.append(f'<polygon points="{px-pw/2:.0f},{top+96:.0f} {px:.0f},{top:.0f} {px+pw/2:.0f},{top+96:.0f}" fill="none" stroke="#64748b" stroke-width="10" opacity="0.75"/>')
for i in range(6):
    colx = px - pw/2 + 70 + i * (pw-140)/5
    s.append(f'<line x1="{colx:.0f}" y1="{top+120:.0f}" x2="{colx:.0f}" y2="{top+ph-40:.0f}" stroke="#475569" stroke-width="26" opacity="0.6"/>')
    s.append(f'<line x1="{colx:.0f}" y1="{top+120:.0f}" x2="{colx:.0f}" y2="{top+ph-40:.0f}" stroke="#94a3b8" stroke-width="4" opacity="0.35"/>')
s.append(f'<rect x="{px-pw/2-30:.0f}" y="{top+ph-40:.0f}" width="{pw+60:.0f}" height="14" fill="#475569" opacity="0.7"/>')
s.append(f'<rect x="{px-pw/2-60:.0f}" y="{top+ph-22:.0f}" width="{pw+120:.0f}" height="14" fill="#334155" opacity="0.7"/>')
coin(s, CX, CY+40, 148, "#f7931a", "#5a3a0c", "#241705", "#fcd34d")
for _ in range(10):
    a = random.uniform(0, math.tau); rr = random.uniform(240, 420)
    s.append(f'<circle cx="{CX+math.cos(a)*rr:.0f}" cy="{CY+math.sin(a)*rr*0.55:.0f}" r="{random.choice([2,3])}" fill="#fcd34d" opacity="0.5"/>')
write("sbr", s)

# ── 2. Store of value: balance scale, gold disc vs bitcoin-orange disc, centred ──
random.seed(9)
s = svg_open(glow="#fbbf24", gop=0.24)
bx, by = CX, CY - 150            # beam pivot
arm = 330
tilt = 6                          # bitcoin side slightly UP (contested, not decided)
s.append(f'<line x1="{bx:.0f}" y1="{by:.0f}" x2="{bx:.0f}" y2="{CY+220:.0f}" stroke="#64748b" stroke-width="16" opacity="0.8"/>')
s.append(f'<ellipse cx="{bx:.0f}" cy="{CY+230:.0f}" rx="150" ry="18" fill="#334155" opacity="0.8"/>')
s.append(f'<g transform="rotate({tilt} {bx:.0f} {by:.0f})">')
s.append(f'<line x1="{bx-arm:.0f}" y1="{by:.0f}" x2="{bx+arm:.0f}" y2="{by:.0f}" stroke="#94a3b8" stroke-width="12" opacity="0.85"/>')
for sgn, dy in [(-1, 150), (1, 150)]:
    hx = bx + sgn*arm
    s.append(f'<line x1="{hx:.0f}" y1="{by:.0f}" x2="{hx-46:.0f}" y2="{by+dy:.0f}" stroke="#64748b" stroke-width="5" opacity="0.7"/>')
    s.append(f'<line x1="{hx:.0f}" y1="{by:.0f}" x2="{hx+46:.0f}" y2="{by+dy:.0f}" stroke="#64748b" stroke-width="5" opacity="0.7"/>')
    s.append(f'<path d="M {hx-70:.0f} {by+dy:.0f} A 70 34 0 0 0 {hx+70:.0f} {by+dy:.0f} Z" fill="#334155" opacity="0.85"/>')
s.append('</g>')
# discs rest IN the pans: compute pan centres after the beam rotation, seat coins just above them
th = math.radians(tilt)
def rot_pt(dx, dy):
    return (bx + dx*math.cos(th) - dy*math.sin(th), by + dx*math.sin(th) + dy*math.cos(th))
lpx, lpy = rot_pt(-arm, 150)
rpx, rpy = rot_pt(arm, 150)
coin(s, lpx, lpy - 72, 92, "#fcd34d", "#7a5c14", "#3a2c08", "#fde68a")   # gold
coin(s, rpx, rpy - 72, 92, "#f7931a", "#5a3a0c", "#241705", "#fcd34d")   # bitcoin-orange
# redraw pan fronts over the coin bottoms so the discs sit inside
for (px_, py_) in [(lpx, lpy), (rpx, rpy)]:
    s.append(f'<path d="M {px_-70:.0f} {py_:.0f} A 70 34 0 0 0 {px_+70:.0f} {py_:.0f} Z" fill="#3c4a60" opacity="0.95"/>')
s.append(f'<circle cx="{bx:.0f}" cy="{by:.0f}" r="18" fill="#94a3b8" opacity="0.9"/>')
write("sov", s)

# ── 3. Yield: emerald coin at centre radiating rising arcs, sprouting small coins ──
random.seed(14)
s = svg_open(glow="#34d399", gop=0.26)
coin(s, CX, CY+60, 150, "#34d399", "#064e3b", "#022c22", "#6ee7b7")
for i, rr in enumerate([210, 275, 345]):
    s.append(f'<path d="M {CX-rr:.0f} {CY+60:.0f} A {rr} {rr} 0 0 1 {CX+rr:.0f} {CY+60:.0f}" fill="none" stroke="#34d399" stroke-width="{6-i}" opacity="{0.5-0.12*i:.2f}"/>')
for _ in range(12):
    a = random.uniform(math.pi*1.1, math.pi*1.9)
    rr = random.uniform(200, 380)
    px_, py_ = CX + math.cos(a)*rr, CY+60 + math.sin(a)*rr*0.8
    r0 = random.choice([10, 14, 18])
    s.append(f'<circle cx="{px_:.0f}" cy="{py_:.0f}" r="{r0}" fill="#10b981" stroke="#6ee7b7" stroke-width="2" opacity="{random.uniform(0.5,0.85):.2f}"/>')
    s.append(f'<line x1="{px_:.0f}" y1="{py_+r0+6:.0f}" x2="{px_:.0f}" y2="{py_+r0+22:.0f}" stroke="#6ee7b7" stroke-width="2.5" opacity="0.4"/>')
write("yield", s)

# ── 4. Dollar: deep-green dollar coin centre, lattice of small stablecoin discs orbiting globe-like ──
random.seed(19)
s = svg_open(glow="#22c55e", gop=0.24)
coin(s, CX, CY, 160, "#22c55e", "#14532d", "#052e16", "#86efac")
nodes = []
for ring_r, count in [(240, 18), (330, 24)]:
    for i in range(count):
        a = i * math.tau / count + random.uniform(-0.06, 0.06)
        x = CX + math.cos(a) * ring_r * 1.35
        y = CY + math.sin(a) * ring_r * 0.62
        nodes.append((x, y, random.choice([5, 7, 9])))
for i, (x1, y1, _r) in enumerate(nodes):
    nn = sorted((((x1-x2)**2+(y1-y2)**2)**0.5, j) for j, (x2, y2, _r2) in enumerate(nodes) if j != i)
    for _, j in nn[:2]:
        if random.random() < 0.6:
            x2, y2, _ = nodes[j]
            s.append(f'<line x1="{x1:.0f}" y1="{y1:.0f}" x2="{x2:.0f}" y2="{y2:.0f}" stroke="#4ade80" stroke-width="1" opacity="0.16"/>')
for (x, y, r0) in nodes:
    s.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r0}" fill="{random.choice(["#4ade80","#86efac","#38bdf8","#a7f3d0"])}" opacity="0.75"/>')
# two elliptical orbit hints
for ry, op in [(150, 0.25), (210, 0.16)]:
    s.append(f'<ellipse cx="{CX:.0f}" cy="{CY:.0f}" rx="{ry*2.2:.0f}" ry="{ry:.0f}" fill="none" stroke="#4ade80" stroke-width="1.5" opacity="{op}" stroke-dasharray="4 12"/>')
write("dollar", s)

# ── 5. Stewards: one fading centre node splitting into three bright violet nodes, centred triad ──
random.seed(23)
s = svg_open(g3="#141030", glow="#8b5cf6", gop=0.28)
# faded former centre
s.append(f'<circle cx="{CX:.0f}" cy="{CY:.0f}" r="92" fill="none" stroke="#8b5cf6" stroke-width="4" opacity="0.28" stroke-dasharray="8 10"/>')
s.append(f'<circle cx="{CX:.0f}" cy="{CY:.0f}" r="60" fill="#2e1065" opacity="0.35"/>')
tri = []
for k in range(3):
    a = -math.pi/2 + k * math.tau/3
    x = CX + math.cos(a) * 250
    y = CY + math.sin(a) * 155
    tri.append((x, y))
for (x, y) in tri:
    s.append(f'<line x1="{CX:.0f}" y1="{CY:.0f}" x2="{x:.0f}" y2="{y:.0f}" stroke="#a78bfa" stroke-width="3" opacity="0.35" stroke-dasharray="2 8"/>')
for i in range(3):
    x1, y1 = tri[i]; x2, y2 = tri[(i+1) % 3]
    s.append(f'<line x1="{x1:.0f}" y1="{y1:.0f}" x2="{x2:.0f}" y2="{y2:.0f}" stroke="#c4b5fd" stroke-width="2.5" opacity="0.5"/>')
pal = [("#8b5cf6", "#3b0764", "#1e1b4b", "#c4b5fd"), ("#a78bfa", "#4c1d95", "#2e1065", "#ddd6fe"), ("#7c3aed", "#312e81", "#1e1b4b", "#c4b5fd")]
for (x, y), (edge, f1, f2, tick) in zip(tri, pal):
    coin(s, x, y, 88, edge, f1, f2, tick)
for _ in range(16):
    a = random.uniform(0, math.tau); rr = random.uniform(300, 520)
    s.append(f'<circle cx="{CX+math.cos(a)*rr:.0f}" cy="{CY+math.sin(a)*rr*0.55:.0f}" r="{random.choice([2,3,4])}" fill="{random.choice(["#a78bfa","#c4b5fd","#8b5cf6"])}" opacity="0.5"/>')
write("stewards", s)
