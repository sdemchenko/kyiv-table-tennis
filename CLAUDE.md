# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static website for Kyiv table tennis community (https://tabletennis.kyiv.ua/). Contains information about clubs, courts, and competition schedules. Bilingual: Ukrainian (`index.html`, `schedule.md`) and English (`index_en.html`, `schedule_en.md`).

## Development

No build step required. Open `index.html` or `index_en.html` directly in a browser.

**Local testing:** Use a local server to avoid CORS issues when fetching schedule files:
```bash
python3 -m http.server 8000
```

**Cache busting:** Update `?cacheBuster=XXX` query parameters in HTML when modifying CSS/JS files.

## Deployment

Pushes to `main` automatically deploy to GitHub Pages via `.github/workflows/static.yml`.

## Architecture

### Content Flow
1. `schedule.md` / `schedule_en.md` - Markdown files with weekly competition schedules
2. `home.js:fetchSchedule()` - Fetches and renders schedule using markdown-it
3. Schedule displays in `#scheduleContainer` with dynamic club name linking

### Key JavaScript Modules (in `assets/`)

- **home.js** - Main logic: schedule fetching, club/court info overlays, filtering, back-to-top button
- **changelog.js** - Fetches commit history from GitHub API, displays schedule changes with diff viewer
- **light-or-dark-mode.js** - Auto theme switching based on system preference

### Places System
Club and court data lives in HTML tables (`#t_clubs`, `#t_courts`). JavaScript builds a `places` Map from these tables. When schedule mentions a club in quotes (e.g., `"Orion"`), it becomes clickable and shows an info overlay.

### Schedule Format
In `schedule.md`:
- Use `🏆` for ranked events, `🏅` for unranked events, `❌` for canceled
- Club names must be in quotes to enable linking: `"ClubName"`
- Rank ranges like `0-25` get auto-highlighted based on tournament type

### Theming
CSS variables in `light-or-dark-mode.css` control colors for both themes. Key variables: `--page-bg-color`, `--ranked-bg`, `--unranked-bg`.

## External Dependencies (CDN)
- jQuery 3.7.1
- jQuery UI 1.13.2
- markdown-it 14.1.0
- diff 5.0.0
- Font Awesome 6.7.2
