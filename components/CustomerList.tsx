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
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <h2 className="text-lg font-bold mb-4">
        <span className="text-green-500">CUSTOMERS</span>
        <span className="text-neutral-500 text-sm ml-2">({activeCustomers.length} active)</span>
      </h2>

      <div className="space-y-2 max-h-[940px] overflow-y-auto">
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
    <div className="bg-neutral-800 rounded p-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-bold">{customer.name}</div>
          <div className={`text-xs ${typeColors[customer.type]}`}>
            {getCustomerTypeLabel(customer.type)}
          </div>
        </div>
        <div className="text-right text-sm">
          <div className="text-neutral-400">
            Bankroll: ${customer.bankroll.toLocaleString()}
          </div>
          <div className={totalPnL >= 0 ? 'text-red-400' : 'text-green-400'}>
            {/* From bookie perspective: customer winning is bad */}
            Your P&L: {totalPnL <= 0 ? '+' : ''}{(-totalPnL).toLocaleString()}
          </div>
        </div>
      </div>

      {currentBets.length > 0 && (
        <div className="mt-2 pt-2 border-t border-neutral-700">
          <div className="text-xs text-neutral-500 mb-1">This week's action: ${weeklyAction.toLocaleString()}</div>
          <div className="flex flex-wrap gap-1">
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
    <div className={`text-xs px-2 py-1 rounded ${resultColor} border border-neutral-600`}>
      {team.city} ${bet.amount}
      {bet.isWin !== undefined && (
        <span className="ml-1">
          {bet.isWin ? '(L)' : '(W)'}
        </span>
      )}
    </div>
  );
}
