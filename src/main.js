import { GAME, formatClock, formatScore } from './config.js';
import { Save } from './systems/SaveSystem.js';
import { Audio } from './systems/AudioSystem.js';
import { bindTouchControls } from './controls/TouchControls.js';
import { MenuScene } from './scenes/MenuScene.js';
import { ArenaScene } from './scenes/ArenaScene.js';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const stage = $('#stage');
const screens = {
  menu: $('#menu-screen'),
  hud: $('#hud'),
  pause: $('#pause-screen'),
  level: $('#upgrade-screen'),
  gameover: $('#gameover-screen'),
  menuModal: $('#menu-modal'),
};
const sceneManager = {
  menu: null,
  arena: null,
};

function registerOfflineCache() {
  if (!('serviceWorker' in navigator)) return;
  const secure = window.isSecureContext || ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (!secure) return;
  navigator.serviceWorker.register(new URL('../sw.js', import.meta.url)).catch(() => {});
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-canvas',
  width: GAME.width,
  height: GAME.height,
  backgroundColor: '#132921',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    expandParent: false,
    width: GAME.width,
    height: GAME.height,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
    transparent: false,
    powerPreference: 'high-performance',
  },
  input: {
    activePointers: 3,
    smoothFactor: 0,
  },
  fps: { target: 60, forceSetTimeOut: false },
  scene: [MenuScene, ArenaScene],
  banner: false,
  disableContextMenu: true,
});

window.moonbladeGame = {
  game,
  start: startRun,
  pause: pauseRun,
  resume: resumeRun,
  restart: restartRun,
  mainMenu: switchToMenu,
  setMovement(vector) { sceneManager.arena?.setMovement(vector); },
  triggerAbility(name) { sceneManager.arena?.triggerAbility(name); },
};

function getScenes() {
  try {
    sceneManager.menu = game.scene.getScene('MenuScene');
    sceneManager.arena = game.scene.getScene('ArenaScene');
  } catch {
    return false;
  }
  return !!sceneManager.menu && !!sceneManager.arena;
}

function showOnly(name) {
  Object.entries(screens).forEach(([key, screen]) => screen.classList.toggle('is-hidden', key !== name));
}

function startRun() {
  Audio.unlock();
  Audio.play('click');
  if (!getScenes()) return;
  screens.pause.classList.add('is-hidden');
  screens.level.classList.add('is-hidden');
  screens.gameover.classList.add('is-hidden');
  screens.menuModal.classList.add('is-hidden');
  if (game.scene.isActive('ArenaScene') || game.scene.isPaused('ArenaScene')) {
    restartRun();
    return;
  }
  screens.menu.classList.add('is-hidden');
  screens.hud.classList.remove('is-hidden');
  sceneManager.menu.scene.start('ArenaScene');
}

function pauseRun() {
  if (!getScenes() || !game.scene.isActive('ArenaScene')) return;
  sceneManager.arena.scene.pause();
  showOnly('pause');
}

function resumeRun() {
  if (!getScenes()) return;
  screens.pause.classList.add('is-hidden');
  screens.hud.classList.remove('is-hidden');
  sceneManager.arena.scene.resume();
  Audio.play('click');
}

function restartRun() {
  if (!getScenes()) return;
  screens.pause.classList.add('is-hidden');
  screens.level.classList.add('is-hidden');
  screens.gameover.classList.add('is-hidden');
  screens.menu.classList.add('is-hidden');
  screens.hud.classList.remove('is-hidden');
  screens.menuModal.classList.add('is-hidden');
  sceneManager.arena.scene.restart();
}

function switchToMenu() {
  if (!getScenes()) return;
  screens.hud.classList.add('is-hidden');
  screens.pause.classList.add('is-hidden');
  screens.level.classList.add('is-hidden');
  screens.gameover.classList.add('is-hidden');
  screens.menuModal.classList.add('is-hidden');
  screens.menu.classList.remove('is-hidden');
  if (game.scene.isActive('ArenaScene') || game.scene.isPaused('ArenaScene')) sceneManager.arena.scene.stop();
  if (game.scene.isSleeping('MenuScene')) sceneManager.menu.scene.wake();
  else if (!game.scene.isActive('MenuScene')) sceneManager.menu.scene.start();
  Audio.play('click');
  renderMeta();
}

function renderMeta() {
  const best = Save.data.bestScore;
  $('#side-best').textContent = best ? formatScore(best) : '000,000';
  $('#side-coins').textContent = Save.data.totalCoins.toLocaleString('en-US');
  $('#menu-sound-label').textContent = Save.data.settings.sound ? 'SOUND ON' : 'SOUND OFF';
  $('#menu-sound-toggle').setAttribute('aria-label', Save.data.settings.sound ? 'Turn sound off' : 'Turn sound on');
}

