# Performance log

Numbers live in `content/library.json` (`metrics` on each item). This file holds the weekly reviews: decisions, not raw data.

**How to record:** the user pastes Instagram Insights numbers, or screenshots. Record them with:
```
node scripts/library.cjs set L01 status=posted metrics.reach=1200 metrics.saves=34 metrics.shares=12 metrics.likes=88 metrics.comments=6 metrics.profile_visits=40 metrics.link_clicks=9
```
Read metrics 3–7 days after posting so posts are compared fairly.

## Weekly review template
```
### Week of <date>
- Posts: <ids>
- Best (saves+shares): <id> because <reason, e.g. practical checklist, strong hook>
- Weakest: <id> because <reason>
- Funnel: profile visits <n> → link clicks <n> → demo requests <n>
- Followers: <start> → <end>
- Keep doing: …
- Stop / change: …
- Next week's adjustments: … (update content/ideas.md priorities)
```

## Reviews
(none yet; the first review is due Sun 25 Oct, then weekly)
