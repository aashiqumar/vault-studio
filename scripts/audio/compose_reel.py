"""Original soundtrack for the Vault reel (27.1 s, 120 BPM, F major).
Every sound is synthesised here, so the track is royalty free."""
import sys
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100
DUR = 27.1
N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N)
R = np.zeros(N)
BEAT = 0.5  # 120 BPM


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
def kick(gain=1.0):
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 50 + 110 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 7)
    click = rng.standard_normal(n) * np.exp(-t * 300) * 0.25
    return (body + click) * gain


def clap():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    noise = bp(rng.standard_normal(n), 900, 5000)
    e = np.exp(-t * 22)
    for off in (0.0, 0.011, 0.022):
        k = int(off * SR)
        e[k:k + 120] += 0.6
    return noise * e * 0.5


def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR)
    t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000) * np.exp(-t * (14 if open_ else 70)) * 0.35


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


def bass(m, length):
    n = int((length + 0.12) * SR)
    f = mtof(m)
    sig = sine(f, n) + 0.35 * sine(2 * f, n) + 0.15 * lp(saw(f, n, 6), 900)
    return sig * env(n, 0.005, 0.08, 0.7, 0.08, length) * 0.55


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


def tap():
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    return (sine(1900, n) * 0.6 + hp(rng.standard_normal(n), 3000) * 0.4) * np.exp(-t * 90) * 0.5


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


def beep():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    sq = np.sign(sine(1320, n)) * 0.3
    return lp(sq, 5000) * np.minimum(1, (0.12 - t) * 60) * 0.5


def swipe():
    n = int(0.22 * SR)
    x = np.linspace(0, 1, n)
    return bp(rng.standard_normal(n), 1500, 7000) * np.sin(np.pi * x) * 0.35


def ticks(t0, t1, every=0.045):
    t = t0
    while t < t1:
        place(lp(tap(), 4000) * 0.35, t, 0.3, 0.2)
        t += every


# ---------- arrangement ----------
# chords (root midi, triad offsets): F, C, Dm, Bb
CH = [(53, [0, 4, 7]), (48, [0, 4, 7]), (50, [0, 3, 7]), (46, [0, 4, 7])]

# intro 0-3.5: soft Dm -> Bb pad, ticking hats, muted
place(pad([62, 65, 69], 1.75, 900), 0.0, 0.8)
place(pad([58, 62, 65], 1.75, 900), 1.75, 0.8)
for i in range(7):
    place(hat(), 0.25 + i * BEAT, 0.25, 0.3)
for tt in (0.75, 0.95, 1.15):
    place(pop(700, 260), tt, 0.5)
for tt in (1.75, 1.95, 2.15):
    place(swipe(), tt, 0.9, -0.2)
place(bell(77, 1.2), 2.55, 0.5)

# logo moment 3.5-6.0
place(whoosh(0.8), 3.5, 0.9)
place(riser(0.55), 3.5, 0.6)
place(impact(), 4.05, 0.9)
place(pad([65, 69, 72, 77], 2.0, 2200), 4.05, 0.9)
for k, m in enumerate([77, 81, 84, 89]):
    place(pluck(m, 0.25, 6000), 4.1 + k * 0.125, 0.3, 0.3 if k % 2 else -0.3)
place(bell(84, 1.6), 4.74, 0.7)
place(bell(89, 1.2), 5.25, 0.35)

# groove 6.0-23.0
start, end = 6.0, 23.0
bar = 0
t = start
while t < end - 0.01:
    root, tri = CH[bar % 4]
    bar_len = min(2.0, end - t)
    place(pad([root + 12 + o for o in tri] + [root + 24], bar_len, 2400), t, 1.0)
    for b in range(4):
        bt = t + b * BEAT
        if bt >= end:
            break
        place(kick(), bt, 0.9)
        if b in (1, 3):
            place(clap(), bt, 0.55, 0.05)
        place(hat(), bt + 0.25, 0.45, 0.35)
        if b == 3 and bar % 2 == 1:
            place(hat(True), bt + 0.25, 0.35, -0.35)
        for e8 in range(2):
            m = root - 12 + (12 if e8 == 1 else 0)
            place(bass(m, 0.22), bt + e8 * 0.25, 0.85)
    arp = [root + 24 + tri[0], root + 24 + tri[1], root + 24 + tri[2], root + 36]
    for s in range(8):
        st = t + s * 0.25
        if st >= end:
            break
        m = arp[s % 4] if s < 4 else arp[(7 - s) % 4]
        place(pluck(m, 0.18), st, 0.22, -0.4)
        place(pluck(m, 0.18) * 0.5, st + 0.375, 0.22, 0.5)  # dotted-8th echo
    t += 2.0
    bar += 1

