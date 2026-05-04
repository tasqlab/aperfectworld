import { useState } from 'react';
import { useGameStore } from '../../../store/gameStore';
import { X, ShoppingCart, Coins } from 'lucide-react';

interface ShopItem {
  id: number;
  itemKey: string;
  name: string;
  type: string;
  rarity: string;
  price: number;
  attackBonus: number;
  defenseBonus: number;
  hpBonus: number;
  description: string;
  levelRequired: number;
}

const RARITY_COLORS: Record<string, string> = {
  common: 'border-gray-500 text-gray-300',
  uncommon: 'border-green-500 text-green-400',
  rare: 'border-blue-500 text-blue-400',
  epic: 'border-purple-500 text-purple-400',
  legendary: 'border-yellow-500 text-yellow-400',
};

const TYPE_ICONS: Record<string, string> = {
  weapon: '⚔',
  armor: '🛡',
  potion: '⚗',
  material: '◈',
  quest: '★',
};

const DEMO_SHOP_ITEMS: ShopItem[] = [
  { id: 1, itemKey: 'iron_sword', name: 'Iron Sword', type: 'weapon', rarity: 'common', price: 50, attackBonus: 5, defenseBonus: 0, hpBonus: 0, description: 'A basic iron sword', levelRequired: 1 },
  { id: 2, itemKey: 'steel_sword', name: 'Steel Sword', type: 'weapon', rarity: 'uncommon', price: 150, attackBonus: 12, defenseBonus: 0, hpBonus: 0, description: 'A sturdy steel blade', levelRequired: 5 },
  { id: 3, itemKey: 'leather_armor', name: 'Leather Armor', type: 'armor', rarity: 'common', price: 40, attackBonus: 0, defenseBonus: 3, hpBonus: 10, description: 'Basic leather protection', levelRequired: 1 },
  { id: 4, itemKey: 'chainmail', name: 'Chainmail', type: 'armor', rarity: 'uncommon', price: 120, attackBonus: 0, defenseBonus: 8, hpBonus: 25, description: 'Good protection against attacks', levelRequired: 4 },
  { id: 5, itemKey: 'health_potion', name: 'Health Potion', type: 'potion', rarity: 'common', price: 20, attackBonus: 0, defenseBonus: 0, hpBonus: 50, description: 'Restores 50 HP', levelRequired: 1 },
  { id: 6, itemKey: 'mana_potion', name: 'Mana Potion', type: 'potion', rarity: 'common', price: 25, attackBonus: 0, defenseBonus: 0, hpBonus: 0, description: 'Restores 30 MP', levelRequired: 1 },
  { id: 7, itemKey: 'flame_sword', name: 'Flame Sword', type: 'weapon', rarity: 'rare', price: 500, attackBonus: 25, defenseBonus: 2, hpBonus: 15, description: 'A sword engulfed in flames', levelRequired: 10 },
  { id: 8, itemKey: 'dragon_armor', name: 'Dragon Armor', type: 'armor', rarity: 'epic', price: 1000, attackBonus: 5, defenseBonus: 30, hpBonus: 100, description: 'Armor forged from dragon scales', levelRequired: 15 },
];

export default function ShopPanel() {
  const character = useGameStore(s => s.character);
  const toggleShop = useGameStore(s => s.toggleShop);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [buying, setBuying] = useState(false);

  const handleBuy = (item: ShopItem) => {
    if (!character) return;
    if (character.gold < item.price) {
      alert('Not enough gold!');
      return;
    }
    if (character.level < item.levelRequired) {
      alert(`Requires level ${item.levelRequired}`);
      return;
    }
    setSelectedItem(item);
    setBuying(true);
  };

  const confirmBuy = () => {
    if (!selectedItem || !character) return;
    alert(`Bought ${selectedItem.name} for ${selectedItem.price} gold!`);
    setBuying(false);
    setSelectedItem(null);
  };

  return (
    <div className="w-96 bg-card/95 border border-primary/40 rounded-lg shadow-[0_0_25px_rgba(0,0,0,0.9)] backdrop-blur-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-primary/20 bg-black/40">
        <span className="text-primary font-bold tracking-widest uppercase text-sm font-serif flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          Shop
        </span>
        <button onClick={toggleShop} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 mb-3 text-yellow-400">
          <Coins className="w-4 h-4" />
          <span className="text-sm font-bold">{character?.gold ?? 0} Gold</span>
        </div>

        <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
          {DEMO_SHOP_ITEMS.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`relative w-14 h-14 bg-black/60 border-2 rounded cursor-pointer flex items-center justify-center text-lg transition-all
                ${RARITY_COLORS[item.rarity] ?? 'border-gray-600'}
                ${selectedItem?.id === item.id ? 'ring-2 ring-primary' : ''}
                ${character && character.level < item.levelRequired ? 'opacity-50' : ''}
              `}
              title={`${item.name} - ${item.price}g`}
            >
              <span>{TYPE_ICONS[item.type] ?? '?'}</span>
              {character && character.level < item.levelRequired && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[8px] text-red-400">
                  Lv{item.levelRequired}
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedItem && (
          <div className="mt-3 p-3 bg-black/40 border border-primary/20 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className={`font-bold ${RARITY_COLORS[selectedItem.rarity]?.split(' ')[1] || 'text-white'}`}>
                {selectedItem.name}
              </span>
              <span className="text-yellow-400 text-sm">{selectedItem.price}g</span>
            </div>
            <p className="text-gray-400 text-xs mb-2">{selectedItem.description}</p>
            <div className="flex gap-3 text-xs text-gray-300 mb-3">
              {selectedItem.attackBonus > 0 && <span className="text-red-400">ATK +{selectedItem.attackBonus}</span>}
              {selectedItem.defenseBonus > 0 && <span className="text-blue-400">DEF +{selectedItem.defenseBonus}</span>}
              {selectedItem.hpBonus > 0 && <span className="text-green-400">HP +{selectedItem.hpBonus}</span>}
            </div>
            {buying ? (
              <div className="flex gap-2">
                <button
                  onClick={confirmBuy}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 rounded transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setBuying(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-xs py-1.5 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleBuy(selectedItem)}
                disabled={!character || character.gold < selectedItem.price || character.level < selectedItem.levelRequired}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs py-1.5 rounded transition-colors"
              >
                Buy
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