function updateHUD({ hp, maxHp, level, xp, xpNext, time, score, kills, coins, enemyCount, abilities, boss }) {
  const fraction = Math.max(0, Math.min(1, hp / maxHp));
  $('#health-fill').style.width = `${fraction * 100}%`;
  $('#health-fill').style.background = fraction < 0.25 ? 'linear-gradient(90deg,#a92f44,#ff596a)' : 'linear-gradient(90deg,#d9505a,#ff9481)';
  $('#health-label').textContent = String(Math.ceil(hp));
  $('#max-health-label').textContent = String(maxHp);
  $('#level-label').textContent = `LV. ${String(level).padStart(2, '0')}`;
  $('#xp-level-label').textContent = String(level).padStart(2, '0');
  $('#xp-label').textContent = `${Math.floor(xp)} / ${xpNext}`;
  $('#xp-fill').style.width = `${Math.max(0, Math.min(100, xp / xpNext * 100))}%`;
  $('#time-label').textContent = formatClock(time);
  $('#score-label').textContent = Math.floor(score).toLocaleString('en-US');
  $('#coin-label').textContent = String(coins);
  $('#enemy-count-label').textContent = String(enemyCount);
  $('#side-best').textContent = Save.data.bestScore ? formatScore(Save.data.bestScore) : '000,000';
  $('#side-coins').textContent = Save.data.totalCoins.toLocaleString('en-US');

  for (const name of ['vortex', 'burst', 'shield']) {
    const button = $(`[data-ability="${name}"]`);
    const detail = abilities[name];
    button.classList.toggle('locked', !detail.unlocked);
    button.classList.toggle('cooling', detail.unlocked && detail.remaining > 0);
    button.classList.toggle('ready', detail.unlocked && detail.remaining <= 0);
    button.setAttribute('aria-label', `${name === 'vortex' ? 'Crimson Vortex' : name === 'burst' ? 'Moon Burst' : 'Energy Shield'}, ${!detail.unlocked ? 'locked' : detail.remaining > 0 ? `${Math.ceil(detail.remaining / 1000)} seconds cooldown` : 'ready'}`);
    const mask = $('.cooldown-mask', button);
    mask.style.height = detail.remaining > 0 ? `${Math.min(100, detail.remaining / detail.total * 100)}%` : '0%';
    $('.lock-mark', button)?.classList.toggle('is-hidden', detail.unlocked);
    const label = $('small', button);
    if (name === 'shield' && detail.active > 0) label.textContent = `SHIELD ${Math.ceil(detail.active / 1000)}s`;
    else label.textContent = name === 'vortex' ? 'VORTEX' : name === 'burst' ? 'BURST' : 'SHIELD';
  }

  const bossBar = $('#boss-bar');
  bossBar.classList.toggle('is-hidden', !boss);
  if (boss) {
    const bossFraction = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
    $('#boss-fill').style.width = `${bossFraction * 100}%`;
    $('#boss-hp-label').textContent = `${Math.ceil(bossFraction * 100)}%`;
  }
}

let alertTimer = null;
function showRunAlert(text, duration = 1300) {
  const alert = $('#run-alert');
  alert.textContent = text;
  alert.classList.add('is-visible');
  window.clearTimeout(alertTimer);
  alertTimer = window.setTimeout(() => alert.classList.remove('is-visible'), duration);
}

function showToast(text) {
  const layer = $('#toast-layer');
  const item = document.createElement('div');
  item.className = 'toast';
  item.textContent = text;
  layer.append(item);
  window.setTimeout(() => item.remove(), 2700);
}

function openMenuModal(kind) {
  const content = $('#menu-modal-content');
  content.innerHTML = buildModalContent(kind);
  screens.menuModal.classList.remove('is-hidden');
  if (kind === 'armory') bindArmory();
  if (kind === 'settings') bindSettings();
  Audio.play('click');
}

