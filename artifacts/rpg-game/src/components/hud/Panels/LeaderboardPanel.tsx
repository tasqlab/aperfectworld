import { useGetLeaderboard, getGetLeaderboardQueryKey } from '@workspace/api-client-react';
import { useGameStore } from '../../../store/gameStore';
import { X } from 'lucide-react';

const CLASS_ICONS: Record<string, string> = {
  warrior: '⚔',
  mage: '✦',
  archer: '◎',
  rogue: '◈',
};

const RANK_COLORS = ['text-yellow-400', 'text-gray-300', 'text-orange-500'];

export default function LeaderboardPanel() {
  const character = useGameStore(s => s.character);
  const toggleLeaderboard = useGameStore(s => s.toggleLeaderboard);

  const { data, isLoading } = useGetLeaderboard({ limit: 20 }, {
    query: {
      queryKey: getGetLeaderboardQueryKey({ limit: 20 }),
      refetchInterval: 30000,
    }
  });

  return (
    <div className="w-64 bg-card/95 border border-primary/40 rounded-lg shadow-[0_0_25px_rgba(0,0,0,0.9)] backdrop-blur-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-primary/20 bg-black/40">
        <span className="text-primary font-bold tracking-widest uppercase text-sm font-serif">Leaderboard</span>
        <button onClick={toggleLeaderboard} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500 text-xs">Loading...</div>
        ) : !data?.length ? (
          <div className="p-4 text-center text-gray-500 text-xs italic">No champions yet. Be the first!</div>
        ) : (
          <div className="divide-y divide-primary/10">
            {data.map((entry, i) => {
              const isMe = entry.characterId === character?.id;
              const rankColor = RANK_COLORS[i] ?? 'text-gray-400';
              return (
                <div
                  key={entry.characterId}
                  className={`flex items-center gap-2 px-3 py-2 text-xs ${isMe ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-white/5'}`}
                >
                  <span className={`w-5 font-black ${rankColor}`}>
                    {entry.rank <= 3 ? ['◆', '◇', '◉'][entry.rank - 1] : entry.rank}
                  </span>
                  <span className="text-lg leading-none">{CLASS_ICONS[entry.class] ?? '?'}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold truncate ${isMe ? 'text-primary' : 'text-gray-200'}`}>{entry.name}</div>
                    <div className="text-gray-500">{entry.kills} kills · {entry.gold} gold</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-primary text-sm">Lv.{entry.level}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
