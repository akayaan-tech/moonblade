export const GAME = Object.freeze({
  width: 540,
  height: 960,
  worldWidth: 3000,
  worldHeight: 3000,
  worldMargin: 118,
  maxEnemies: 78,
  maxProjectiles: 90,
  initialSpawnMs: 1250,
  minimumSpawnMs: 430,
  bossFirstMs: 120_000,
  bossRepeatMs: 180_000,
  ability: {
    vortex: { cooldown: 15_000, damage: 40, radius: 160, duration: 1_500 },
    burst: { cooldown: 18_000, damage: 20, count: 10, speed: 440 },
    shield: { cooldown: 24_000, duration: 4_500 },
  },
  scoring: { second: 7, kill: 25, level: 100 },
});

export const PLAYER_BASE = Object.freeze({
  hp: 100,
  speed: 180,
  damage: 10,
  attackInterval: 1000,
  weaponCount: 3,
  orbitRadius: 70,
  orbitSpeed: 1.9,
  attackRadius: 130,
  critChance: 0.05,
  pickupRadius: 172,
});

export const ENEMY_BASE = Object.freeze({
  slime: { hp: 20, speed: 66, damage: 7, radius: 17, xp: 6, score: 25 },
  sun: { hp: 56, speed: 48, damage: 12, radius: 25, xp: 12, score: 55 },
  ranged: { hp: 34, speed: 54, damage: 8, radius: 18, xp: 10, score: 45 },
  elite: { hp: 112, speed: 70, damage: 16, radius: 28, xp: 22, score: 120 },
  boss: { hp: 720, speed: 46, damage: 22, radius: 62, xp: 110, score: 1200 },
});

export const COLORS = Object.freeze({
  ink: 0x091315,
  grass: 0x172d25,
  deep: 0x0b1719,
  gold: 0xffcf61,
  moon: 0xffe9a2,
  red: 0xff4b63,
  teal: 0x62e7d3,
});

export function formatClock(ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function formatScore(score) {
  return Math.max(0, Math.floor(score)).toLocaleString('en-US').padStart(6, '0');
}
