# Moonblade Arena

A complete, original, portrait-first survival action game built with Phaser 3. Kael's moonblades orbit and attack automatically; move through the arena, gather moon energy, choose upgrades, and survive the growing waves.

**Runs entirely in the browser.** There is no backend, account, build step, API key, or remote asset. Phaser 3 is included locally. On HTTPS hosting (including GitHub Pages), a small service worker caches the game after the first visit for offline reopening.

## Play locally

The game uses ES modules, so open it through a local static web server rather than `file://`:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. No npm install is required. On desktop use **WASD** or the arrow keys. On phones, drag the lower-left virtual stick. Your orbiting blades attack automatically.

## Controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Move | WASD / arrow keys | Virtual joystick |
| Crimson Vortex | Space | Vortex button |
| Moon Burst | Q (after unlock) | Burst button (after unlock) |
| Energy Veil | E (after unlock) | Shield button (after unlock) |
| Pause | Escape | Pause button |

Moon Burst and Energy Veil can appear as level-up choices. Use the pause screen to restart or return to the menu. The game supports portrait phones and wider desktop screens; portrait is recommended on mobile.

## Deploy to GitHub Pages

1. Create a public repository named `moonblade-arena`.
2. Upload the contents of this project to the repository root (including `vendor/phaser.min.js` and `.nojekyll`).
3. In **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, and save.
4. Wait for the Pages build, then open the published URL on a phone and desktop.

All app and library paths are relative, so publishing below a repository URL works. No server configuration or build command is needed. The included Phaser distribution is Phaser **3.90.0**; see [`vendor/PHASER-LICENSE.txt`](vendor/PHASER-LICENSE.txt).

## What is implemented

- Responsive Phaser Canvas game, generated original vector-style art, grass arena, flowers, rocks, and monitor-stack obstacles.
- Kael movement, obstacle collision, camera follow, virtual joystick, keyboard movement, and three initially orbiting moonblades.
- Automatic blade damage and critical hits; slimes, sun-creatures, ranged enemies, elites, and the Eclipse Warden boss with telegraphed charge and projectile patterns.
- Moon-energy, coins, health drops, XP, escalating levels, three-card upgrade choices, and difficulty scaling.
- Crimson Vortex, unlockable Moon Burst, and unlockable Energy Veil.
- Pause/resume/restart, run summary, best score, local coin wallet, and three small permanent armory upgrades.
- LocalStorage validation and settings; locally synthesized sound effects / ambient notes via Web Audio; reduced screen-shake toggle.
- Phaser 3 is bundled locally. All other artwork is procedurally drawn and every gameplay asset works offline.

## Project map

```text
index.html                 GitHub Pages entry point and interface
style.css                  Responsive shell, HUD, menus, and touch controls
sw.js                      Offline cache for HTTPS / localhost
vendor/phaser.min.js       Bundled Phaser 3 runtime
src/config.js              Central balance values
src/main.js                Game boot, DOM menus, and HUD bindings
src/scenes/MenuScene.js    Animated title-screen scene
src/scenes/ArenaScene.js   Run loop, spawning, combat, pickups, and progression
src/entities/              Player, enemy, and projectile models
src/systems/               Save, audio, textures, weapons, and upgrades
src/controls/              Touch joystick input
```

## Balancing and save data

Core tuning is in `src/config.js`: player start values, enemy stats, weapon ability timing, world size, and spawn limits. `src/systems/UpgradeSystem.js` holds level-up cards. Local progress uses the `moonblade-arena-save-v1` LocalStorage key; clearing browser storage clears the local save. Coin purchases and score are device-local and are not synced between browsers.

## Notes

- The art, names, and generated audio are original to this project; the hero is not based on a licensed character.
- The game uses no external runtime services. A browser's usual user gesture is required before Web Audio starts.
- Tested targets are current mobile and desktop browsers with Canvas, ES modules, LocalStorage, and Web Audio support.
