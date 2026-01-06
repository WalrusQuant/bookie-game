'use client';

import { useGame } from '@/context/GameContext';
import { WIN_THRESHOLD } from '@/lib/types';

export default function BankrollDisplay() {
  const { state } = useGame();
  const { bankroll, startingBankroll, energy, maxEnergy, heat } = state;

  const profit = bankroll - startingBankroll;
  const profitPercent = ((profit / startingBankroll) * 100).toFixed(1);
  const progressToWin = Math.min((bankroll / WIN_THRESHOLD) * 100, 100);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`text-lg font-bold ${bankroll >= startingBankroll ? 'text-green-500' : 'text-red-500'}`}>
            ${bankroll.toLocaleString()}
          </div>
          <div className={`text-xs ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {profit >= 0 ? '+' : ''}{profitPercent}%
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5">
            {Array.from({ length: maxEnergy }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i < energy ? 'bg-yellow-500' : 'bg-neutral-700'
                }`}
              />
            ))}
          </div>
          <div className={`text-xs font-bold ${
            heat > 60 ? 'text-red-500' : heat > 30 ? 'text-orange-500' : 'text-blue-500'
          }`}>
            {heat}%
          </div>
        </div>
      </div>
      <div className="h-1 bg-neutral-800 rounded-full overflow-hidden mt-1">
        <div
          className="h-full bg-green-600 transition-all duration-500"
          style={{ width: `${progressToWin}%` }}
        />
      </div>
    </div>
  );
}
