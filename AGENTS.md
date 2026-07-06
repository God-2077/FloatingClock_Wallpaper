# AGENTS.md

## Project identity
Wallpaper Engine web wallpaper — a static HTML/CSS/JS project imported into Wallpaper Engine, not served as a regular website. The entrypoint is `index.html`.

## Commands
- **Dev server**: `python -m RangeHTTPServer 8091` (see `server.sh`; may require `pip install rangehttpserver`). Note: `server.sh` is gitignored.
- **No build / test / lint / typecheck** — pure static files, no toolchain.

## Architecture
- `index.html` — entrypoint; loads Google Fonts, VanillaTilt, iziToast (cdn-like path but bundled locally)
- `css/style.css` — all styles, single file
- `js/main.js` — clock (`setInterval` every 1s), hitokoto fetch from `v1.hitokoto.cn`, VanillaTilt init, keyboard/double-click event handlers, wallpaper mode logic (`default` / `online` / `carousel`), and the `wallpaperPropertyListener` API hook. The `CONFIG` object at the top defines runtime defaults.
- `js/vanilla-tilt.min.js` — third-party 3D tilt library (minified; do not modify)
- `js/izitoast/1.4.0/` + `css/izitoast/1.4.0/` — bundled iziToast for error notifications
- `img/default-{1920,2048,4096}.jpg` — local fallback wallpapers used by `default` mode; `style.css` references `default-2048.jpg`
- `img/preview.jpg` — Wallpaper Engine preview thumbnail (referenced in `project.json`)
- `wallpaper_engine_web_docs/` — Wallpaper Engine SDK reference docs (not project docs; bundled for reference). Key file: `api/propertylistener.md`.
- `test/` — test fixture wallpaper projects for Wallpaper Engine

## Wallpaper Engine conventions
- `project.json` is auto-generated/managed by Wallpaper Engine; it defines user-configurable properties exposed in the Wallpaper Engine UI. The `type` field must be `"web"` and `file` must point to `"index.html"`.
- The `wallpaperPropertyListener.applyUserProperties` global function (in `js/main.js:513`) receives property changes from Wallpaper Engine. If you add/rename properties in `project.json`, you must update the corresponding handler and the `CONFIG` defaults in `main.js`.
- Init is delayed 1s (`setTimeout` in `main.js:589`) but can be triggered earlier if Wallpaper Engine sends properties before the timeout fires.
- Bundle all assets locally; avoid loading from the web. Current code loads Google Fonts and hitokoto API at runtime — this is a known tradeoff.
- `.webm` / `.ogg` / `.ogv` for video; avoid unsupported formats
- For debugging: enable CEF devtools port in Wallpaper Engine settings, then browse `localhost:<port>` in Chrome
