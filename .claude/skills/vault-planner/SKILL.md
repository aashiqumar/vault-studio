---
name: vault-planner
description: Plan Vault's social media: monthly or weekly content calendars, campaign plans, and creative briefs, using the content library so nothing repeats. Use for "plan next month", "what should we post", "content calendar", "campaign", "next week's posts" or "give me ideas".
---

# Plan content (social media planner)

1. **Know what exists.**
   - Run `node scripts/library.cjs status` (the session start hook shows it too).
   - Read `content/calendar.md` (generated from the library), `content/strategy.md`, the latest review in `content/performance.md`, and `content/ideas.md`.
   - Note any WARNINGS and fix them first.
2. **Set the frame.** Work out the date range, the season (see Seasonal hooks in strategy.md), and any events the user mentions (webinars, launches, district events). Verify every weekday with `date -d 2026-11-16 +%a` or similar. Never guess weekdays.
3. **Pick the slots.**
   - 3 feed posts a week: Mon tips, Wed reel, Fri product or community.
   - Stories 4–5 days a week.
   - Fill to the pillar targets, correcting what `status` says is over or under.
   - Favour the formats and topics that won on saves and shares in the performance log.
4. **Choose fresh ideas.** For each slot, take an idea from `content/ideas.md` (or invent one), then run:
   `node scripts/library.cjs check --topic "<topic>" --keywords a,b,c --pose <pose> --bg <bg> --pillar <pillar> --date <date>`
   - Any REPEAT, POSE or BG failure: change the angle, pose or background and check again.
   - Also vary the hook formula: question, number list, POV, bold statement, "Dot's Tip #n". Don't use the same formula twice in a row.
   - Plan the grid: alternate backgrounds, and use rose only for covers.
5. **Write a brief per item:** id, date, slot, pillar, format and size, the single message, hook, outline (slides or scenes), Dot pose and mood, background, CTA, hashtag set, claim check (⚑ live?), and the files to produce.
6. **Record it.**
   - Add each item to the library as `status=idea` (`node scripts/library.cjs add '<json>'`), with `post_date`, `post_time`, hook, keywords, pose and background. The calendar regenerates automatically.
   - Add the supporting **stories** (`type: story`) and **tasks** (`type: task`, e.g. ads, webinars, reviews) the same way, so they show on the dashboard calendar too.
   - Never move a 🔒 (`date_locked`) item. The user placed it; plan around it, or ask.
   - Mark the ideas used in `content/ideas.md`.
7. **Present** the plan as a week-by-week table plus briefs. Tell the user they can rearrange it by dragging cards on the dashboard Timeline, and ask them to approve **before** you produce assets. Re-run `status` after they reply, because they may have moved things.
8. **After approval:** produce each item with `vault-post` / `vault-reel` / `vault-captions`, then `set <id> status=ready files=...`. When the user confirms an item is posted: `set <id> status=posted`.
