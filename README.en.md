<p align="right"><a href="README.md">简体中文</a> · <b>English</b></p>

# letsduck · 来做鸭

<p align="center"><img src="frontend/shared/brand/logo.svg" width="128" alt="来做鸭 letsduck"></p>


A painting studio for the XGO Duck V2 robot duck: pick colours in three steps, make it nod, quack and sway, share a poster with friends, then export a recoloured 3MF (print structure preserved) for a print service. It comes in two editions: a double-click **personal edition**, and a **server edition** with a colour gallery, ratings and remixes.

<p align="center"><img src="docs/media/outfits.gif" width="560" alt="Click a card and the duck changes its colours"></p>

**This is a source release. The model, 3MF, derived meshes and filament data are not included.** They are separately licensed; MIT does not cover them. Running letsduck requires a complete local asset pack that you are entitled to use; a single 3MF is not enough to reproduce the assembled preview. See [local assets](docs/local-assets.md) (Chinese).

## Three steps

**① Pick a start**: a blank duck, a classic palette, inspiration dice (lock a card, reroll one or all) or one of your saved designs. One click and the duck changes.

![Step 1: pick a start](docs/media/en/01-start.jpg)

**② Refine parts**: click a part on the model or in the list, then a colour. Real Bambu Lab PLA Basic / TPU 90A colours, or free colour mixing; brush, eyedropper, focus, side-by-side zoom, A/B compare and part locks are close at hand.

<table><tr>
<td width="60%"><img src="docs/media/en/02-refine.jpg" alt="Step 2: refine parts"></td>
<td width="40%"><img src="docs/media/refine.gif" alt="Click a part, click a colour"></td>
</tr></table>

**③ Show & share**: pose the duck, play MicroDuck's classic moves and sounds (every palette gets its own voice), change the background, make a poster, save or publish to the gallery, or export the 3MF.

<table><tr>
<td width="60%"><img src="docs/media/en/03-show.jpg" alt="Step 3: show and share"></td>
<td width="40%"><img src="docs/media/moves.gif" alt="Quack, sway, pick something up"></td>
</tr></table>

![Share poster](docs/media/en/04-poster.jpg)

## Colour gallery (server edition)

Everything your friends publish: popular / newest / top rated, colour-family and tag filters, star ratings. Like one? "Remix" it back into the studio; remixes hang under the original in a family tree that shows what changed.

![Colour gallery](docs/media/en/05-gallery.jpg)

<table><tr>
<td><img src="docs/media/en/06-detail.jpg" alt="Work detail: source and what changed"></td>
<td><img src="docs/media/en/07-family.jpg" alt="Remix family tree"></td>
</tr></table>

<p align="center"><img src="docs/media/en/08-mobile.jpg" width="300" alt="The gallery on a phone"></p>

Authors, works and ratings in the screenshots are sample data; their titles are user content and stay in Chinese. The interface is available in 12 languages, but apart from Chinese the translations are machine-assisted and not yet fully reviewed by native speakers, so some English wording in the screenshots is still rough.

## More

- **Real filaments**: Bambu Lab PLA Basic / TPU 90A colour table. Other brands are illustrative swatches; you are asked to switch to real filaments before publishing or exporting.
- **Phones**: the duck fills almost the whole screen; the three steps sit in a bottom tab bar and each step's controls in a draggable bottom sheet (swipe up to expand, down to a sliver); paint and view tools float at the sides. Pinch to zoom, double-tap to focus the selected part, long-press the duck to compare with the original colours, and a light vibration on taps where the phone supports it.
- **Export**: checks the filament of all 35 parts and writes a recoloured 3MF (six plate thumbnails re-rendered) plus a BOM for your print service.
- **Accounts (server edition)**: nickname + simple password. Private designs live in your account; before you sign in they stay in the browser and sync when you do.
- **Sharing**: copy or paste a colour code any time; posters of published works carry a real QR code pointing to the same page as the copied link (needs `DUCK_PUBLIC_URL`).
- **12 languages**: Simplified and Traditional Chinese, English, Japanese, Korean, French, German, Spanish, Brazilian Portuguese, Russian, Arabic and Hindi; switch at the top right, defaults to the browser language. See [translations](docs/i18n.md) (Chinese).

