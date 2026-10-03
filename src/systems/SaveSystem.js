const STORAGE_KEY = 'moonblade-arena-save-v1';

const DEFAULTS = {
  bestScore: 0,
  totalCoins: 0,
  runs: 0,
  totalKills: 0,
  selectedCharacter: 'kael',
  settings: { sound: true, music: false, shake: true },
  upgrades: { vitality: 0, edge: 0, magnet: 0 },
};

function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULTS));
}

function safeInt(value, min = 0, max = 1_000_000_000) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.floor(number)));
}

class SaveSystem {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return cloneDefaults();
      return {
        ...DEFAULTS,
        bestScore: safeInt(parsed.bestScore),
        totalCoins: safeInt(parsed.totalCoins),
        runs: safeInt(parsed.runs),
        totalKills: safeInt(parsed.totalKills),
        selectedCharacter: 'kael',
        settings: {
          sound: parsed.settings?.sound !== false,
          music: parsed.settings?.music === true,
          shake: parsed.settings?.shake !== false,
        },
        upgrades: {
          vitality: safeInt(parsed.upgrades?.vitality, 0, 5),
          edge: safeInt(parsed.upgrades?.edge, 0, 5),
          magnet: safeInt(parsed.upgrades?.magnet, 0, 5),
        },
      };
    } catch {
      return cloneDefaults();
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Private browsing or a full storage quota should never prevent a run.
    }
  }

  get snapshot() {
    return JSON.parse(JSON.stringify(this.data));
  }

  addCoins(amount = 1) {
    this.data.totalCoins = safeInt(this.data.totalCoins + amount);
    this.save();
    return this.data.totalCoins;
  }

  recordRun({ score = 0, kills = 0 } = {}) {
    const wasBest = score > this.data.bestScore;
    this.data.bestScore = Math.max(this.data.bestScore, safeInt(score));
    this.data.totalKills = safeInt(this.data.totalKills + kills);
    this.data.runs = safeInt(this.data.runs + 1);
    this.save();
    return { wasBest, bestScore: this.data.bestScore };
  }

  setSetting(key, value) {
    if (!Object.hasOwn(this.data.settings, key)) return;
    this.data.settings[key] = Boolean(value);
    this.save();
  }

  purchase(key) {
    const costs = { vitality: 30, edge: 40, magnet: 25 };
    const maxLevels = 5;
    const current = this.data.upgrades[key];
    if (!Object.hasOwn(costs, key) || current >= maxLevels) return { ok: false, reason: 'max' };
    const price = costs[key] * (current + 1);
    if (this.data.totalCoins < price) return { ok: false, reason: 'coins', price };
    this.data.totalCoins -= price;
    this.data.upgrades[key] += 1;
    this.save();
    return { ok: true, price, level: this.data.upgrades[key] };
  }
}

export const Save = new SaveSystem();
