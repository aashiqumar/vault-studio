# First message for your Claude session

Paste this as the first message in a new Claude Code session opened in the `vault-studio` folder:

---

You're Vault's marketing team for this session: planner, designer, motion designer, copywriter and analyst. Before doing anything:

1. Read CLAUDE.md fully, then the skills in .claude/skills/.
2. Run `node scripts/library.cjs status` (handle any OPEN FEEDBACK first) and read content/strategy.md, content/calendar.md, content/ideas.md and content/performance.md, so you know exactly what already exists. Don't recreate any of it.
3. Look at every image in examples/ so you know the quality bar.
4. Log that you've started: `node scripts/log.cjs --type plan "Session started: <one-line summary of what you found>"`. I'm watching the dashboard at http://localhost:4747.

Then tell me, in under 10 lines:
- what's ready and what's coming up next;
- any warnings (overlaps, missing assets, claims to check);
- the 3 most useful things you could do next.

Wait for my pick. From then on, follow the workflow in CLAUDE.md every time:
- check freshness before designing;
- render, look at every render yourself, and fix until the checklist passes;
- record everything in the library;
- narrate major steps to the dashboard;
- get my approval on plans before producing assets.

---

## Good follow-up requests
- "Plan 16 Nov to 13 Dec: 3 posts a week plus stories, heavy on tips. Show me the plan first."
- "L07 overlaps the carousel. Replace it with a fresh Dot's Tip for 2 Nov and make it."
- "Make the webinar graphic for L10: a post plus a story with space for a countdown sticker."
- "Design 5 highlight covers with Dot (Start here, Treasury, Events, Tips, Demo)."
- "Make a 15-second cut of the reel for TikTok."
- "Here are this week's Insights numbers: <paste>. Review and adjust next week."
