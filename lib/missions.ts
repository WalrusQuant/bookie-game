import { Mission, MissionType, Debt, Customer, CustomerType } from './types';

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

// Generate all available missions for the current state
export function generateDailyMissions(
  debts: Debt[],
  customers: Customer[],
  heat: number,
  day: number
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

  // Rest is only available on odd days (1, 3, 5)
  if (day % 2 === 1) {
    missions.push(generateRestMission());
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
    default:
      return 'Something went wrong.';
  }
}

// Get a random location for a new debt
export function getRandomDebtLocation(): string {
  return randomChoice(LOCATIONS);
}
