'use client';

import { useGame } from '@/context/GameContext';
import { CollectionAction } from '@/lib/types';

export default function NonPayerPopup() {
  const { state, dispatch } = useGame();
  const { pendingNonPayer, energy } = state;

  if (!pendingNonPayer) return null;

  const handleAction = (action: CollectionAction) => {
    dispatch({
      type: 'HANDLE_NONPAYER',
      payload: {
        customerId: pendingNonPayer.customerId,
        action,
      },
    });
  };

  const canPressure = energy >= 1;
  const canEnforce = energy >= 2;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-neutral-900 border border-red-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-red-500 text-4xl mb-2">!</div>
          <h2 className="text-xl font-bold text-red-500 mb-2">Problem Customer</h2>
          <p className="text-neutral-300">
            <span className="font-bold text-white">{pendingNonPayer.customerName}</span> won't pay
            the <span className="text-green-400 font-bold">${pendingNonPayer.amount}</span> they owe.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleAction('let_slide')}
            className="w-full p-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-left transition-colors"
          >
            <div className="font-bold text-green-400">Talk to them</div>
            <div className="text-sm text-neutral-400">
              Have a conversation. They'll pay up this time.
            </div>
          </button>

          <button
            onClick={() => handleAction('pressure')}
            disabled={!canPressure}
            className={`w-full p-4 border rounded-lg text-left transition-colors ${
              canPressure
                ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700'
                : 'bg-neutral-900 border-neutral-800 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="font-bold text-yellow-400">
              Put pressure on them
              <span className="ml-2 text-xs text-neutral-500">(1 energy)</span>
            </div>
            <div className="text-sm text-neutral-400">
              80% chance they pay. Small heat increase.
            </div>
          </button>

          <button
            onClick={() => handleAction('enforce')}
            disabled={!canEnforce}
            className={`w-full p-4 border rounded-lg text-left transition-colors ${
              canEnforce
                ? 'bg-neutral-800 hover:bg-red-900/50 border-neutral-700'
                : 'bg-neutral-900 border-neutral-800 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="font-bold text-red-400">
              Rough them up
              <span className="ml-2 text-xs text-neutral-500">(2 energy)</span>
            </div>
            <div className="text-sm text-neutral-400">
              Guaranteed payment. High heat increase.
            </div>
          </button>

          <button
            onClick={() => handleAction('cut_off')}
            className="w-full p-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-left transition-colors"
          >
            <div className="font-bold text-neutral-400">Cut them off</div>
            <div className="text-sm text-neutral-500">
              Write off the debt. They're no longer a customer.
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
