# Vault Studio

Vault's in-house marketing team, run by Claude. It plans the content calendar, designs posts and carousels, animates reels with a soundtrack, draws Dot, writes captions, and reviews performance. Everything is rendered from code (HTML/SVG → PNG/MP4), so it's always on-brand, and a memory of past work keeps new content fresh.

## 1. Set up (once)
Install **Node 18+** and **Python 3.9+**, then:
```bash
./setup.sh
```
Windows: run it in WSL, or run the four commands inside `setup.sh` by hand.

## 2. Open the dashboard
```bash
npm run studio        # → http://localhost:4747
```
| Tab | What you see |
|---|---|
| Overview | Days to next post, ready / posted counts, up next, pillar mix vs target, warnings, recent activity |
| Timeline | Month calendar with thumbnails and an agenda. Click any item for details |
| Library | Every piece made: filter, search, view files, **copy caption + hashtags**, set status, post date and metrics |
| Grid preview | How your Instagram grid will look, including planned posts |
| Live | What Claude is doing right now: activity feed, renders appearing as they're made, reel progress |
| Idea bank | Unused and used ideas |

Leave it open while a Claude session works in this folder. It updates live.

## 3. Start a Claude session in this folder
Open Claude Code in `vault-studio/` (pick the Sonnet model). `CLAUDE.md` and the skills in `.claude/skills/` load automatically, and the start hook shows Claude the content library, so it knows everything made so far. Paste the prompt from `START-PROMPT.md` the first time.

**Things you can ask:**
- "Plan the content for 16 Nov to 13 Dec."
- "Make next week's posts from the approved plan."
- "Make a 15-second reel about logging an expense."
- "Design highlight covers for Treasury, Events, Tips and Demo."
- "Here are last week's Insights screenshots. Review them."
- "Draw Dot holding a Vesak lantern."
- "Write captions for N012–N014."

## 4. Your weekly loop
1. **Sun:** paste Insights → `vault-review` → approve next week's plan (`vault-planner`).
2. **Mon:** Claude produces the week's assets → check them in the dashboard → schedule in Meta Business Suite (copy the caption from the dashboard).
3. **After posting:** mark items `posted` in the dashboard (or tell Claude).

## Folder map
`brand/` logo, fonts, colours, screens · `kit/` Dot and logo drawing code · `templates/` page templates · `scripts/` render, reel, library and dashboard · `content/` memory, plan, ideas, reviews · `assets/` approved finals · `examples/` reference quality · `out/` scratch renders.
