"""Score for the Matale partner-story reel (29.6 s). An emotional arc: sparse and tense
under the chaos, a warm resolving chord as Dot arrives, upbeat through the celebration,
calm and confident for the reveal and end card. Synthesised, royalty free."""
import sys
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100
DUR = 29.6
N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N)
R = np.zeros(N)


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
    e = np.concatenate([np.linspace(0, 1, max(a_n, 1)), np.linspace(1, s, max(d_n, 1)), np.full(s_n, s), np.linspace(s, 0, max(r_n, 1))])
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


def saw(f, n, harmonics=14):
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, harmonics + 1):
        if f * k > 12000:
            break
        out += np.sin(2 * np.pi * f * k * t) / k
    return out * 0.55


def sine(f, n, phase=0):
    return np.sin(2 * np.pi * f * np.arange(n) / SR + phase)


# ---------- instruments ----------
def pluck(m, length=0.4, bright=4500):
    n = int((length + 0.3) * SR)
    sig = saw(mtof(m), n, 10) + 0.4 * saw(mtof(m) * 1.004, n, 10)
    sig = lp(sig, bright) * env(n, 0.003, 0.18, 0.25, 0.25, length)
    return sig * 0.5


def pad(midis, length, cutoff=1800):
    n = int((length + 0.8) * SR)
    sig = np.zeros(n)
    for m in midis:
        for det in (-0.06, 0.06):
            sig += saw(mtof(m + det), n, 9)
    sig = lp(sig, cutoff, 2) * env(n, 0.35, 0.4, 0.8, 0.8, length)
    return sig * 0.09


# ---------- sound effects ----------
def whoosh(dur=0.7, up=True):
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    lo, hi = bp(noise, 300, 1500), bp(noise, 2000, 9000)
    x = np.linspace(0, 1, n)
    mix = x if up else 1 - x
    shape = np.sin(np.pi * x) ** 1.5
    return (lo * (1 - mix) + hi * mix) * shape * 0.6


def riser(dur=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 200 * (2 ** (3 * t / dur))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    noise = hp(rng.standard_normal(n), 2500) * 0.3
    return (tone + noise) * (t / dur) ** 2


def impact():
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(45 + 60 * np.exp(-t * 12)) / SR) * np.exp(-t * 3.2)
    air = lp(rng.standard_normal(n), 3000) * np.exp(-t * 6) * 0.3
    return (boom + air) * 0.9


def pop(f0=1100, f1=320):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * 0.45


def bell(m, length=1.4):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    sig = sine(f, n) + 0.5 * sine(f * 2.0, n) * np.exp(-t * 3) + 0.25 * sine(f * 3.01, n) * np.exp(-t * 6)
    return sig * np.exp(-t * 3.5) * 0.35


# ---------- arrangement ----------
# Ambient, minimal: a slow sustained pad bed under the whole reel, swelling gently
# at each scene change, plus soft chimes/whooshes timed to the GSAP timeline.
# chords (root midi, triad offsets): F, Dm, Bb, C — one per scene
CH = [(53, [0, 4, 7]), (50, [0, 3, 7]), (46, [0, 4, 7]), (48, [0, 4, 7])]
SCENES = [0.0, 2.3, 6.3, 10.3, 13.8]  # scene start times; last pad holds to DUR

for i, t0 in enumerate(SCENES):
    t1 = SCENES[i + 1] if i + 1 < len(SCENES) else DUR
    root, tri = CH[i % len(CH)]
    place(pad([root + o for o in tri] + [root + 12], t1 - t0, 1500), t0, 0.85)
    place(pad([root + 12 + o for o in tri], t1 - t0, 2200), t0 + 0.05, 0.4)

# soft sparkle ticks under the brand-reveal and product beats, very quiet
for tt in (0.9, 1.3, 1.7):
    place(pop(900, 340), tt, 0.22, -0.2)

def boing(f0=520, length=0.5):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = f0 * (1 + 0.35 * np.exp(-t * 6) * np.sin(2 * np.pi * 13 * t)) * (1 + 0.6 * np.exp(-t * 25))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * 0.42

# ===== S0 cold open, 0 - 2.3: sparse, a single low tense drone =====
place(pad([50, 53], 2.1, 700), 0.1, 0.55)

