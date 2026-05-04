import { useRef, useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';

export default function Chat() {
  const { messages, sendChat, connected } = useSocket();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const msg = input.trim();
    if (!msg) return;
    sendChat(msg);
    setInput('');
  };

  return (
    <div className="w-80 flex flex-col bg-black/70 border border-primary/30 rounded-lg backdrop-blur-sm overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.8)]">
      <div className="px-3 py-1.5 border-b border-primary/20 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_4px_#22c55e]' : 'bg-red-500'}`} />
        <span className="text-xs font-bold text-primary/80 tracking-widest uppercase">World Chat</span>
      </div>

      <div className="h-32 overflow-y-auto px-2 py-1 space-y-0.5 scrollbar-thin">
        {messages.map((m) => (
          <div key={m.id} className="text-xs leading-relaxed">
            {m.type === 'system' ? (
              <span className="text-yellow-400 italic">{m.message}</span>
            ) : (
              <>
                <span className="text-primary font-bold">{m.from}: </span>
                <span className="text-gray-300">{m.message}</span>
              </>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex border-t border-primary/20">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Press Enter to chat..."
          maxLength={200}
          className="flex-1 bg-transparent px-2 py-1.5 text-xs text-white placeholder-gray-600 outline-none"
        />
        <button
          onClick={handleSend}
          className="px-3 text-primary/70 hover:text-primary text-xs font-bold transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
