'use client';

import { useGame } from '@/context/GameContext';

export default function GameLog() {
  const { state } = useGame();
  const { log } = state;

  // Show only recent logs (last 50 for sidebar), reversed so newest is on top
  const recentLogs = log.slice(-50).reverse();

  const typeColors: Record<string, string> = {
    info: 'text-neutral-400',
    win: 'text-green-500',
    loss: 'text-red-500',
    warning: 'text-yellow-500',
    danger: 'text-red-600',
    news: 'text-blue-400',
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-neutral-800">
        <h2 className="text-xs font-bold uppercase tracking-wide text-green-500">Log</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs">
        {recentLogs.map((entry) => (
          <div key={entry.id} className={`${typeColors[entry.type]} leading-tight`}>
            <span className="text-neutral-600">[{entry.week}.{entry.day}]</span>{' '}
            {entry.message}
          </div>
        ))}
      </div>
    </div>
  );
}
