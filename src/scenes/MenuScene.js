import { ensureTextures } from '../systems/TextureFactory.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
    this.dust = [];
  }

  create() {
    ensureTextures(this);
    this.cameras.main.setBackgroundColor('#10251f');
    const width = this.scale.width;
    const height = this.scale.height;
    this.floor = this.add.tileSprite(0, 0, width, height, 'grass-tile').setOrigin(0).setScrollFactor(0).setAlpha(0.98);
    this.shade = this.add.graphics().setScrollFactor(0).setDepth(3);
    this.mandala = this.add.graphics().setScrollFactor(0).setDepth(4);
    this.heroAura = this.add.circle(width / 2, height * 0.58, 95, 0xf1c867, 0.055).setDepth(5);
    this.heroAura.setStrokeStyle(1, 0xf0d483, 0.28);
    this.hero = this.add.image(width / 2, height * 0.585, 'player').setDepth(8).setDisplaySize(144, 164);
    this.heroShadow = this.add.ellipse(width / 2, height * 0.645, 100, 25, 0x030a0c, 0.44).setDepth(7);
    this.showcaseBlades = [0, 1, 2].map((i) => this.add.image(width / 2, height * 0.58, 'blade').setDepth(9).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(48, 48));
    this.sun = this.add.image(width * 0.19, height * 0.54, 'sun').setDepth(6).setDisplaySize(52, 52).setAlpha(0.78);
    this.ranged = this.add.image(width * 0.81, height * 0.57, 'ranged').setDepth(6).setDisplaySize(45, 45).setAlpha(0.75);
    this.rocks = [];
    for (let i = 0; i < 24; i++) {
      const isFlower = i % 4 === 0;
      const x = Math.random() * width;
      const y = height * (0.39 + Math.random() * 0.4);
      const image = this.add.image(x, y, isFlower ? 'flower' : 'tuft').setDepth(2 + y / height * 0.05).setAlpha(0.3 + Math.random() * 0.35);
      image.setScale(0.55 + Math.random() * 0.8);
      this.rocks.push(image);
    }
    for (let i = 0; i < 22; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const p = this.add.circle(x, y, Math.random() * 1.6 + 0.6, i % 3 ? 0xe0ce91 : 0x95d5bb, Math.random() * 0.55 + 0.15).setDepth(10);
      this.dust.push({ sprite: p, x, y, speed: 3 + Math.random() * 10, phase: Math.random() * Math.PI * 2 });
    }
    this.drawShade(width, height);
    this.drawMandala(width, height, 0);
    this.scale.on('resize', this.handleResize, this);
  }

  handleResize(gameSize) {
    if (!this.floor) return;
    const width = gameSize.width;
    const height = gameSize.height;
    this.floor.setSize(width, height);
    this.hero.setPosition(width / 2, height * 0.585);
    this.heroAura.setPosition(width / 2, height * 0.58);
    this.heroShadow.setPosition(width / 2, height * 0.645);
    this.sun.setPosition(width * 0.19, height * 0.54);
    this.ranged.setPosition(width * 0.81, height * 0.57);
    this.drawShade(width, height);
    this.drawMandala(width, height, this.elapsed || 0);
  }

  drawShade(width, height) {
    this.shade.clear();
    this.shade.fillStyle(0x041012, 0.28).fillRect(0, 0, width, height);
    this.shade.fillGradientStyle(0x041012, 0x041012, 0x041012, 0x041012, 0.34, 0.25, 0.06, 0.72).fillRect(0, 0, width, height);
    this.shade.fillStyle(0x081010, 0.24).fillRect(0, height * 0.76, width, height * 0.24);
  }

  drawMandala(width, height, time) {
    const g = this.mandala;
    g.clear();
    const cx = width * 0.5;
    const cy = height * 0.585;
    g.lineStyle(1, 0xe9c76c, 0.19).strokeCircle(cx, cy, 117 + Math.sin(time / 1200) * 3);
    g.lineStyle(1, 0xd5e0c4, 0.08).strokeCircle(cx, cy, 143);
    g.lineStyle(1, 0xf0c766, 0.15).strokeCircle(cx, cy, 83 + Math.sin(time / 900) * 2);
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6 + time / 5000;
      const inner = i % 3 === 0 ? 97 : 106;
      const outer = i % 3 === 0 ? 130 : 120;
      g.lineStyle(i % 3 === 0 ? 1.2 : 0.7, i % 3 === 0 ? 0xf4d780 : 0xd4e1c6, i % 3 === 0 ? 0.22 : 0.12);
      g.lineBetween(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner, cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    }
    g.fillStyle(0xffd982, 0.5);
    for (let i = 0; i < 4; i++) {
      const a = time / 2800 + i * Math.PI / 2;
      g.fillCircle(cx + Math.cos(a) * 130, cy + Math.sin(a) * 130, 1.7);
    }
  }

  update(time, delta) {
    this.elapsed = time;
    const width = this.scale.width;
    const height = this.scale.height;
    this.drawMandala(width, height, time);
    this.hero.y = height * 0.585 + Math.sin(time / 500) * 3;
    this.heroAura.setScale(1 + Math.sin(time / 780) * 0.035);
    this.heroShadow.setPosition(width / 2, height * 0.645 + Math.sin(time / 500) * 1.2);
    this.hero.setAngle(Math.sin(time / 850) * 1.2);
    this.showcaseBlades.forEach((blade, i) => {
      const angle = time / 1000 * (i % 2 ? -0.62 : 0.62) + i * Math.PI * 2 / 3;
      blade.setPosition(width / 2 + Math.cos(angle) * (91 + i * 4), height * 0.585 + Math.sin(angle) * 66);
      blade.setRotation(angle + Math.PI / 2);
      blade.setAlpha(0.78 + Math.sin(time / 250 + i) * 0.15);
    });
    this.sun.y = height * 0.54 + Math.sin(time / 530 + 1) * 4;
    this.ranged.y = height * 0.57 + Math.sin(time / 710 + 3) * 3;
    this.dust.forEach((p) => {
      p.y -= p.speed * delta / 1000;
      if (p.y < -5) p.y = height + 5;
      p.sprite.setPosition(p.x + Math.sin(time / 1300 + p.phase) * 1.6, p.y);
      p.sprite.setAlpha(0.15 + (Math.sin(time / 400 + p.phase) + 1) * 0.2);
    });
  }
}
