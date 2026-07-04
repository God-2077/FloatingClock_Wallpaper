# AGENTS.md

## Project identity
Wallpaper Engine web wallpaper — a static HTML/CSS/JS project imported into Wallpaper Engine, not served as a regular website. The entrypoint is `index.html`.

## Commands
- **Dev server**: `python -m RangeHTTPServer 8091` (see `server.sh`; may require `pip install rangehttpserver`). Note: `server.sh` is gitignored.
- **No build / test / lint / typecheck** — pure static files, no toolchain.

## Architecture
- `index.html` — entrypoint; loads fonts from Google Fonts
- `css/style.css` — all styles, single file
- `js/main.js` — clock (`setInterval` every 1s), hitokoto fetch from `v1.hitokoto.cn`, VanillaTilt init, keyboard/double-click event handlers, and wallpaper mode logic (`default` / `online` / `carousel`). The `WALLPAPER_CONFIG` object at the top is the primary runtime config.
- `js/vanilla-tilt.min.js` — third-party 3D tilt library (minified; do not modify)
- `img/default-{1920,2048,4096}.jpg` — local fallback wallpapers used by `default` mode; referenced in `css/style.css` as `default-2048.jpg`
- `docs/` — Wallpaper Engine SDK reference docs (not project docs; bundled for reference)

## Wallpaper Engine conventions (from docs/)
- Bundle all assets locally; avoid loading from the web. Current code loads Google Fonts and hitokoto API at runtime — this is a known tradeoff.
- `.webm` / `.ogg` / `.ogv` for video; avoid unsupported formats
- Wallpaper Engine auto-generates `project.json` in the project root on import
- For debugging: enable CEF devtools port in Wallpaper Engine settings, then browse `localhost:<port>` in Chrome
