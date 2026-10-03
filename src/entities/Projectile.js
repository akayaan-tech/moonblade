export class Projectile {
  constructor(scene, options) {
    this.scene = scene;
    Object.assign(this, options);
    this.dead = false;
    this.age = 0;
    this.sprite = scene.add.image(this.x, this.y, this.texture || 'projectile').setDepth(this.y + 18);
    this.sprite.setDisplaySize(this.size || 25, this.size || 25);
    if (this.kind === 'player') this.sprite.setBlendMode(Phaser.BlendModes.ADD);
  }

  update(delta) {
    if (this.dead) return;
    this.age += delta;
    this.x += this.vx * delta / 1000;
    this.y += this.vy * delta / 1000;
    this.sprite.setPosition(this.x, this.y).setDepth(this.y + 18);
    this.sprite.setRotation(Math.atan2(this.vy, this.vx) + Math.PI / 2);
    this.sprite.setAlpha(Math.min(1, Math.max(0, (this.life - this.age) / 220)));
    if (this.age >= this.life || this.x < 0 || this.y < 0 || this.x > 3000 || this.y > 3000) {
      this.dead = true;
      this.sprite.destroy();
    }
  }

  destroy() {
    this.sprite.destroy();
  }
}
