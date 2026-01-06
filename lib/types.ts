// Core game types

export type CustomerType = 'square' | 'sharp' | 'whale' | 'deadbeat';

export interface Team {
  id: string;
  name: string;
  city: string;
  abbreviation: string;
  offense: number;  // 1-100
  defense: number;  // 1-100
  consistency: number; // 1-100, affects variance
  record: { wins: number; losses: number };
  streak: number; // positive = winning streak, negative = losing
  homeRecord: { wins: number; losses: number };
  awayRecord: { wins: number; losses: number };
}

export interface TeamNews {
  teamId: string;
  day: number; // When this news breaks (1-6)
  type: 'injury' | 'return' | 'weather' | 'motivation' | 'rest';
  impact: number; // How much it affects the line (-5 to +5)
  headline: string;
  isRevealed: boolean;
}

export interface Game {
  id: string;
  week: number;
  homeTeam: Team;
  awayTeam: Team;
  trueLine: number; // The "true" spread based on team ratings + news
  marketLine: number; // What the "sharp" books have it at (hint for player)
  yourLine: number; // The line you set
  homeScore?: number;
  awayScore?: number;
  isComplete: boolean;
  news: TeamNews[]; // News items for this game
}

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  bankroll: number;
  maxBet: number;
  reliability: number; // 0-1, chance they pay when they lose
  sharpness: number; // 0-1, how good they are at finding value
  favoritesBias: number; // 0-1, tendency to bet favorites (squares)
  isActive: boolean;
  location?: string; // Where they hang out (for recruitment missions)
}

export interface Bet {
  id: string;
  customerId: string;
  gameId: string;
  amount: number;
  pick: 'home' | 'away';
  line: number; // The line at time of bet
  dayPlaced: number; // Which day of the week
  isWin?: boolean;
  isPaid: boolean;
}

export interface Debt {
  customerId: string;
  amount: number;
  weekIncurred: number;
  attempts: number;
  location: string; // Where to find them
}

export interface GameLogEntry {
  id: string;
  week: number;
  day: number;
  message: string;
  type: 'info' | 'win' | 'loss' | 'warning' | 'danger' | 'news';
}

// Mission system
export type MissionType = 'collect' | 'recruit' | 'avoid_heat' | 'rest';

export interface Mission {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  location: string;
  energyCost: number;
  moneyCost: number;
  risk: number; // 0-1, chance of bad outcome
  reward: MissionReward;
}

export interface MissionReward {
  money?: number;
  newCustomer?: CustomerType;
  debtCollected?: string; // customerId
  heat?: number; // negative = reduce heat
  energy?: number;
}

export interface NonPayerPopup {
  customerId: string;
  customerName: string;
  amount: number;
}

export interface GameState {
  week: number;
  day: number; // 1-7
  bankroll: number;
  startingBankroll: number;
  energy: number; // Actions remaining today (resets to 10 each day)
  maxEnergy: number;
  heat: number; // Police attention (0-100, game over at 100)
  teams: Team[];
  games: Game[];
  customers: Customer[];
  bets: Bet[];
  debts: Debt[];
  log: GameLogEntry[];
  availableMissions: Mission[];
  actionsToday: number; // Track how many actions taken today
  betsReceivedToday: boolean; // Track if bets came in today
  isGameOver: boolean;
  gameOverReason?: string;
  pendingNonPayer?: NonPayerPopup; // Popup when someone won't pay
}

export type GameAction =
  | { type: 'NEW_GAME' }
  | { type: 'LOAD_GAME'; payload: GameState }
  | { type: 'SET_LINE'; payload: { gameId: string; line: number } }
  | { type: 'DO_MISSION'; payload: { missionId: string } }
  | { type: 'REST' }
  | { type: 'END_DAY' }
  | { type: 'SIMULATE_GAMES' }
  | { type: 'COLLECT_DEBT'; payload: { customerId: string } }
  | { type: 'HANDLE_NONPAYER'; payload: { customerId: string; action: CollectionAction } }
  | { type: 'DISMISS_POPUP' }
  | { type: 'ADD_LOG'; payload: { message: string; type: GameLogEntry['type'] } };

export type CollectionAction =
  | 'let_slide'
  | 'pressure'
  | 'cut_off'
  | 'enforce';

// Constants
export const STARTING_BANKROLL = 10000;
export const STARTING_ENERGY = 3;
export const MAX_ENERGY = 10;
export const MIN_BET = 50;
export const MAX_BET_MULTIPLIER = 0.1;
export const JUICE = 0.1;
export const BANKRUPTCY_THRESHOLD = 500;
export const WIN_THRESHOLD = 100000;
export const HEAT_THRESHOLD = 100;

// Day schedule - simplified
export const GAME_DAY = 7; // When games are played

// Action costs
export const ACTION_COSTS = {
  adjust_lines: 0,   // Free to adjust lines
  recruit: 2,        // Find new customers
  collect: 1,        // Collect from deadbeat
  rest: 0,           // Rest is free, gives +3 energy
  avoid_heat: 2,     // Lay low
} as const;