function buildModalContent(kind) {
  if (kind === 'howto') return `
    <div class="modal-eyebrow">FIELD NOTES / 001</div><h2>HOW TO SURVIVE</h2>
    <p class="detail-lead">A simple rule for a dark night: keep moving, gather the light, and let your blades do the talking.</p>
    <div class="detail-row"><span class="detail-icon">⌖</span><div><strong>MOVE LIKE MOONLIGHT</strong><span>WASD or arrow keys on desktop. Drag the left stick on touchscreens.</span></div></div>
    <div class="detail-row"><span class="detail-icon">☾</span><div><strong>THE BLADES HUNT FOR YOU</strong><span>Your orbiting crescents attack automatically when an enemy gets close.</span></div></div>
    <div class="detail-row"><span class="detail-icon">✦</span><div><strong>GATHER MOON ENERGY</strong><span>Walk near the golden drops. Level up, then choose one of three upgrades.</span></div></div>
    <div class="detail-row"><span class="detail-icon">✹</span><div><strong>BREAK THE CROWD</strong><span>Tap Vortex or press Space to unleash a wide crimson shockwave. Q and E become available as you level.</span></div></div>
    <p class="menu-copy-note">Pause with the button in the top corner or press Escape. Runs, best score, settings and coins are saved on this device.</p>`;
  if (kind === 'fighter') return `
    <div class="modal-eyebrow">SOLE SURVIVOR / MOONKEEPER</div><h2>MEET KAEL</h2>
    <p class="detail-lead">An original moonblade wielder, bound to a quiet oath and a very loud orbit.</p>
    <div class="character-showcase"><div class="character-orb">✧</div><div><strong>KAEL</strong><span>THE MOONKEEPER · FIELD READY</span><small>White ash hair, a steady gaze, and three crescent blades that never sleep.</small></div></div>
    <div class="detail-row"><span class="detail-icon">♥</span><div><strong>100 HEALTH</strong><span>A balanced start with room to grow.</span></div></div>
    <div class="detail-row"><span class="detail-icon">☾</span><div><strong>3 MOONBLADES</strong><span>Automatic orbit · quick cuts · critical strikes.</span></div></div>
    <p class="menu-copy-note">Kael is the first playable fighter. New original characters can be added in future updates.</p>`;
  if (kind === 'armory') return renderArmoryContent();
  if (kind === 'settings') return `
    <div class="modal-eyebrow">MAKE IT YOURS</div><h2>SETTINGS</h2>
    <p class="detail-lead">Preferences are stored on this device. Audio is generated locally and works offline.</p>
    <div class="settings-row"><span>Sound effects</span><button class="toggle" data-setting="sound" role="switch" aria-checked="${Save.data.settings.sound}"></button></div>
    <div class="settings-row"><span>Ambient music</span><button class="toggle" data-setting="music" role="switch" aria-checked="${Save.data.settings.music}"></button></div>
    <div class="settings-row"><span>Screen shake</span><button class="toggle" data-setting="shake" role="switch" aria-checked="${Save.data.settings.shake}"></button></div>
    <p class="menu-copy-note">Sound begins after your first tap or key press, as required by mobile browsers.</p>`;
  return '';
}

function renderArmoryContent() {
  const upgrades = Save.data.upgrades;
  const entries = [
    { key: 'vitality', icon: '♥', name: 'MOONLIT VITALITY', desc: '+12 starting health each level.', base: 30 },
    { key: 'edge', icon: '⚔', name: 'TEMPERED EDGE', desc: '+1 starting blade damage each level.', base: 40 },
    { key: 'magnet', icon: '⌁', name: 'LUNAR MAGNET', desc: '+24 starting pickup range each level.', base: 25 },
  ];
  return `<div class="modal-eyebrow">PERMANENT UPGRADES / LOCAL SAVE</div><h2>THE ARMORY</h2>
    <p class="detail-lead">Spend found moon coins on a small edge before your next run.</p>
    <div class="armory-wallet"><span>YOUR MOON COINS</span><b>✦ ${Save.data.totalCoins}</b></div>
    ${entries.map((entry) => {
      const level = upgrades[entry.key];
      const cost = entry.base * (level + 1);
      const maxed = level >= 5;
      return `<div class="armory-item"><span class="detail-icon">${entry.icon}</span><div class="armory-item-copy"><strong>${entry.name} · ${level}/5</strong><span>${entry.desc}</span></div><button class="buy-button" data-purchase="${entry.key}" ${maxed || Save.data.totalCoins < cost ? 'disabled' : ''}>${maxed ? 'MAXED' : `✦ ${cost}`}</button></div>`;
    }).join('')}
    <p class="menu-copy-note">These modest, permanent bonuses do not affect the free in-run upgrade choices. Save data never leaves this browser.</p>`;
}

function bindArmory() {
  $$('#menu-modal-content [data-purchase]').forEach((button) => {
    button.addEventListener('click', () => {
      const result = Save.purchase(button.dataset.purchase);
      if (result.ok) {
        Audio.play('coin');
        renderMeta();
        openMenuModal('armory');
        showToast('UPGRADE ACQUIRED · READY FOR THE NEXT RUN');
      } else {
        Audio.play('click');
        showToast(result.reason === 'max' ? 'THIS UPGRADE IS ALREADY MAXED' : `NEED ${result.price} MOON COINS`);
      }
    });
  });
}

