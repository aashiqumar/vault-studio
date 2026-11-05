"""Original synthesised soundtrack for the Vault Event Check-in Reel (15.2 s, 120 BPM, F major).
Royalty free, hand-timed to templates/checkin-reel.html. Target: -14 LUFS."""
import sys
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100
DUR = 15.2
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
    e = np.concatenate([
        np.linspace(0, 1, max(a_n, 1)),
        np.linspace(1, s, max(d_n, 1)),
        np.full(s_n, s),
        np.linspace(s, 0, max(r_n, 1))
    ])
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


# ---------- Instruments ----------
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
    e = np.zeros(n)
    for dt in (0.0, 0.012, 0.024, 0.038):
        k = int(dt * SR)
        rem = n - k
        e[k:] += np.exp(-t[:rem] * 45) * (1.0 if dt == 0.038 else 0.4)
    return noise * e * 0.55


def hat(open_=False):
    length = 0.22 if open_ else 0.04
    n = int(length * SR)
    t = np.arange(n) / SR
    noise = hp(rng.standard_normal(n), 7000)
    decay = 18 if open_ else 90
    return noise * np.exp(-t * decay) * 0.28


def bass(m, length=0.45):
    n = int((length + 0.12) * SR)
    f = mtof(m)
    sig = sine(f, n) + 0.35 * sine(2 * f, n) + 0.15 * lp(saw(f, n, 6), 900)
    return sig * env(n, 0.005, 0.08, 0.7, 0.08, length) * 0.55


def pluck(m, length=0.4, bright=4500):
    n = int((length + 0.3) * SR)
    sig = saw(mtof(m), n, 10) + 0.4 * saw(mtof(m) * 1.004, n, 10)
    sig = lp(sig, bright) * env(n, 0.003, 0.18, 0.25, 0.25, length)
    return sig * 0.45


def pad(midis, length, cutoff=1600):
    n = int((length + 0.6) * SR)
    sig = np.zeros(n)
    for m in midis:
        for det in (-0.08, 0.08):
            sig += saw(mtof(m + det), n, 8)
    sig = lp(sig, cutoff, 2) * env(n, 0.2, 0.3, 0.7, 0.6, length)
    return sig * 0.08


def bell(m, length=1.2):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    sig = sine(f, n) + 0.4 * sine(f * 2.0, n) * np.exp(-t * 3) + 0.2 * sine(f * 3.01, n) * np.exp(-t * 6)
    return sig * np.exp(-t * 3.5) * 0.35


# ---------- Sound Effects ----------
def whoosh(dur=0.5, up=True):
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    lo = bp(noise, 250, 1200)
    hi = bp(noise, 1800, 8000)
    x = np.linspace(0, 1, n)
    mix = x if up else 1 - x
    shape = np.sin(np.pi * x) ** 1.5
    return (lo * (1 - mix) + hi * mix) * shape * 0.65


def impact():
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(45 + 60 * np.exp(-t * 12)) / SR) * np.exp(-t * 3.2)
    air = lp(rng.standard_normal(n), 3000) * np.exp(-t * 6) * 0.3
    return (boom + air) * 0.85


def tap():
    n = int(0.08 * SR)
    t = np.arange(n) / SR
    click = np.sin(2 * np.pi * 320 * t) * np.exp(-t * 80)
    thud = np.sin(2 * np.pi * 95 * t) * np.exp(-t * 40) * 0.6
    return (click + thud) * 0.75


def pop(f0=1200, f1=360):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * 0.45


def boing(f0=540, length=0.45):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = f0 * (1 + 0.35 * np.exp(-t * 6) * np.sin(2 * np.pi * 13 * t)) * (1 + 0.6 * np.exp(-t * 25))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * 0.42


def beep(f=1800, dur=0.08):
    n = int(dur * SR)
    t = np.arange(n) / SR
    e = np.sin(np.pi * t / dur) ** 2
    return np.sin(2 * np.pi * f * t) * e * 0.4


def ticks(start, end, step=0.08):
    tt = start
    while tt < end:
        place(pop(1400, 900), tt, 0.2, 0.1)
        tt += step


# ==========================================
# ARRANGEMENT & DRUM GROOVE (120 BPM)
# ==========================================
# Scene 1: Intro pad (0.0s - 2.0s)
place(pad([53, 57, 60, 65], 2.2, 1400), 0.0, 0.8)

# Groove starts at 2.0s (Scenes 2 to 4: 2.0s - 11.8s)
groove_start = 2.0
groove_end = 11.8

# Drum pattern: kick on 1 and 3, clap on 2 and 4, 8th-note hi-hats
t = groove_start
bar = 0
chords = [
    (53, [0, 4, 7]),   # F major (Bar 1)
    (50, [0, 3, 7]),   # D minor (Bar 2)
    (46, [0, 4, 7]),   # Bb major (Bar 3)
    (48, [0, 4, 7]),   # C major (Bar 4)
    (53, [0, 4, 7]),   # F major (Bar 5)
]

