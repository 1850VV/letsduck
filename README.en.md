<p align="right"><a href="README.md">简体中文</a> · <b>English</b></p>

# letsduck · 来做鸭

<p align="center"><img src="frontend/shared/brand/logo.svg" width="128" alt="letsduck"></p>

A painting, servo debugging and 3D assembly tool for the XGO Duck V2. Choose colours, export a recoloured 3MF and bill of materials, connect an UNO Q locally to check servo IDs and parameters, then follow the assembly guide.

**The public main branch provides software source. Running it requires a complete local asset pack that you are entitled to use; a single 3MF is insufficient.** Models, manufacturing data, tutorial media and derived assets have separate terms. The code's MIT licence does not cover them. Read [local assets](docs/local-assets.md) and [third-party notices](THIRD_PARTY_NOTICES.md).

<p align="center"><img src="docs/media/outfits.gif" width="560" alt="Switching palettes in the painting studio"></p>

## Three entry points

On the personal home page, drag the three ducks sideways or use the arrow keys. Click a side duck to bring it to the centre, then click the centre duck to open its tool.

| Entry | Features | Requirements |
| --- | --- | --- |
| Paint `/paint` | Palettes, part colours, poses, posters, saved schemes, 3MF + BOM export | Complete painting asset pack |
| Debug `/debug/` | Connection status, live feedback, scanning, servo ID and parameter checks and writes, jogging and zero calibration | Local USB connection to UNO Q, installed ADB and compatible Duck Runtime |
| Assemble `/assemble/` | Chapter materials, pickup positions, 3D installation steps and reference videos | Assembly asset pack; the home entry unlocks after all 15 installation IDs pass read-back verification |

Studio animations are screen previews. Device actions in Debug affect real hardware and require clicking the corresponding control. Opening Debug only reads status.

### Paint and export

1. **Choose a start:** a blank duck, classic palette, inspiration dice or a saved scheme.
2. **Refine parts:** select a part on the model or in the list, then choose a filament colour or mix your own. Tools include a brush, eyedropper, focus, A/B comparison and part locks.
3. **Show and export:** pose the duck, play moves and sounds, change the background, make a poster, and export a recoloured 3MF and BOM with the print structure preserved.

<table><tr>
<td><img src="docs/media/en/02-refine.jpg" alt="Select parts and change colours"></td>
<td><img src="docs/media/en/03-show.jpg" alt="Poses, posters and export"></td>
</tr></table>

Export targets a fixed project with 35 parts and 6 print plates. Display poses and exploded views do not alter manufacturing meshes. Arbitrary 3MF import, automatic slicing and printer control are outside the project. Screen colours do not guarantee physical colour accuracy, and model previews do not validate assembly tolerances.

Mobile painting supports bottom panels, pinch zoom, double-tap focus and long-press comparison. Painting and community screens have 12 language dictionaries; newer debug and assembly screens still contain Chinese. See [translation maintenance](docs/i18n.md).

### Servo preparation and assembly

