import { useSocket } from '../../hooks/useSocket';
import { useGameStore } from '../../store/gameStore';

export default function DeathOverlay() {
  const character = useGameStore(s => s.character);
  const { socket } = useSocket();

  const handleRespawn = () => {
    socket?.emit('respawn_request');
    socket?.emit('attack', { targetId: -1, targetType: 'respawn' });
  };

  return (
    <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-50 pointer-events-auto backdrop-blur-sm">
      <div className="text-center space-y-6">
        <div className="text-6xl font-black font-serif text-red-600 tracking-widest drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-pulse">
          FALLEN
        </div>
        <div className="text-gray-400 text-lg font-serif italic">
          {character?.name} has been slain...
        </div>
        <div className="text-gray-500 text-sm">
          Kills: {character?.kills ?? 0} &nbsp;|&nbsp; Deaths: {(character?.deaths ?? 0) + 1}
        </div>
        <button
          onClick={handleRespawn}
          className="mt-8 px-10 py-3 bg-primary/90 hover:bg-primary text-black font-black text-lg tracking-widest uppercase rounded-lg shadow-[0_0_20px_rgba(234,179,8,0.5)] hover:shadow-[0_0_30px_rgba(234,179,8,0.8)] transition-all duration-200 border border-yellow-500/50"
        >
          Rise Again
        </button>
        <p className="text-xs text-gray-600 italic">You will respawn at the sanctuary</p>
      </div>
    </div>
  );
}
