---
name: vault-reel
description: Create or edit Vault motion videos (Instagram/TikTok reels, 9:16, 15–30s) as a GSAP timeline rendered frame by frame to MP4 with a synthesised soundtrack. Use for any reel, video, animation, motion or teaser request.
---

# Make a Vault reel

0. **Freshness.** Run `library.cjs status` and `check` the reel's topic. Don't remake a reel concept that's already in the library; change the format or the story.
1. **Script first.** Write a scene table: time range, on-screen caption (2 lines max), visual, Dot moment, and SFX. Hook in 0–2s, end card in the last 3–4s with vaultpro.cloud. 15s cut: problem, reveal, one product beat, end card.
2. **Start from `templates/reel.html`.** Copy it to `templates/<name>-reel.html`. Reuse its building blocks:
   - the `.phone` and `.screen` mock UI (built in HTML, not screenshots);
   - `counter()`, `tap()` and `putDot()`;
   - `lockDot()`, where the logo's full stop turns into Dot.
3. **Timeline rules.**
   - Use one paused `gsap.timeline` and add a label per scene (`tl.addLabel('s3', 6.1)`).
   - Everything animates on the timeline: no CSS animation, timers or `requestAnimationFrame`.
   - End with `window.DURATION = tl.duration(); window.seek = t => tl.time(t,false)`.
   - Use eases `power3/4.out` for entrances and `back.out(1.6–2.6)` for Dot pops. Use `bounce.out` only for the full stop.
4. **Preview.** Run `node scripts/render-reel.cjs templates/<name>-reel.html out/<name>-prev --preview <one time per scene, at its busiest moment>`. Read every still and check safe areas (250px top, 340px bottom), overlaps and caption length. Fix and re-preview.
5. **Audio.** Copy `scripts/audio/compose_reel.py`, then set `DUR` and the SFX times at the bottom so they land on the timeline's taps, pops and reveals. Run `python3 scripts/audio/<name>.py out/<name>.wav`.
6. **Render.** Run `node scripts/render-reel.cjs templates/<name>-reel.html out/<name>.mp4 --audio out/<name>.wav`.
7. **Verify.** Pull 3–4 frames from the MP4 at key moments (`ffmpeg -ss <t> -i out/<name>.mp4 -frames:v 1 out/chk-<t>.jpg`) and Read them. Confirm the duration and that audio is present.
8. **Record.** Save a `<name>-poster.jpg` (a strong frame) next to the MP4 in `assets/<campaign>/` (the dashboard uses it as the thumbnail), then `library.cjs add` the reel with its scene summary in `angle`.
9. **Deliver** the MP4, the scene table and a caption.
