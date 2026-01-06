'use client';

import { useGame } from '@/context/GameContext';
import { Customer, Bet } from '@/lib/types';
import { getCustomerTypeLabel } from '@/lib/customers';

export default function CustomerList() {
  const { state } = useGame();
  const { customers, bets, week, games } = state;

  const activeCustomers = customers.filter((c) => c.isActive);

  const getCustomerBets = (customerId: string): Bet[] => {
    return bets.filter((b) => b.customerId === customerId &&
      games.find((g) => g.id === b.gameId)?.week === week
    );
  };

  const getCustomerPnL = (customerId: string): number => {
    const customerBets = bets.filter((b) => b.customerId === customerId && b.isWin !== undefined);
    return customerBets.reduce((sum, bet) => {
      if (bet.isWin === true) return sum + Math.round(bet.amount * 0.909); // Win at -110
      if (bet.isWin === false) return sum - bet.amount;
      return sum; // Push
    }, 0);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-2 h-full flex flex-col">
      <h2 className="text-xs font-bold mb-1 shrink-0">
        <span className="text-green-500">CUSTOMERS</span>
        <span className="text-neutral-500 text-[10px] ml-2">({activeCustomers.length})</span>
      </h2>

      <div className="space-y-1 flex-1 min-h-0 overflow-y-auto">
        {activeCustomers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            currentBets={getCustomerBets(customer.id)}
            totalPnL={getCustomerPnL(customer.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface CustomerCardProps {
  customer: Customer;
  currentBets: Bet[];
  totalPnL: number;
}

function CustomerCard({ customer, currentBets, totalPnL }: CustomerCardProps) {
  const typeColors: Record<string, string> = {
    square: 'text-blue-400',
    sharp: 'text-purple-400',
    whale: 'text-yellow-400',
    deadbeat: 'text-red-400',
  };

  const weeklyAction = currentBets.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="bg-neutral-800 rounded p-1.5">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xs font-bold">{customer.name}</div>
          <div className={`text-[10px] ${typeColors[customer.type]}`}>
            {getCustomerTypeLabel(customer.type)}
          </div>
        </div>
        <div className="text-right text-[10px]">
          <div className="text-neutral-400">
            ${customer.bankroll.toLocaleString()}
          </div>
          <div className={totalPnL >= 0 ? 'text-red-400' : 'text-green-400'}>
            {totalPnL <= 0 ? '+' : ''}{(-totalPnL).toLocaleString()}
          </div>
        </div>
      </div>

      {currentBets.length > 0 && (
        <div className="mt-1 pt-1 border-t border-neutral-700">
          <div className="text-[10px] text-neutral-500">Wk: ${weeklyAction.toLocaleString()}</div>
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {currentBets.map((bet) => (
              <BetChip key={bet.id} bet={bet} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BetChip({ bet }: { bet: Bet }) {
  const { state } = useGame();
  const game = state.games.find((g) => g.id === bet.gameId);
  if (!game) return null;

  const team = bet.pick === 'home' ? game.homeTeam : game.awayTeam;
  const resultColor = bet.isWin === undefined
    ? 'bg-neutral-700'
    : bet.isWin
    ? 'bg-red-900 border-red-700'
    : 'bg-green-900 border-green-700';

  return (
    <div className={`text-[10px] px-1 py-0.5 rounded ${resultColor} border border-neutral-600`}>
      {team.city} ${bet.amount}
      {bet.isWin !== undefined && (
        <span className="ml-0.5">{bet.isWin ? 'L' : 'W'}</span>
      )}
    </div>
  );
}
