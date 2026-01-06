import { Mission, MissionType, Debt, Customer, CustomerType, Game, Bet } from './types';

// Location data
const LOCATIONS = [
  'Downtown Bar',
  'Sports Bar',
  'Pool Hall',
  'Poker Room',
  'Country Club',
  'Warehouse District',
  'Industrial Park',
  'The Docks',
];

const RECRUIT_LOCATIONS: Record<CustomerType, string[]> = {
  square: ['Downtown Bar', 'Sports Bar', 'Country Club'],
  sharp: ['Poker Room', 'Country Club'],
  whale: ['Country Club', 'Poker Room'],
  deadbeat: ['Pool Hall', 'The Docks', 'Warehouse District'],
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate collection missions based on current debts (max 4)
export function generateCollectionMissions(debts: Debt[], customers: Customer[]): Mission[] {
  // Only show up to 4 debts at a time
  const limitedDebts = debts.slice(0, 4);

  return limitedDebts.map((debt) => {
    const customer = customers.find((c) => c.id === debt.customerId);
    const name = customer?.name || 'Unknown';

    // First attempt costs 1 energy, after that need to "rough them up" for 2 energy
    const energyCost = debt.attempts > 0 ? 2 : 1;
    const description = debt.attempts > 0
      ? `${name} dodged you before. Time to rough them up. ($${debt.amount})`
      : `${name} owes you $${debt.amount}. Find them and get your money.`;

    return {
      id: generateId(),
      type: 'collect' as MissionType,
      title: `Collect from ${name}`,
      description,
      location: debt.location,
      energyCost,
      moneyCost: 0,
      risk: 0.05, // Small chance of trouble
      reward: {
        debtCollected: debt.customerId,
        money: debt.amount,
      },
    };
  });
}

// Generate recruitment missions
export function generateRecruitmentMissions(heat: number): Mission[] {
  const missions: Mission[] = [];

  // Always offer 1-2 recruitment options
  const numMissions = Math.floor(Math.random() * 2) + 1;

  const customerTypes: CustomerType[] = ['square', 'square', 'sharp', 'whale', 'deadbeat'];

  for (let i = 0; i < numMissions; i++) {
    const type = randomChoice(customerTypes);
    const location = randomChoice(RECRUIT_LOCATIONS[type]);

    const typeDescriptions: Record<CustomerType, string> = {
      square: 'casual bettor who loves favorites',
      sharp: 'sharp player who knows value',
      whale: 'high roller with deep pockets',
      deadbeat: 'sketchy character who might not pay',
    };

    missions.push({
      id: generateId(),
      type: 'recruit',
      title: `Find new customer at ${location}`,
      description: `Word is there's a ${typeDescriptions[type]} looking for a book.`,
      location,
      energyCost: 2,
      moneyCost: type === 'whale' ? 100 : 0, // Have to buy drinks for whales
      risk: type === 'deadbeat' ? 0.3 : 0.1,
      reward: {
        newCustomer: type,
      },
    });
  }

  return missions;
}

// Generate avoid heat missions
export function generateHeatMissions(heat: number): Mission[] {
  const missions: Mission[] = [];

  if (heat > 20) {
    missions.push({
      id: generateId(),
      type: 'avoid_heat',
      title: 'Lay low',
      description: 'Stay home and keep a low profile. Reduce police attention.',
      location: 'Home',
      energyCost: 1,
      moneyCost: 0,
      risk: 0,
      reward: {
        heat: -10,
      },
    });
  }

  if (heat > 40) {
    missions.push({
      id: generateId(),
      type: 'avoid_heat',
      title: 'Grease some palms',
      description: 'Pay off a contact to make some attention go away.',
      location: 'Downtown',
      energyCost: 1,
      moneyCost: 500,
      risk: 0.1,
      reward: {
        heat: -25,
      },
    });
  }

  if (heat > 60) {
    missions.push({
      id: generateId(),
      type: 'avoid_heat',
      title: 'Get out of town',
      description: 'Take a quick trip until things cool down.',
      location: 'Out of Town',
      energyCost: 2,
      moneyCost: 1000,
      risk: 0,
      reward: {
        heat: -40,
      },
    });
  }

  return missions;
}

// Generate rest mission (always available)
export function generateRestMission(): Mission {
  return {
    id: generateId(),
    type: 'rest',
    title: 'Take it easy',
    description: 'Rest up and recover your energy for tomorrow.',
    location: 'Home',
    energyCost: 0,
    moneyCost: 0,
    risk: 0,
    reward: {
      energy: 1,
    },
  };
}

// Generate hedge missions based on current exposure
export function generateHedgeMissions(games: Game[], bets: Bet[]): Mission[] {
  const missions: Mission[] = [];

  for (const game of games) {
    if (game.isComplete) continue;

    // Calculate exposure on this game
    const gameBets = bets.filter((b) => b.gameId === game.id);
    const homeBets = gameBets.filter((b) => b.pick === 'home');
    const awayBets = gameBets.filter((b) => b.pick === 'away');
    const homeAmount = homeBets.reduce((sum, b) => sum + b.amount, 0);
    const awayAmount = awayBets.reduce((sum, b) => sum + b.amount, 0);
    const totalAction = homeAmount + awayAmount;

    // Only offer hedge if there's significant imbalanced action (>$500 and >60/40 split)
    if (totalAction < 500) continue;
    const imbalance = Math.abs(homeAmount - awayAmount);
    const imbalancePercent = imbalance / totalAction;
    if (imbalancePercent < 0.2) continue;

    const heavySide = homeAmount > awayAmount ? 'home' : 'away';
    const heavyTeam = heavySide === 'home' ? game.homeTeam.city : game.awayTeam.city;
    const hedgeCost = Math.round(imbalance * 0.1); // 10% vig to hedge

    missions.push({
      id: generateId(),
      type: 'hedge',
      title: `Layoff ${heavyTeam} action`,
      description: `Hedge $${imbalance.toLocaleString()} exposure at another book. Costs 10% vig.`,
      location: 'Phone',
      energyCost: 1,
      moneyCost: hedgeCost,
      risk: 0.05, // Small chance the other book doesn't answer
      targetGameId: game.id,
      reward: {
        hedgeGameId: game.id,
      },
    });
  }

  return missions;
}

// Generate scout mission - reveals market lines for all games
export function generateScoutMission(hasScoutedThisWeek: boolean): Mission | null {
  if (hasScoutedThisWeek) return null;

  return {
    id: generateId(),
    type: 'scout',
    title: 'Scout the competition',
    description: 'Check what lines the sharp books are running. Reveals market lines for all games.',
    location: 'Various',
    energyCost: 2,
    moneyCost: 0,
    risk: 0,
    reward: {
      revealMarketLines: true,
    },
  };
}

// Generate schmooze missions for customers
export function generateSchmoozeMissions(customers: Customer[]): Mission[] {
  const missions: Mission[] = [];

  // Only offer schmooze for active customers who could improve
  const improvableCustomers = customers.filter((c) =>
    c.isActive && (c.reliability < 0.95 || c.maxBet < 2000)
  );

  // Offer 1-2 schmooze options
  const shuffled = [...improvableCustomers].sort(() => Math.random() - 0.5);
  const toOffer = shuffled.slice(0, 2);

  for (const customer of toOffer) {
    const isWhale = customer.type === 'whale';
    const cost = isWhale ? 200 : 50;
    const location = isWhale ? 'Country Club' : 'Sports Bar';

    missions.push({
      id: generateId(),
      type: 'schmooze',
      title: `Buy drinks for ${customer.name}`,
      description: `Schmooze ${customer.name}. Improves reliability and may increase their bet size.`,
      location,
      energyCost: 1,
      moneyCost: cost,
      risk: 0,
      targetCustomerId: customer.id,
      reward: {
        improveCustomerId: customer.id,
      },
    });
  }

  return missions;
}

// Generate fix game mission - desperate chaos option
export function generateFixGameMission(games: Game[], bets: Bet[], bankroll: number): Mission | null {
  // Only available if you have significant exposure on a game
  for (const game of games) {
    if (game.isComplete) continue;

    const gameBets = bets.filter((b) => b.gameId === game.id);
    const homeBets = gameBets.filter((b) => b.pick === 'home');
    const awayBets = gameBets.filter((b) => b.pick === 'away');
    const homeAmount = homeBets.reduce((sum, b) => sum + b.amount, 0);
    const awayAmount = awayBets.reduce((sum, b) => sum + b.amount, 0);
    const totalAction = homeAmount + awayAmount;

    // Only offer if there's big action and you could afford it
    if (totalAction < 1000) continue;
    if (bankroll < 2500) continue;

    // Fix it so the side with LESS action wins (you profit)
    const fixedOutcome: 'home' | 'away' = homeAmount < awayAmount ? 'home' : 'away';
    const winningTeam = fixedOutcome === 'home' ? game.homeTeam.city : game.awayTeam.city;
    const losingBettors = fixedOutcome === 'home' ? awayAmount : homeAmount;

    return {
      id: generateId(),
      type: 'fix_game',
      title: `Fix: ${game.awayTeam.city} @ ${game.homeTeam.city}`,
      description: `Pay off a ref. ${winningTeam} wins guaranteed. You pocket $${losingBettors.toLocaleString()}. EXTREMELY risky.`,
      location: 'Warehouse District',
      energyCost: 4,
      moneyCost: 2500,
      risk: 0.15, // 15% chance of getting caught
      targetGameId: game.id,
      reward: {
        fixGameId: game.id,
        fixedOutcome,
        heat: 35, // Massive heat spike
      },
    };
  }

  return null;
}

// Generate all available missions for the current state
export function generateDailyMissions(
  debts: Debt[],
  customers: Customer[],
  heat: number,
  day: number,
  games: Game[] = [],
  bets: Bet[] = [],
  bankroll: number = 0,
  hasScoutedThisWeek: boolean = false
): Mission[] {
  const missions: Mission[] = [];

  // Collection missions (if there are debts)
  if (debts.length > 0) {
    missions.push(...generateCollectionMissions(debts, customers));
  }

  // Recruitment missions (not on game day)
  if (day < 7) {
    missions.push(...generateRecruitmentMissions(heat));
  }

  // Heat missions
  missions.push(...generateHeatMissions(heat));

  // Rest is only available once per week (day 1 - Monday)
  if (day === 1) {
    missions.push(generateRestMission());
  }

  // Schmooze missions - always available if you have customers
  if (customers.length > 0 && day < 7) {
    missions.push(...generateSchmoozeMissions(customers));
  }

  // Scout mission - available once per week until used
  if (!hasScoutedThisWeek && day < 7) {
    const scoutMission = generateScoutMission(hasScoutedThisWeek);
    if (scoutMission) {
      missions.push(scoutMission);
    }
  }

  // Hedge missions - only after bets start coming in (day 2+)
  if (day >= 2 && day < 7 && bets.length > 0) {
    missions.push(...generateHedgeMissions(games, bets));
  }

  // Fix game mission - desperate option, only late in week with big exposure
  if (day >= 5 && day < 7) {
    const fixMission = generateFixGameMission(games, bets, bankroll);
    if (fixMission) {
      missions.push(fixMission);
    }
  }

  return missions;
}

// Execute a mission and return the result
export interface MissionResult {
  success: boolean;
  message: string;
  moneyChange: number;
  heatChange: number;
  newCustomer?: Customer;
  debtCollected?: string;
  energyChange: number;
}

export function executeMission(
  mission: Mission,
  bankroll: number
): MissionResult {
  // Check if mission succeeds (based on risk)
  const succeeded = Math.random() > mission.risk;

  if (!succeeded) {
    // Mission failed
    const heatGain = mission.type === 'collect' ? 15 :
                     mission.type === 'recruit' ? 5 : 0;

    return {
      success: false,
      message: getMissionFailureMessage(mission),
      moneyChange: -mission.moneyCost,
      heatChange: heatGain,
      energyChange: -mission.energyCost,
    };
  }

  // Mission succeeded
  return {
    success: true,
    message: getMissionSuccessMessage(mission),
    moneyChange: (mission.reward.money || 0) - mission.moneyCost,
    heatChange: mission.reward.heat || (mission.type === 'collect' ? 5 : 0),
    newCustomer: mission.reward.newCustomer ? undefined : undefined, // Customer created elsewhere
    debtCollected: mission.reward.debtCollected,
    energyChange: (mission.reward.energy || 0) - mission.energyCost,
  };
}

function getMissionSuccessMessage(mission: Mission): string {
  switch (mission.type) {
    case 'collect':
      return `Collection successful! Got the money.`;
    case 'recruit':
      return `Found a new customer at ${mission.location}!`;
    case 'avoid_heat':
      return `Managed to reduce some heat.`;
    case 'rest':
      return `Feeling rested and ready.`;
    case 'hedge':
      return `Layoff accepted. Your exposure is covered.`;
    case 'scout':
      return `Scouted the competition. You can now see market lines for all games.`;
    case 'schmooze':
      return `Good time! They're more loyal now and might bet bigger.`;
    case 'fix_game':
      return `The fix is in. This one's guaranteed. Keep your head down.`;
    default:
      return 'Mission complete.';
  }
}

function getMissionFailureMessage(mission: Mission): string {
  switch (mission.type) {
    case 'collect':
      return `Things got heated. They got away and now there's more attention on you.`;
    case 'recruit':
      return `The contact was a bust. Wasted trip.`;
    case 'avoid_heat':
      return `Your contact got cold feet. Money wasted.`;
    case 'hedge':
      return `The other book wouldn't take the action. You're still exposed.`;
    case 'scout':
      return `Couldn't get good intel. Try again next week.`;
    case 'schmooze':
      return `They weren't in the mood. Wasted the drinks.`;
    case 'fix_game':
      return `The ref got cold feet! You're out the money and now there's heat on you.`;
    default:
      return 'Something went wrong.';
  }
}

// Get a random location for a new debt
export function getRandomDebtLocation(): string {
  return randomChoice(LOCATIONS);
}
