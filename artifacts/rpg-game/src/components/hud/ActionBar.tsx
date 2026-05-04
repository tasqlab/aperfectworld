import React from 'react';
import { useGameStore } from '../../store/gameStore';

export default function ActionBar() {
  const isDead = useGameStore(s => (s.character?.hp ?? 1) <= 0);

  const slots = [
    { key: '1', type: 'attack', icon: '⚔', label: 'Attack [SPACE]' },
    { key: '2', type: 'ability', icon: 'I', label: 'Inventory [I]' },
    { key: '3', type: 'ability', icon: 'C', label: 'Character [C]' },
    { key: '4', type: 'item', icon: 'L', label: 'Leaderboard [L]' },
  ];

  return (
    <div className={`flex gap-2 p-2 bg-card/80 border border-primary/30 rounded-lg backdrop-blur-sm shadow-[0_0_20px_rgba(0,0,0,0.8)] ${isDead ? 'opacity-50 pointer-events-none' : ''}`}>
      {slots.map((slot) => (
        <div key={slot.key} className="relative group cursor-pointer">
          <div className="w-12 h-12 bg-black/60 border border-primary/40 rounded flex items-center justify-center text-xl hover:border-primary transition-colors hover:bg-black/40 shadow-inner">
            {slot.icon}
          </div>
          <div className="absolute -top-2 -left-2 w-5 h-5 bg-background border border-primary text-primary text-[10px] rounded-sm flex items-center justify-center font-bold">
            {slot.key}
          </div>
          
          {/* Tooltip */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 border border-primary/50 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {slot.label}
          </div>
        </div>
      ))}
    </div>
  );
}
