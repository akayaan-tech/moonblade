import { ENEMY_BASE } from '../config.js';

const TEXTURE_BY_TYPE = { slime: 'slime', sun: 'sun', ranged: 'ranged', elite: 'elite', boss: 'boss' };
const SIZE_BY_TYPE = { slime: 48, sun: 63, ranged: 48, elite: 67, boss: 136 };

export class Enemy {
  constructor(scene, type, x, y, difficulty = 1, id = 0) {
    const base = ENEMY_BASE[type] || ENEMY_BASE.slime;
    this.scene = scene;
    this.type = type;
    this.id = id;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = base.radius;
    this.maxHp = Math.round(base.hp * difficulty);
    this.hp = this.maxHp;
    this.speed = base.speed * (0.94 + Math.min(0.31, (difficulty - 1) * 0.16));
    this.damage = Math.round(base.damage * difficulty);
    this.xp = base.xp;
    this.score = base.score;
    this.dead = false;
    this.lastContactAt = 0;
    this.lastShotAt = 0;
    this.spawnTime = scene.runMs;
    this.phase = Math.random() * Math.PI * 2;
    this.chargeState = 'idle';
    this.chargeUntil = 0;
    this.sprite = scene.add.image(x, y, TEXTURE_BY_TYPE[type] || 'slime').setDepth(y + 2);
    const size = SIZE_BY_TYPE[type] || 48;
    this.sprite.setDisplaySize(size, size);
    if (type === 'boss') this.sprite.setDisplaySize(size, size);
    this.shadow = scene.add.ellipse(x, y + this.radius * 0.55, this.radius * 2.1, this.radius * 0.66, 0x071010, 0.34).setDepth(y - 1);
    this.hpBar = null;
    if (type === 'boss') this.createBossBar();
    else if (type === 'elite') this.createHpPip();
  }

  createBossBar() {
    const width = 72;
    this.hpBar = this.scene.add.graphics().setDepth(this.y + 45);
    this.hpBarWidth = width;
    this.drawHpBar();
  }

  createHpPip() {
    this.hpBar = this.scene.add.graphics().setDepth(this.y + 25);
    this.hpBarWidth = 32;
    this.drawHpBar();
  }

  drawHpBar() {
    if (!this.hpBar) return;
    this.hpBar.clear();
    const fraction = Math.max(0, this.hp / this.maxHp);
    const y = this.y - this.radius - (this.type === 'boss' ? 18 : 10);
    const x = this.x - this.hpBarWidth / 2;
    this.hpBar.fillStyle(0x101315, 0.75).fillRoundedRect(x, y, this.hpBarWidth, 4, 2);
    this.hpBar.fillStyle(this.type === 'boss' ? 0xff6873 : 0xb47cec, 0.94).fillRoundedRect(x + 1, y + 1, (this.hpBarWidth - 2) * fraction, 2, 1);
  }

  update(delta, time) {
    if (this.dead) return;
    const player = this.scene.player;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.hypot(dx, dy) || 1;
    let vx = dx / distance;
    let vy = dy / distance;
    if (this.type === 'ranged') {
      if (distance < 220) { vx *= -1; vy *= -1; }
      else if (distance < 330) { vx = -vy * 0.45; vy = dx / distance * 0.45; }
      if (time - this.lastShotAt > 2300 && distance < 560) {
        this.lastShotAt = time;
        this.scene.fireEnemyProjectile(this, dx / distance, dy / distance, 185, 9 + this.scene.difficulty * 1.1);
      }
    } else if (this.type === 'boss') {
      this.updateBoss(time, dx, dy, distance);
      if (this.chargeState === 'charging') {
        vx = this.chargeVx;
        vy = this.chargeVy;
      } else if (this.chargeState === 'windup') {
        vx = 0;
        vy = 0;
      }
    } else if (this.type === 'elite') {
      vx = dx / distance + Math.cos(time / 350 + this.phase) * 0.16;
      vy = dy / distance + Math.sin(time / 350 + this.phase) * 0.16;
    }

    const length = Math.hypot(vx, vy) || 1;
    vx /= length;
    vy /= length;
    const wobble = this.type === 'sun' ? 1 + Math.sin(time / 150 + this.phase) * 0.06 : 1;
    const moveScale = this.chargeState === 'charging' ? 3.6 : 1;
    const multiplier = this.scene.difficultySpeed;
    this.vx = vx * this.speed * multiplier * wobble * moveScale;
    this.vy = vy * this.speed * multiplier * wobble * moveScale;
    const nx = this.x + this.vx * delta / 1000;
    const ny = this.y + this.vy * delta / 1000;
    const adjusted = this.scene.resolveObstaclePosition(nx, ny, this.radius * 0.75, this.x, this.y);
    this.x = adjusted.x;
    this.y = adjusted.y;
    this.sprite.setPosition(this.x, this.y + Math.sin(time / 160 + this.phase) * 1.7).setDepth(this.y + 2);
    this.sprite.setRotation(Math.sin(time / 600 + this.phase) * (this.type === 'boss' ? 0.04 : 0.09));
    this.shadow.setPosition(this.x, this.y + this.radius * 0.56).setDepth(this.y - 1);
    this.shadow.setScale(wobble, 1);
    if (this.hpBar) {
      this.hpBar.setDepth(this.y + (this.type === 'boss' ? 45 : 25));
      this.drawHpBar();
    }
  }

  updateBoss(time, dx, dy, distance) {
    if (this.chargeState === 'windup' && time >= this.chargeUntil) {
      this.chargeState = 'charging';
      this.chargeUntil = time + 720;
      const length = Math.hypot(dx, dy) || 1;
      this.chargeVx = dx / length;
      this.chargeVy = dy / length;
      this.scene.spawnRingTelegraph(this.x, this.y, 112, 460);
      return;
    }
    if (this.chargeState === 'charging' && time >= this.chargeUntil) {
      this.chargeState = 'idle';
      this.lastShotAt = time;
      this.scene.fireBossBurst(this);
    }
    if (this.chargeState === 'idle' && time - this.lastShotAt > 4400 && distance < 660) {
      this.chargeState = 'windup';
      this.chargeUntil = time + 720;
      this.scene.showAlert('THE WARDEN GATHERS ITS STRENGTH', 1500);
      this.scene.spawnRingTelegraph(this.scene.player.x, this.scene.player.y, 52, 760);
    }
  }

  takeDamage(amount) {
    if (this.dead) return false;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hpBar) this.drawHpBar();
    if (this.hp <= 0) {
      this.dead = true;
      return true;
    }
    return false;
  }

  destroy() {
    this.sprite.destroy();
    this.shadow.destroy();
    this.hpBar?.destroy();
  }
}
