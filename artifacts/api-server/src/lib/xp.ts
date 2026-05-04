export function xpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.4, level - 1));
}

export function calcLevel(totalXp: number): { level: number; xp: number; xpToNext: number } {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpToNextLevel(level)) {
    remaining -= xpToNextLevel(level);
    level++;
  }
  return { level, xp: remaining, xpToNext: xpToNextLevel(level) };
}

export function baseStats(charClass: string, level: number) {
  const base: Record<string, { hp: number; mp: number; attack: number; defense: number; speed: number }> = {
    warrior: { hp: 150, mp: 30, attack: 15, defense: 12, speed: 7 },
    mage:    { hp: 80,  mp: 120, attack: 20, defense: 4, speed: 9 },
    archer:  { hp: 100, mp: 60, attack: 18, defense: 6, speed: 11 },
    rogue:   { hp: 110, mp: 50, attack: 22, defense: 5, speed: 13 },
  };
  const b = base[charClass] ?? base["warrior"]!;
  const lvlMult = 1 + (level - 1) * 0.12;
  return {
    maxHp: Math.floor(b.hp * lvlMult),
    maxMp: Math.floor(b.mp * lvlMult),
    attack: Math.floor(b.attack * lvlMult),
    defense: Math.floor(b.defense * lvlMult),
    speed: b.speed,
  };
}
