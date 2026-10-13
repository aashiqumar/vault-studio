---
name: vault-dot
description: Draw Dot, Vault's mascot, in a new pose, expression, prop or sheet (stickers, highlight covers, character sheets) by extending kit/dot.js and kit/poses.js. Use when asked for a new Dot image, pose, expression, sticker pack or mascot art.
---

# Extend Dot

Dot is SVG drawn in a 200×240 body space (`kit/dot.js`). Feet sit at y≈206, body centre x=100, door centre (100,124), face plate radius 42.

1. **Read first:** `examples/dot-01-character-sheet.png`, `dot-02-expressions.png` and `dot-03-poses.png`. New art must look like the same character: same proportions, palette and line weights.
2. **New face:** add `FACES.<name> = () => ...` in `kit/poses.js` using `eyeOpen / eyeHappy / eyeClosed / cheeks() / stroke()`. Keep eyes at x≈85/115, y≈117 and the mouth near y≈132–138.
3. **New pose:** add an entry to the `P` map in `pose()`. Set `face`, `arms` (`{a: angle}` from straight down, `front:true` to draw over the body, or `{to:[x,y]}`), `extras`, `behind`/`front` SVG for props, and a widened `vb` if props stick out.
4. **New prop:** write a function next to `receipt()` / `qr()` / `coin()` in `dot.js`. Use only brand colours: plum for gadgets, teal for success, amber for coins.
5. **Preview** on a scratch page (copy `templates/dot-sheets.html`, or add a section to it) at 300px and at 64px. Dot must still read as box, door and dot when small.
6. **Render and Read.** Check the hands attach to the shoulders, nothing floats, nothing is clipped by the viewBox, and the face is centred in the plate.
7. **Character rules:**
   - cute, kind and tidy, never angry;
   - no fingers;
   - no real-world brand logos on props;
   - no Rotary marks;
   - no cash piles.
