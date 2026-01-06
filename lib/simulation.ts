import { Game, Team, Bet } from './types';
import { getTeamPowerRating } from './teams';
import { doesBetWin } from './lines';

/**
 * Simulate a game and return the final score
 */
export function simulateGame(
  homeTeam: Team,
  awayTeam: Team
): { homeScore: number; awayScore: number } {
  // Base scoring (average NFL-ish scores)
  const BASE_SCORE = 21;
  const SCORE_VARIANCE = 10;

  // Team power affects expected score
  const homePower = getTeamPowerRating(homeTeam);
  const awayPower = getTeamPowerRating(awayTeam);

  // Home advantage
  const HOME_BOOST = 3;

  // Calculate expected scores
  // Higher offense = more points scored
  // Lower defense = more points allowed
  const homeExpected =
    BASE_SCORE +
    (homeTeam.offense - 75) / 10 +
    (100 - awayTeam.defense - 25) / 10 +
    HOME_BOOST;

  const awayExpected =
    BASE_SCORE +
    (awayTeam.offense - 75) / 10 +
    (100 - homeTeam.defense - 25) / 10;

  // Add variance based on consistency
  // Lower consistency = higher variance
  const homeVariance = SCORE_VARIANCE * (1.5 - homeTeam.consistency / 100);
  const awayVariance = SCORE_VARIANCE * (1.5 - awayTeam.consistency / 100);

  // Generate scores using normal-ish distribution
  const homeScore = Math.max(
    0,
    Math.round(homeExpected + gaussianRandom() * homeVariance)
  );
  const awayScore = Math.max(
    0,
    Math.round(awayExpected + gaussianRandom() * awayVariance)
  );

  return { homeScore, awayScore };
}

/**
 * Generate a random number with approximate normal distribution
 * Using Box-Muller transform
 */
function gaussianRandom(): number {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Resolve all bets for a completed game
 */
export function resolveBets(
  game: Game,
  bets: Bet[]
): Bet[] {
  if (!game.isComplete || game.homeScore === undefined || game.awayScore === undefined) {
    throw new Error('Cannot resolve bets for incomplete game');
  }

  return bets.map((bet) => {
    const result = doesBetWin(
      game.homeScore!,
      game.awayScore!,
      bet.pick,
      bet.line
    );

    return {
      ...bet,
      isWin: result,
    };
  });
}

/**
 * Calculate payout for a bet
 * Returns positive number for customer win, negative for bookie win
 * Standard -110 juice means bet $110 to win $100
 */
export function calculatePayout(bet: Bet, juice: number = 0.1): number {
  if (bet.isWin === undefined) {
    // Push - return stake
    return 0;
  }

  if (bet.isWin) {
    // Customer wins - they get their stake back plus winnings
    // At -110, they win ~90.9% of their stake
    return bet.amount / (1 + juice);
  } else {
    // Customer loses - bookie keeps the stake
    return -bet.amount;
  }
}

/**
 * Format a score for display
 */
export function formatScore(homeScore: number, awayScore: number): string {
  return `${homeScore} - ${awayScore}`;
}

/**
 * Get the winner of a game
 */
export function getGameWinner(game: Game): 'home' | 'away' | 'tie' | null {
  if (!game.isComplete || game.homeScore === undefined || game.awayScore === undefined) {
    return null;
  }

  if (game.homeScore > game.awayScore) return 'home';
  if (game.awayScore > game.homeScore) return 'away';
  return 'tie';
}
