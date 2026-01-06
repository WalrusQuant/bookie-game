import { Team, Game } from './types';
import { getTeamPowerRating } from './teams';

// Home field advantage in points
const HOME_ADVANTAGE = 3;

/**
 * Calculate the "true" spread based on team ratings
 * Positive number means home team is favored
 * e.g., +7 means home team favored by 7
 */
export function calculateTrueLine(homeTeam: Team, awayTeam: Team): number {
  const homePower = getTeamPowerRating(homeTeam);
  const awayPower = getTeamPowerRating(awayTeam);

  // Convert power rating difference to point spread
  // Roughly 2.5 power rating points = 1 point spread
  const ratingDiff = (homePower - awayPower) / 2.5;

  // Add home field advantage
  const trueLine = ratingDiff + HOME_ADVANTAGE;

  // Round to nearest 0.5
  return Math.round(trueLine * 2) / 2;
}

/**
 * Calculate the market line (what sharp books would have)
 * This is the true line adjusted by revealed news
 */
export function calculateMarketLine(game: Game): number {
  const newsImpact = game.news
    .filter((n) => n.isRevealed)
    .reduce((sum, n) => sum + n.impact, 0);

  return Math.round((game.trueLine + newsImpact) * 2) / 2;
}

/**
 * Check if a line offers value to sharp bettors
 * Returns which side has value, if any
 */
export function findLineValue(
  game: Game
): { side: 'home' | 'away'; valuePoints: number } | null {
  const lineDiff = game.yourLine - game.trueLine;

  // If your line differs from true line by more than 1.5 points, there's value
  if (Math.abs(lineDiff) > 1.5) {
    if (lineDiff > 0) {
      // You're giving too many points to home, away has value
      return { side: 'away', valuePoints: lineDiff };
    } else {
      // You're not giving enough points to home, home has value
      return { side: 'home', valuePoints: Math.abs(lineDiff) };
    }
  }

  return null;
}

/**
 * Format a spread for display
 * Positive = home favored, Negative = away favored
 */
export function formatSpread(line: number, perspective: 'home' | 'away'): string {
  const adjustedLine = perspective === 'home' ? -line : line;

  if (adjustedLine === 0) return 'PK'; // Pick'em
  if (adjustedLine > 0) return `+${adjustedLine}`;
  return `${adjustedLine}`;
}

/**
 * Determine if a bet wins against the spread
 */
export function doesBetWin(
  homeScore: number,
  awayScore: number,
  pick: 'home' | 'away',
  line: number
): boolean | undefined {
  // Calculate the spread result
  // Line is from home perspective (negative = home favored)
  const homeMargin = homeScore - awayScore;

  if (pick === 'home') {
    // Home bet wins if home wins by more than the spread
    // If line is -7 (home favored by 7), home needs to win by more than 7
    const coverMargin = homeMargin + line;
    if (coverMargin === 0) return undefined; // Push
    return coverMargin > 0;
  } else {
    // Away bet wins if away covers
    // If line is -7 (home favored), away wins if they lose by less than 7 or win
    const coverMargin = -homeMargin - line;
    if (coverMargin === 0) return undefined; // Push
    return coverMargin > 0;
  }
}
