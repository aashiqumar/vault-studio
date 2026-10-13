---
name: vault-captions
description: Write Vault social captions, hashtags, alt text, bios, DM/WhatsApp messages and posting schedules in the brand voice. Use for caption, copy, hashtag, posting plan or content calendar requests.
---

# Vault copy

Read `content/strategy.md` (voice, hashtag sets, times) and `node scripts/library.cjs status` first. Past captions live in `content/library.json`: **never reuse a hook or opening line that's already there.** Vary the hook formula: question, number, POV, bold statement, or "Dot's Tip #n".

**Caption formula**
1. **Hook** (8 words or fewer): a question or a relatable pain point.
2. **Value:** 2–3 short lines in plain words. Write for a 20-year-old club member, not an accountant.
3. **One CTA:** save, share, tag the treasurer, comment a keyword, or "demo, link in bio".
4. **Hashtags:** one set of 3–5 from `hashtag_sets` in library.json. Rotate sets and don't repeat the same set on consecutive posts.
5. **Alt text:** one sentence describing what's in the image.

**Rules**
- Dot's Tips posts are in Dot's voice and end with "📌 Save it · 📤 Share it with your board".
- Use 1–3 emojis, never one per line.
- Check the "Claims" section in CLAUDE.md before describing a feature.
- No invented stats, testimonials or endorsements.
- Dates: verify the weekday for every date you write.
- Posting times are in Sri Lanka time: 7:30pm on weekdays, 12:30pm as a backup.
- LinkedIn: drop the emojis and hashtags down to 3. Lead with the insight, mention Vault last.
- WhatsApp outreach: personal, with the name and the club name, 3 sentences or fewer, never sent in bulk.
- Save every caption into the item's `caption` field (`library.cjs set` or `add`) so future sessions can see it and the dashboard can copy it.