function bindSettings() {
  $$('#menu-modal-content [data-setting]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.setting;
      const value = !Save.data.settings[key];
      if (key === 'sound' || key === 'music') Audio.setSetting(key, value);
      else Save.setSetting(key, value);
      Audio.play('click');
      openMenuModal('settings');
      renderMeta();
    });
  });
}

function fillUpgradeCards({ level, choices }) {
  $('#new-level-label').textContent = String(level).padStart(2, '0');
  const cards = $('#upgrade-cards');
  cards.innerHTML = choices.map((choice) => `
    <button class="upgrade-card" data-upgrade="${choice.key}">
      <span class="upgrade-card-icon">${choice.icon}</span>
      <span class="upgrade-card-copy"><strong>${choice.name}</strong><span>${choice.description}</span></span>
      <span class="upgrade-card-tag">${choice.tag}</span>
    </button>`).join('');
  $$('.upgrade-card', cards).forEach((card) => card.addEventListener('click', () => {
    $$('.upgrade-card', cards).forEach((button) => { button.disabled = true; button.style.opacity = button === card ? '1' : '.44'; });
    Audio.play('level');
    sceneManager.arena?.chooseUpgrade(card.dataset.upgrade);
  }));
  showOnly('level');
}

function showGameOver(data) {
  $('#final-score').textContent = formatScore(data.score);
  $('#final-time').textContent = formatClock(data.time);
  $('#final-kills').textContent = String(data.kills);
  $('#final-level').textContent = String(data.level);
  $('#final-coins').textContent = String(data.coins);
  $('#best-stamp').classList.toggle('is-hidden', !data.isBest);
  $('#run-summary').textContent = data.bossDefeated ? 'The Warden fell. The dark did not.' : data.kills > 18 ? 'A fine stand against the dark.' : 'The night was hungry. You made it count.';
  renderMeta();
  showOnly('gameover');
}

$('#play-button').addEventListener('click', startRun);
$('#pause-button').addEventListener('click', () => { Audio.play('click'); pauseRun(); });
$('#resume-button').addEventListener('click', resumeRun);
$('#pause-restart').addEventListener('click', restartRun);
$('#pause-settings').addEventListener('click', () => openMenuModal('settings'));
$('#restart-button').addEventListener('click', restartRun);
$('#pause-home').addEventListener('click', switchToMenu);
$('#gameover-home').addEventListener('click', switchToMenu);
$('#close-menu-modal').addEventListener('click', () => { screens.menuModal.classList.add('is-hidden'); Audio.play('click'); });
$('#menu-sound-toggle').addEventListener('click', () => {
  const enabled = !Save.data.settings.sound;
  Audio.setSetting('sound', enabled);
  renderMeta();
  if (enabled) Audio.play('click');
});
$$('[data-menu-modal]').forEach((button) => button.addEventListener('click', () => openMenuModal(button.dataset.menuModal)));
$$('[data-ability]').forEach((button) => button.addEventListener('click', () => {
  Audio.unlock();
  sceneManager.arena?.triggerAbility(button.dataset.ability);
}));

window.addEventListener('moonblade:game-started', () => {
  screens.menu.classList.add('is-hidden');
  screens.menuModal.classList.add('is-hidden');
  screens.pause.classList.add('is-hidden');
  screens.level.classList.add('is-hidden');
  screens.gameover.classList.add('is-hidden');
  screens.hud.classList.remove('is-hidden');
  renderMeta();
});
window.addEventListener('moonblade:hud', (event) => updateHUD(event.detail));
window.addEventListener('moonblade:alert', (event) => {
  const detail = event.detail || {};
  showRunAlert(detail.text || '', detail.duration || 1300);
  if (detail.text && detail.duration > 1600) showToast(detail.text);
});
window.addEventListener('moonblade:level-up', (event) => {
  screens.hud.classList.remove('is-hidden');
  fillUpgradeCards(event.detail);
});
window.addEventListener('moonblade:upgrade-dismiss', () => {
  screens.level.classList.add('is-hidden');
  screens.hud.classList.remove('is-hidden');
});
window.addEventListener('moonblade:run-ended', (event) => showGameOver(event.detail));
window.addEventListener('moonblade:pause-request', pauseRun);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !screens.menuModal.classList.contains('is-hidden')) screens.menuModal.classList.add('is-hidden');
}, { passive: true });

bindTouchControls(window.moonbladeGame);
registerOfflineCache();
renderMeta();

// Keep all Phaser scene references fresh after the first boot has completed.
game.events.once('ready', getScenes);
window.setTimeout(getScenes, 0);
