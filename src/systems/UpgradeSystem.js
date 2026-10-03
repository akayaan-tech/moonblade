const UPGRADES = [
  { key: 'blade', icon: '☾', name: 'ONE MORE MOON', description: 'Add a crescent blade to your orbit.', tag: 'WEAPON' },
  { key: 'damage', icon: '⚔', name: 'SHARPENED EDGE', description: 'Moon blades deal 20% more damage.', tag: 'DAMAGE' },
  { key: 'speed', icon: '➶', name: 'QUICKFOOT', description: 'Move 15% faster through the dark.', tag: 'MOBILITY' },
  { key: 'orbit', icon: '⟳', name: 'LUNAR RHYTHM', description: 'Orbit 18% faster and hit more often.', tag: 'WEAPON' },
  { key: 'vitality', icon: '✚', name: 'SECOND WIND', description: 'Raise max health by 20 and heal 20.', tag: 'VITALITY' },
  { key: 'critical', icon: '✧', name: 'STAR-CUT', description: 'Gain 8% critical hit chance.', tag: 'PRECISION' },
  { key: 'reach', icon: '◉', name: 'WIDE ORBIT', description: 'Extend blade orbit and attack reach.', tag: 'RANGE' },
  { key: 'magnet', icon: '⌁', name: 'MOON MAGNET', description: 'Pull energy from further away.', tag: 'COLLECT' },
  { key: 'burst', icon: '☄', name: 'MOON BURST', description: 'Unlock a volley of flying crescents.', tag: 'ABILITY', unlock: true },
  { key: 'shield', icon: '◇', name: 'ENERGY VEIL', description: 'Unlock a short-lived damage shield.', tag: 'ABILITY', unlock: true },
];

export function getUpgradeChoices(player) {
  const eligible = UPGRADES.filter((upgrade) => {
    if (upgrade.key === 'blade') return player.weaponCount < 8;
    if (upgrade.key === 'damage') return player.bonusDamage < player.damage * 2.5;
    if (upgrade.key === 'critical') return player.critChance < 0.53;
    if (upgrade.key === 'reach') return player.orbitRadius < 144;
    if (upgrade.key === 'magnet') return player.pickupRadius < 440;
    if (upgrade.key === 'burst') return !player.unlocked.burst;
    if (upgrade.key === 'shield') return !player.unlocked.shield;
    if (upgrade.key === 'orbit') return player.orbitSpeed < 4.4;
    if (upgrade.key === 'speed') return player.speed < 310;
    return true;
  });
  const pool = [...eligible];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  let choices = pool.slice(0, 3);
  if (choices.length < 3) choices = [...choices, ...UPGRADES.filter((x) => !choices.some((y) => y.key === x.key)).slice(0, 3 - choices.length)];
  return choices.map((upgrade) => ({ ...upgrade }));
}

export function applyUpgrade(scene, key) {
  const player = scene.player;
  switch (key) {
    case 'blade':
      player.weaponCount += 1;
      player.bladeSize = Math.min(1.32, player.bladeSize + 0.035);
      scene.weaponSystem.syncCount();
      break;
    case 'damage':
      player.bonusDamage += Math.max(2, Math.round((player.damage + player.bonusDamage) * 0.2));
      player.bladeSize = Math.min(1.3, player.bladeSize + 0.04);
      break;
    case 'speed':
      player.speed *= 1.15;
      break;
    case 'orbit':
      player.orbitSpeed *= 1.18;
      player.attackInterval = Math.max(470, Math.round(player.attackInterval * 0.92));
      break;
    case 'vitality':
      player.maxHp += 20;
      player.heal(20);
      break;
    case 'critical':
      player.critChance = Math.min(0.6, player.critChance + 0.08);
      break;
    case 'reach':
      player.orbitRadius += 13;
      player.attackRadius += 20;
      break;
    case 'magnet':
      player.pickupRadius += 60;
      break;
    case 'burst':
      player.unlocked.burst = true;
      break;
    case 'shield':
      player.unlocked.shield = true;
      break;
  }
  scene.syncHUD(true);
}
