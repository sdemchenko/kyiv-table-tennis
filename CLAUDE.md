## Project Overview
Static website for Kyiv table tennis community (https://tabletennis.kyiv.ua/).
Contains information about table tennis clubs, courts, and competitions.
Bilingual: Ukrainian (`index.html`, `schedule.md`) and English (`index_en.html`, `schedule_en.md`).

## Development
No build step required. Open `index.html` or `index_en.html` directly in a browser.

**Local testing:** Use a local server to avoid CORS issues when fetching schedule files:
```bash
python3 -m http.server 8000
```

**Cache busting:** Update `?cacheBuster=XXX` all query parameters in HTML when modifying CSS/JS files.

## Deployment
Pushes to `main` automatically deploy to GitHub Pages via `.github/workflows/static.yml`.

## Architecture

### Content Flow
1. `schedule.md` / `schedule_en.md` - Weekly competition schedule
2. `home.js:fetchSchedule()` - Fetches and renders the competition schedule and changelog 
3. Schedule displays in `#scheduleContainer` with dynamic club name linking

### Key JavaScript Modules (in `assets/`)
- **home.js** - Main logic: schedule fetching, club/court info overlays
- **changelog.js** - Handling the schedule changelog
- **light-or-dark-mode.js** - Theme switching based on system preference

### Places System
Club and court data lives in HTML tables (`#t_clubs`, `#t_courts`). JavaScript builds a `places` Map from these tables.
When schedule mentions a club in quotes (e.g., `"Orion"`), it becomes clickable and shows an info overlay.

### Schedule Format
In `schedule.md`:
- Club names must be in quotes to enable linking: `"ClubName"`
- Rank ranges like `0-25` get auto-highlighted, different colors for unranked and ranked events.

### Theming
CSS variables in `light-or-dark-mode.css` control colors for both themes.
Key variables: `--page-bg-color`, `--ranked-bg`, `--unranked-bg`.

## External Dependencies (CDN)
- jQuery 3.7.1
- jQuery UI 1.13.2
- markdown-it 14.1.0
- diff 5.0.0
- Font Awesome 6.7.2

## Applied Learning
When something fails repeatedly, when Nate has to re-explain, or when a workaround is found for a platform/tool limitation,
add a one-line bullet here. Keep each bullet under 15 words. No explanations. Only add things that will save time in future sessions.