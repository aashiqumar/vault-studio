"""Soundtrack for 'The Treasurer's Day' reel (17.0 s, 140 BPM, D minor).
Punchy, percussive, fast-cut energy. Every sound is synthesised."""
import sys
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100
DUR = 17.0
N = int(SR * DUR)
rng = np.random.default_rng(42)
L = np.zeros(N)
R = np.zeros(N)
BEAT = 60 / 140  # ~0.4286s


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR / 2 - 100), 'low', fs=SR, output='sos'), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def env(n, a, d, s, r, sus_len):
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    s_n = max(0, int(sus_len * SR) - a_n - d_n)
    e = np.concatenate([np.linspace(0, 1, max(a_n, 1)), np.linspace(1, s, max(d_n, 1)),
                        np.full(s_n, s), np.linspace(s, 0, max(r_n, 1))])
    out = np.zeros(n)
    out[:min(n, len(e))] = e[:n]
    return out


def place(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    j = min(N, i + len(sig))
    seg = sig[: j - i] * gain
    L[i:j] += seg * np.sqrt((1 - pan) / 2) * 1.414
    R[i:j] += seg * np.sqrt((1 + pan) / 2) * 1.414


def sine(f, n, phase=0):
    return np.sin(2 * np.pi * f * np.arange(n) / SR + phase)


def saw(f, n, harmonics=14):
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, harmonics + 1):
        if f * k > 12000:
            break
        out += np.sin(2 * np.pi * f * k * t) / k
    return out * 0.55


# ---------- instruments ----------
def kick(gain=1.0):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 55 + 130 * np.exp(-t * 35)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 8)
    click = rng.standard_normal(n) * np.exp(-t * 350) * 0.3
    return (body + click) * gain


def clap():
    n = int(0.2 * SR)
    t = np.arange(n) / SR
    noise = bp(rng.standard_normal(n), 1000, 5500)
    e = np.exp(-t * 28)
    for off in (0.0, 0.009, 0.018):
        k = int(off * SR)
        e[k:k + 100] += 0.5
    return noise * e * 0.45


def hat(open_=False):
    n = int((0.2 if open_ else 0.04) * SR)
    t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7500) * np.exp(-t * (16 if open_ else 90)) * 0.35


def click_tick():
    """Sharp percussive click for chaos cuts."""
    n = int(0.025 * SR)
    t = np.arange(n) / SR
    return (sine(3200, n) * 0.7 + hp(rng.standard_normal(n), 5000) * 0.4) * np.exp(-t * 160) * 0.55


def snap():
    """Finger snap sound."""
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 2000, 8000) * np.exp(-t * 80) * 0.55


def bass(m, length):
    n = int((length + 0.1) * SR)
    f = mtof(m)
    sig = sine(f, n) + 0.35 * sine(2 * f, n) + 0.15 * lp(saw(f, n, 6), 900)
    return sig * env(n, 0.004, 0.06, 0.7, 0.06, length) * 0.55


def pad(midis, length, cutoff=1600):
    n = int((length + 0.6) * SR)
    sig = np.zeros(n)
    for m in midis:
        for det in (-0.05, 0.05):
            sig += saw(mtof(m + det), n, 8)
    sig = lp(sig, cutoff, 2) * env(n, 0.3, 0.35, 0.75, 0.6, length)
    return sig * 0.08


def pluck(m, length=0.3, bright=5000):
    n = int((length + 0.2) * SR)
    sig = saw(mtof(m), n, 8) + 0.35 * saw(mtof(m) * 1.005, n, 8)
    sig = lp(sig, bright) * env(n, 0.002, 0.12, 0.2, 0.2, length)
    return sig * 0.45


# ---------- sound effects ----------
def whoosh(dur=0.6, up=True):
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    lo, hi = bp(noise, 300, 1500), bp(noise, 2500, 10000)
    x = np.linspace(0, 1, n)
    mix = x if up else 1 - x
    shape = np.sin(np.pi * x) ** 1.5
    return (lo * (1 - mix) + hi * mix) * shape * 0.55


def riser(dur=0.8):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 250 * (2 ** (3.5 * t / dur))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    noise = hp(rng.standard_normal(n), 3000) * 0.35
    return (tone + noise) * (t / dur) ** 2.5


