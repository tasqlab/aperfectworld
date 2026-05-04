import { useGameStore } from '../../store/gameStore';
import { useGetOnlinePlayers, getGetOnlinePlayersQueryKey } from '@workspace/api-client-react';

const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 2400;
const MAP_SIZE = 100;

export default function Minimap() {
  const character = useGameStore(s => s.character);
  const token = useGameStore(s => s.token);

  const { data: onlineData } = useGetOnlinePlayers({
    query: {
      enabled: !!token,
      queryKey: getGetOnlinePlayersQueryKey(),
      refetchInterval: 10000,
    }
  });

  if (!character) return null;

  const px = (character.posX / WORLD_WIDTH) * MAP_SIZE;
  const py = (character.posY / WORLD_HEIGHT) * MAP_SIZE;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="text-xs text-primary/70 font-bold tracking-widest uppercase">
        {onlineData ? `${onlineData.count} Online` : 'World Map'}
      </div>
      <div
        className="relative bg-black/80 border border-primary/40 rounded overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.8)]"
        style={{ width: MAP_SIZE, height: MAP_SIZE }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/50 to-slate-950/50" />

        {onlineData?.players.map(p => {
          if (p.characterId === character.id) return null;
          return (
            <div
              key={p.characterId}
              className="absolute w-1 h-1 bg-blue-400 rounded-full"
              style={{
                left: `${(p.characterId % 100) / 100 * MAP_SIZE - 0.5}px`,
                top: `${(p.characterId % 70) / 70 * MAP_SIZE - 0.5}px`,
              }}
            />
          );
        })}

        <div
          className="absolute w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_6px_#fbbf24] -translate-x-1 -translate-y-1"
          style={{ left: px, top: py }}
        />
      </div>
    </div>
  );
}
