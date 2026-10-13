---
name: vault-review
description: Weekly or monthly social media performance review for Vault, from Instagram/Facebook Insights numbers or screenshots the user provides. Records metrics in the content library and turns them into decisions. Use for "how did we do", "analyse these insights", "weekly report", "what's working".
---

# Review performance (analyst)

1. **Collect.** Ask for Insights per post (reach, likes, comments, saves, shares, profile visits, link clicks) and account totals (followers, demo requests). Screenshots are fine: read them carefully and confirm any number you're unsure of.
2. **Record.** For each post, run `node scripts/library.cjs set <id> status=posted metrics.reach=… metrics.saves=…`.
3. **Analyse** (run `node scripts/library.cjs status` for the top list):
   - **Rank by saves+shares per 1,000 reach.** That's quality; raw reach mostly reflects ads and timing.
   - **Compare by pillar, format (carousel, reel, post), hook formula, Dot pose and background.** Look for patterns across 3 or more posts. Never draw conclusions from a single post.
   - **Check the funnel:** profile visits → link clicks → demo requests. Where does it leak?
4. **Decide.** Choose 3 "keep doing" items, 1–2 "stop or change" items, and concrete changes for next week: reprioritise `content/ideas.md`, adjust the pillar mix, and suggest an ad budget move.
5. **Write** the review into `content/performance.md` using the template there.
6. **Report** to the user: a short summary table, the 3 decisions, and what you'll change in the next plan.

Be honest about small numbers. Early on, most differences are noise, so say so.
