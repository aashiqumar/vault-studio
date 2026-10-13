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
| Timeline | Month calendar: **drag any card to reschedule it** (with Undo). An Unscheduled tray (drag ideas in or out), **+** on any day to add an item there, clash and overlap warnings, and an agenda |
| Board | Status columns (idea → draft → ready → scheduled → posted). Drag cards to change status |
| Library | Every piece made: filter, search, view files, **copy caption + hashtags**, set status, date, time and metrics, and **send feedback to Claude** |
| Grid preview | How your Instagram grid will look, including planned posts |
| Live | What Claude is doing right now: activity feed, renders appearing as they're made, reel progress |
| 📱 Phone | QR code to open the dashboard on your phone (when phone access is on) |
| Idea bank | Unused and used ideas. Click one to turn it into a card |

Leave it open while a Claude session works in this folder. It updates live.

**Working with Claude from the dashboard:**
- **Reschedule:** drag a card to another day. The date gets a 🔒, which means Claude won't move it without asking you.
- **Request changes:** open a card → *Feedback for Claude* → "make the headline shorter". Claude handles open feedback first at the start of its next task and replies on the card.
- **Add ideas:** use **+ New**, or click an idea in the Idea bank. Then ask Claude to "make N001".

### Desktop shortcut (Linux)
Run this once from a terminal in the project folder:
```bash
npm run shortcut
```
It adds a **Vault Studio** icon (the V. app icon) to your desktop and app menu. Clicking it starts the dashboard server in the background if it isn't running, then opens it in its own app window (Chrome, Chromium, Edge or Brave in `--app` mode, otherwise your default browser).
- **Pin it to the dock:** click **Show Apps** (⋮⋮⋮ at the end of the dock), search "Vault Studio", right-click → *Pin to Dash* / *Add to Favorites*. Ubuntu doesn't let you drag desktop icons onto the dock.
- **Desktop icon warning:** right-click it → *Allow Launching*.
- **Stop the server:** right-click the icon → *Stop dashboard server*, or run `npm run stop`.
- **From a terminal:** `npm run open` does the same thing as clicking the icon.
- **If you move the folder:** re-run `npm run shortcut`.

### Use it on your phone
**At home or in the office (same Wi-Fi):**
1. Right-click the Vault Studio icon → **Open with phone access**, or run `npm run open:lan`.
2. The dashboard opens with a QR code (also under **📱 Phone** in the sidebar). Scan it with your phone camera.
3. In the phone browser, use **Add to Home screen** to get an app icon.

On the phone you get a bottom tab bar, a list-style calendar, and **Move** buttons (−1 day, +1 day, +1 week, Unschedule) on every card, because touch screens can't drag. Status, captions, metrics and feedback for Claude all work the same.
- **Security:** the QR link contains a private key. Your phone remembers it, and anyone without it gets a "private" page. To change the key, delete `.studio-token` and restart.
- **If the phone can't connect:** check both devices are on the same Wi-Fi, and if Ubuntu's firewall is on, run `sudo ufw allow 4747/tcp`.
- **Your computer must stay on**, because the dashboard and files live there.

**From anywhere (mobile data, another city):** install [Tailscale](https://tailscale.com) (free) on the computer and the phone and sign in to both. Start phone access as above, then open `http://<computer's Tailscale IP>:4747/?key=…` (the same link, with the Tailscale IP instead of the Wi-Fi IP). Don't expose the dashboard to the public internet with port forwarding.

**Talking to Claude from your phone:** in this folder on your computer, run `claude remote-control`. The session shows up in the Claude app on your phone, so you can ask it to make posts while you watch the dashboard on the same phone.

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