Screen colours are not a guarantee of printed colour; some assembly positions (e.g. ankle axes) are approximate and assembly tolerances are unverified.

## Two editions

| | Personal edition | Server edition |
| --- | --- | --- |
| For | Painting on your own computer | A circle of friends: accounts, gallery, ratings, remixes |
| Runs | Double-click, macOS / Windows | Docker: nginx frontend + FastAPI backend + MySQL 8.4 |
| Needs | Python 3.9+ only, nothing to install | Docker Compose (on the server) |
| Data | One local SQLite file | MySQL (`mysql-data` volume) |
| Code | `personal/` (Python standard library) | `backend/` (FastAPI + SQLAlchemy) |

Both editions share the frontend in `frontend/`; it reads `/api/site` to learn the edition, and the personal edition hides sign-in, the gallery and publishing. Design validation (`backend/rules.py`) and 3MF export (`backend/exporter.py`) use only the standard library and are shared, so both editions give identical results.

```
frontend/   static frontend: index.html (studio), home.html + home/ (personal edition home), assemble/ (assembly guide), gallery/ (server edition only), shared/, lib/, locales/, vendor/
personal/   personal edition: app.py (static files + design/export API), schemes.py (local SQLite)
backend/    server edition API: server.py (FastAPI), store.py / database.py (MySQL), rules.py, exporter.py
assets/     local asset pack (git-ignored; read directly by the personal edition, mounted read-only on servers)
```

## Personal edition: double-click to start

1. Put the asset pack in `assets/`: `python3 scripts/import_local_assets.py /path/to/assets` (Windows: `py -3 scripts\import_local_assets.py C:\path\to\assets`).
2. Double-click:
   - **macOS**: `启动来做鸭.command`. The system Python 3 is enough; if there is none, macOS offers to install the Command Line Developer Tools. If macOS says the developer cannot be verified, right-click the file in Finder → Open.
   - **Windows**: `启动来做鸭.bat`. Without Python it offers to install Python 3.12 with winget, or opens python.org (tick "Add python.exe to PATH" when installing).