while t < groove_end:
    # 4 beats per bar
    place(kick(), t, 0.85)
    place(kick(), t + 1.0, 0.85)
    place(clap(), t + 0.5, 0.7, 0.1)
    place(clap(), t + 1.5, 0.7, 0.1)

    # Hi-hats
    for b in range(8):
        place(hat(open_=(b == 6)), t + b * 0.25, 0.4 if b % 2 == 0 else 0.25, 0.15)

    # Bassline & Pad
    root, tri = chords[bar % len(chords)]
    place(bass(root - 12, 0.42), t, 0.85)
    place(bass(root - 12, 0.28), t + 0.75, 0.75)
    place(bass(root - 12, 0.42), t + 1.0, 0.85)
    place(bass(root - 12 + 7, 0.35), t + 1.5, 0.75)

    place(pad([root + o for o in tri], 2.0, 1800), t, 0.55)

    # Arpeggiated melody plucks
    for k, o in enumerate([0, 7, 12, 7]):
        st = t + k * 0.5
        place(pluck(root + 12 + o, 0.25, 5500), st, 0.3, -0.2 if k % 2 else 0.2)
        place(pluck(root + 12 + o, 0.18, 4000) * 0.5, st + 0.25, 0.18, 0.3)

    t += 2.0
    bar += 1

# Sidechain ducking under kicks
duck = np.ones(N)
dk = np.concatenate([np.linspace(0.45, 1.0, int(0.22 * SR))])
bt = groove_start
while bt < groove_end:
    i = int(bt * SR)
    j = min(N, i + len(dk))
    duck[i:j] = np.minimum(duck[i:j], dk[: j - i])
    bt += BEAT

# ==========================================
# SFX CUES (HAND-TIMED TO GSAP TIMELINE)
# ==========================================
# SCENE 1 (0.0s - 2.0s): Problem
place(whoosh(0.5), 0.1, 0.4)
place(pop(800, 300), 0.45, 0.35)
place(pop(850, 320), 0.65, 0.35)
place(pop(900, 340), 0.85, 0.35)
place(boing(480), 1.05, 0.42)  # worried Dot pops up
place(whoosh(0.18), 1.10, 0.35)  # strike 1
place(whoosh(0.18), 1.22, 0.35)  # strike 2
place(whoosh(0.18), 1.34, 0.35)  # strike 3
place(whoosh(0.5), 1.85, 0.45)  # transition to s2

# SCENE 2 (2.0s - 5.5s): RSVP Beat
place(whoosh(0.6), 2.0, 0.5)
place(tap(), 3.30, 0.95)  # finger tap RSVP
place(pop(1400, 600), 3.35, 0.45)  # button turns green
place(bell(84, 0.7), 3.40, 0.45)  # counter & avatar roll
place(boing(560), 3.55, 0.5)  # happy Dot cheers
place(whoosh(0.5), 5.35, 0.45)  # transition to s3

# SCENE 3 (5.5s - 8.8s): QR Scan Beat
place(whoosh(0.5), 5.5, 0.45)
# Scanner laser hum sweep
place(beep(1200, 0.12), 6.30, 0.3)
place(beep(1400, 0.12), 6.60, 0.3)
place(beep(1300, 0.12), 6.90, 0.3)
# Check-in double confirmation beep
place(beep(1800, 0.08), 7.40, 0.55)
place(beep(2200, 0.08), 7.52, 0.55)
# Success chime + Dot pop
place(bell(81, 0.9), 7.45, 0.5)
place(bell(88, 1.1), 7.55, 0.5)
place(pop(1200, 450), 7.50, 0.4)
place(whoosh(0.5), 8.60, 0.45)  # transition to s4

# SCENE 4 (8.8s - 11.8s): Service Hours Logged
place(whoosh(0.55), 8.8, 0.5)
ticks(9.3, 10.2, 0.07)  # counter rolling from 26h to 30h
place(pop(1300, 500), 9.60, 0.45)  # verified log entry slides in
place(boing(620), 9.80, 0.55)  # party Dot springs up with hat & confetti!
place(bell(89, 1.2), 10.05, 0.5)  # celebratory chime
place(whoosh(0.7), 11.60, 0.6)  # transition to end card

# SCENE 5 (11.8s - 15.2s): Brand End Card
place(impact(), 11.90, 0.85)  # sub-bass impact
place(pad([65, 69, 72, 77], 3.0, 2400), 11.90, 0.9)
# Wordmark letters chime
for k, m in enumerate([72, 77, 81, 84, 89]):
    place(pluck(m, 0.35, 6000), 12.25 + k * 0.12, 0.28, 0.3 if k % 2 else -0.3)
place(pop(1100, 380), 12.55, 0.4)  # full stop bounces
place(boing(580), 13.05, 0.55)  # full stop morphs into waving Dot
place(bell(89, 1.6), 13.50, 0.55)  # resolving bell chime

# ==========================================
# MASTERING & LIMITING
# ==========================================
# Apply ducking to groove
i_start = int(groove_start * SR)
i_end = int(groove_end * SR)
L[i_start:i_end] *= duck[i_start:i_end] ** 0.6
R[i_start:i_end] *= duck[i_start:i_end] ** 0.6

# Fade in and fade out
fade_in = int(0.15 * SR)
L[:fade_in] *= np.linspace(0, 1, fade_in)
R[:fade_in] *= np.linspace(0, 1, fade_in)

fade_out = int(1.4 * SR)
L[-fade_out:] *= np.linspace(1, 0, fade_out)
R[-fade_out:] *= np.linspace(1, 0, fade_out)

mix = np.stack([L, R], axis=1)
mix = hp(mix.T, 30).T  # remove DC / subsonic rumble
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.6) / np.tanh(1.6) * 0.89  # soft limiter to -1 dBFS

wavfile.write(sys.argv[1], SR, (mix * 32767).astype(np.int16))
print('written', sys.argv[1], round(len(mix) / SR, 2), 's')
