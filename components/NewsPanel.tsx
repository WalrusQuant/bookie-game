'use client';

import { useGame } from '@/context/GameContext';
import { TeamNews, Game } from '@/lib/types';

export default function NewsPanel() {
  const { state } = useGame();
  const { games, week, day } = state;

  // Get this week's games
  const currentGames = games.filter((g) => g.week === week && !g.isComplete);

  // Get all revealed news for current week's games
  const revealedNews: Array<{ news: TeamNews; game: Game }> = [];
  for (const game of currentGames) {
    for (const news of game.news) {
      if (news.isRevealed) {
        revealedNews.push({ news, game });
      }
    }
  }

  // Sort by day (most recent first)
  revealedNews.sort((a, b) => b.news.day - a.news.day);

  if (revealedNews.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
        <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
          <span className="text-yellow-500">NEWS</span>
        </h2>
        <p className="text-neutral-500 text-sm">
          {day === 1
            ? 'Check back later for injury reports and game updates.'
            : 'No news yet this week.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span className="text-yellow-500">NEWS</span>
        <span className="text-xs text-neutral-500 font-normal">
          ({revealedNews.length} update{revealedNews.length !== 1 ? 's' : ''})
        </span>
      </h2>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {revealedNews.map(({ news, game }, index) => (
          <NewsItem key={`${game.id}-${news.teamId}-${news.day}-${news.type}-${index}`} news={news} game={game} />
        ))}
      </div>
    </div>
  );
}

function NewsItem({ news, game }: { news: TeamNews; game: Game }) {
  const team =
    game.homeTeam.id === news.teamId ? game.homeTeam : game.awayTeam;

  const typeIcons: Record<string, string> = {
    injury: 'INJURY',
    return: 'RETURN',
    weather: 'WEATHER',
    motivation: 'BUZZ',
    rest: 'REST',
  };

  const typeColors: Record<string, string> = {
    injury: 'text-red-500',
    return: 'text-green-500',
    weather: 'text-blue-500',
    motivation: 'text-yellow-500',
    rest: 'text-purple-500',
  };

  // Determine impact direction
  const impactOnTeam = news.impact;
  const isPositive = impactOnTeam > 0;
  const isNegative = impactOnTeam < 0;

  return (
    <div className="border-l-2 border-neutral-700 pl-3 py-1">
      <div className="flex items-center gap-2 text-xs mb-1">
        <span className={`font-bold ${typeColors[news.type]}`}>
          {typeIcons[news.type]}
        </span>
        <span className="text-neutral-500">Day {news.day}</span>
        <span className="text-neutral-600">|</span>
        <span className="text-neutral-400">{team.city} {team.name}</span>
      </div>
      <p className="text-sm">{news.headline}</p>
      <div className="flex items-center gap-2 mt-1 text-xs">
        <span className={isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-neutral-500'}>
          Line impact: {impactOnTeam > 0 ? '+' : ''}{impactOnTeam} pts
        </span>
        {Math.abs(impactOnTeam) >= 2 && (
          <span className="text-orange-500">SIGNIFICANT</span>
        )}
      </div>
    </div>
  );
}