- Follow the [manufacturer's instructions](https://www.xgorobot.com/duck.html#software) to set up Arduino App Lab, Duck OS and the board. letsduck reuses installed ADB; set `DUCK_ADB` for a custom executable path.
- Connect one servo at a time for initial numbering. Target IDs are `10–14`, `20–24` and `30–34`. The tool matches the runtime profile and verifies writes by reading them back. Duplicate-ID servos must be connected separately.
- Use safe shutdown before changing connections. Wait at least 15 seconds and confirm the board has stopped, then disconnect USB and battery power. Do not reconnect servos while powered.
- Saved numbering verification and current online status are separate. Disconnecting preserves progress; ID changes or unconfirmed writes recalculate readiness. An online count is not a verified-ID count.
- Assembly includes material quantities, enlarged rotatable items, direct main/secondary horn selection and pickup records. Keep the tray in its fixed three-by-five arrangement; leave removed positions empty.
- IDs, parameters and mechanical zero are separate. Software cannot fix reversed or jammed hardware. Cable specifications and some installation orientations still need manufacturer and physical checks; a completed page is not physical acceptance.

## Choose an edition

| | Personal | Server |
| --- | --- | --- |
| Use | Local painting, debugging and assembly | Sharing palettes, ratings and remixes with friends |
| Runtime | Python 3.9+, standard library only | Docker Compose: nginx + FastAPI + MySQL 8.4 |
| Data | Local SQLite; drafts and preferences in the browser | MySQL; anonymous drafts in the browser |
| Accounts and gallery | None | Nickname accounts, private schemes, publishing, ratings and remix families |
| USB device control | Local only | Unavailable |

Both editions share the frontend, colour validation and 3MF exporter. The Electron desktop client remains on a separate development branch. The instructions below cover the Python personal edition and Docker server edition on `main`.

## Run locally

```sh
git clone https://github.com/1850VV/letsduck.git
cd letsduck
python3 scripts/import_local_assets.py /path/to/authorized/assets
python3 scripts/import_assembly_assets.py /path/to/authorized/assembly/assets
python3 run.py
```

On Windows, replace `python3` with `py -3`. Assembly asset import can be deferred; assembly and the home page's model previews need those files. See [asset requirements](docs/local-assets.md).

You can also double-click `启动来做鸭.command` on macOS or `启动来做鸭.bat` on Windows. Follow the launcher's Python installation prompt if needed. On macOS, use Finder's right-click → Open for the first launch if blocked.

The browser opens `http://127.0.0.1:8876/`, trying the next port if occupied. Use `python3 run.py --port 8880 --no-open` to choose a port and suppress browser launch. Stop the launcher process to exit.

The personal server listens locally. Named schemes, numbering verification and pickup progress live outside the application folder:

- macOS: `~/Library/Application Support/DoodleDuck/personal.db`
- Windows: `%APPDATA%\DoodleDuck\personal.db`
- Linux: `~/.local/share/doodleduck/personal.db`

Override the location with `DUCK_PERSONAL_DB`. Back up this file before updating; browser drafts and preferences are stored separately.

## Deploy the server

Prepare an authorised painting asset pack, then configure database passwords:

```sh
python3 scripts/import_local_assets.py /path/to/authorized/assets
cp .env.example .env
# Edit .env and set two different long random passwords.
docker compose up -d --build
```

The default address is `http://<server-address>:8080/`. nginx serves the frontend and proxies `/api/`; the backend and MySQL stay on the container network. Assets are mounted read-only; the source 3MF has no public static endpoint.

The gallery supports popular, recent and top-rated sorting, filters, ratings, remixes and family trees. Accounts, works and ratings in these screenshots are sample data.

![Example gallery](docs/media/en/05-gallery.jpg)

For public deployment, follow [deployment instructions](docs/deployment.md) for HTTPS, domains and backups. An optional Caddy configuration is included. Share links and poster QR codes require a public HTTPS domain in `DUCK_PUBLIC_URL`. See [.env.example](.env.example) for bind address, port, database and export concurrency settings.

## Develop and verify

The frontend uses native ES modules and needs no build step for development. Run the personal edition with `python3 run.py`. Server development requires Python 3.11+:

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python backend/server.py --static frontend
```

Without a configured database connection, the development server uses local SQLite; production uses MySQL. See [deployment](docs/deployment.md) for connection settings, migration, backup and rollback.

```sh
python3 -I -m unittest discover -s tests -p test_personal.py -v
python3 scripts/publication_audit.py
.venv/bin/python -m unittest discover -s tests -v
node --test tests/*.mjs tests/assembly/*.test.mjs
```

Full tests require local assets and development dependencies. Real MySQL regression tests also require `DUCK_TEST_DATABASE_URL`, with a database name starting with `duck_test_`; otherwise those tests skip. [Public CI](.github/workflows/check.yml) uses synthetic fixtures and MySQL, without restricted models. It does not replace real-model export, browser interaction or physical acceptance.

Debug and home browser checks use the fake runtime and temporary database in `tests/debug_browser_fixture.py`, followed by `tests/duck_debug_browser.js` and `tests/home_carousel_browser.js`. They require local assembly assets. Keep these automated checks disconnected from real hardware.

The home language menu has a separate read-only check, using the same isolated fixture on port 8896. It requires local Playwright, its matching managed Chromium and model assets:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node tests/browser/home-language-menu.mjs --url http://127.0.0.1:8896 --output output/playwright/home-language-menu
```

Omit `PLAYWRIGHT_MODULE` if Node can import `playwright` directly. The script uses a temporary browser profile and blocks HTTP writes. It checks the header position, expanded bounds, clipping, clicks, keyboard exit, language persistence and runtime errors across desktop, responsive breakpoints, narrow screens, long labels and an existing RTL language. It defaults to headless Chromium with software WebGL; use `--headed` to watch. Results and screenshots go to the chosen output directory. This check does not replace other pages, native browser zoom or human visual acceptance.

## Source and documentation

```text
frontend/   Home, painting, debug, assembly, gallery and shared modules
personal/   Local HTTP service, SQLite, UNO Q / ADB debugging and servo preparation
backend/    FastAPI, accounts and community storage, shared rules and 3MF export
deploy/     Optional HTTPS configuration
scripts/    Asset import, display model packing and publication checks
tests/      Python, Node and browser checks
assets/     Separately supplied local assets; do not commit
```

- [Project structure and boundaries](docs/project.md)
- [Local assets and reproduction requirements](docs/local-assets.md)
- [Deployment, migration and backups](docs/deployment.md)
- [Third-party sources and licences](THIRD_PARTY_NOTICES.md)
- [Publication scope](docs/publication.md)
- [Contributing](CONTRIBUTING.md) · [Security reports](SECURITY.md)

## Licence

Original code and documentation use [MIT](LICENSE). Three.js, meshoptimizer, MicroDuck and other third-party code retain their respective notices; see [third-party notices](THIRD_PARTY_NOTICES.md). Models, manufacturer data, brands and model imagery in this README receive no new licence through this repository. letsduck is not an official product of Luwu Dynamics, Pollen Robotics, Bambu Lab or DeepSeek.
