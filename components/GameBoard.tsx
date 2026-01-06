'use client';

import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { GAME_DAY } from '@/lib/types';
import BankrollDisplay from './BankrollDisplay';
import WeeklyGames from './WeeklyGames';
import CustomerList from './CustomerList';
import GameLog from './GameLog';
import MissionPanel from './MissionPanel';
import NewsPanel from './NewsPanel';
import NonPayerPopup from './NonPayerPopup';

type MobileTab = 'games' | 'missions' | 'customers' | 'log';

export default function GameBoard() {
  const { state, dispatch, isHydrated } = useGame();
  const [activeTab, setActiveTab] = useState<MobileTab>('games');

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-green-500 text-lg animate-pulse">Loading...</div>
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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top bar with game controls */}
      <header className="bg-neutral-900 border-b border-neutral-800 px-3 py-1.5 flex justify-between items-center">
        <h1 className="text-lg font-bold text-green-500">BOOKIE</h1>
        <div className="flex gap-1.5">
          <button
            onClick={handleNewGame}
            className="px-2 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 rounded transition-colors"
          >
            New
          </button>
          <button
            onClick={handleExitGame}
            className="px-2 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 rounded transition-colors"
          >
            Exit
          </button>
        </div>
      </header>

      {/* Desktop layout */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Left sidebar: Log */}
        <aside className="w-80 bg-neutral-900 border-r border-neutral-800 flex flex-col overflow-hidden">
          <GameLog />
        </aside>

        {/* Center: Main game content */}
        <main className="flex-1 overflow-hidden p-2 flex flex-col">
          <DesktopMainContent
            state={state}
            dispatch={dispatch}
            week={week}
            day={day}
            isGameDay={isGameDay}
            gamesPlayed={gamesPlayed}
          />
        </main>

        {/* Right sidebar: Missions & Customers */}
        <aside className="w-80 bg-neutral-900 border-l border-neutral-800 p-2 flex flex-col gap-2 overflow-hidden">
          {!isGameDay && (
            <button
              onClick={() => dispatch({ type: 'END_DAY' })}
              className="w-full py-1.5 bg-green-600 hover:bg-green-500 text-black font-bold rounded transition-colors text-center text-xs shrink-0"
            >
              END DAY
            </button>
          )}
          {!isGameDay && (
            <div className="flex-1 min-h-0 overflow-hidden">
              <MissionPanel />
            </div>
          )}
          <div className={`${isGameDay ? 'flex-1' : 'flex-1'} min-h-0 overflow-hidden`}>
            <CustomerList />
          </div>
        </aside>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden flex-1 flex flex-col overflow-hidden">
        {/* Bankroll always visible on mobile */}
        <div className="p-2 border-b border-neutral-800">
          <BankrollDisplay />
        </div>

        {/* Mobile content area */}
        <div className="flex-1 overflow-y-auto p-2">
          {activeTab === 'games' && (
            <MobileGamesTab
              state={state}
              dispatch={dispatch}
              week={week}
              day={day}
              isGameDay={isGameDay}
              gamesPlayed={gamesPlayed}
            />
          )}
          {activeTab === 'missions' && (
            <MobileMissionsTab
              dispatch={dispatch}
              isGameDay={isGameDay}
            />
          )}
          {activeTab === 'customers' && <CustomerList />}
          {activeTab === 'log' && (
            <div className="h-full">
              <GameLog />
            </div>
          )}
        </div>

        {/* Mobile bottom navigation */}
        <nav className="bg-neutral-900 border-t border-neutral-800 flex safe-area-bottom">
          <MobileNavButton
            active={activeTab === 'games'}
            onClick={() => setActiveTab('games')}
            icon="🏈"
            label="Games"
          />
          <MobileNavButton
            active={activeTab === 'missions'}
            onClick={() => setActiveTab('missions')}
            icon="⚡"
            label="Actions"
            badge={!isGameDay ? state.availableMissions.length : undefined}
          />
          <MobileNavButton
            active={activeTab === 'customers'}
            onClick={() => setActiveTab('customers')}
            icon="👥"
            label="Customers"
            badge={state.customers.filter(c => c.isActive).length}
          />
          <MobileNavButton
            active={activeTab === 'log'}
            onClick={() => setActiveTab('log')}
            icon="📋"
            label="Log"
          />
        </nav>
      </div>

      {/* Non-payer popup */}
      <NonPayerPopup />
    </div>
  );
}

function MobileNavButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center py-2 px-2 transition-colors relative ${
        active ? 'text-green-500 bg-neutral-800' : 'text-neutral-400'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-[10px] mt-0.5">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-1 right-1/4 bg-green-600 text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function MobileGamesTab({
  state,
  dispatch,
  week,
  day,
  isGameDay,
  gamesPlayed,
}: {
  state: ReturnType<typeof useGame>['state'];
  dispatch: ReturnType<typeof useGame>['dispatch'];
  week: number;
  day: number;
  isGameDay: boolean;
  gamesPlayed: boolean;
}) {
  return (
    <div className="space-y-2">
      {/* Day indicator */}
      <DayIndicator week={week} day={day} actionsToday={state.actionsToday} />

      {/* News Panel */}
      <NewsPanel />

      {/* Games */}
      <WeeklyGames canEdit={!isGameDay && !gamesPlayed} />

      {/* Game Day Actions */}
      {isGameDay && !gamesPlayed && (
        <div className="text-center py-2">
          <button
            onClick={() => dispatch({ type: 'SIMULATE_GAMES' })}
            className="w-full px-6 py-4 bg-green-600 hover:bg-green-500 active:bg-green-400 text-black font-bold rounded text-lg transition-colors"
          >
            PLAY GAMES
          </button>
        </div>
      )}

      {/* End Week button */}
      {isGameDay && gamesPlayed && (
        <div className="text-center py-2">
          <button
            onClick={() => dispatch({ type: 'END_DAY' })}
            className="w-full px-4 py-4 bg-green-600 hover:bg-green-500 active:bg-green-400 text-black font-bold rounded text-lg transition-colors"
          >
            END WEEK
          </button>
        </div>
      )}
    </div>
  );
}

function MobileMissionsTab({
  dispatch,
  isGameDay,
}: {
  dispatch: ReturnType<typeof useGame>['dispatch'];
  isGameDay: boolean;
}) {
  return (
    <div className="h-full flex flex-col gap-2">
      {!isGameDay && (
        <>
          <button
            onClick={() => dispatch({ type: 'END_DAY' })}
            className="w-full py-2 bg-green-600 hover:bg-green-500 active:bg-green-400 text-black font-bold rounded text-sm transition-colors text-center shrink-0"
          >
            END DAY
          </button>
          <MissionPanel />
        </>
      )}
      {isGameDay && (
        <div className="text-center text-neutral-500 py-8">
          <p className="text-lg">It's game day!</p>
          <p className="text-sm mt-2">Go to Games tab to play.</p>
        </div>
      )}
    </div>
  );
}

function DesktopMainContent({
  state,
  dispatch,
  week,
  day,
  isGameDay,
  gamesPlayed,
}: {
  state: ReturnType<typeof useGame>['state'];
  dispatch: ReturnType<typeof useGame>['dispatch'];
  week: number;
  day: number;
  isGameDay: boolean;
  gamesPlayed: boolean;
}) {
  return (
    <div className="h-full flex flex-col gap-1">
      {/* Top row: Bankroll + Day */}
      <div className="flex gap-1 shrink-0">
        <div className="flex-1"><BankrollDisplay /></div>
        <DayIndicator week={week} day={day} actionsToday={state.actionsToday} />
      </div>

      {/* News - only if there's news */}
      <div className="shrink-0"><NewsPanel /></div>

      {/* Games - fills remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <WeeklyGames canEdit={!isGameDay && !gamesPlayed} />
      </div>

      {/* Game Day Actions */}
      {isGameDay && !gamesPlayed && (
        <div className="text-center shrink-0">
          <button
            onClick={() => dispatch({ type: 'SIMULATE_GAMES' })}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-black font-bold rounded text-sm transition-colors"
          >
            PLAY GAMES
          </button>
        </div>
      )}

      {/* End Week button */}
      {isGameDay && gamesPlayed && (
        <div className="text-center shrink-0">
          <button
            onClick={() => dispatch({ type: 'END_DAY' })}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-black font-bold rounded text-sm transition-colors"
          >
            END WEEK
          </button>
        </div>
      )}
    </div>
  );
}

function DayIndicator({ week, day, actionsToday }: { week: number; day: number; actionsToday: number }) {
  const dayNames = ['', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const isGameDay = day === GAME_DAY;

  return (
    <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1">
      <div className="flex items-center gap-2">
        <div className="text-xs font-bold">
          W{week} {dayNames[day]}
        </div>
        <div className="text-neutral-400 text-[10px]">
          {actionsToday} act
        </div>
      </div>

      {isGameDay && (
        <span className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] rounded">
          GAME DAY
        </span>
      )}
    </div>
  );
}

function GameOverScreen({ reason, onNewGame }: { reason?: string; onNewGame: () => void }) {
  const isWin = reason?.includes('made it');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className={`text-5xl mb-3 ${isWin ? 'text-green-500' : 'text-red-500'}`}>
          {isWin ? '$$$$' : 'BUST'}
        </div>
        <h1 className={`text-2xl font-bold mb-3 ${isWin ? 'text-green-500' : 'text-red-500'}`}>
          {isWin ? 'YOU WIN!' : 'GAME OVER'}
        </h1>
        <p className="text-neutral-400 text-sm mb-6">{reason}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onNewGame}
            className="px-6 py-4 sm:py-3 bg-green-600 hover:bg-green-500 active:bg-green-400 text-black font-bold rounded transition-colors"
          >
            PLAY AGAIN
          </button>
          <a
            href="/"
            className="px-6 py-4 sm:py-3 bg-neutral-700 hover:bg-neutral-600 active:bg-neutral-500 text-white font-bold rounded transition-colors text-center"
          >
            EXIT
          </a>
        </div>
      </div>
    </div>
  );
}
