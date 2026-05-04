import { useState } from 'react';
import { useGameStore } from '../../../store/gameStore';
import { X, Scroll, CheckCircle, Circle, AlertCircle } from 'lucide-react';

interface Quest {
  id: number;
  title: string;
  description: string;
  type: string;
  giverName: string;
  targetType: string;
  targetCount: number;
  progress: number;
  rewardXp: number;
  rewardGold: number;
  status: 'available' | 'in_progress' | 'completed';
}

const DEMO_QUESTS: Quest[] = [
  { id: 1, title: 'Goblin Slayer', description: 'Defeat 5 goblins in the forest', type: 'story', giverName: 'Village Elder', targetType: 'kill', targetCount: 5, progress: 3, rewardXp: 100, rewardGold: 50, status: 'in_progress' },
  { id: 2, title: 'Herb Gathering', description: 'Collect 10 healing herbs', type: 'side', giverName: 'Herbalist', targetType: 'collect', targetCount: 10, progress: 0, rewardXp: 50, rewardGold: 25, status: 'available' },
  { id: 3, title: 'Skeleton Threat', description: 'Clear the crypt of undead', type: 'story', giverName: 'Guard Captain', targetType: 'kill', targetCount: 10, progress: 10, rewardXp: 200, rewardGold: 100, status: 'completed' },
  { id: 4, title: 'Dragon Hunt', description: 'Slay the ancient dragon', type: 'epic', giverName: 'King', targetType: 'kill', targetCount: 1, progress: 0, rewardXp: 1000, rewardGold: 500, status: 'available' },
];

const TYPE_COLORS: Record<string, string> = {
  story: 'text-yellow-400',
  side: 'text-green-400',
  epic: 'text-purple-400',
  daily: 'text-blue-400',
};

const STATUS_ICONS = {
  available: Circle,
  in_progress: AlertCircle,
  completed: CheckCircle,
};

export default function QuestPanel() {
  const character = useGameStore(s => s.character);
  const toggleQuests = useGameStore(s => s.toggleQuests);
  const [activeTab, setActiveTab] = useState<'active' | 'available'>('active');

  const activeQuests = DEMO_QUESTS.filter(q => q.status === 'in_progress');
  const availableQuests = DEMO_QUESTS.filter(q => q.status === 'available');
  const completedQuests = DEMO_QUESTS.filter(q => q.status === 'completed');

  const handleStartQuest = (questId: number) => {
    alert(`Started quest!`);
  };

  const renderQuest = (quest: Quest) => {
    const StatusIcon = STATUS_ICONS[quest.status];
    const progressPercent = Math.min((quest.progress / quest.targetCount) * 100, 100);

    return (
      <div key={quest.id} className="p-3 bg-black/40 border border-primary/20 rounded mb-2">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-4 h-4 ${quest.status === 'completed' ? 'text-green-400' : quest.status === 'in_progress' ? 'text-yellow-400' : 'text-gray-400'}`} />
            <span className={`font-bold text-sm ${TYPE_COLORS[quest.type] || 'text-white'}`}>{quest.title}</span>
          </div>
          <span className="text-xs text-gray-500">{quest.giverName}</span>
        </div>
        <p className="text-gray-400 text-xs mb-2">{quest.description}</p>
        
        {quest.status === 'in_progress' && (
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>{quest.progress}/{quest.targetCount}</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500 transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-3 text-xs">
            <span className="text-yellow-400">+{quest.rewardXp} XP</span>
            <span className="text-yellow-400">+{quest.rewardGold}g</span>
          </div>
          {quest.status === 'available' && (
            <button
              onClick={() => handleStartQuest(quest.id)}
              className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
            >
              Start
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 bg-card/95 border border-primary/40 rounded-lg shadow-[0_0_25px_rgba(0,0,0,0.9)] backdrop-blur-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-primary/20 bg-black/40">
        <span className="text-primary font-bold tracking-widest uppercase text-sm font-serif flex items-center gap-2">
          <Scroll className="w-4 h-4" />
          Quests
        </span>
        <button onClick={toggleQuests} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex border-b border-primary/20">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2 text-xs font-bold transition-colors ${activeTab === 'active' ? 'text-primary bg-primary/10' : 'text-gray-500 hover:text-white'}`}
        >
          Active ({activeQuests.length})
        </button>
        <button
          onClick={() => setActiveTab('available')}
          className={`flex-1 py-2 text-xs font-bold transition-colors ${activeTab === 'available' ? 'text-primary bg-primary/10' : 'text-gray-500 hover:text-white'}`}
        >
          Available ({availableQuests.length})
        </button>
      </div>

      <div className="p-3 max-h-80 overflow-y-auto">
        {activeTab === 'active' ? (
          activeQuests.length > 0 ? (
            activeQuests.map(renderQuest)
          ) : (
            <div className="text-center text-gray-500 text-sm py-8">No active quests</div>
          )
        ) : (
          availableQuests.length > 0 ? (
            availableQuests.map(renderQuest)
          ) : (
            <div className="text-center text-gray-500 text-sm py-8">No available quests</div>
          )
        )}

        {completedQuests.length > 0 && (
          <div className="mt-4 pt-4 border-t border-primary/20">
            <div className="text-xs text-gray-500 mb-2">Completed ({completedQuests.length})</div>
            {completedQuests.slice(0, 3).map(q => (
              <div key={q.id} className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span>{q.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
