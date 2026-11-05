"""Original bespoke pop/electronic song & dynamic soundtrack for Vault Narrative Reel: "Matale's Day"
Duration: 17.6s, 128 BPM (0.46875s per beat, 1.875s per bar).
Musical arc:
  - 0.0s – 4.8s (Bars 1-2.5, D minor): Tense, syncopated trap/lo-fi beat, urgent ticking, 808 bass, WhatsApp vibration buzzes, rising snare build.
  - 4.8s – 5.3s: Pre-drop tension riser, sudden silence for 1 beat before drop.
  - 5.3s – 7.0s (Bar 3.5, F major): MASSIVE BEAT DROP! Superhero landing shockwave impact, punchy kick, bouncy synth bass, uplifting brass chords.
  - 7.0s – 10.4s (Bars 4-5): Upbeat pop groove (F - Bb - C), bouncy walking bass, funky rhythmic plucks, synchronized foley snaps on each card delivery.
  - 10.4s – 12.6s (Bar 6): Full Celebration Chorus! Soaring synth lead melody, four-on-the-floor dance kick, upbeat claps, confetti cannon pop.
  - 12.6s – 14.8s (Bar 7): Matale Fanfare — triumphant brass synth chords, bell arpeggios welcoming Rotaract Club of Matale.
  - 14.8s – 17.6s (Bar 8-9): Outro — Vault wordmark assembly sting, heavy rubber/brass partner seal stamp impact (15.5s), Dot wink chime, smooth musical fade.
All audio synthesised from first principles with numpy and scipy (100% royalty-free).
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100
DUR = 17.6
N = int(SR * DUR)
rng = np.random.default_rng(2026)
L = np.zeros(N)
R = np.zeros(N)

BPM = 128.0
BEAT = 60.0 / BPM  # 0.46875 s
SIXTEENTH = BEAT / 4.0  # ~0.117s

def mtof(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)

def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR / 2 - 100), 'low', fs=SR, output='sos'), x)

def hp(x, fc, order=2):
    return sosfilt(butter(order, max(10, fc), 'high', fs=SR, output='sos'), x)

def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [max(10, lo), min(hi, SR / 2 - 100)], 'band', fs=SR, output='sos'), x)

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
    if i >= N or i < 0:
        return
    j = min(N, i + len(sig))
    seg = sig[: j - i] * gain
    pan = np.clip(pan, -1.0, 1.0)
    angle = (pan + 1.0) * (np.pi / 4.0)
    L[i:j] += seg * np.cos(angle)
    R[i:j] += seg * np.sin(angle)

def saw(f, n, harmonics=12):
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, harmonics + 1):
        if f * k > 14000:
            break
        out += np.sin(2 * np.pi * f * k * t) / k
    return out * 0.5

def square(f, n, harmonics=8):
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, harmonics + 1, 2):
        if f * k > 12000:
            break
        out += np.sin(2 * np.pi * f * k * t) / k
    return out * 0.45

def sine(f, n, phase=0):
    return np.sin(2 * np.pi * f * np.arange(n) / SR + phase)

# ==================== DRUM & PERCUSSION SYNTH ====================

def kick(gain=1.0):
    """Punchy electronic dance kick."""
    n = int(0.38 * SR)
    t = np.arange(n) / SR
    f = 50 + 120 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    sub = np.sin(ph) * np.exp(-t * 9.5)
    click = lp(rng.standard_normal(n), 4500) * np.exp(-t * 120) * 0.35
    return (sub + click) * gain

def snare(gain=0.9):
    """Crisp 808 layered snare/clap."""
    n = int(0.28 * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * 185 * np.exp(-t * 24) * t) * np.exp(-t * 18) * 0.45
    noise = bp(rng.standard_normal(n), 1200, 7500) * np.exp(-t * 14) * 0.75
    return (body + noise) * gain

def hat(open_hat=False, gain=0.6):
    """Crisp metallic hi-hat."""
    dur = 0.25 if open_hat else 0.05
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = hp(rng.standard_normal(n), 6500)
    decay = 12 if open_hat else 70
    return noise * np.exp(-t * decay) * gain

# ==================== INSTRUMENTS ====================

def bass_note(midi, dur=0.35, gain=0.8):
    """Bouncy analog synth bass."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = mtof(midi)
    sig = saw(f, n, 6) * 0.6 + square(f, n, 4) * 0.4
    fc = 300 + 1200 * np.exp(-t * 14)
    sig = lp(sig, 800) * env(n, 0.005, 0.08, 0.7, 0.08, dur)
    return sig * gain

