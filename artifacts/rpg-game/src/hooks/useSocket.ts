import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';

type Message = {
  from: string;
  message: string;
  type: 'system' | 'player';
  id: string;
};

export const useSocket = () => {
  const socket = useRef<Socket | null>(null);
  const token = useGameStore((s) => s.token);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const updateStats = useGameStore((s) => s.updateCharacterStats);

  useEffect(() => {
    if (!token) return;

    // Connect to same origin
    socket.current = io(window.location.origin, {
      path: '/socket.io',
    });

    socket.current.on('connect', () => {
      setConnected(true);
      socket.current?.emit('join', { token });
    });

    socket.current.on('disconnect', () => {
      setConnected(false);
    });

    socket.current.on('chat_message', (data: Omit<Message, 'id'>) => {
      setMessages((prev) => [...prev.slice(-49), { ...data, id: Math.random().toString(36).substr(2, 9) }]);
    });

    socket.current.on('xp_gained', (data: { amount: number, newXp: number, newLevel: number, leveledUp: boolean }) => {
      updateStats({ xp: data.newXp, level: data.newLevel });
      if (data.leveledUp) {
        setMessages((prev) => [...prev.slice(-49), { 
          from: 'System', 
          message: `You leveled up to level ${data.newLevel}!`, 
          type: 'system', 
          id: Math.random().toString(36).substr(2, 9) 
        }]);
      }
    });

    socket.current.on('level_up', (data: { newLevel: number, statBoosts: any }) => {
       updateStats({ level: data.newLevel });
    });

    socket.current.on('respawn', (data: { x: number, y: number, hp: number, mp: number }) => {
      updateStats({ hp: data.hp, mp: data.mp, posX: data.x, posY: data.y });
    });

    return () => {
      socket.current?.disconnect();
    };
  }, [token, updateStats]);

  const sendChat = (message: string) => {
    if (!socket.current || !connected) return;
    socket.current.emit('chat', { message });
  };

  return {
    socket: socket.current,
    connected,
    messages,
    sendChat,
  };
};