3. Your browser opens `http://127.0.0.1:8876/` (the next free port if that one is taken) on a home page with two cards: “Paint a duck” opens the studio (`/paint`), “Build a duck” the assembly guide (`/assemble/`, printed parts in the studio's current colors; shown as coming soon until its assets are imported with `scripts/import_assembly_assets.py`, see [local assets](docs/local-assets.md)). Close the launcher window to quit.

Or run `python3 run.py` in a terminal (`--port` to change the port, `--no-open` to skip opening the browser).

- Saved designs are kept on this computer: macOS `~/Library/Application Support/DoodleDuck/personal.db`, Windows `%APPDATA%\DoodleDuck\personal.db`, Linux `~/.local/share/doodleduck/personal.db`; set `DUCK_PERSONAL_DB` to choose another place. They live outside the app folder, so unzipping a newer version keeps them; up to 30 designs.
- Drafts, language and background preferences stay in the browser. There are no accounts, gallery or publishing; 3MF export, posters and colour codes all work.
- Listens on `127.0.0.1` only. Personal designs from the earlier all-in-one version (`backend/data/doodleduck.db`) are imported once on first start.

## Server edition: Docker + MySQL

A 1-core / 2 GB cloud server is enough (see "Small servers" below). The three containers use about 250–330 MB of memory when idle; 3D rendering and painting run in each visitor's browser, the server only stores data and exports 3MF.

```sh
git clone git@github.com:1850VV/letsduck.git
cd letsduck
python3 scripts/import_local_assets.py /path/to/assets   # mounted, never baked into an image; also writes the smaller geometry.pack.bin
cp .env.example .env                                      # set two different long random passwords
docker compose up -d --build
```

Open `http://<server>:8080/` (change with `DUCK_PORT` / `DUCK_BIND` in `.env`).

- `frontend` (nginx) serves the static pages with gzip and a read-only `/assets/` (the source 3MF is never served), and proxies `/api/` to `backend`; `backend` stays on the internal network and MySQL has no host port.
- **HTTPS (automatic certificates)**: point your domain and its `www.` at the server, open ports 80 and 443, then set in `.env`:

  ```dotenv
  DUCK_DOMAIN=your-domain
  DUCK_PUBLIC_URL=https://your-domain
  DUCK_BIND=127.0.0.1
  DUCK_PORT=8080
  COMPOSE_FILE=docker-compose.yml:docker-compose.https.yml
  ```

  and run `docker compose up -d`. `docker-compose.https.yml` adds a Caddy container that obtains and renews Let's Encrypt certificates, redirects HTTP to HTTPS and `www.` to the bare domain. Copy-link and poster QR codes appear once `DUCK_PUBLIC_URL` is set (pointing to `<DUCK_PUBLIC_URL>/gallery/#d/<work id>`); unset, non-HTTPS, localhost or IP addresses produce no share links. An existing reverse proxy works too.
- Backup: `docker compose exec -T mysql sh -c 'mysqldump --single-transaction -uduck -p"$MYSQL_PASSWORD" doodleduck' > backup.sql`. Upgrading from an older SQLite deployment, rollback and external MySQL: see [deployment](docs/deployment.md) (Chinese).

### Small servers (1 core / 2 GB)

- **Add 2 GB of swap first**, so building images or a busy moment cannot run out of memory and get processes killed (Ubuntu / Debian, once):

  ```sh
  sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
  sudo mkswap /swapfile && sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```

- **MySQL cache**: `DUCK_MYSQL_BUFFER_POOL` in `.env`, default `128M`, plenty for a circle of friends; use `256M` with 4 GB. Apply with `docker compose up -d`.
- **Export**: keep `DUCK_EXPORT_WORKERS=1`. One export takes about 1–2 s on a single core; one runs, two wait, more are asked to retry shortly.
- **Bandwidth matters more than CPU or memory**: a first visit downloads about 3.8 MB (gzipped; the model is 3 MB). At 5 Mbps that is roughly 10 first visits per minute, at 30 Mbps about 60. When the frontend image is built, `frontend/stamp.py` adds a content hash to every script and stylesheet, one import map and preload links, so all modules and the model download in parallel from the start; hashed code is cached for a year and the model for 7 days, so returning visitors barely touch the network. After replacing the asset pack, browsers that visited within 7 days may need a hard refresh.

## Development

The frontend has no build step. The personal edition runs with the system Python: `python3 run.py`. The server edition needs Python 3.11+ and its dependencies:

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
DUCK_DATABASE_URL='mysql+pymysql://user:pass@127.0.0.1:3306/doodleduck' .venv/bin/python backend/server.py --static frontend
```

Without `DUCK_DATABASE_URL` the server edition uses `backend/data/doodleduck.db` (SQLite, for development and tests only; deployments always use MySQL).

## Checks

```sh
python3 -m unittest discover -s tests -p test_personal.py -v   # personal edition: system Python, nothing installed
.venv/bin/python scripts/publication_audit.py
.venv/bin/python -m unittest discover -s tests -v              # all Python tests (needs the asset pack)
node --test tests/*.mjs
```

Real MySQL tests run when `DUCK_TEST_DATABASE_URL` is set (the database name must start with `duck_test_`); otherwise they are skipped. CI provides MySQL. CI has no model assets and cannot replace real-model, export and browser checks.

Exports run one at a time with up to two waiting; beyond that the API returns `503` with `Retry-After`. Tune with `DUCK_EXPORT_WORKERS` / `DUCK_EXPORT_QUEUE`.

## Documentation

Most project documents are in Chinese.

- [Deployment, data migration, backup and rollback](docs/deployment.md)
- [Project structure and boundaries](docs/project.md)
- [Local assets and reproduction limits](docs/local-assets.md)
- [Third-party sources and licences](THIRD_PARTY_NOTICES.md)
- [Publication checks and exclusions](docs/publication.md)
- [Design and research history](docs/history/README.md)
- [Contributing](CONTRIBUTING.md) / [Security](SECURITY.md)

## Licence

Original code and documentation are [MIT](LICENSE). Three.js keeps its [MIT notice](frontend/vendor/THREE-LICENSE.txt); the MicroDuck voice synthesizer port keeps its [Apache-2.0 notice](frontend/shared/MICRODUCK-LICENSE.txt). The model, manufacturer data and brand names gain no new licence from this repository; the screenshots and clips in `docs/media/` show that model and are not covered by MIT either. letsduck is not an official product of Luwu Dynamics, Pollen Robotics, Bambu Lab or DeepSeek, and is not endorsed by them.