# sidechain-style ducking on the music under every kick in the groove
duck = np.ones(N)
dk = np.concatenate([np.linspace(0.45, 1.0, int(0.22 * SR))])
bt = start
while bt < end:
    i = int(bt * SR)
    j = min(N, i + len(dk))
    duck[i:j] = np.minimum(duck[i:j], dk[: j - i])
    bt += BEAT

# outro 23.0-27.1
place(whoosh(0.8), 23.2, 0.9)
place(impact(), 23.65, 0.85)
place(pad([65, 69, 72, 77], 3.0, 2600), 23.65, 1.0)
for k, m in enumerate([72, 77, 81, 84, 89]):
    place(pluck(m, 0.4, 6000), 23.7 + k * 0.18, 0.28, 0.35 if k % 2 else -0.35)
place(bell(89, 2.0), 24.27, 0.6)
place(pop(1300, 500), 24.95, 0.45)

# ---------- UI sound effects (timed to the animation) ----------
for tt in (6.65, 7.0, 7.14, 7.28, 7.42, 7.56):
    place(pop(), tt, 0.35, 0.1)
place(whoosh(0.5), 9.7, 0.45)
for tt in (10.05, 10.15, 10.25, 10.35):
    place(pop(900, 300), tt, 0.3)
place(tap(), 11.2, 0.9)
place(pop(1400, 600), 11.23, 0.4)
place(whoosh(0.5), 11.7, 0.45)
ticks(12.2, 13.0)
place(pop(1200, 400), 13.0, 0.45)
place(tap(), 14.0, 0.9)
place(bell(84, 0.9), 14.2, 0.5)
place(bell(89, 1.0), 14.32, 0.45)
place(whoosh(0.5), 15.4, 0.45)
place(tap(), 16.6, 0.9)
place(pop(1500, 700), 16.7, 0.45)
place(beep(), 17.75, 0.6)
place(beep(), 18.2, 0.6)
place(bell(81, 0.9), 18.45, 0.5)
place(bell(88, 1.2), 18.57, 0.5)
place(whoosh(0.7, up=False), 19.35, 0.6)
place(whoosh(0.6), 19.85, 0.55)
ticks(20.3, 21.4, 0.06)
for tt in (20.9, 21.05, 21.2):
    place(pop(800, 300), tt, 0.3, 0.3)
place(bell(86, 1.2), 21.7, 0.45)

# ---------- Dot mascot cameos ----------
def boing(f0=520, length=0.5):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = f0 * (1 + 0.35 * np.exp(-t * 6) * np.sin(2 * np.pi * 13 * t)) * (1 + 0.6 * np.exp(-t * 25))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * 0.42

place(pop(1000, 420), 2.45, 0.35, 0.3)
place(boing(560), 5.3, 0.55)
place(pop(1300, 500), 14.2, 0.3, 0.4)
place(pop(1300, 500), 18.45, 0.3, -0.4)
place(pop(1100, 450), 21.8, 0.3, -0.3)
place(boing(640), 24.8, 0.5)

# ---------- master ----------
music_end = int(23.0 * SR)
L[:music_end] *= duck[:music_end] ** 0.6
R[:music_end] *= duck[:music_end] ** 0.6
fade_in = int(0.25 * SR)
L[:fade_in] *= np.linspace(0, 1, fade_in)
R[:fade_in] *= np.linspace(0, 1, fade_in)
fo = int(1.6 * SR)
L[-fo:] *= np.linspace(1, 0, fo)
R[-fo:] *= np.linspace(1, 0, fo)
mix = np.stack([L, R], axis=1)
mix = hp(mix.T, 30).T
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.6) / np.tanh(1.6) * 0.89  # gentle limiting to about -1 dBFS
wavfile.write(sys.argv[1], SR, (mix * 32767).astype(np.int16))
print('written', sys.argv[1], round(len(mix) / SR, 2), 's')