def pad_chord(midis, dur=2.0, gain=0.6, cutoff=1800):
    """Lush detuned stereo pad."""
    n = int((dur + 0.4) * SR)
    sig = np.zeros(n)
    for m in midis:
        for det in (-0.05, 0.05):
            sig += saw(mtof(m + det), n, 8) * 0.35
            sig += sine(mtof(m) * 1.001, n) * 0.2
    return lp(sig, cutoff, 2) * env(n, 0.15, 0.2, 0.8, 0.35, dur) * gain * 0.18

def synth_lead(midi, dur=0.3, gain=0.7):
    """Bright anthemic lead synth for the celebration chorus."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = mtof(midi)
    sig = saw(f, n, 10) * 0.7 + sine(f * 2, n) * 0.3
    sig = lp(sig, 3500) * env(n, 0.01, 0.06, 0.75, 0.08, dur)
    return sig * gain * 0.45

def arpeggio_pluck(midi, dur=0.2, gain=0.5):
    """Bright percussive pluck for the active help groove."""
    n = int((dur + 0.1) * SR)
    t = np.arange(n) / SR
    f = mtof(midi)
    sig = saw(f, n, 8) * 0.7 + sine(f, n) * 0.3
    return lp(sig, 4800) * np.exp(-t * 16) * gain * 0.35

def bell(midi, dur=1.2, gain=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = mtof(midi)
    sig = sine(f, n) + 0.4 * sine(f * 2.002, n) * np.exp(-t * 3.5) + 0.2 * sine(f * 3.01, n) * np.exp(-t * 7)
    return sig * np.exp(-t * 3.2) * gain * 0.35

# ==================== SFX & FOLEY ====================

def phone_vibration(dur=0.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    motor = np.sin(2 * np.pi * 150 * t) + 0.5 * np.sin(2 * np.pi * 300 * t)
    pulse = np.sin(2 * np.pi * 18 * t) ** 2
    return motor * pulse * 0.35

def shockwave_impact():
    """Superhero landing shockwave blast."""
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    sub_thump = np.sin(2 * np.pi * np.cumsum(85 + 130 * np.exp(-t * 18)) / SR) * np.exp(-t * 6)
    air_blast = lp(rng.standard_normal(n), 2800) * np.exp(-t * 8) * 0.6
    ring = sine(mtof(77), n) * np.exp(-t * 5) * 0.3
    return (sub_thump * 0.9 + air_blast * 0.7 + ring * 0.3) * 0.95

def pop_snap(f0=1400, f1=420):
    n = int(0.1 * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 55)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45) * 0.45

def partner_stamp():
    """Heavy satisfying rubber/brass seal stamp impact on wood."""
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    thump = np.sin(2 * np.pi * np.cumsum(70 + 120 * np.exp(-t * 30)) / SR) * np.exp(-t * 9)
    knock = lp(bp(rng.standard_normal(n), 200, 1600), 1200) * np.exp(-t * 22) * 0.8
    click = hp(rng.standard_normal(n), 3000) * np.exp(-t * 50) * 0.45
    gold_ring = sine(mtof(81), n) * np.exp(-t * 4) * 0.35
    return (thump * 0.85 + knock * 0.6 + click * 0.5 + gold_ring * 0.35) * 0.95

def confetti_burst(dur=0.8):
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = hp(rng.standard_normal(n), 4500)
    mod = 1 + 0.6 * np.sin(2 * np.pi * 32 * t)
    return noise * np.exp(-t * 4.2) * mod * 0.4

# ==================== THE SONG ARRANGEMENT ====================

# ----------------------------------------------------
# PART 1: THE TENSE PROBLEM VERSE (0.0s – 4.8s)
# ----------------------------------------------------
# D minor tense chords & driving syncopated beat
place(pad_chord([50, 53, 57], 4.8, gain=0.6, cutoff=1200), 0.0)

# Bassline in Dm (D2, F2, C2, D2)
d_bass = [38, 38, 41, 38, 36, 38, 38, 41]
for idx, b_note in enumerate(d_bass):
    t_bass = idx * (BEAT * 1.25)
    if t_bass < 4.2:
        place(bass_note(b_note, dur=BEAT * 0.9, gain=0.7), t_bass, pan=0.0)

# Hi-hat pulse with trap-style 16th note rolls
for i in range(int(4.5 / SIXTEENTH)):
    t_h = i * SIXTEENTH
    place(hat(open_hat=(i % 8 == 4), gain=0.4 if i % 2 == 0 else 0.25), t_h, pan=0.2)

# WhatsApp vibration buzzes
for t_vibe in [0.45, 0.75, 1.05, 1.35, 2.1, 2.45, 2.8, 3.2]:
    place(phone_vibration(0.18), t_vibe, gain=0.45, pan=-0.2)

# Urgency ticking clock
for t_tick in np.linspace(0.2, 4.4, 14):
    place(pop_snap(2200, 1600), t_tick, gain=0.15, pan=0.1)

# Rising snare build into the drop (4.2s to 4.9s)
for idx, t_roll in enumerate(np.linspace(4.2, 4.9, 9)):
    g_roll = 0.3 + 0.08 * idx
    place(snare(gain=g_roll), t_roll, pan=-0.1 + idx * 0.02)

# Dramatic pause at 5.0s – 5.2s!

# ----------------------------------------------------
# PART 2: THE DROP & DOT SUPERHERO ARRIVAL (5.3s – 7.0s)
# ----------------------------------------------------
# Massive superhero landing shockwave at 5.3s!
place(shockwave_impact(), 5.3, gain=1.0, pan=0.0)
place(kick(gain=1.2), 5.3, pan=0.0)
place(pad_chord([53, 57, 60, 65], 1.8, gain=0.85, cutoff=2800), 5.3, pan=0.0) # F major resolution!

# Bouncy synth bass kicks in
place(bass_note(41, dur=BEAT * 1.2, gain=0.9), 5.5, pan=0.0) # F1
place(bass_note(45, dur=BEAT * 0.8, gain=0.8), 6.0, pan=0.0) # A1
place(bass_note(48, dur=BEAT * 0.8, gain=0.85), 6.5, pan=0.0) # C2

# Hopeful chimes as members look up
place(bell(77, 1.2, gain=0.6), 5.8, pan=-0.2)
place(bell(81, 1.2, gain=0.6), 6.2, pan=0.2)

# ----------------------------------------------------
# PART 3: THE ACTIVE HELP GROOVE (7.0s – 10.4s)
# ----------------------------------------------------
# Upbeat pop drums (kick on 1 & 3, snare on 2 & 4, 16th hats)
t_start_groove = 7.0
for b in range(8):
    t_b = t_start_groove + b * BEAT
    if b % 2 == 0:
        place(kick(gain=0.95), t_b, pan=0.0)
    else:
        place(snare(gain=0.85), t_b, pan=0.0)
    # Hi-hats
    place(hat(open_hat=False, gain=0.35), t_b, pan=0.2)
    place(hat(open_hat=(b % 2 == 1), gain=0.45), t_b + BEAT * 0.5, pan=0.2)

# Bouncy bassline (F -> Bb -> C -> F)
f_groove_bass = [41, 41, 46, 46, 48, 48, 41, 45]
for idx, b_note in enumerate(f_groove_bass):
    place(bass_note(b_note, dur=BEAT * 0.85, gain=0.8), t_start_groove + idx * (BEAT * 0.5), pan=0.0)

# Syncopated pluck arpeggio
arp_notes = [65, 69, 72, 77, 72, 69, 65, 72, 70, 74, 77, 82, 72, 76, 79, 84]
for idx, a_note in enumerate(arp_notes):
    t_arp = t_start_groove + idx * (BEAT * 0.25)
    place(arpeggio_pluck(a_note, dur=BEAT * 0.3, gain=0.4), t_arp, pan=0.3 if idx % 2 else -0.3)

# Sound effect hits synced with card presentations:
# 7.2s: Dilani's Voucher Approved
place(pop_snap(1400, 420), 7.25, gain=0.7, pan=-0.4)
place(bell(81, 0.9, gain=0.55), 7.3, pan=-0.4)

# 8.2s: Kaveen's Budget Reconciled
place(pop_snap(1600, 480), 8.35, gain=0.7, pan=0.0)
place(bell(84, 1.0, gain=0.6), 8.4, pan=0.0)

# 9.2s: Tariq's Attendance Checked
place(pop_snap(1800, 520), 9.35, gain=0.7, pan=0.4)
place(bell(89, 1.1, gain=0.65), 9.4, pan=0.4)

# ----------------------------------------------------
# PART 4: THE CELEBRATION CHORUS (10.4s – 12.6s)
# ----------------------------------------------------
# High-energy full dance chorus!
t_celeb = 10.4
# Four-on-the-floor kick
for b in range(5):
    t_b = t_celeb + b * BEAT
    place(kick(gain=1.05), t_b, pan=0.0)
    place(snare(gain=0.9), t_b + BEAT * 0.5, pan=0.0)
    place(hat(open_hat=True, gain=0.5), t_b + BEAT * 0.5, pan=0.25)

# Confetti cannon explosion at 10.6s
place(confetti_burst(0.9), 10.6, gain=0.7, pan=0.0)

# Anthemic melody synth lead (catchy celebration hook!)
celeb_melody = [(77, 0.4), (79, 0.2), (81, 0.4), (84, 0.5), (82, 0.3), (81, 0.3), (77, 0.6)]
t_cur_m = t_celeb + 0.1
for m_note, m_dur in celeb_melody:
    place(synth_lead(m_note, dur=m_dur, gain=0.8), t_cur_m, pan=0.0)
    t_cur_m += m_dur * 0.9

# ----------------------------------------------------
# PART 5: MATALE REVEAL FANFARE (12.6s – 14.8s)
# ----------------------------------------------------
t_matale = 12.6
# Grand, triumphant F-major brass pad
place(pad_chord([53, 60, 65, 69], 2.2, gain=0.9, cutoff=3200), t_matale, pan=0.0)
place(kick(gain=1.0), t_matale, pan=0.0)

# Descending regal bells
place(bell(89, 1.8, gain=0.65), t_matale + 0.1, pan=0.2)
place(bell(84, 1.8, gain=0.65), t_matale + 0.35, pan=-0.2)
place(bell(81, 1.8, gain=0.6), t_matale + 0.6, pan=0.1)
place(bell(77, 2.0, gain=0.7), t_matale + 0.85, pan=0.0)

# ----------------------------------------------------
# PART 6: END CARD & PARTNER SEAL STAMP (14.8s – 17.6s)
# ----------------------------------------------------
t_end = 14.8
# Dark cinematic whoosh wipe
place(pad_chord([46, 53, 58], 2.8, gain=0.75, cutoff=1600), t_end, pan=0.0)

# Wordmark letter drop plucks (15.0s to 15.3s)
for idx, t_let in enumerate(np.linspace(14.95, 15.3, 5)):
    place(arpeggio_pluck(72 + idx * 2, dur=0.15, gain=0.4), t_let, pan=-0.3 + idx * 0.15)
# Coral dot bounce
place(pop_snap(1600, 650), 15.25, gain=0.55, pan=0.3)

# AUTHORITATIVE PARTNER SEAL STAMP IMPACT AT 15.5s!
place(partner_stamp(), 15.5, gain=1.1, pan=0.0)

# Dot wink chime at 15.8s
place(bell(93, 1.4, gain=0.55), 15.8, pan=-0.3)

# Sustaining golden chord under vaultpro.cloud URL (15.9s – 17.6s)
place(bell(84, 1.8, gain=0.5), 15.95, pan=0.0)

# ==================== MASTERING ====================
fade_in = int(0.12 * SR)
L[:fade_in] *= np.linspace(0, 1, fade_in)
R[:fade_in] *= np.linspace(0, 1, fade_in)

fo = int(1.1 * SR)
L[-fo:] *= np.linspace(1, 0, fo)
R[-fo:] *= np.linspace(1, 0, fo)

mix = np.stack([L, R], axis=1)
mix = hp(mix.T, 30).T  # Clean sub-rumble

peak = np.max(np.abs(mix))
if peak > 0:
    mix = np.tanh(mix / peak * 1.55) / np.tanh(1.55) * 0.90  # Analog warmth & limiting to -0.9 dBFS

out_file = sys.argv[1] if len(sys.argv) > 1 else 'out/matale-table-reel.wav'
wavfile.write(out_file, SR, (mix * 32767).astype(np.int16))
print(f"Generated song soundtrack: {out_file} ({round(len(mix) / SR, 2)}s, {SR}Hz)")
