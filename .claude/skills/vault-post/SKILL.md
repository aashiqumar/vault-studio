---
name: vault-post
description: Design and render Vault static social assets (feed posts, carousels, stories, banners, highlight covers, webinar graphics) as HTML → PNG using the brand kit and Dot. Use for any request for a post, carousel, graphic, cover, banner or image for Vault's socials.
---

# Make a Vault post or carousel

Follow CLAUDE.md. This skill is the step-by-step.

1. **Freshness first.** Run `node scripts/library.cjs status`, then `check` your idea (topic, keywords, pose, background). Fix any REPEAT before designing.
   **Brief.** Write down the format (see the Formats table), the single message, the audience, the CTA, and the Dot pose that fits the mood. For a carousel, outline each slide in one line first (cover → 3–5 value slides → CTA slide).
2. **Reference.** Read `examples/posts-preview.jpg` and the closest post in `templates/posts.html`. Match its kicker, headline size and footer.
3. **Build.** Copy `templates/new-post.html` to `templates/<campaign>.html`. Use one `<section class="post" data-export="vault-<nn>-<slug>">` per image, sized by inline width and height for non-feed formats.
   - Logo: `<span data-logo data-h="43">` plus `mountLogos()` at the end.
   - Dot: `placeDot(id, pose, width, feetX, feetY, {dark})`. Use `disc()` first if the background is rose.
   - App screens: `<img src="../brand/screens/...">`, rotated by 4–6°, never cropped mid-UI.
   - Carousel: the slide number goes top-right (`2 / 5`), the same footer on each slide, and the cover shows a "SWIPE →" kicker.
4. **Render.** Run `node scripts/render.cjs templates/<campaign>.html out/<campaign>`.
5. **Review.** Read each PNG and run the CLAUDE.md quality checklist. Fix, re-render, and repeat until clean.
6. **Set check.** Run `node scripts/contact-sheet.cjs out/<campaign> out/<campaign>-preview.jpg`, then Read it.
7. **Captions.** Write one caption per post, plus alt text (one sentence describing the image), using `hashtag_sets` from `content/library.json`.
8. **Record.** Copy the finals to `assets/<yyyy-mm-campaign>/`, then run `node scripts/library.cjs add '<json>'` (or `set <id> ...`) with type, pillar, topic, angle, hook, keywords, dot_pose, background, layout, hashtag_set, status `ready`, post_date, files and caption.
9. **Deliver.** List the PNG paths, the preview sheet, and the captions. Log `node scripts/log.cjs --type done "..."`.

Common fixes:
- Text collides with Dot: move Dot, or shrink it to 260px. Don't shrink the headline below 88px on feed posts.
- The footer line is too long next to Dot: replace it with a Dot speech bubble (see posts.html, slides 7–9).
- A big empty zone: enlarge Dot or the visual, or move the visual up. Don't add filler text.
