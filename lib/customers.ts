import { Customer, CustomerType, Game, MIN_BET, MAX_BET_MULTIPLIER } from './types';
import { findLineValue } from './lines';

// First and last names for generation
const FIRST_NAMES = [
  'Tony', 'Vinnie', 'Joey', 'Sal', 'Mike', 'Frank', 'Eddie', 'Bobby',
  'Jimmy', 'Tommy', 'Paulie', 'Richie', 'Danny', 'Lou', 'Ray'
];

const LAST_INITIALS = ['M', 'S', 'D', 'C', 'B', 'T', 'R', 'G', 'P', 'L'];

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

interface CustomerTemplate {
  type: CustomerType;
  reliability: [number, number];
  sharpness: [number, number];
  favoritesBias: [number, number];
  bankroll: [number, number];
  maxBetPct: [number, number];
}

const CUSTOMER_TEMPLATES: Record<CustomerType, CustomerTemplate> = {
  square: {
    type: 'square',
    reliability: [0.95, 1.0],    // Almost always pay
    sharpness: [0.1, 0.3],       // Not sharp at all
    favoritesBias: [0.6, 0.9],   // Love betting favorites
    bankroll: [500, 2000],
    maxBetPct: [0.1, 0.2],
  },
  sharp: {
    type: 'sharp',
    reliability: [1.0, 1.0],     // Always pay (reputation matters)
    sharpness: [0.7, 0.95],      // Very sharp
    favoritesBias: [0.4, 0.6],   // No bias
    bankroll: [2000, 10000],
    maxBetPct: [0.15, 0.3],
  },
  whale: {
    type: 'whale',
    reliability: [0.95, 1.0],    // Almost always pay
    sharpness: [0.3, 0.6],       // Moderately sharp
    favoritesBias: [0.4, 0.6],   // No strong bias
    bankroll: [10000, 50000],
    maxBetPct: [0.2, 0.4],
  },
  deadbeat: {
    type: 'deadbeat',
    reliability: [0.75, 0.9],    // Usually pay, occasionally stiff
    sharpness: [0.2, 0.5],       // Average
    favoritesBias: [0.5, 0.7],   // Slight favorite bias
    bankroll: [200, 1000],
    maxBetPct: [0.3, 0.5],       // Bet big relative to bankroll
  },
};

export function generateCustomer(type: CustomerType): Customer {
  const template = CUSTOMER_TEMPLATES[type];
  const firstName = randomChoice(FIRST_NAMES);
  const lastInitial = randomChoice(LAST_INITIALS);

  const bankroll = Math.round(randomInRange(...template.bankroll));
  const maxBetPct = randomInRange(...template.maxBetPct);

  return {
    id: `customer-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    name: `${firstName} ${lastInitial}.`,
    type,
    bankroll,
    maxBet: Math.round(bankroll * maxBetPct),
    reliability: randomInRange(...template.reliability),
    sharpness: randomInRange(...template.sharpness),
    favoritesBias: randomInRange(...template.favoritesBias),
    isActive: true,
  };
}

export function generateStartingCustomers(): Customer[] {
  // Start with a mix of customers - mostly reliable, no deadbeats at start
  return [
    generateCustomer('square'),
    generateCustomer('square'),
    generateCustomer('square'),
    generateCustomer('square'),
    generateCustomer('square'),
    generateCustomer('sharp'),
    generateCustomer('whale'),
  ];
}

/**
 * Determine what bets a customer will place
 */
export function generateCustomerBets(
  customer: Customer,
  games: Game[],
  bookieBankroll: number
): Array<{ gameId: string; amount: number; pick: 'home' | 'away' }> {
  const bets: Array<{ gameId: string; amount: number; pick: 'home' | 'away' }> = [];

  // Max bet is limited by bookie's bankroll too
  const bookieMaxBet = Math.round(bookieBankroll * MAX_BET_MULTIPLIER);
  const effectiveMaxBet = Math.min(customer.maxBet, bookieMaxBet, customer.bankroll);

  if (effectiveMaxBet < MIN_BET) return bets;

  for (const game of games) {
    // Random chance to bet on any given game (50-80% depending on type)
    const betChance = customer.type === 'whale' ? 0.5 : 0.7;
    if (Math.random() > betChance) continue;

    const value = findLineValue(game);
    let pick: 'home' | 'away';
    let betSize: number;

    if (value && Math.random() < customer.sharpness) {
      // Sharp enough to find value - bet the value side
      pick = value.side;
      // Bet more when there's more value
      const valueMultiplier = Math.min(value.valuePoints / 3, 1);
      betSize = Math.round(
        MIN_BET + (effectiveMaxBet - MIN_BET) * (0.5 + valueMultiplier * 0.5)
      );
    } else {
      // Bet based on favorites bias
      const homeFavored = game.yourLine < 0;
      const favoriteIsHome = homeFavored;

      if (Math.random() < customer.favoritesBias) {
        // Bet the favorite
        pick = favoriteIsHome ? 'home' : 'away';
      } else {
        // Bet the underdog
        pick = favoriteIsHome ? 'away' : 'home';
      }

      // Random bet size
      betSize = Math.round(MIN_BET + Math.random() * (effectiveMaxBet - MIN_BET));
    }

    // Round to nearest $10
    betSize = Math.round(betSize / 10) * 10;
    if (betSize >= MIN_BET) {
      bets.push({ gameId: game.id, amount: betSize, pick });
    }
  }

  return bets;
}

export function getCustomerTypeLabel(type: CustomerType): string {
  switch (type) {
    case 'square': return 'Square';
    case 'sharp': return 'Sharp';
    case 'whale': return 'Whale';
    case 'deadbeat': return 'Deadbeat';
  }
}

export function getCustomerTypeDescription(type: CustomerType): string {
  switch (type) {
    case 'square': return 'Casual bettor, loves favorites, always pays';
    case 'sharp': return 'Smart money, finds value, reliable';
    case 'whale': return 'Big bettor, high stakes';
    case 'deadbeat': return 'May not pay when they lose';
  }
}
