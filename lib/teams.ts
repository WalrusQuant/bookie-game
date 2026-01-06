import { Team, TeamNews, Game } from './types';

// Fictional team data
const TEAM_DATA: Array<{
  city: string;
  name: string;
  abbreviation: string;
  offense: number;
  defense: number;
  consistency: number;
}> = [
  { city: 'Metro', name: 'Tigers', abbreviation: 'MET', offense: 85, defense: 78, consistency: 70 },
  { city: 'Bay City', name: 'Bears', abbreviation: 'BAY', offense: 72, defense: 82, consistency: 80 },
  { city: 'Riverside', name: 'Rockets', abbreviation: 'RIV', offense: 90, defense: 65, consistency: 55 },
  { city: 'Summit', name: 'Storm', abbreviation: 'SUM', offense: 68, defense: 88, consistency: 85 },
  { city: 'Harbor', name: 'Hawks', abbreviation: 'HAR', offense: 75, defense: 75, consistency: 75 },
  { city: 'Valley', name: 'Vipers', abbreviation: 'VAL', offense: 82, defense: 70, consistency: 60 },
  { city: 'Capital', name: 'Crushers', abbreviation: 'CAP', offense: 78, defense: 80, consistency: 72 },
  { city: 'Lakeside', name: 'Lions', abbreviation: 'LAK', offense: 70, defense: 72, consistency: 90 },
];

// News templates
const NEWS_TEMPLATES = {
  injury: [
    { headline: '{team} star QB questionable with shoulder injury', impact: -3 },
    { headline: '{team} starting RB ruled out with hamstring', impact: -2 },
    { headline: '{team} top receiver dealing with ankle sprain', impact: -1.5 },
    { headline: '{team} defensive captain limited in practice', impact: -1 },
  ],
  return: [
    { headline: '{team} star player cleared to play Sunday', impact: 2.5 },
    { headline: '{team} key defender returns from suspension', impact: 1.5 },
    { headline: '{team} gets reinforcements back from IR', impact: 2 },
  ],
  weather: [
    { headline: 'Heavy rain expected for {team} home game', impact: -1 },
    { headline: 'Wind advisory for {team} stadium Sunday', impact: -0.5 },
    { headline: 'Perfect conditions forecast for {location}', impact: 0.5 },
  ],
  motivation: [
    { headline: '{team} fired up after last week\'s loss', impact: 1 },
    { headline: '{team} looking ahead to rivalry game next week', impact: -1.5 },
    { headline: '{team} coach gives impassioned speech to media', impact: 0.5 },
  ],
  rest: [
    { headline: '{team} well-rested after bye week', impact: 1.5 },
    { headline: '{team} playing third road game in a row', impact: -1 },
    { headline: '{team} dealing with short week after Monday game', impact: -1.5 },
  ],
};

export function generateTeams(): Team[] {
  return TEAM_DATA.map((data, index) => ({
    id: `team-${index}`,
    city: data.city,
    name: data.name,
    abbreviation: data.abbreviation,
    offense: data.offense,
    defense: data.defense,
    consistency: data.consistency,
    record: { wins: 0, losses: 0 },
    streak: 0,
    homeRecord: { wins: 0, losses: 0 },
    awayRecord: { wins: 0, losses: 0 },
  }));
}

export function getTeamFullName(team: Team): string {
  return `${team.city} ${team.name}`;
}

export function getTeamPowerRating(team: Team): number {
  return team.offense * 0.55 + team.defense * 0.45;
}

export function getTeamRecord(team: Team): string {
  return `${team.record.wins}-${team.record.losses}`;
}

export function getTeamStreak(team: Team): string {
  if (team.streak === 0) return '';
  if (team.streak > 0) return `W${team.streak}`;
  return `L${Math.abs(team.streak)}`;
}

// Generate news for a game
export function generateGameNews(game: Game): TeamNews[] {
  const news: TeamNews[] = [];
  const newsTypes: Array<keyof typeof NEWS_TEMPLATES> = ['injury', 'return', 'weather', 'motivation', 'rest'];

  // Each game gets 1-3 news items spread across the week
  const numNews = Math.floor(Math.random() * 3) + 1;

  for (let i = 0; i < numNews; i++) {
    const type = newsTypes[Math.floor(Math.random() * newsTypes.length)];
    const templates = NEWS_TEMPLATES[type];
    const template = templates[Math.floor(Math.random() * templates.length)];

    // Randomly assign to home or away team
    const isHome = Math.random() > 0.5;
    const team = isHome ? game.homeTeam : game.awayTeam;

    // News breaks on day 1, 3, or 5
    const day = [1, 3, 5][Math.floor(Math.random() * 3)];

    // Impact is negative for away team news (from home perspective)
    const impact = isHome ? template.impact : -template.impact;

    news.push({
      teamId: team.id,
      day,
      type,
      impact,
      headline: template.headline
        .replace('{team}', team.city)
        .replace('{location}', game.homeTeam.city),
      isRevealed: false,
    });
  }

  return news;
}

// Shuffle array using Fisher-Yates
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateWeeklyMatchups(teams: Team[]): Array<{ home: Team; away: Team }> {
  const shuffled = shuffleArray(teams);

  const matchups: Array<{ home: Team; away: Team }> = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    matchups.push({
      home: shuffled[i],
      away: shuffled[i + 1],
    });
  }

  return matchups;
}

// Update team records after a game
export function updateTeamRecords(
  teams: Team[],
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number
): Team[] {
  return teams.map((team) => {
    if (team.id === homeTeamId) {
      const won = homeScore > awayScore;
      return {
        ...team,
        record: {
          wins: team.record.wins + (won ? 1 : 0),
          losses: team.record.losses + (won ? 0 : 1),
        },
        homeRecord: {
          wins: team.homeRecord.wins + (won ? 1 : 0),
          losses: team.homeRecord.losses + (won ? 0 : 1),
        },
        streak: won ? Math.max(1, team.streak + 1) : Math.min(-1, team.streak - 1),
      };
    }
    if (team.id === awayTeamId) {
      const won = awayScore > homeScore;
      return {
        ...team,
        record: {
          wins: team.record.wins + (won ? 1 : 0),
          losses: team.record.losses + (won ? 0 : 1),
        },
        awayRecord: {
          wins: team.awayRecord.wins + (won ? 1 : 0),
          losses: team.awayRecord.losses + (won ? 0 : 1),
        },
        streak: won ? Math.max(1, team.streak + 1) : Math.min(-1, team.streak - 1),
      };
    }
    return team;
  });
}

// Calculate estimated points per game based on ratings
export function getTeamPPG(team: Team): number {
  return Math.round(14 + (team.offense / 10));
}

// Calculate estimated points allowed per game
export function getTeamPAPG(team: Team): number {
  return Math.round(28 - (team.defense / 10));
}
