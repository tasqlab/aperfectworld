import { useGameStore } from '../../../store/gameStore';
import { X } from 'lucide-react';

export default function StatsPanel() {
  const character = useGameStore(s => s.character);
  const toggleStats = useGameStore(s => s.toggleStats);

  if (!character) return null;

  const stats = [
    { label: 'ATK', value: character.attack, color: 'text-red-400' },
    { label: 'DEF', value: character.defense, color: 'text-blue-400' },
    { label: 'SPD', value: character.speed, color: 'text-green-400' },
    { label: 'HP', value: `${character.hp}/${character.maxHp}`, color: 'text-red-300' },
    { label: 'MP', value: `${character.mp}/${character.maxMp}`, color: 'text-blue-300' },
  ];

  const CLASS_BADGES: Record<string, { label: string; color: string }> = {
    warrior: { label: 'Warrior', color: 'bg-red-900/50 text-red-400 border-red-700' },
    mage: { label: 'Mage', color: 'bg-blue-900/50 text-blue-400 border-blue-700' },
    archer: { label: 'Archer', color: 'bg-green-900/50 text-green-400 border-green-700' },
    rogue: { label: 'Rogue', color: 'bg-purple-900/50 text-purple-400 border-purple-700' },
  };

  const badge = CLASS_BADGES[character.class] ?? CLASS_BADGES['warrior']!;

  return (
    <div className="w-64 bg-card/95 border border-primary/40 rounded-lg shadow-[0_0_25px_rgba(0,0,0,0.9)] backdrop-blur-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-primary/20 bg-black/40">
        <span className="text-primary font-bold tracking-widest uppercase text-sm font-serif">Character</span>
        <button onClick={toggleStats} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-primary">{character.name}</div>
            <div className={`text-xs px-2 py-0.5 rounded border inline-block mt-1 ${badge.color}`}>{badge.label}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-primary">{character.level}</div>
            <div className="text-xs text-gray-500">Level</div>
          </div>
        </div>

        <div className="space-y-1.5">
          {stats.map(s => (
            <div key={s.label} className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-bold tracking-wider">{s.label}</span>
              <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-primary/10 pt-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Gold</span>
            <span className="text-yellow-400 font-bold">{character.gold.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Kills</span>
            <span className="text-red-400 font-bold">{character.kills}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Deaths</span>
            <span className="text-gray-400">{character.deaths}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">K/D Ratio</span>
            <span className="text-green-400 font-bold">
              {character.deaths === 0 ? character.kills : (character.kills / character.deaths).toFixed(1)}
            </span>
          </div>
        </div>

        <div className="border-t border-primary/10 pt-2">
          <div className="text-xs text-gray-500 mb-1">XP Progress</div>
          <div className="relative h-2 bg-black/60 rounded overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-yellow-500 transition-all"
              style={{ width: `${Math.min(100, (character.xp / character.xpToNextLevel) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-0.5">
            <span>{character.xp}</span>
            <span>{character.xpToNextLevel} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
