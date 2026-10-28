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
| Debug `/debug/` | Connection status, live feedback, automatic numbering and next-servo queue, scanning, ID and parameter checks and writes, jogging and zero calibration | Local USB connection to UNO Q, installed ADB and compatible Duck Runtime |
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

Mobile painting supports bottom panels, pinch zoom, double-tap focus and long-press comparison. The home, paint, debug and assembly interfaces use the existing 12 language dictionaries. See [translation maintenance](docs/i18n.md) for coverage and review status.

### Servo preparation and assembly

- Follow the [manufacturer's instructions](https://www.xgorobot.com/duck.html#software) to set up Arduino App Lab, Duck OS and the board. letsduck reuses installed ADB; set `DUCK_ADB` for a custom executable path.
- Use Debug's **Automatic numbering** tab for the automatic flow. Explicitly start scanning and configuration, add or remove the next servo, pause with progress retained, and resume after a power swap. Assembly keeps tutorials, materials and pickup.
- Connect one servo at a time for initial numbering. Target IDs are `10–14`, `20–24` and `30–34`. The tool matches the runtime profile and verifies writes by reading them back. Duplicate-ID servos must be connected separately.
- Use safe shutdown before changing connections. Wait at least 15 seconds and confirm the board has stopped, then disconnect USB and battery power. Do not reconnect servos while powered.
- Saved numbering verification and current online status are separate. Disconnecting preserves progress; ID changes or unconfirmed writes recalculate readiness. An online count is not a verified-ID count.
- Assembly includes material quantities, enlarged rotatable items, direct main/secondary horn selection and pickup records. Keep the tray in its fixed three-by-five arrangement; leave removed positions empty.
- IDs, parameters and mechanical zero are separate. Software cannot fix reversed or jammed hardware. Cable specifications and some installation orientations still need manufacturer and physical checks; a completed page is not physical acceptance.

## Choose an edition

| | Personal | Server |
| --- | --- | --- |
| Use | Local painting, debugging and assembly | Sharing palettes, ratings and remixes with friends |
| Runtime | Node.js 24.20+ (24.x) | Docker Compose: nginx + Node.js + MySQL 8.4 |
| Data | Local SQLite; drafts and preferences in the browser | MySQL; anonymous drafts in the browser |
| Accounts and gallery | None | Nickname accounts, private schemes, publishing, ratings and remix families |
| USB device control | Local only | Unavailable |

The personal, server and Electron desktop entries share the TypeScript renderer, validation, storage and 3MF exporter. The instructions below cover the source personal edition and Docker server edition. Desktop installers and browser archives with bundled Node support Windows x64 (`win32/x64`) and Apple silicon Macs (`darwin/arm64`) only. Intel Mac packages are no longer provided. See [desktop and offline packaging](apps/desktop/README.md) for builds and acceptance checks. Linux Node CLI and server support remains available. Installation, updates, signing and physical devices have separate acceptance checks.

## Run locally

```sh
git clone https://github.com/1850VV/letsduck.git
cd letsduck
npm ci
npm run import:assets -- /path/to/authorized/assets
npm run import:assembly -- /path/to/authorized/assembly/assets
npm run start:local
```

Source development requires Node.js 24.20 or newer in the 24.x series. Assembly asset import can be deferred; assembly and the home page's model previews need those files. See [asset requirements](docs/local-assets.md).

You can also double-click `启动来做鸭.command` on macOS or `启动来做鸭.bat` on Windows. Install Node 24.20+ (24.x) and run `npm ci` first. On macOS, use Finder's right-click → Open for the first launch if blocked.

The browser opens `http://127.0.0.1:8876/`, trying the next port if occupied. Use `npm run start:local -- --port 8880 --no-open` to choose a port and suppress browser launch. Stop the launcher process to exit.

The personal server listens locally. Named schemes, numbering verification and pickup progress live outside the application folder:

- macOS: `~/Library/Application Support/DoodleDuck/personal.db`
- Windows: `%APPDATA%\DoodleDuck\personal.db`
- Linux: `~/.local/share/doodleduck/personal.db`

Override the location with `DUCK_PERSONAL_DB`. Back up this file before updating; browser drafts and preferences are stored separately.

## Deploy the server

Prepare an authorised painting asset pack, then configure database passwords:

```sh
npm run import:assets -- /path/to/authorized/assets
cp .env.example .env
# Edit .env and set two different long random passwords.
docker compose up -d --build
```

The default address is `http://<server-address>:8080/`. nginx serves the frontend and proxies `/api/`; the backend and MySQL stay on the container network. Assets are mounted read-only; the source 3MF has no public static endpoint.

The gallery supports popular, recent and top-rated sorting, filters, ratings, remixes and family trees. Accounts, works and ratings in these screenshots are sample data.

![Example gallery](docs/media/en/05-gallery.jpg)

For public deployment, follow [deployment instructions](docs/deployment.md) for HTTPS, domains and backups. An optional Caddy configuration is included. Share links and poster QR codes require a public HTTPS domain in `DUCK_PUBLIC_URL`. See [.env.example](.env.example) for bind address, port, database and export concurrency settings.

## Develop and verify

Active application, renderer, tools and ordinary tests use strict TypeScript. Vite builds `frontend/` into `frontend/dist/`, which both Node hosts serve. The personal home page contains three entry points; the server's `/` is the paint studio.

```sh
npm ci
npm run build
npm run typecheck
npm test
npm run probe:runtime
npm run audit:typescript
npm run audit:publication
```

Shared packages provide contracts, domain rules and lossless JSON, export workers, SQLite/MySQL storage, device controllers and Cordis/Fastify composition. `apps/local`, `apps/server` and `apps/desktop` are the host entry points. Source launchers build before starting. The server can serve the renderer with `npm run start:server -- --static frontend/dist --port 8880`.

Tests use disposable databases and fake devices. Asset-dependent files that cannot run are listed explicitly; they require a separately authorized model pack. Full migration source checks use `npm run verify:phase7` with that pack; actual desktop and installation checks are listed in the desktop packaging guide. MySQL contracts require an isolated `duck_test_*` database via `DUCK_TEST_DATABASE_URL`; otherwise they report skips. Every owned source, test and configuration remains covered by strict type checks.

Install Playwright's matching managed Chromium, then set `DUCK_TEST_BROWSER=1` for the actual browser lifecycle checks. nginx protocol tests report a skip when native nginx is unavailable. Visual review, native controls, installers and physical-device acceptance are separate checks.

For development, use `npm run start:local -- --port 0 --no-open` with `DUCK_PERSONAL_DB` set to a development database. The source audit protects TypeScript, pinned vendor files and explicitly archived tools. Publication scanning checks private-data boundaries and requires review.

`npm run migrate:database -- SOURCE.db --backup COPY.db` reads the source and creates a consistent backup. It writes the configured target, which must be empty or an unchanged copy of the same snapshot.

`npm run baseline:capture -- --assets /path/to/authorized/assets --output output/baseline --browser` measures an owned Node host with temporary data. Keep environment, request/response and ZIP evidence private. Compare only identical inputs and environments.

Ordinary build, test and tool paths need no Python. Synthetic historical Python results are frozen oracles. `npm run test:historical -- --list` lists optional replay suites; select the old interpreter with `--python /path/to/legacy/python`. The runner extracts a fixed Git reference to a read-only temporary tree and owns all data/services. `baseline:capture -- --engine historical ...` labels old-engine measurements separately. Fetch the reference first in shallow clones.

For explicit cross-platform assembly diagnosis, run `npx tsx tooling/test/assembly-diagnostic.ts .`. Node compares the fixed historical MJS and current TS poses, order and numeric values, then removes the temporary reference. It needs no Python and is outside ordinary tests.

## Source and documentation

```text
frontend/   Home, painting, debug, assembly, gallery and shared modules
apps/       Personal and server entry points
packages/   Shared contracts, domain, storage, devices, exporter and HTTP hosts
deploy/     Optional HTTPS configuration
scripts/    Asset import, display model packing and publication checks
tests/      TypeScript Node and browser checks
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
