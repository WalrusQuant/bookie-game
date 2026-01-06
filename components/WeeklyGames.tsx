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
  const { games, week, bets, day } = state;

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
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-green-500">WEEK {week}</span>
        <span className="text-neutral-500">GAMES</span>
        {canEdit && (
          <span className="text-xs text-yellow-500 ml-auto">SET YOUR LINES</span>
        )}
      </h2>

      <div className="space-y-4">
        {currentGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            canEdit={canEdit && !game.isComplete}
            onLineChange={handleLineChange}
            betInfo={day > 1 ? getGameBets(game.id) : undefined}
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
}

function GameCard({ game, canEdit, onLineChange, betInfo }: GameCardProps) {
  const homeFavored = game.yourLine < 0;
  const lineOff = Math.abs(game.yourLine - game.marketLine);
  const hasValue = lineOff > 1.5;

  // Show market line hint when there's revealed news
  const hasRevealedNews = game.news?.some((n) => n.isRevealed) ?? false;

  return (
    <div className={`bg-neutral-800 rounded-lg p-4 ${hasValue && canEdit ? 'border border-yellow-600' : ''}`}>
      {/* Value warning */}
      {hasValue && canEdit && (
        <div className="text-yellow-500 text-xs mb-2">
          Sharp money sees value! Your line is {lineOff.toFixed(1)} pts off market
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 items-center">
        {/* Away Team */}
        <div className="text-right">
          <div className={`text-sm ${!homeFavored ? 'text-green-500' : 'text-neutral-400'}`}>
            {getTeamFullName(game.awayTeam)}
          </div>
          <div className="text-xs text-neutral-600">
            ({game.awayTeam.record.wins}-{game.awayTeam.record.losses})
          </div>
          {game.isComplete && (
            <div className="text-2xl font-bold mt-1">{game.awayScore}</div>
          )}
          {betInfo && !game.isComplete && betInfo.awayCount > 0 && (
            <div className="text-xs text-neutral-500 mt-1">
              {betInfo.awayCount} bet{betInfo.awayCount !== 1 ? 's' : ''} · ${betInfo.awayAmount.toLocaleString()}
            </div>
          )}
        </div>

        {/* Line / At */}
        <div className="text-center">
          {game.isComplete ? (
            <div className="text-neutral-500 text-sm">FINAL</div>
          ) : (
            <>
              <div className="text-neutral-500 text-xs mb-1">@</div>
              <div className="flex items-center justify-center gap-2">
                {canEdit && (
                  <button
                    onClick={() => onLineChange(game.id, -0.5)}
                    className="w-8 h-8 bg-neutral-700 hover:bg-neutral-600 rounded text-lg transition-colors"
                  >
                    -
                  </button>
                )}
                <div className="w-16 text-center">
                  <div className={`text-lg font-bold ${homeFavored ? 'text-green-500' : 'text-neutral-300'}`}>
                    {formatSpread(game.yourLine, 'home')}
                  </div>
                  <div className="text-xs text-neutral-500">YOUR LINE</div>
                </div>
                {canEdit && (
                  <button
                    onClick={() => onLineChange(game.id, 0.5)}
                    className="w-8 h-8 bg-neutral-700 hover:bg-neutral-600 rounded text-lg transition-colors"
                  >
                    +
                  </button>
                )}
              </div>

              {/* Market line hint */}
              {hasRevealedNews && (
                <div className="text-xs text-neutral-500 mt-2">
                  Market: {formatSpread(game.marketLine, 'home')}
                </div>
              )}
            </>
          )}
        </div>

        {/* Home Team */}
        <div className="text-left">
          <div className={`text-sm ${homeFavored ? 'text-green-500' : 'text-neutral-400'}`}>
            {getTeamFullName(game.homeTeam)}
          </div>
          <div className="text-xs text-neutral-600">
            ({game.homeTeam.record.wins}-{game.homeTeam.record.losses})
          </div>
          {game.isComplete && (
            <div className="text-2xl font-bold mt-1">{game.homeScore}</div>
          )}
          {betInfo && !game.isComplete && betInfo.homeCount > 0 && (
            <div className="text-xs text-neutral-500 mt-1">
              {betInfo.homeCount} bet{betInfo.homeCount !== 1 ? 's' : ''} · ${betInfo.homeAmount.toLocaleString()}
            </div>
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
    <div className="mt-3">
      <div className="flex justify-between text-xs text-neutral-500 mb-1">
        <span>Action balance</span>
        <span className={imbalancePercent > 30 ? 'text-yellow-500' : ''}>
          {imbalancePercent > 30 ? `${imbalancePercent.toFixed(0)}% imbalanced` : 'Balanced'}
        </span>
      </div>
      <div className="h-2 bg-neutral-700 rounded-full overflow-hidden flex">
        <div
          className="h-full bg-red-600 transition-all duration-300"
          style={{ width: `${homePercent}%` }}
        />
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${100 - homePercent}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-neutral-600 mt-1">
        <span>Home</span>
        <span>Away</span>
      </div>
    </div>
  );
}
