import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useGetMe, getGetMeQueryKey, useGetInventory, getGetInventoryQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useGameStore } from '../../store/gameStore';
import { useSocket } from '../../hooks/useSocket';

import PhaserGame from '../../game/PhaserGame';
import Portrait from '../../components/hud/Portrait';
import ActionBar from '../../components/hud/ActionBar';
import Chat from '../../components/hud/Chat';
import InventoryPanel from '../../components/hud/Panels/InventoryPanel';
import StatsPanel from '../../components/hud/Panels/StatsPanel';
import LeaderboardPanel from '../../components/hud/Panels/LeaderboardPanel';
import ShopPanel from '../../components/hud/Panels/ShopPanel';
import QuestPanel from '../../components/hud/Panels/QuestPanel';
import DeathOverlay from '../../components/hud/DeathOverlay';
import Minimap from '../../components/hud/Minimap';

export default function GamePage() {
  const [, setLocation] = useLocation();
  const token = useGameStore(s => s.token);
  const character = useGameStore(s => s.character);
  const setCharacter = useGameStore(s => s.setCharacter);
  const setInventory = useGameStore(s => s.setInventory);
  
  const toggleInventory = useGameStore(s => s.toggleInventory);
  const toggleStats = useGameStore(s => s.toggleStats);
  const toggleLeaderboard = useGameStore(s => s.toggleLeaderboard);
  const toggleShop = useGameStore(s => s.toggleShop);
  const toggleQuests = useGameStore(s => s.toggleQuests);
  const showInventory = useGameStore(s => s.showInventory);
  const showStats = useGameStore(s => s.showStats);
  const showLeaderboard = useGameStore(s => s.showLeaderboard);
  const showShop = useGameStore(s => s.showShop);
  const showQuests = useGameStore(s => s.showQuests);

  const queryClient = useQueryClient();
  const { connected, socket } = useSocket();

  const { data: authData, isLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: getGetMeQueryKey(),
      retry: false,
    }
  });

  const { data: inventoryData } = useGetInventory(character?.id || 0, {
    query: {
      enabled: !!character?.id,
      queryKey: getGetInventoryQueryKey(character?.id || 0),
    }
  });

  useEffect(() => {
    if (!token || error) {
      setLocation('/');
    }
  }, [token, error, setLocation]);

  useEffect(() => {
    if (authData?.character) {
      setCharacter(authData.character);
    }
  }, [authData, setCharacter]);

  useEffect(() => {
    if (inventoryData) {
      setInventory(inventoryData);
    }
  }, [inventoryData, setInventory]);

  // Keyboard shortcuts for panels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in chat or input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      switch (e.key.toLowerCase()) {
        case 'i':
          toggleInventory();
          break;
        case 'c':
          toggleStats();
          break;
        case 'l':
          toggleLeaderboard();
          break;
        case 'b':
          toggleShop();
          break;
        case 'q':
          toggleQuests();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleInventory, toggleStats, toggleLeaderboard, toggleShop, toggleQuests]);

  if (!token) return null;
  if (isLoading || !authData || !character) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary font-serif animate-pulse text-2xl tracking-widest flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          Summoning World...
        </div>
      </div>
    );
  }

  const isDead = character.hp <= 0;

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden select-none">
      <div className="absolute inset-0 w-full h-full" id="phaser-container">
        <PhaserGame character={character} socket={socket} />
      </div>
      
      <div className="absolute inset-0 pointer-events-none z-10 p-4">
        <div className="pointer-events-auto absolute top-4 left-4">
          <Portrait character={character} />
        </div>

        <div className="pointer-events-auto absolute top-4 right-4 flex flex-col items-end gap-2">
          <Minimap />
        </div>

        <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2">
          <ActionBar />
        </div>

        <div className="pointer-events-auto absolute bottom-4 left-4 w-80">
          <Chat />
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-full h-full max-w-7xl max-h-[900px] pointer-events-none">
             {showInventory && (
               <div className="absolute bottom-20 right-4 pointer-events-auto">
                 <InventoryPanel />
               </div>
             )}
             {showStats && (
               <div className="absolute bottom-20 left-4 pointer-events-auto">
                 <StatsPanel />
               </div>
             )}
             {showLeaderboard && (
               <div className="absolute top-20 right-4 pointer-events-auto">
                 <LeaderboardPanel />
               </div>
             )}
             {showShop && (
               <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-auto">
                 <ShopPanel />
               </div>
             )}
             {showQuests && (
               <div className="absolute top-20 left-4 pointer-events-auto">
                 <QuestPanel />
               </div>
             )}
          </div>
        </div>

        {isDead && (
           <DeathOverlay />
        )}
      </div>
    </div>
  );
}
