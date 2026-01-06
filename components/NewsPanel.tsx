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

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-2 h-28 lg:h-60">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-yellow-500 text-xs font-bold">NEWS</span>
        <span className="text-[10px] text-neutral-500">
          {revealedNews.length > 0 ? `(${revealedNews.length})` : (day === 1 ? 'Check back later' : 'No news')}
        </span>
      </div>
      <div className="space-y-1 h-16 lg:h-48 overflow-y-auto">
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
    <div className="border-l-2 border-neutral-700 pl-2 py-0.5">
      <div className="flex items-center gap-1.5 text-[10px] mb-0.5">
        <span className={`font-bold ${typeColors[news.type]}`}>
          {typeIcons[news.type]}
        </span>
        <span className="text-neutral-500">D{news.day}</span>
        <span className="text-neutral-600">|</span>
        <span className="text-neutral-400">{team.city}</span>
      </div>
      <p className="text-xs leading-snug">{news.headline}</p>
      <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
        <span className={isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-neutral-500'}>
          {impactOnTeam > 0 ? '+' : ''}{impactOnTeam} pts
        </span>
        {Math.abs(impactOnTeam) >= 2 && (
          <span className="text-orange-500">BIG</span>
        )}
      </div>
    </div>
  );
}