def impact():
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(50 + 80 * np.exp(-t * 14)) / SR) * np.exp(-t * 3.5)
    air = lp(rng.standard_normal(n), 3500) * np.exp(-t * 7) * 0.3
    return (boom + air) * 0.85


def tap():
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    return (sine(2100, n) * 0.55 + hp(rng.standard_normal(n), 3500) * 0.4) * np.exp(-t * 100) * 0.5


def pop(f0=1100, f1=320):
    n = int(0.1 * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 45)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * 0.42


def bell(m, length=1.2):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    sig = sine(f, n) + 0.5 * sine(f * 2.0, n) * np.exp(-t * 3) + 0.25 * sine(f * 3.01, n) * np.exp(-t * 6)
    return sig * np.exp(-t * 3.5) * 0.32


def boing(f0=520, length=0.4):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = f0 * (1 + 0.35 * np.exp(-t * 6) * np.sin(2 * np.pi * 13 * t)) * (1 + 0.6 * np.exp(-t * 25))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * 0.42


def swipe():
    n = int(0.18 * SR)
    x = np.linspace(0, 1, n)
    return bp(rng.standard_normal(n), 1800, 8000) * np.sin(np.pi * x) * 0.35


def ticks(t0, t1, every=0.04):
    t = t0
    while t < t1:
        place(lp(tap(), 4500) * 0.3, t, 0.3, 0.15)
        t += every


# ========== ARRANGEMENT ==========

# --- Scene 1: CHAOS MONTAGE (0–3.0s) ---
# Sharp clicks/taps on every chaos cut (~0.4s each)
# 6 cuts + pileup + riser
chaos_cuts = [0.0, 0.4, 0.8, 1.2, 1.6, 2.0]
for i, ct in enumerate(chaos_cuts):
    place(click_tick(), ct, 0.85, -0.3 if i % 2 else 0.3)
    place(snap(), ct + 0.02, 0.5, 0.2 if i % 2 else -0.2)
    if i in (0, 2, 4):  # snare/clap on alternate cuts
        place(clap(), ct + 0.01, 0.35, 0.0)

# Accelerating hat pattern through chaos
for i in range(16):
    ht = i * 0.175
    if ht < 2.5:
        place(hat(), ht, 0.25 + i * 0.02, -0.4 if i % 2 else 0.4)

# Dot worried pop at 2.1
place(pop(900, 350), 2.1, 0.4, 0.3)

# Riser building into pileup (2.5–3.0)
place(riser(0.5), 2.5, 0.7)

# --- Scene 2: HARD STOP (3.0–3.5s) ---
place(impact(), 3.0, 1.0)
# Reverb tail of impact fills the silence

# --- Scene 3: BRAND REVEAL (3.5–6.5s) ---
place(whoosh(0.7), 3.5, 0.8)
# Letter pops as wordmark assembles (3.65–3.95)
for k in range(5):
    place(pop(800 + k * 100, 300), 3.65 + k * 0.06, 0.25, -0.3 + k * 0.15)
# Full stop bounce
place(bell(84, 1.0), 4.05, 0.6)
# Full stop → Dot boing
place(boing(580), 4.9, 0.55)
# Subtle pad underneath reveal
place(pad([62, 65, 69, 74], 2.5, 1800), 3.6, 0.85)
# Shimmer bell
place(bell(89, 1.4), 5.1, 0.4)

# --- Scene 4: SNAP INTO PLACE (6.5–11.0s) ---
# Percussive groove: tight 140 BPM with kick/hat/clap
groove_start, groove_end = 6.5, 11.0
t = groove_start
bar = 0
# D minor chords: Dm, Am, Bb, F
CH = [(50, [0, 3, 7]), (45, [0, 3, 7]), (46, [0, 4, 7]), (53, [0, 4, 7])]
while t < groove_end - 0.01:
    root, tri = CH[bar % 4]
    bar_len = min(BEAT * 4, groove_end - t)
    place(pad([root + 12 + o for o in tri] + [root + 24], bar_len, 2200), t, 0.75)
    for b in range(4):
        bt = t + b * BEAT
        if bt >= groove_end:
            break
        place(kick(), bt, 0.8)
        if b in (1, 3):
            place(clap(), bt, 0.45, 0.05)
        place(hat(), bt + BEAT / 2, 0.35, 0.3)
        place(bass(root - 12, BEAT * 0.8), bt, 0.7)
    t += BEAT * 4
    bar += 1

