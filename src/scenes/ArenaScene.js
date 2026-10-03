import { GAME } from '../config.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Projectile } from '../entities/Projectile.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { Save } from '../systems/SaveSystem.js';
import { Audio } from '../systems/AudioSystem.js';
import { ensureTextures } from '../systems/TextureFactory.js';
import { applyUpgrade, getUpgradeChoices } from '../systems/UpgradeSystem.js';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export class ArenaScene extends Phaser.Scene {
  constructor() {
    super('ArenaScene');
    this.touchVector = { x: 0, y: 0 };
  }

  create() {
    ensureTextures(this);
    this.runMs = 0;
    this.lastHudAt = 0;
    this.spawnClock = 650;
    this.nextBossAt = GAME.bossFirstMs;
    this.bossWarningAt = 0;
    this.difficulty = 1;
    this.difficultySpeed = 1;
    this.enemyId = 0;
    this.enemies = [];
    this.projectiles = [];
    this.drops = [];
    this.particles = [];
    this.telegraphs = [];
    this.obstacles = [];
    this.decorations = [];
    this.killedBoss = false;
    this.pendingLevels = 0;
    this.awaitingUpgrade = false;
    this.isGameOver = false;
    this.vortex = null;
    this.currentBoss = null;
    this.runCoins = 0;

    this.createArena();
    const meta = Save.data.upgrades;
    this.player = new Player(this, GAME.worldWidth / 2, GAME.worldHeight / 2, {
      vitality: meta.vitality,
      edge: meta.edge,
      magnet: meta.magnet,
    });
    this.weaponSystem = new WeaponSystem(this, this.player);
    this.vortexGraphics = this.add.graphics().setDepth(9_000);
    this.shieldGraphics = this.add.graphics().setDepth(9_100);

    this.keys = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      UP: Phaser.Input.Keyboard.KeyCodes.UP,
      DOWN: Phaser.Input.Keyboard.KeyCodes.DOWN,
      LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT,
      RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
      Q: Phaser.Input.Keyboard.KeyCodes.Q,
      E: Phaser.Input.Keyboard.KeyCodes.E,
      ESC: Phaser.Input.Keyboard.KeyCodes.ESC,
    });
    this.cameras.main.setBounds(0, 0, GAME.worldWidth, GAME.worldHeight);
    this.cameras.main.startFollow(this.player.sprite, true, 0.11, 0.11);
    this.cameras.main.setRoundPixels(false);
    this.cameras.main.setBackgroundColor('#213a2e');
    this.spawnClock = 700;

    this.syncHUD(true);
    window.dispatchEvent(new CustomEvent('moonblade:game-started'));
    window.dispatchEvent(new CustomEvent('moonblade:alert', { detail: { text: 'STAY IN MOTION · YOUR BLADES ATTACK AUTOMATICALLY', duration: 2600 } }));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  createArena() {
    const width = GAME.worldWidth;
    const height = GAME.worldHeight;
    this.add.tileSprite(width / 2, height / 2, width, height, 'grass-tile').setDepth(0);

    const groundMarks = this.add.graphics().setDepth(1);
    groundMarks.lineStyle(2, 0x91a56a, 0.1).strokeRect(54, 54, width - 108, height - 108);
    groundMarks.lineStyle(12, 0x0d201c, 0.52).strokeRect(28, 28, width - 56, height - 56);
    groundMarks.lineStyle(2, 0x769466, 0.28).strokeRect(44, 44, width - 88, height - 88);
    groundMarks.fillStyle(0x173229, 0.44).fillRect(0, 0, width, 45);
    groundMarks.fillStyle(0x173229, 0.44).fillRect(0, height - 45, width, 45);
    groundMarks.fillStyle(0x173229, 0.4).fillRect(0, 0, 45, height);
    groundMarks.fillStyle(0x173229, 0.4).fillRect(width - 45, 0, 45, height);

    let seed = 17931;
    const rand = () => ((seed = (seed * 48271) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < 245; i++) {
      const x = 68 + rand() * (width - 136);
      const y = 68 + rand() * (height - 136);
      if (Math.hypot(x - width / 2, y - height / 2) < 220) continue;
      const choice = rand();
      const key = choice > 0.9 ? 'flower' : choice > 0.43 ? 'tuft' : 'rock';
      const image = this.add.image(x, y, key).setDepth(y - 8).setAlpha(key === 'rock' ? 0.8 : 0.5 + rand() * 0.33);
      const scale = key === 'rock' ? 0.34 + rand() * 0.48 : 0.33 + rand() * 0.64;
      image.setScale(scale);
      if (key === 'rock') this.decorations.push({ x, y, scale, image });
    }

    for (let i = 0; i < 23; i++) {
      let x = 150 + rand() * (width - 300);
      let y = 150 + rand() * (height - 300);
      let attempts = 0;
      while ((Math.hypot(x - width / 2, y - height / 2) < 340 || this.obstacles.some((o) => Math.hypot(o.x - x, o.y - y) < 120)) && attempts < 30) {
        x = 150 + rand() * (width - 300);
        y = 150 + rand() * (height - 300);
        attempts++;
      }
      const monitor = i % 3 !== 1;
      const image = this.add.image(x, y, monitor ? 'monitor-stack' : 'rock').setDepth(y + 3);
      image.setDisplaySize(monitor ? 82 : 58, monitor ? 76 : 48);
      const obstacle = { x, y, w: monitor ? 34 : 22, h: monitor ? 25 : 17, image, type: monitor ? 'monitor' : 'rock' };
      this.obstacles.push(obstacle);
    }
  }

  setMovement(vector) {
    this.touchVector = { x: clamp(Number(vector.x) || 0, -1, 1), y: clamp(Number(vector.y) || 0, -1, 1) };
  }

  update(_time, delta) {
    if (!this.player || this.isGameOver) return;
    const dt = Math.min(42, Math.max(0, delta));
    this.runMs += dt;
    this.difficulty = 1 + Math.min(1.75, this.runMs / 300_000);
    this.difficultySpeed = 1 + Math.min(0.28, this.runMs / 500_000);

    this.handleInput();
    if (this.isGameOver || this.awaitingUpgrade) return;
    this.movePlayer(dt);
    this.player.updateVisual(this.runMs, Math.hypot(this.player.vx, this.player.vy) / Math.max(1, this.player.speed));
    this.player.sprite.setDepth(this.player.y + 5);
    this.player.shadow.setDepth(this.player.y - 2);
    this.weaponSystem.update(dt, this.runMs);
    this.updateSpawning(dt);

    for (const enemy of this.enemies) {
      enemy.update(dt, this.runMs);
      this.checkEnemyContact(enemy);
      if (this.isGameOver) return;
    }
    this.updateProjectiles(dt);
    this.updateDrops(dt);
    this.updateParticles(dt);
    this.updateTelegraphs(dt);
    this.drawVortex();
    this.drawShield();
    this.enemies = this.enemies.filter((enemy) => !enemy.dead);
    this.projectiles = this.projectiles.filter((projectile) => !projectile.dead);
    this.drops = this.drops.filter((drop) => !drop.collected);
    this.particles = this.particles.filter((particle) => particle.life > 0);
    this.telegraphs = this.telegraphs.filter((item) => item.age < item.duration);

    if (this.runMs - this.lastHudAt > 115) this.syncHUD();
  }

  handleInput() {
    const down = (key) => key?.isDown === true;
    const just = (key) => key && Phaser.Input.Keyboard.JustDown(key);
    if (just(this.keys.ESC)) {
      window.dispatchEvent(new CustomEvent('moonblade:pause-request'));
      return;
    }
    const x = this.touchVector.x + (down(this.keys.D) || down(this.keys.RIGHT) ? 1 : 0) - (down(this.keys.A) || down(this.keys.LEFT) ? 1 : 0);
    const y = this.touchVector.y + (down(this.keys.S) || down(this.keys.DOWN) ? 1 : 0) - (down(this.keys.W) || down(this.keys.UP) ? 1 : 0);
    this.moveVector = { x, y };
    if (just(this.keys.SPACE)) this.triggerAbility('vortex');
    if (just(this.keys.Q)) this.triggerAbility('burst');
    if (just(this.keys.E)) this.triggerAbility('shield');
  }

  movePlayer(delta) {
    let { x, y } = this.moveVector || { x: 0, y: 0 };
    const length = Math.hypot(x, y);
    if (length > 1) { x /= length; y /= length; }
    const speed = this.player.speed + this.player.bonusSpeed;
    const targetX = x * speed;
    const targetY = y * speed;
    const blend = 1 - Math.exp(-(length > 0.02 ? 13 : 15) * delta / 1000);
    this.player.vx += (targetX - this.player.vx) * blend;
    this.player.vy += (targetY - this.player.vy) * blend;
    const nx = this.player.x + this.player.vx * delta / 1000;
    const ny = this.player.y + this.player.vy * delta / 1000;
    const resolved = this.resolveObstaclePosition(nx, ny, this.player.radius, this.player.x, this.player.y);
    if (Math.abs(resolved.x - nx) > 0.1) this.player.vx = 0;
    if (Math.abs(resolved.y - ny) > 0.1) this.player.vy = 0;
    this.player.setPosition(resolved.x, resolved.y);
  }

  resolveObstaclePosition(x, y, radius, oldX, oldY) {
    let px = clamp(x, GAME.worldMargin, GAME.worldWidth - GAME.worldMargin);
    let py = clamp(y, GAME.worldMargin, GAME.worldHeight - GAME.worldMargin);
    for (const obstacle of this.obstacles) {
      const minX = obstacle.x - obstacle.w;
      const maxX = obstacle.x + obstacle.w;
      const minY = obstacle.y - obstacle.h;
      const maxY = obstacle.y + obstacle.h;
      const nearestX = clamp(px, minX, maxX);
      const nearestY = clamp(py, minY, maxY);
      let dx = px - nearestX;
      let dy = py - nearestY;
      let distance = Math.hypot(dx, dy);
      if (distance >= radius) continue;
      if (distance < 0.001) {
        const choices = [
          { gap: Math.abs(px - minX), x: minX - radius, y: py },
          { gap: Math.abs(maxX - px), x: maxX + radius, y: py },
          { gap: Math.abs(py - minY), x: px, y: minY - radius },
          { gap: Math.abs(maxY - py), x: px, y: maxY + radius },
        ].sort((a, b) => a.gap - b.gap);
        px = choices[0].x;
        py = choices[0].y;
      } else {
        const push = radius - distance + 0.75;
        px += dx / distance * push;
        py += dy / distance * push;
      }
    }
    return { x: clamp(px, GAME.worldMargin, GAME.worldWidth - GAME.worldMargin), y: clamp(py, GAME.worldMargin, GAME.worldHeight - GAME.worldMargin) };
  }

  updateSpawning(delta) {
    this.spawnClock -= delta;
    const ramp = this.runMs / 180_000;
    const interval = Math.max(GAME.minimumSpawnMs, GAME.initialSpawnMs - ramp * 480);
    if (this.spawnClock <= 0 && this.enemies.length < GAME.maxEnemies) {
      const count = this.runMs > 125_000 && Math.random() < 0.26 ? 2 : 1;
      for (let i = 0; i < count; i++) this.spawnEnemy(this.chooseEnemyType());
      this.spawnClock += interval;
    }

    if (this.nextBossAt - this.runMs <= 3200 && this.bossWarningAt !== this.nextBossAt) {
      this.bossWarningAt = this.nextBossAt;
      this.showAlert('A GREAT SHADOW STIRS…', 2300);
      Audio.play('boss');
      window.dispatchEvent(new CustomEvent('moonblade:alert', { detail: { text: 'A GREAT SHADOW STIRS…', duration: 2300 } }));
    }
    if (this.runMs >= this.nextBossAt) {
      if (!this.currentBoss || this.currentBoss.dead) this.spawnBoss();
      this.nextBossAt += GAME.bossRepeatMs;
    }
  }

  chooseEnemyType() {
    const r = Math.random();
    if (this.runMs < 16_000) return r < 0.82 ? 'slime' : 'sun';
    if (this.runMs < 48_000) return r < 0.61 ? 'slime' : r < 0.91 ? 'sun' : 'ranged';
    if (this.runMs < 105_000) return r < 0.46 ? 'slime' : r < 0.69 ? 'sun' : r < 0.91 ? 'ranged' : 'elite';
    return r < 0.36 ? 'slime' : r < 0.59 ? 'sun' : r < 0.82 ? 'ranged' : 'elite';
  }

  spawnEnemy(type, forcedX, forcedY) {
    if (type !== 'boss' && this.enemies.length >= GAME.maxEnemies) return null;
    let x = forcedX;
    let y = forcedY;
    if (x == null || y == null) {
      const angle = Math.random() * Math.PI * 2;
      const view = Math.max(this.cameras.main.width || GAME.width, this.cameras.main.height || GAME.height);
      const distance = view * (0.54 + Math.random() * 0.22) + 80;
      x = this.player.x + Math.cos(angle) * distance;
      y = this.player.y + Math.sin(angle) * distance;
    }
    x = clamp(x, GAME.worldMargin + 35, GAME.worldWidth - GAME.worldMargin - 35);
    y = clamp(y, GAME.worldMargin + 35, GAME.worldHeight - GAME.worldMargin - 35);
    for (let i = 0; i < 7; i++) {
      const blocked = this.obstacles.some((o) => Math.abs(o.x - x) < o.w + 30 && Math.abs(o.y - y) < o.h + 30);
      if (!blocked) break;
      x = clamp(x + (Math.random() - 0.5) * 130, 130, GAME.worldWidth - 130);
      y = clamp(y + (Math.random() - 0.5) * 130, 130, GAME.worldHeight - 130);
    }
    const enemy = new Enemy(this, type, x, y, this.difficulty, ++this.enemyId);
    this.enemies.push(enemy);
    if (type === 'boss') {
      this.currentBoss = enemy;
      this.showAlert('THE ECLIPSE WARDEN', 2800);
      Audio.play('boss');
      this.spawnRingTelegraph(x, y, 120, 900, 0xff596d);
      this.emitParticles(x, y, 0xff6670, 26, 145);
    }
    return enemy;
  }

  spawnBoss() {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.max(this.cameras.main.height * 0.56, 520);
    const x = clamp(this.player.x + Math.cos(angle) * radius, 180, GAME.worldWidth - 180);
    const y = clamp(this.player.y + Math.sin(angle) * radius, 180, GAME.worldHeight - 180);
    this.spawnEnemy('boss', x, y);
    this.syncHUD(true);
  }

  checkEnemyContact(enemy) {
    if (enemy.dead) return;
    const dx = enemy.x - this.player.x;
    const dy = enemy.y - this.player.y;
    const hitDistance = this.player.radius + enemy.radius * (enemy.type === 'boss' ? 0.7 : 0.58);
    if (dx * dx + dy * dy > hitDistance * hitDistance || this.runMs - enemy.lastContactAt < 470) return;
    enemy.lastContactAt = this.runMs;
    if (this.player.shieldUntil > this.runMs) {
      const len = Math.hypot(dx, dy) || 1;
      enemy.x += dx / len * 25;
      enemy.y += dy / len * 25;
      this.emitParticles(this.player.x, this.player.y, 0x84d7f2, 4, 80);
      return;
    }
    const applied = this.player.takeDamage(enemy.damage, this.runMs);
    if (!applied) return;
    Audio.play('damage');
    this.emitParticles(this.player.x, this.player.y, 0xff7b86, 9, 125);
    this.cameras.main.flash(90, 210, 62, 72, false, undefined, 0.3);
    if (Save.data.settings.shake) this.cameras.main.shake(115, 0.0032);
    this.syncHUD(true);
    if (!this.player.alive) this.finishRun();
  }

  damageEnemy(enemy, amount, impact = {}) {
    if (!enemy || enemy.dead) return;
    const killed = enemy.takeDamage(amount);
    this.showDamage(amount, impact.x ?? enemy.x, impact.y ?? enemy.y - enemy.radius * 0.35, impact.critical);
    if (Math.random() < 0.16) Audio.play('hit');
    if (impact.x != null) this.spawnBladeSpark(impact.x, impact.y, impact.critical ? 0xfff0a1 : 0xffcc62);
    if (killed) this.defeatEnemy(enemy);
    if (enemy.type === 'boss') this.syncHUD(true);
  }

  showDamage(amount, x, y, critical = false) {
    const label = this.add.text(x, y, critical ? `${Math.round(amount)}!` : `${Math.round(amount)}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: critical ? '15px' : '11px',
      fontStyle: 'bold',
      color: critical ? '#fff0a0' : '#f6ede0',
      stroke: '#17201d',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(8_200);
    this.tweens.add({ targets: label, y: y - (critical ? 34 : 23), alpha: 0, scale: critical ? 1.25 : 1.08, duration: 520, ease: 'Cubic.easeOut', onComplete: () => label.destroy() });
  }

  spawnBladeSpark(x, y, color) {
    this.emitParticles(x, y, color === 0xfff0a1 ? 0xffe992 : 0xffc459, 3, 70, 4);
  }

  defeatEnemy(enemy) {
    enemy.dead = true;
    const isBoss = enemy.type === 'boss';
    const x = enemy.x;
    const y = enemy.y;
    enemy.hpBar?.destroy();
    enemy.hpBar = null;
    this.tweens.add({ targets: enemy.sprite, alpha: 0, scaleX: 0.15, scaleY: 0.15, angle: enemy.sprite.angle + 35, duration: isBoss ? 620 : 360, ease: 'Back.easeIn', onComplete: () => enemy.sprite.destroy() });
    this.tweens.add({ targets: enemy.shadow, alpha: 0, scaleX: 0.1, duration: 280, onComplete: () => enemy.shadow.destroy() });
    this.emitParticles(x, y, isBoss ? 0xffb85c : enemy.type === 'sun' ? 0xffcf61 : 0x81ddbd, isBoss ? 34 : 10, isBoss ? 220 : 110);
    this.addBurstRing(x, y, isBoss ? 85 : 30, isBoss ? 510 : 270, isBoss ? 0xff8769 : 0xe9ce74);
    this.player.kills += 1;
    this.player.score += enemy.score;
    const dropCount = isBoss ? 13 : enemy.type === 'elite' ? 2 : enemy.type === 'sun' && Math.random() < 0.35 ? 2 : 1;
    for (let i = 0; i < dropCount; i++) {
      const offsetX = (Math.random() - 0.5) * (isBoss ? 120 : 45);
      const offsetY = (Math.random() - 0.5) * (isBoss ? 100 : 40);
      this.spawnDrop('xp', x + offsetX, y + offsetY, isBoss ? 12 : enemy.xp);
    }
    const coinChance = isBoss ? 1 : enemy.type === 'elite' ? 0.75 : enemy.type === 'sun' ? 0.28 : 0.12;
    if (Math.random() < coinChance) {
      const coinCount = isBoss ? 15 : enemy.type === 'elite' ? 3 : 1;
      for (let i = 0; i < coinCount; i++) this.spawnDrop('coin', x + (Math.random() - 0.5) * 64, y + (Math.random() - 0.5) * 55, 1);
    }
    if (Math.random() < (isBoss ? 1 : 0.035)) this.spawnDrop('health', x + 16, y - 12, 24);
    this.enemies = this.enemies.filter((item) => item !== enemy);
    if (isBoss) {
      this.currentBoss = null;
      this.killedBoss = true;
      this.showAlert('THE WARDEN IS BROKEN', 2500);
      this.emitParticles(x, y, 0xffe184, 30, 190);
      window.dispatchEvent(new CustomEvent('moonblade:alert', { detail: { text: 'THE WARDEN IS BROKEN', duration: 2400 } }));
    }
    Audio.play('defeat');
    this.syncHUD(true);
  }

  spawnDrop(type, x, y, value) {
    const texture = type === 'xp' ? 'xp-orb' : type === 'coin' ? 'coin' : 'health-orb';
    const size = type === 'xp' ? 23 : 22;
    const sprite = this.add.image(x, y, texture).setDisplaySize(size, size).setDepth(y + 14);
    if (type !== 'health') sprite.setBlendMode(Phaser.BlendModes.ADD);
    this.drops.push({ type, x, y, baseY: y, value, sprite, phase: Math.random() * Math.PI * 2, vx: 0, vy: 0, collected: false });
  }

  updateDrops(delta) {
    const player = this.player;
    for (const drop of this.drops) {
      if (drop.collected) continue;
      const dx = player.x - drop.x;
      const dy = player.y - drop.y;
      const distance = Math.hypot(dx, dy) || 0.001;
      const attractionRadius = drop.type === 'xp' ? player.pickupRadius : drop.type === 'coin' ? player.pickupRadius * 0.65 : 95;
      if (distance < attractionRadius) {
        const pull = drop.type === 'xp' ? 320 : 265;
        drop.vx += dx / distance * pull * delta / 1000;
        drop.vy += dy / distance * pull * delta / 1000;
        const speed = Math.hypot(drop.vx, drop.vy);
        const maxSpeed = drop.type === 'xp' ? 245 : 200;
        if (speed > maxSpeed) { drop.vx = drop.vx / speed * maxSpeed; drop.vy = drop.vy / speed * maxSpeed; }
        drop.x += drop.vx * delta / 1000;
        drop.y += drop.vy * delta / 1000;
      } else {
        drop.vx *= 0.92;
        drop.vy *= 0.92;
        drop.x += drop.vx * delta / 1000;
        drop.y += drop.vy * delta / 1000;
      }
      const bob = Math.sin(this.runMs / 220 + drop.phase) * 2.4;
      drop.sprite.setPosition(drop.x, drop.y + bob).setDepth(drop.y + 14);
      drop.sprite.setScale(1 + Math.sin(this.runMs / 170 + drop.phase) * 0.08);
      if (distance < (drop.type === 'health' ? 22 : 18)) this.collectDrop(drop);
    }
  }

  collectDrop(drop) {
    if (drop.collected) return;
    drop.collected = true;
    drop.sprite.destroy();
    this.emitParticles(drop.x, drop.y, drop.type === 'xp' ? 0xffdf72 : drop.type === 'coin' ? 0xffd268 : 0xff9bb3, 6, 86, 3);
    if (drop.type === 'xp') {
      this.gainXp(drop.value);
      this.player.score += drop.value * 2;
      this.showPickupText(`+${drop.value} MOON`, drop.x, drop.y, '#ffe18a');
      Audio.play('pickup');
    } else if (drop.type === 'coin') {
      this.player.coins += drop.value;
      this.runCoins += drop.value;
      Save.addCoins(drop.value);
      this.showPickupText('+1 COIN', drop.x, drop.y, '#ffda77');
      Audio.play('coin');
      this.syncHUD(true);
    } else {
      this.player.heal(drop.value);
      this.showPickupText(`+${drop.value} HP`, drop.x, drop.y, '#ff9eb0');
      Audio.play('pickup');
      this.syncHUD(true);
    }
  }

  showPickupText(text, x, y, color) {
    const label = this.add.text(x, y, text, { fontFamily: 'Arial,sans-serif', fontSize: '9px', fontStyle: 'bold', color, stroke: '#15211b', strokeThickness: 3, letterSpacing: 1 }).setOrigin(0.5).setDepth(8_300);
    this.tweens.add({ targets: label, y: y - 26, alpha: 0, duration: 630, ease: 'Sine.easeOut', onComplete: () => label.destroy() });
  }

  gainXp(amount) {
    this.player.xp += amount;
    while (this.player.xp >= this.player.xpNext) {
      this.player.xp -= this.player.xpNext;
      this.player.level += 1;
      this.player.xpNext = Math.round(this.player.xpNext * 1.28 + 7);
      this.pendingLevels += 1;
    }
    if (this.pendingLevels > 0 && !this.awaitingUpgrade) {
      this.awaitingUpgrade = true;
      Audio.play('level');
      this.cameras.main.flash(260, 247, 213, 130, false, undefined, 0.12);
      if (Save.data.settings.shake) this.cameras.main.shake(180, 0.0025);
      this.scene.pause();
      this.presentUpgrade();
    }
    this.syncHUD(true);
  }

  presentUpgrade() {
    window.dispatchEvent(new CustomEvent('moonblade:level-up', { detail: { level: this.player.level, choices: getUpgradeChoices(this.player) } }));
  }

  chooseUpgrade(key) {
    if (!this.awaitingUpgrade || !this.player) return;
    applyUpgrade(this, key);
    this.pendingLevels = Math.max(0, this.pendingLevels - 1);
    if (this.pendingLevels > 0) {
      this.presentUpgrade();
    } else {
      this.awaitingUpgrade = false;
      window.dispatchEvent(new CustomEvent('moonblade:upgrade-dismiss'));
      this.scene.resume();
      this.syncHUD(true);
    }
  }

  triggerAbility(name) {
    if (!this.player || this.isGameOver || this.awaitingUpgrade) return false;
    const player = this.player;
    if (!player.unlocked[name]) {
      window.dispatchEvent(new CustomEvent('moonblade:alert', { detail: { text: 'LEVEL UP TO UNLOCK THIS SKILL', duration: 1300 } }));
      return false;
    }
    const now = this.runMs;
    if (now < player.cooldowns[name]) return false;
    const config = GAME.ability[name];
    if (!config) return false;
    player.cooldowns[name] = now + config.cooldown;
    if (name === 'vortex') this.activateVortex(config);
    if (name === 'burst') this.activateBurst(config);
    if (name === 'shield') this.activateShield(config);
    this.syncHUD(true);
    return true;
  }

  activateVortex(config) {
    const player = this.player;
    this.vortex = { start: this.runMs, end: this.runMs + config.duration, x: player.x, y: player.y, radius: config.radius };
    let struck = 0;
    for (const enemy of [...this.enemies]) {
      if (enemy.dead) continue;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= config.radius + enemy.radius) {
        this.damageEnemy(enemy, config.damage, { x: enemy.x, y: enemy.y, critical: false });
        const length = distance || 1;
        const push = (config.radius - Math.min(config.radius, distance)) * 0.48 + 55;
        enemy.x += dx / length * push;
        enemy.y += dy / length * push;
        struck++;
      }
    }
    this.addBurstRing(player.x, player.y, 28, config.radius * 2.2, 0xff505f);
    this.emitParticles(player.x, player.y, 0xff5965, 31, 245);
    this.emitParticles(player.x, player.y, 0x101119, 17, 180);
    Audio.play('vortex');
    if (Save.data.settings.shake) this.cameras.main.shake(230, 0.007);
    this.showAlert(struck ? 'CRIMSON VORTEX · ' + struck + ' STRUCK' : 'CRIMSON VORTEX', 1300);
  }

  activateBurst(config) {
    const count = config.count;
    const angleOffset = this.runMs / 510;
    for (let i = 0; i < count; i++) {
      const angle = Math.PI * 2 * i / count + angleOffset;
      this.addProjectile({
        kind: 'player', texture: 'blade', x: this.player.x, y: this.player.y,
        vx: Math.cos(angle) * config.speed, vy: Math.sin(angle) * config.speed,
        damage: config.damage + this.player.bonusDamage, life: 1100, size: 31,
      });
    }
    this.addBurstRing(this.player.x, this.player.y, 18, 185, 0xf5cf71);
    this.emitParticles(this.player.x, this.player.y, 0xffdc7c, 20, 170);
    Audio.play('burst');
    if (Save.data.settings.shake) this.cameras.main.shake(150, 0.0033);
    this.showAlert('MOON BURST', 1000);
  }

  activateShield(config) {
    this.player.shieldUntil = this.runMs + config.duration;
    this.emitParticles(this.player.x, this.player.y, 0x77dff1, 20, 130);
    this.addBurstRing(this.player.x, this.player.y, 25, 82, 0x81e2ee);
    Audio.play('burst');
    this.showAlert('ENERGY VEIL · 4.5 SEC', 1150);
  }

  addProjectile(options) {
    if (this.projectiles.length >= GAME.maxProjectiles) return;
    this.projectiles.push(new Projectile(this, options));
  }

  fireEnemyProjectile(enemy, dx, dy, speed, damage) {
    const projectile = new Projectile(this, {
      kind: 'enemy', texture: 'projectile', x: enemy.x, y: enemy.y,
      vx: dx * speed, vy: dy * speed, damage, life: 4200, size: 24,
    });
    if (this.projectiles.length < GAME.maxProjectiles) this.projectiles.push(projectile);
    else projectile.destroy();
    this.emitParticles(enemy.x, enemy.y, 0xff927a, 3, 40, 3);
  }

  fireBossBurst(enemy) {
    const n = 8;
    const offset = this.runMs / 900;
    for (let i = 0; i < n; i++) {
      const angle = Math.PI * 2 * i / n + offset;
      this.fireEnemyProjectile(enemy, Math.cos(angle), Math.sin(angle), 138, enemy.damage * 0.72);
    }
  }

  updateProjectiles(delta) {
    for (const projectile of this.projectiles) {
      projectile.update(delta);
      if (projectile.dead) continue;
      if (projectile.kind === 'player') {
        for (const enemy of this.enemies) {
          if (enemy.dead) continue;
          const dx = enemy.x - projectile.x;
          const dy = enemy.y - projectile.y;
          const radius = enemy.radius + 12;
          if (dx * dx + dy * dy <= radius * radius) {
            this.damageEnemy(enemy, projectile.damage, { x: projectile.x, y: projectile.y });
            projectile.dead = true;
            projectile.sprite.destroy();
            break;
          }
        }
      } else {
        const dx = this.player.x - projectile.x;
        const dy = this.player.y - projectile.y;
        if (dx * dx + dy * dy <= (this.player.radius + 8) ** 2) {
          projectile.dead = true;
          projectile.sprite.destroy();
          if (this.player.shieldUntil <= this.runMs && this.player.takeDamage(projectile.damage, this.runMs)) {
            Audio.play('damage');
            this.emitParticles(this.player.x, this.player.y, 0xff7b86, 7, 110);
            if (Save.data.settings.shake) this.cameras.main.shake(100, 0.0025);
            this.syncHUD(true);
            if (!this.player.alive) this.finishRun();
          }
        }
      }
    }
  }

  emitParticles(x, y, color, amount = 8, speed = 100, size = 3) {
    const max = 88;
    const count = Math.min(amount, max - this.particles.length);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const magnitude = speed * (0.35 + Math.random() * 0.75);
      const radius = size * (0.5 + Math.random() * 0.9);
      const sprite = this.add.circle(x, y, radius, color, 0.95).setDepth(8_800);
      this.particles.push({ sprite, x, y, vx: Math.cos(angle) * magnitude, vy: Math.sin(angle) * magnitude, life: 320 + Math.random() * 390, maxLife: 710, size: radius });
    }
  }

  spawnRingTelegraph(x, y, radius, duration, color = 0xff525e) {
    const graphic = this.add.graphics().setDepth(9_300);
    this.telegraphs.push({ graphic, x, y, radius, duration, age: 0, color });
  }

  addBurstRing(x, y, startRadius, endRadius, color) {
    const ring = this.add.circle(x, y, startRadius, color, 0).setDepth(9_200);
    ring.setStrokeStyle(3, color, 0.76);
    this.tweens.add({ targets: ring, scale: endRadius / startRadius, alpha: 0, duration: 520, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
  }

  updateTelegraphs(delta) {
    for (const item of this.telegraphs) {
      item.age += delta;
      const progress = Math.min(1, item.age / item.duration);
      item.graphic.clear();
      const pulse = 0.55 + Math.sin(this.runMs / 70) * 0.18;
      item.graphic.lineStyle(3.5, item.color, pulse * (1 - progress * 0.25));
      item.graphic.strokeCircle(item.x, item.y, item.radius * (0.72 + progress * 0.28));
      item.graphic.lineStyle(1, item.color, 0.18 * (1 - progress));
      item.graphic.strokeCircle(item.x, item.y, item.radius * (0.45 + progress * 0.48));
      if (item.age >= item.duration) item.graphic.destroy();
    }
  }

  updateParticles(delta) {
    for (const particle of this.particles) {
      particle.life -= delta;
      particle.x += particle.vx * delta / 1000;
      particle.y += particle.vy * delta / 1000;
      particle.vx *= 0.96;
      particle.vy *= 0.96;
      const alpha = Math.max(0, particle.life / particle.maxLife);
      particle.sprite.setPosition(particle.x, particle.y).setAlpha(alpha).setScale(0.5 + alpha * 0.7);
      if (particle.life <= 0) particle.sprite.destroy();
    }
  }

  drawVortex() {
    const g = this.vortexGraphics;
    g.clear();
    if (!this.vortex || this.runMs > this.vortex.end) return;
    const { x, y, radius, start, end } = this.vortex;
    const progress = (this.runMs - start) / (end - start);
    const fade = Math.min(1, (1 - progress) * 3.5);
    const swell = 0.85 + 0.13 * Math.sin(this.runMs / 80);
    const r = radius * swell;
    g.fillStyle(0x12070d, 0.31 * fade).fillCircle(x, y, r * 0.98);
    g.lineStyle(5, 0x080a11, 0.62 * fade).beginPath().arc(x, y, r * 0.86, this.runMs / 170, this.runMs / 170 + Math.PI * 1.25).strokePath();
    g.lineStyle(4, 0xff3f59, 0.9 * fade).beginPath().arc(x, y, r * 0.93, -this.runMs / 140, -this.runMs / 140 + Math.PI * 1.6).strokePath();
    g.lineStyle(2.2, 0xffb1a0, 0.68 * fade).beginPath().arc(x, y, r * 0.69, this.runMs / 220 + 1.8, this.runMs / 220 + 4.9).strokePath();
    g.lineStyle(9, 0x130c18, 0.42 * fade).beginPath().arc(x, y, r * 0.48, -this.runMs / 190, -this.runMs / 190 + Math.PI * 1.25).strokePath();
    g.lineStyle(3, 0xf56873, 0.75 * fade).strokeCircle(x, y, r * 0.28);
    g.fillStyle(0xffd195, 0.22 * fade).fillCircle(x, y, 17 + Math.sin(this.runMs / 65) * 4);
    g.fillStyle(0xff9b8b, 0.29 * fade).fillCircle(x, y, 7);
    for (let i = 0; i < 6; i++) {
      const angle = this.runMs / 220 + i * Math.PI / 3;
      const px = x + Math.cos(angle) * r * 0.78;
      const py = y + Math.sin(angle) * r * 0.78;
      g.fillStyle(i % 2 ? 0xffb66d : 0xff556a, 0.85 * fade).fillCircle(px, py, 3.5 + (i % 2));
    }
  }

  drawShield() {
    const g = this.shieldGraphics;
    g.clear();
    if (!this.player || this.player.shieldUntil <= this.runMs) return;
    const remaining = (this.player.shieldUntil - this.runMs) / GAME.ability.shield.duration;
    const r = 43 + Math.sin(this.runMs / 90) * 2;
    g.fillStyle(0x63d9f1, 0.075 + 0.045 * remaining).fillCircle(this.player.x, this.player.y, r);
    g.lineStyle(2.5, 0x83e8f3, 0.58 + 0.2 * Math.sin(this.runMs / 100)).strokeCircle(this.player.x, this.player.y, r);
    g.lineStyle(1, 0xc4fcff, 0.55).beginPath().arc(this.player.x, this.player.y, r + 6, this.runMs / 260, this.runMs / 260 + Math.PI * 1.1).strokePath();
    g.lineStyle(1.5, 0x84e5f5, 0.42).beginPath().arc(this.player.x, this.player.y, r + 6, -this.runMs / 230, -this.runMs / 230 + Math.PI * 0.9).strokePath();
  }

  showAlert(text, duration = 1300) {
    window.dispatchEvent(new CustomEvent('moonblade:alert', { detail: { text, duration } }));
  }

  syncHUD(force = false) {
    if (!this.player) return;
    if (!force) this.lastHudAt = this.runMs;
    const player = this.player;
    const score = Math.floor(player.score + Math.floor(this.runMs / 1000) * GAME.scoring.second + player.kills * GAME.scoring.kill + player.level * GAME.scoring.level);
    const abilities = {};
    for (const key of ['vortex', 'burst', 'shield']) {
      const total = GAME.ability[key].cooldown;
      const remaining = Math.max(0, (player.cooldowns[key] || 0) - this.runMs);
      abilities[key] = { unlocked: !!player.unlocked[key], remaining, total, active: key === 'shield' ? Math.max(0, player.shieldUntil - this.runMs) : 0 };
    }
    const boss = this.currentBoss && !this.currentBoss.dead ? this.currentBoss : null;
    window.dispatchEvent(new CustomEvent('moonblade:hud', { detail: {
      hp: player.hp,
      maxHp: player.maxHp,
      level: player.level,
      xp: player.xp,
      xpNext: player.xpNext,
      time: this.runMs,
      score,
      kills: player.kills,
      coins: player.coins,
      enemyCount: this.enemies.filter((enemy) => !enemy.dead).length,
      abilities,
      boss: boss ? { hp: boss.hp, maxHp: boss.maxHp } : null,
    } }));
  }

  finishRun() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    const survivalMs = this.runMs;
    const score = Math.floor(this.player.score + Math.floor(survivalMs / 1000) * GAME.scoring.second + this.player.kills * GAME.scoring.kill + this.player.level * GAME.scoring.level);
    const result = Save.recordRun({ score, kills: this.player.kills });
    Audio.play('damage');
    this.scene.pause();
    window.dispatchEvent(new CustomEvent('moonblade:run-ended', { detail: {
      score,
      bestScore: result.bestScore,
      isBest: result.wasBest,
      time: survivalMs,
      kills: this.player.kills,
      level: this.player.level,
      coins: this.runCoins,
      totalCoins: Save.data.totalCoins,
      bossDefeated: this.killedBoss,
    } }));
  }

  shutdown() {
    this.weaponSystem?.destroy();
    this.enemies?.forEach((enemy) => enemy.destroy());
    this.projectiles?.forEach((projectile) => projectile.destroy());
    this.drops?.forEach((drop) => drop.sprite.destroy());
    this.particles?.forEach((particle) => particle.sprite.destroy());
    this.telegraphs?.forEach((item) => item.graphic.destroy());
  }
}
