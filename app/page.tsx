'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/context/GameContext';

export default function Home() {
  const router = useRouter();
  const { dispatch, hasSavedGame } = useGame();
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    setShowContinue(hasSavedGame());
  }, [hasSavedGame]);

  const handleNewGame = () => {
    dispatch({ type: 'NEW_GAME' });
    router.push('/game');
  };

  const handleContinue = () => {
    router.push('/game');
  };

  const handleClearGame = () => {
    if (confirm('Are you sure you want to delete your saved game? This cannot be undone.')) {
      localStorage.removeItem('bookie-game-state');
      setShowContinue(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <div className="max-w-2xl w-full text-center">
        {/* ASCII Art Title */}
        <pre className="text-green-500 text-xs sm:text-sm mb-8 font-mono leading-tight">
{`
 ██████╗  ██████╗  ██████╗ ██╗  ██╗██╗███████╗
 ██╔══██╗██╔═══██╗██╔═══██╗██║ ██╔╝██║██╔════╝
 ██████╔╝██║   ██║██║   ██║█████╔╝ ██║█████╗
 ██╔══██╗██║   ██║██║   ██║██╔═██╗ ██║██╔══╝
 ██████╔╝╚██████╔╝╚██████╔╝██║  ██╗██║███████╗
 ╚═════╝  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝╚══════╝
`}
        </pre>

        <p className="text-neutral-400 mb-12 text-sm">
          Run your own sports book. Set lines, take bets, manage risk, and collect debts.
          <br />
          Build your bankroll to $100,000 to win. Go bust and it's game over.
        </p>

        <div className="flex flex-col gap-4 max-w-xs mx-auto">
          {showContinue && (
            <button
              onClick={handleContinue}
              className="px-8 py-4 bg-green-600 hover:bg-green-500 text-black font-bold rounded transition-colors"
            >
              CONTINUE GAME
            </button>
          )}

          <button
            onClick={handleNewGame}
            className={`px-8 py-4 ${
              showContinue
                ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
                : 'bg-green-600 hover:bg-green-500 text-black'
            } font-bold rounded transition-colors`}
          >
            NEW GAME
          </button>

          {showContinue && (
            <button
              onClick={handleClearGame}
              className="px-8 py-2 text-neutral-500 hover:text-red-500 text-sm transition-colors"
            >
              Delete Saved Game
            </button>
          )}
        </div>

        <div className="mt-16 text-neutral-500 text-xs">
          <p className="mb-4">HOW TO PLAY:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-lg mx-auto">
            <div className="bg-neutral-900 p-3 rounded">
              <span className="text-green-500">1.</span> Set betting lines for each game
            </div>
            <div className="bg-neutral-900 p-3 rounded">
              <span className="text-green-500">2.</span> Customers place their bets
            </div>
            <div className="bg-neutral-900 p-3 rounded">
              <span className="text-green-500">3.</span> Watch games play out
            </div>
            <div className="bg-neutral-900 p-3 rounded">
              <span className="text-green-500">4.</span> Collect debts from deadbeats
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
