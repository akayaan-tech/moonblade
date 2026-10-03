export class WeaponSystem {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.rotation = 0;
    this.blades = [];
    this.syncCount();
  }

  syncCount() {
    const desired = Math.max(1, Math.min(10, this.player.weaponCount));
    while (this.blades.length < desired) {
      const sprite = this.scene.add.image(this.player.x, this.player.y, 'blade').setDepth(35).setBlendMode(Phaser.BlendModes.ADD);
      const glow = this.scene.add.circle(this.player.x, this.player.y, 8, 0xffbb44, 0.12).setDepth(34);
      this.blades.push({ sprite, glow, hitTimes: new Map(), phase: this.blades.length * Math.PI * 2 / desired });
      this.scene.tweens.add({ targets: [sprite], scaleX: { from: 0.94, to: 1.08 }, scaleY: { from: 0.94, to: 1.08 }, duration: 530, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    while (this.blades.length > desired) {
      const removed = this.blades.pop();
      removed.sprite.destroy();
      removed.glow.destroy();
    }
    this.blades.forEach((blade, index) => { blade.phase = index * Math.PI * 2 / desired; });
  }

  update(delta, time) {
    this.rotation += this.player.orbitSpeed * delta / 1000;
    const count = this.blades.length;
    const scale = this.player.bladeSize;
    this.blades.forEach((blade, index) => {
      const angle = this.rotation + blade.phase;
      const radius = this.player.orbitRadius;
      const x = this.player.x + Math.cos(angle) * radius;
      const y = this.player.y + Math.sin(angle) * radius * 0.82;
      blade.sprite.setPosition(x, y);
      blade.sprite.setRotation(angle + Math.PI / 2 + 0.3);
      blade.sprite.setDisplaySize(37 * scale, 37 * scale);
      blade.glow.setPosition(x, y).setRadius(11 * scale).setAlpha(0.1 + Math.sin(time / 100 + index) * 0.025);
      const targetY = this.player.y + Math.sin(angle + 0.04) * radius * 0.82;
      blade.sprite.setDepth(targetY < this.player.y ? targetY + 1 : targetY + 12);
      blade.glow.setDepth(targetY < this.player.y ? targetY : targetY + 11);

      for (let i = 0; i < this.scene.enemies.length; i++) {
        const enemy = this.scene.enemies[i];
        if (!enemy || enemy.dead) continue;
        const dx = x - enemy.x;
        const dy = y - enemy.y;
        const hitRange = enemy.radius + 12 * scale;
        if (dx * dx + dy * dy > hitRange * hitRange) continue;
        const previous = blade.hitTimes.get(enemy.id) || 0;
        if (time - previous < this.player.attackInterval) continue;
        blade.hitTimes.set(enemy.id, time);
        let damage = this.player.damage + this.player.bonusDamage;
        const critical = Math.random() < this.player.critChance;
        if (critical) damage = Math.round(damage * 2);
        this.scene.damageEnemy(enemy, damage, { critical, x, y });
      }
    });
  }

  destroy() {
    this.blades.forEach(({ sprite, glow }) => { sprite.destroy(); glow.destroy(); });
    this.blades.length = 0;
  }
}
