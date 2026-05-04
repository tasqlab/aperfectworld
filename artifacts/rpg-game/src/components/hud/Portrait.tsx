import React from 'react';
import { Character } from '@workspace/api-client-react';
import { Sword, Wand2, Shield, Crosshair } from 'lucide-react';

export default function Portrait({ character }: { character: Character }) {
  const classColors: Record<string, string> = {
    warrior: 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] text-red-500',
    mage: 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] text-blue-500',
    archer: 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] text-green-500',
    rogue: 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] text-purple-500'
  };

  const hpPercent = Math.max(0, Math.min(100, (character.hp / character.maxHp) * 100));
  const mpPercent = Math.max(0, Math.min(100, (character.mp / character.maxMp) * 100));
  const xpPercent = Math.max(0, Math.min(100, (character.xp / character.xpToNextLevel) * 100));

  const renderIcon = () => {
    switch (character.class) {
      case 'warrior': return <Sword className="w-8 h-8" />;
      case 'mage': return <Wand2 className="w-8 h-8" />;
      case 'archer': return <Crosshair className="w-8 h-8" />;
      case 'rogue': return <Shield className="w-8 h-8" />;
      default: return <Sword className="w-8 h-8" />;
    }
  };

  return (
    <div className="bg-card/90 border border-primary/30 p-3 rounded-lg backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.8)] flex gap-4 w-[320px]">
      <div className={`relative w-16 h-16 rounded border-2 flex items-center justify-center bg-black/50 ${classColors[character.class]}`}>
        {renderIcon()}
        <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs border border-black z-10">
          {character.level}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center space-y-2">
        <div className="flex justify-between items-baseline mb-1">
          <span className="font-bold text-lg text-primary truncate max-w-[150px]">{character.name}</span>
          <span className="text-xs text-muted-foreground capitalize">{character.class}</span>
        </div>
        
        <div className="space-y-1.5">
          <div className="relative h-3 bg-black/60 rounded border border-white/10 overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-red-600 transition-all duration-300" style={{ width: `${hpPercent}%` }} />
            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white text-shadow-sm">
              HP {Math.max(0, character.hp)} / {character.maxHp}
            </div>
          </div>
          
          <div className="relative h-3 bg-black/60 rounded border border-white/10 overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-blue-600 transition-all duration-300" style={{ width: `${mpPercent}%` }} />
            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white text-shadow-sm">
              MP {character.mp} / {character.maxMp}
            </div>
          </div>
          
          <div className="relative h-2 bg-black/60 rounded border border-white/10 overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-yellow-500 transition-all duration-300 shadow-[0_0_5px_rgba(234,179,8,0.8)]" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
