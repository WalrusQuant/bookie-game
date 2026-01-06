'use client';

import { useGame } from '@/context/GameContext';
import { Game } from '@/lib/types';
import { formatSpread } from '@/lib/lines';
import { getTeamFullName } from '@/lib/teams';

interface WeeklyGamesProps {
  canEdit: boolean;
}

export default function WeeklyGames({ canEdit }: WeeklyGamesProps) {
  const { state, dispatch } = useGame();
  const { games, week, bets, day, hasScoutedThisWeek, hedgedGames, fixedGames } = state;

  const currentGames = games.filter((g) => g.week === week);

  const handleLineChange = (gameId: string, delta: number) => {
    const game = games.find((g) => g.id === gameId);
    if (game) {
      const newLine = Math.round((game.yourLine + delta) * 2) / 2; // Round to 0.5
      dispatch({ type: 'SET_LINE', payload: { gameId, line: newLine } });
    }
  };

  const getGameBets = (gameId: string) => {
    const gameBets = bets.filter((b) => b.gameId === gameId);
    const homeBets = gameBets.filter((b) => b.pick === 'home');
    const awayBets = gameBets.filter((b) => b.pick === 'away');
    return {
      homeAmount: homeBets.reduce((sum, b) => sum + b.amount, 0),
      awayAmount: awayBets.reduce((sum, b) => sum + b.amount, 0),
      homeCount: homeBets.length,
      awayCount: awayBets.length,
    };
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-2 h-full flex flex-col">
      <h2 className="text-xs font-bold mb-1 flex items-center gap-2 shrink-0">
        <span className="text-green-500">WEEK {week}</span>
        <span className="text-neutral-500">GAMES</span>
        {canEdit && (
          <span className="text-[10px] text-yellow-500 ml-auto">SET LINES</span>
        )}
      </h2>

      <div className="space-y-1 flex-1 min-h-0 overflow-y-auto">
        {currentGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            canEdit={canEdit && !game.isComplete}
            onLineChange={handleLineChange}
            betInfo={day > 1 ? getGameBets(game.id) : undefined}
            showMarketLine={hasScoutedThisWeek}
            isHedged={hedgedGames.includes(game.id)}
            isFixed={fixedGames.some((fg) => fg.gameId === game.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface GameCardProps {
  game: Game;
  canEdit: boolean;
  onLineChange: (gameId: string, delta: number) => void;
  betInfo?: {
    homeAmount: number;
    awayAmount: number;
    homeCount: number;
    awayCount: number;
  };
  showMarketLine: boolean;
  isHedged: boolean;
  isFixed: boolean;
}

function GameCard({ game, canEdit, onLineChange, betInfo, showMarketLine, isHedged, isFixed }: GameCardProps) {
  const homeFavored = game.yourLine < 0;
  const lineOff = Math.abs(game.yourLine - game.marketLine);
  const hasValue = lineOff > 1.5;

  // Show market line hint when scouted OR when there's revealed news
  const hasRevealedNews = game.news?.some((n) => n.isRevealed) ?? false;
  const shouldShowMarketLine = showMarketLine || hasRevealedNews;

  return (
    <div className={`bg-neutral-800 rounded px-6 py-3 ${
      isFixed ? 'border border-red-600' :
      isHedged ? 'border border-cyan-600' :
      hasValue && canEdit ? 'border border-yellow-600' : ''
    }`}>
      {/* Status indicators inline */}
      {(isFixed || isHedged || (hasValue && canEdit && !isHedged && !isFixed)) && (
        <div className="text-[10px] mb-0.5">
          {isFixed && !game.isComplete && <span className="text-red-500 font-bold">FIX IS IN</span>}
          {isHedged && !game.isComplete && !isFixed && <span className="text-cyan-500">HEDGED</span>}
          {hasValue && canEdit && !isHedged && !isFixed && <span className="text-yellow-500">{lineOff.toFixed(1)} off mkt</span>}
        </div>
      )}

      <div className="grid grid-cols-3 gap-1 items-center">
        {/* Away Team */}
        <div className="text-right">
          <div className={`text-sm leading-tight ${!homeFavored ? 'text-green-500' : 'text-neutral-400'}`}>
            {getTeamFullName(game.awayTeam)}
          </div>
          {game.isComplete && (
            <div className="text-base font-bold">{game.awayScore}</div>
          )}
        </div>

        {/* Line / At */}
        <div className="text-center">
          {game.isComplete ? (
            <div className="text-neutral-500 text-[10px]">FINAL</div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-0.5">
                {canEdit && (
                  <button
                    onClick={() => onLineChange(game.id, -0.5)}
                    className="w-5 h-5 bg-neutral-700 hover:bg-neutral-600 active:bg-neutral-500 rounded text-xs transition-colors"
                  >
                    -
                  </button>
                )}
                <div className="w-10 text-center">
                  <div className={`text-sm font-bold ${homeFavored ? 'text-green-500' : 'text-neutral-300'}`}>
                    {formatSpread(game.yourLine, 'home')}
                  </div>
                </div>
                {canEdit && (
                  <button
                    onClick={() => onLineChange(game.id, 0.5)}
                    className="w-5 h-5 bg-neutral-700 hover:bg-neutral-600 active:bg-neutral-500 rounded text-xs transition-colors"
                  >
                    +
                  </button>
                )}
              </div>
              {shouldShowMarketLine && (
                <div className="text-[10px] text-neutral-500">
                  Mkt: {formatSpread(game.marketLine, 'home')}
                </div>
              )}
            </>
          )}
        </div>

        {/* Home Team */}
        <div className="text-left">
          <div className={`text-sm leading-tight ${homeFavored ? 'text-green-500' : 'text-neutral-400'}`}>
            {getTeamFullName(game.homeTeam)}
          </div>
          {game.isComplete && (
            <div className="text-base font-bold">{game.homeScore}</div>
          )}
        </div>
      </div>

      {/* Exposure warning */}
      {betInfo && !game.isComplete && (betInfo.homeCount > 0 || betInfo.awayCount > 0) && (
        <ExposureBar homeAmount={betInfo.homeAmount} awayAmount={betInfo.awayAmount} />
      )}
    </div>
  );
}

function ExposureBar({ homeAmount, awayAmount }: { homeAmount: number; awayAmount: number }) {
  const total = homeAmount + awayAmount;
  if (total === 0) return null;

  const homePercent = (homeAmount / total) * 100;
  const imbalance = Math.abs(homeAmount - awayAmount);
  const imbalancePercent = total > 0 ? (imbalance / total) * 100 : 0;

  return (
    <div className="mt-1.5">
      <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
        <span>Balance</span>
        <span className={imbalancePercent > 30 ? 'text-yellow-500' : ''}>
          {imbalancePercent > 30 ? `${imbalancePercent.toFixed(0)}%` : 'OK'}
        </span>
      </div>
      <div className="h-1 bg-neutral-700 rounded-full overflow-hidden flex">
        <div
          className="h-full bg-red-600 transition-all duration-300"
          style={{ width: `${homePercent}%` }}
        />
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${100 - homePercent}%` }}
        />
      </div>
    </div>
  );
}