# ===== S1 the problem, 2.3 - 7.5: tense, minor, sparse nervous ticks =====
place(pad([50, 53, 56], 2.5, 900), 2.3, 0.5)
place(pad([48, 51, 55], 2.7, 900), 4.8, 0.5)
for tt in (3.3, 3.9, 4.6, 5.3, 6.0, 6.7):
    place(pop(650, 480), tt, 0.16, -0.15 if tt % 2 else 0.15)

# ===== S2 Dot arrives, 7.5 - 11.6: wipe, then a warm resolving major chord =====
place(whoosh(0.6), 7.4, 0.55)
place(riser(0.4), 7.5, 0.4)
place(impact(), 7.9, 0.7)
place(pad([65, 69, 72], 3.8, 2200), 7.95, 0.85)
for k, m in enumerate([72, 77, 81]):
    place(pluck(m, 0.3, 6000), 8.0 + k * 0.12, 0.28, 0.3 if k % 2 else -0.3)
place(bell(81, 1.6), 8.2, 0.55)
place(boing(560), 8.6, 0.4)

# ===== S3 Dot helps (two beats), 11.6 - 17.5: light, plucky, positive =====
place(pad([60, 64, 67], 3.3, 2000), 11.6, 0.5)
place(pluck(79, 0.3, 6000), 12.0, 0.26, -0.2)
place(pluck(84, 0.3, 6000), 12.1, 0.26, 0.2)
place(pop(1200, 420), 12.7, 0.4, -0.3)  # check L

place(pad([62, 65, 69], 2.4, 2000), 15.0, 0.5)
place(pluck(81, 0.3, 6000), 15.2, 0.26, 0.2)
place(pluck(86, 0.3, 6000), 15.3, 0.26, -0.2)
place(pop(1300, 460), 15.9, 0.4, 0.3)  # check R

# ===== S4 celebration, 18.0 - 21.6: upbeat, full pad, confetti pops =====
place(whoosh(0.4), 17.9, 0.4)
place(pad([65, 69, 72, 77], 3.5, 2600), 18.0, 0.9)
for k, m in enumerate([77, 81, 84, 89, 93]):
    place(pluck(m, 0.25, 6500), 18.15 + k * 0.1, 0.26, 0.3 if k % 2 else -0.3)
for tt in (18.5, 18.75, 19.0, 19.3, 19.6):
    place(pop(1100 + 80 * (tt * 10 % 3), 420), tt, 0.22, -0.3 if tt % 2 else 0.3)
place(bell(84, 1.6), 18.9, 0.4)

# ===== S5 Matale reveal, 22.0 - 26.0: calm, confident, held =====
place(whoosh(0.5), 21.8, 0.45)
place(pad([53, 57, 60, 65], 4.0, 1900), 22.0, 0.75)
place(bell(77, 2.0), 22.3, 0.4)
place(bell(81, 1.6), 22.9, 0.25)

# ===== S6 end card, 26.5 - 29.6: final resolving chord + Dot's stamp =====
place(whoosh(0.55), 26.3, 0.5)
place(impact(), 26.6, 0.65)
place(pad([65, 69, 72, 77], 3.0, 2600), 26.7, 0.9)
for k, m in enumerate([77, 81, 84, 89]):
    place(pluck(m, 0.3, 6000), 26.75 + k * 0.1, 0.26, 0.3 if k % 2 else -0.3)
place(bell(84, 1.8), 27.0, 0.5)
place(boing(600), 27.1, 0.45)
place(bell(89, 1.8), 27.5, 0.35)

# ---------- master ----------
fade_in = int(0.3 * SR)
L[:fade_in] *= np.linspace(0, 1, fade_in)
R[:fade_in] *= np.linspace(0, 1, fade_in)
fo = int(1.3 * SR)
L[-fo:] *= np.linspace(1, 0, fo)
R[-fo:] *= np.linspace(1, 0, fo)
mix = np.stack([L, R], axis=1)
mix = hp(mix.T, 30).T
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.6) / np.tanh(1.6) * 0.89  # gentle limiting to about -1 dBFS
wavfile.write(sys.argv[1], SR, (mix * 32767).astype(np.int16))
print('written', sys.argv[1], round(len(mix) / SR, 2), 's')
