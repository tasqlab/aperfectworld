import { create } from 'zustand';
import { Character, InventoryItem } from '@workspace/api-client-react';

interface GameState {
  token: string | null;
  character: Character | null;
  inventory: InventoryItem[];
  onlinePlayersCount: number;
  
  // UI toggles
  showInventory: boolean;
  showStats: boolean;
  showLeaderboard: boolean;

  setToken: (token: string | null) => void;
  setCharacter: (character: Character | null) => void;
  setInventory: (inventory: InventoryItem[]) => void;
  setOnlinePlayersCount: (count: number) => void;
  updateCharacterStats: (stats: Partial<Character>) => void;
  logout: () => void;
  
  toggleInventory: () => void;
  toggleStats: () => void;
  toggleLeaderboard: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  token: localStorage.getItem('rpg_token'),
  character: null,
  inventory: [],
  onlinePlayersCount: 0,
  
  showInventory: false,
  showStats: false,
  showLeaderboard: false,
  
  setToken: (token) => {
    if (token) {
      localStorage.setItem('rpg_token', token);
    } else {
      localStorage.removeItem('rpg_token');
    }
    set({ token });
  },
  
  setCharacter: (character) => set({ character }),
  setInventory: (inventory) => set({ inventory }),
  setOnlinePlayersCount: (onlinePlayersCount) => set({ onlinePlayersCount }),
  
  updateCharacterStats: (stats) => 
    set((state) => ({ 
      character: state.character ? { ...state.character, ...stats } : null 
    })),
    
  logout: () => {
    localStorage.removeItem('rpg_token');
    set({ token: null, character: null, inventory: [] });
  },

  toggleInventory: () => set((state) => ({ showInventory: !state.showInventory })),
  toggleStats: () => set((state) => ({ showStats: !state.showStats })),
  toggleLeaderboard: () => set((state) => ({ showLeaderboard: !state.showLeaderboard })),
}));
