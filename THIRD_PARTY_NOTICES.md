# Third-party notices and asset boundaries

## Included source

`assets/vendor/` contains Three.js revision 180: `three.core.js`, `three.module.js`, `OrbitControls.js`, `BufferGeometryUtils.js`, and `RoomEnvironment.js`. Copyright remains with the Three.js authors. These files retain the accompanying [MIT license](assets/vendor/THREE-LICENSE.txt). Source: [mrdoob/three.js, r180](https://github.com/mrdoob/three.js/tree/r180).

DuckPalette's original software and documentation are MIT licensed. Imported libraries retain their own notices. Historical research documents quote and link external sources; those sources and trademarks do not become DuckPalette's intellectual property.

## Not distributed

- **XGO Duck V2 3MF and derived meshes/manifests:** the reviewed input metadata identifies `MakerWorld Exclusive License`. The [XGO hardware licensing statement](https://github.com/LuwuDynamics/xgoduck_hardware/blob/cd3358d96945c6ff2b713c7c2f3084321b9537ca/LICENSING.md) says that final file-level terms remain pending. This release does not establish permission for public redistribution; it excludes both original and converted model assets, previews, manufacturing exports, and archives.
- **Bambu catalog and export schema:** the local catalog was derived from [Bambu Studio color codes at a pinned revision](https://github.com/bambulab/BambuStudio/blob/79df7ae309be398ed30c9f397c13c9911c2edc57/resources/profiles/BBL/filament/filaments_color_codes.json). Bambu Studio uses [AGPL-3.0](https://github.com/bambulab/BambuStudio/blob/master/LICENSE). No separate permissive data grant was established during this release review, so the catalog and derived schema are not redistributed under MIT here. The archived generation scripts are original project tooling, not the upstream data or source tables.
- **Other robot repositories:** software licenses do not automatically cover their design assets. The local project used XGO assembly references and identified MicroDuck ancestry; neither robot's meshes are included in this public distribution.

Asset filenames in code, hashes, citations and historical verification records describe the adapter's inputs. They do not grant rights in those inputs. Obtain assets and any necessary permission from their respective owners. Personal/local possession also does not automatically authorize a public hosted model viewer or download service.

## Credits

XGO-Duck by Luwu Dynamics builds on the MicroDuck ecosystem by Pollen Robotics. The workspace references Bambu Lab product color identifiers. The blue-white-black design uses a DeepSeek brand-blue reference. These names identify compatibility and inspiration, not endorsement, affiliation, or trademark permission.

Review date: 2026-10-22. See [licensing research](docs/history/outputs/MicroDuck-XGODuck-授权核查-2026-10-22.md) for the recorded evidence and remaining uncertainty. This is an engineering release boundary, not legal advice.
