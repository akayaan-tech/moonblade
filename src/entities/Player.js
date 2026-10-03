import { PLAYER_BASE } from '../config.js';

export class Player {
  constructor(scene, x, y, meta = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.hp = PLAYER_BASE.hp + (meta.vitality || 0) * 12;
    this.maxHp = this.hp;
    this.speed = PLAYER_BASE.speed;
    this.damage = PLAYER_BASE.damage + (meta.edge || 0);
    this.attackInterval = PLAYER_BASE.attackInterval;
    this.weaponCount = PLAYER_BASE.weaponCount;
    this.orbitRadius = PLAYER_BASE.orbitRadius;
    this.orbitSpeed = PLAYER_BASE.orbitSpeed;
    this.attackRadius = PLAYER_BASE.attackRadius;
    this.critChance = PLAYER_BASE.critChance;
    this.pickupRadius = PLAYER_BASE.pickupRadius + (meta.magnet || 0) * 24;
    this.radius = 18;
    this.level = 1;
    this.xp = 0;
    this.xpNext = 28;
    this.coins = 0;
    this.kills = 0;
    this.score = 0;
    this.invulnerableUntil = 0;
    this.shieldUntil = 0;
    this.unlocked = { vortex: true, burst: false, shield: false };
    this.cooldowns = { vortex: 0, burst: 0, shield: 0 };
    this.bonusDamage = 0;
    this.bonusSpeed = 0;
    this.bladeSize = 1;
    this.sprite = scene.add.image(x, y, 'player').setDepth(30).setDisplaySize(64, 72);
    this.baseScaleX = this.sprite.scaleX;
    this.baseScaleY = this.sprite.scaleY;
    this.shadow = scene.add.ellipse(x, y + 18, 41, 13, 0x031010, 0.38).setDepth(28);
  }

  get alive() {
    return this.hp > 0;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.sprite.setPosition(x, y);
    this.shadow.setPosition(x, y + 18);
  }

  updateVisual(time, moveAmount = 0) {
    const bob = Math.sin(time / 120) * (moveAmount > 0.08 ? 2.1 : 0.75);
    this.sprite.y = this.y + bob;
    this.shadow.y = this.y + 18;
    this.sprite.setAngle(Math.max(-8, Math.min(8, this.vx * 0.025)));
    this.sprite.setScale(this.baseScaleX, this.baseScaleY * (1 + Math.sin(time / 140) * 0.018));
    const flicker = time < this.invulnerableUntil && Math.floor(time / 85) % 2 === 0;
    this.sprite.setAlpha(flicker ? 0.5 : 1);
    this.shadow.setAlpha(this.shieldUntil > time ? 0.62 : 0.38);
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  takeDamage(amount, time) {
    if (time < this.invulnerableUntil || this.shieldUntil > time) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnerableUntil = time + 720;
    return true;
  }
}
