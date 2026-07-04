# AGENTS.md

## Project identity
Wallpaper Engine web wallpaper — a static HTML/CSS/JS project imported into Wallpaper Engine, not served as a regular website. The entrypoint is `index.html`.

## Commands
- **Dev server**: `python -m RangeHTTPServer 8091` (see `server.sh`; may require `pip install rangehttpserver`)
- **No build / test / lint / typecheck** — pure static files, no toolchain

## Architecture
- `index.html` — entrypoint; loads fonts from Google Fonts
- `css/style.css` — all styles (~370 lines, single file)
- `js/main.js` — clock (`setInterval` every 1s), hitokoto fetch from `v1.hitokoto.cn`, VanillaTilt init, keyboard/double-click event handlers
- `js/vanilla-tilt.min.js` — third-party 3D tilt library (checked in as minified, do not modify)
- `docs/` — Wallpaper Engine SDK reference docs (not project docs; bundled for reference)

## Wallpaper Engine conventions (from docs/)
- Bundle all assets locally; avoid loading from the web (the current Unsplash BG and hitokoto API calls contradict this)
- `.webm` / `.ogg` / `.ogv` for video; avoid unsupported formats
- Wallpaper Engine auto-generates `project.json` in the project root on import
- See `docs/properties.md` for the `wallpaperPropertyListener` API if adding user-configurable settings
- See `docs/visualizer.md` for audio, `docs/rgb.md` for RGB hardware, `docs/media.md` for media integration
- For debugging: enable CEF devtools port in Wallpaper Engine settings, then browse `localhost:<port>` in Chrome
