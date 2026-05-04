import { useState } from 'react';
import { useGameStore } from '../../../store/gameStore';
import { useRemoveInventoryItem, getGetInventoryQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { InventoryItem } from '@workspace/api-client-react';
import { X } from 'lucide-react';

const RARITY_COLORS: Record<string, string> = {
  common: 'border-gray-500 text-gray-300',
  uncommon: 'border-green-500 text-green-400',
  rare: 'border-blue-500 text-blue-400',
  epic: 'border-purple-500 text-purple-400',
  legendary: 'border-yellow-500 text-yellow-400 shadow-[0_0_6px_rgba(234,179,8,0.5)]',
};

const TYPE_ICONS: Record<string, string> = {
  weapon: '⚔',
  armor: '🛡',
  potion: '⚗',
  material: '◈',
  quest: '★',
};

export default function InventoryPanel() {
  const character = useGameStore(s => s.character);
  const inventory = useGameStore(s => s.inventory);
  const toggleInventory = useGameStore(s => s.toggleInventory);
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const queryClient = useQueryClient();

  const removeMutation = useRemoveInventoryItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey(character?.id ?? 0) });
        setSelected(null);
      },
    },
  });

  const handleDrop = (item: InventoryItem) => {
    if (!character) return;
    removeMutation.mutate({ characterId: character.id, itemId: item.id });
  };

  const GRID_SIZE = 40;
  const slots = Array.from({ length: GRID_SIZE });

  return (
    <div className="w-80 bg-card/95 border border-primary/40 rounded-lg shadow-[0_0_25px_rgba(0,0,0,0.9)] backdrop-blur-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-primary/20 bg-black/40">
        <span className="text-primary font-bold tracking-widest uppercase text-sm font-serif">Inventory</span>
        <button onClick={toggleInventory} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-8 gap-1 mb-3">
          {slots.map((_, i) => {
            const item = inventory[i];
            return (
              <div
                key={i}
                onClick={() => setSelected(item ?? null)}
                className={`relative w-8 h-8 bg-black/60 border rounded cursor-pointer flex items-center justify-center text-sm transition-all
                  ${item ? (RARITY_COLORS[item.rarity] ?? 'border-gray-600') : 'border-gray-800 hover:border-gray-600'}
                  ${selected?.id === item?.id ? 'ring-1 ring-primary' : ''}
                  ${item?.equipped ? 'bg-primary/10' : ''}
                `}
                title={item?.name}
              >
                {item && (
                  <>
                    <span className="text-xs">{TYPE_ICONS[item.type] ?? '?'}</span>
                    {item.equipped && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full" />
                    )}
                    {item.quantity > 1 && (
                      <span className="absolute -bottom-1 -right-1 text-[8px] bg-black text-white px-0.5 rounded">
                        {item.quantity}
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {selected ? (
          <div className={`p-3 rounded border ${RARITY_COLORS[selected.rarity] ?? 'border-gray-600'} bg-black/40 space-y-2`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-sm">{selected.name}</div>
                <div className="text-xs text-gray-400 capitalize">{selected.rarity} {selected.type}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-gray-400">
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="text-xs text-gray-400">{selected.description}</div>
            <div className="flex gap-3 text-xs">
              {selected.attackBonus > 0 && <span className="text-red-400">+{selected.attackBonus} ATK</span>}
              {selected.defenseBonus > 0 && <span className="text-blue-400">+{selected.defenseBonus} DEF</span>}
              {selected.hpBonus > 0 && <span className="text-green-400">+{selected.hpBonus} HP</span>}
            </div>
            <button
              onClick={() => handleDrop(selected)}
              className="w-full text-xs py-1 border border-red-800/50 text-red-500 hover:bg-red-900/20 rounded transition-colors"
              disabled={removeMutation.isPending}
            >
              Drop Item
            </button>
          </div>
        ) : (
          <div className="text-xs text-gray-600 text-center py-2 italic">
            {inventory.length === 0
              ? 'Your inventory is empty. Defeat monsters to collect items!'
              : 'Click an item to inspect it'}
          </div>
        )}
      </div>
    </div>
  );
}