# SFX timed to snap scenes:
# 4a: Treasury counter (6.85) + bar fill
ticks(6.85, 7.55, 0.05)
place(pop(1200, 400), 7.4, 0.4, 0.1)
place(whoosh(0.35), 7.55, 0.4)

# 4b: Approval slide + tick stamp
place(swipe(), 7.85, 0.65)
place(tap(), 8.5, 0.9)
place(pop(1500, 600), 8.52, 0.5)
place(bell(86, 0.8), 8.55, 0.45)
place(whoosh(0.3), 8.95, 0.4)

# 4c: Check-in counter + badge pop
place(swipe(), 9.3, 0.6)
ticks(9.6, 10.1, 0.04)
place(pop(1300, 500), 10.0, 0.4, -0.2)
place(boing(480), 10.2, 0.45)

# --- Scene 5: PAYOFF (11.0–14.0s) ---
# Flash replay: quick riser
place(riser(0.3), 11.0, 0.6)
# Wipe whoosh
place(whoosh(0.4, up=False), 11.2, 0.6)
place(whoosh(0.5), 11.35, 0.55)

# Dashboard landing
place(impact(), 11.65, 0.6)
place(pad([62, 65, 69, 74], 2.0, 2400), 11.7, 0.85)

# Counter ticks + bar fills
ticks(11.9, 12.6, 0.05)
# Ledger rows
for tt in (12.5, 12.62, 12.74):
    place(pop(900, 300), tt, 0.3, 0.25)

# Dot proud pop
place(pop(1100, 450), 13.0, 0.35, -0.3)
place(boing(560), 13.05, 0.4)

# --- Scene 6: END CARD (14.0–17.0s) ---
place(whoosh(0.7), 14.0, 0.8)
place(impact(), 14.5, 0.75)
place(pad([65, 69, 72, 77], 2.5, 2400), 14.5, 0.9)

# Letter pops
for k in range(5):
    place(pop(850 + k * 80, 320), 14.15 + k * 0.04, 0.2, -0.2 + k * 0.1)

# Dot boing (full stop → Dot)
place(boing(620), 15.1, 0.5)

# URL punch
place(bell(89, 1.6), 15.6, 0.5)
place(bell(84, 1.2), 15.35, 0.35)

# Gentle chord hold to end
place(pluck(77, 0.4, 5500), 15.7, 0.2, -0.3)
place(pluck(81, 0.4, 5500), 15.75, 0.2, 0.3)

# ========== MASTER ==========
# Sidechain ducking during groove section
duck = np.ones(N)
dk = np.concatenate([np.linspace(0.4, 1.0, int(0.18 * SR))])
bt = groove_start
while bt < groove_end:
    i = int(bt * SR)
    j = min(N, i + len(dk))
    duck[i:j] = np.minimum(duck[i:j], dk[: j - i])
    bt += BEAT

gs, ge = int(groove_start * SR), min(N, int(groove_end * SR))
L[gs:ge] *= duck[gs:ge] ** 0.5
R[gs:ge] *= duck[gs:ge] ** 0.5

# Fade in
fade_in = int(0.1 * SR)
L[:fade_in] *= np.linspace(0, 1, fade_in)
R[:fade_in] *= np.linspace(0, 1, fade_in)

# Fade out
fo = int(1.0 * SR)
L[-fo:] *= np.linspace(1, 0, fo)
R[-fo:] *= np.linspace(1, 0, fo)

mix = np.stack([L, R], axis=1)
mix = hp(mix.T, 30).T
peak = np.max(np.abs(mix))
if peak > 0:
    mix = np.tanh(mix / peak * 1.6) / np.tanh(1.6) * 0.89
wavfile.write(sys.argv[1], SR, (mix * 32767).astype(np.int16))
print('written', sys.argv[1], round(len(mix) / SR, 2), 's')
