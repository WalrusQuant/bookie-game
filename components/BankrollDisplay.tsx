'use client';

import { useGame } from '@/context/GameContext';
import { WIN_THRESHOLD } from '@/lib/types';

export default function BankrollDisplay() {
  const { state } = useGame();
  const { bankroll, week, startingBankroll, energy, maxEnergy, heat } = state;

  const profit = bankroll - startingBankroll;
  const profitPercent = ((profit / startingBankroll) * 100).toFixed(1);
  const progressToWin = Math.min((bankroll / WIN_THRESHOLD) * 100, 100);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-neutral-500 text-xs uppercase tracking-wide">Week {week}</div>
          <div className={`text-2xl font-bold ${bankroll >= startingBankroll ? 'text-green-500' : 'text-red-500'}`}>
            ${bankroll.toLocaleString()}
          </div>
        </div>
        <div className="flex gap-6">
          {/* Energy */}
          <div className="text-center">
            <div className="text-yellow-500 text-xs uppercase tracking-wide">Energy</div>
            <div className="flex gap-1 mt-1">
              {Array.from({ length: maxEnergy }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < energy ? 'bg-yellow-500' : 'bg-neutral-700'
                  }`}
                />
              ))}
            </div>
          </div>
          {/* Heat */}
          <div className="text-center">
            <div className={`text-xs uppercase tracking-wide ${
              heat > 60 ? 'text-red-500' : heat > 30 ? 'text-orange-500' : 'text-blue-500'
            }`}>
              Heat
            </div>
            <div className="text-lg font-bold mt-0.5">{heat}%</div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-neutral-500 mb-1">
          <span>Progress to $100k</span>
          <span>{progressToWin.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 transition-all duration-500"
            style={{ width: `${progressToWin}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between text-sm">
        <div>
          <span className="text-neutral-500">P&L: </span>
          <span className={profit >= 0 ? 'text-green-500' : 'text-red-500'}>
            {profit >= 0 ? '+' : ''}${profit.toLocaleString()} ({profit >= 0 ? '+' : ''}{profitPercent}%)
          </span>
        </div>
      </div>
    </div>
  );
}
