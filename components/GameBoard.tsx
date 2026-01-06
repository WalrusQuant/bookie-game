'use client';

import { useGame } from '@/context/GameContext';
import { GAME_DAY } from '@/lib/types';
import BankrollDisplay from './BankrollDisplay';
import WeeklyGames from './WeeklyGames';
import CustomerList from './CustomerList';
import GameLog from './GameLog';
import MissionPanel from './MissionPanel';
import NewsPanel from './NewsPanel';
import NonPayerPopup from './NonPayerPopup';

export default function GameBoard() {
  const { state, dispatch, isHydrated } = useGame();

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-green-500 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (state.isGameOver) {
    return <GameOverScreen reason={state.gameOverReason} onNewGame={() => dispatch({ type: 'NEW_GAME' })} />;
  }

  const { day, week } = state;
  const isGameDay = day === GAME_DAY;
  const gamesPlayed = state.games.some(g => g.week === week && g.isComplete);

  const handleNewGame = () => {
    if (confirm('Are you sure you want to start a new game? Your current progress will be lost.')) {
      dispatch({ type: 'NEW_GAME' });
    }
  };

  const handleExitGame = () => {
    if (confirm('Are you sure you want to exit? Your game is auto-saved.')) {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar with game controls */}
      <header className="bg-neutral-900 border-b border-neutral-800 px-4 py-2 flex justify-between items-center">
        <h1 className="text-xl font-bold text-green-500">BOOKIE</h1>
        <div className="flex gap-2">
          <button
            onClick={handleNewGame}
            className="px-3 py-1 text-sm bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded transition-colors"
          >
            New Game
          </button>
          <button
            onClick={handleExitGame}
            className="px-3 py-1 text-sm bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded transition-colors"
          >
            Exit
          </button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar: Log (always visible) */}
        <aside className="w-80 bg-neutral-900 border-r border-neutral-800 flex flex-col">
          <GameLog />
        </aside>

        {/* Center: Main game content */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Stats bar */}
            <BankrollDisplay />

            {/* Day indicator */}
            <DayIndicator week={week} day={day} actionsToday={state.actionsToday} />

            {/* News Panel */}
            <NewsPanel />

            {/* Games - always can edit lines (it's free) except on game day */}
            <WeeklyGames canEdit={!isGameDay && !gamesPlayed} />

            {/* Game Day Actions */}
            {isGameDay && !gamesPlayed && (
              <div className="text-center">
                <button
                  onClick={() => dispatch({ type: 'SIMULATE_GAMES' })}
                  className="px-8 py-4 bg-green-600 hover:bg-green-500 text-black font-bold rounded text-lg transition-colors"
                >
                  PLAY GAMES
                </button>
              </div>
            )}

            {/* End Week button (only on game day after games played) */}
            {isGameDay && gamesPlayed && (
              <div className="text-center pb-4">
                <button
                  onClick={() => dispatch({ type: 'END_DAY' })}
                  className="px-6 py-3 bg-green-600 hover:bg-green-500 text-black font-bold rounded transition-colors"
                >
                  END WEEK
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Right sidebar: Missions & Customers */}
        <aside className="w-96 bg-neutral-900 border-l border-neutral-800 overflow-y-auto p-4 space-y-4">
          {/* Rest & End Day button */}
          {!isGameDay && (
            <button
              onClick={() => dispatch({ type: 'END_DAY' })}
              className="w-full p-4 bg-green-600 hover:bg-green-500 text-black font-bold rounded transition-colors text-center"
            >
              REST & END DAY
            </button>
          )}

          {/* Missions */}
          {!isGameDay && <MissionPanel />}

          <CustomerList />
        </aside>
      </div>

      {/* Non-payer popup */}
      <NonPayerPopup />
    </div>
  );
}

function DayIndicator({ week, day, actionsToday }: { week: number; day: number; actionsToday: number }) {
  const dayNames = ['', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const isGameDay = day === GAME_DAY;

  return (
    <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <div className="flex items-center gap-4">
        <div className="text-2xl font-bold">
          Week {week}, {dayNames[day]}
        </div>
        <div className="text-neutral-400 text-sm">
          {actionsToday} action{actionsToday !== 1 ? 's' : ''} today
        </div>
      </div>

      <div className="flex gap-2">
        {isGameDay && (
          <span className="px-3 py-1 bg-red-600 text-white text-sm rounded">
            GAME DAY
          </span>
        )}
      </div>
    </div>
  );
}

function GameOverScreen({ reason, onNewGame }: { reason?: string; onNewGame: () => void }) {
  const isWin = reason?.includes('made it');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className={`text-6xl mb-4 ${isWin ? 'text-green-500' : 'text-red-500'}`}>
          {isWin ? '$$$$' : 'BUST'}
        </div>
        <h1 className={`text-3xl font-bold mb-4 ${isWin ? 'text-green-500' : 'text-red-500'}`}>
          {isWin ? 'YOU WIN!' : 'GAME OVER'}
        </h1>
        <p className="text-neutral-400 mb-8">{reason}</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onNewGame}
            className="px-8 py-4 bg-green-600 hover:bg-green-500 text-black font-bold rounded transition-colors"
          >
            PLAY AGAIN
          </button>
          <a
            href="/"
            className="px-8 py-4 bg-neutral-700 hover:bg-neutral-600 text-white font-bold rounded transition-colors"
          >
            EXIT
          </a>
        </div>
      </div>
    </div>
  );
}
