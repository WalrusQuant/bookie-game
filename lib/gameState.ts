import {
  GameState,
  GameAction,
  Game,
  Bet,
  Debt,
  CollectionAction,
  NonPayerPopup,
  STARTING_BANKROLL,
  STARTING_ENERGY,
  MAX_ENERGY,
  BANKRUPTCY_THRESHOLD,
  WIN_THRESHOLD,
  HEAT_THRESHOLD,
  JUICE,
  GAME_DAY,
  ACTION_COSTS,
} from './types';
import { generateTeams, generateWeeklyMatchups, generateGameNews, updateTeamRecords } from './teams';
import { calculateTrueLine } from './lines';
import { generateStartingCustomers, generateCustomerBets, generateCustomer } from './customers';
import { simulateGame, resolveBets, calculatePayout } from './simulation';
import { generateDailyMissions, executeMission, getRandomDebtLocation } from './missions';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function createWeekGames(teams: GameState['teams'], week: number): Game[] {
  const matchups = generateWeeklyMatchups(teams);

  return matchups.map((matchup, index) => {
    const trueLine = calculateTrueLine(matchup.home, matchup.away);
    const baseGame: Game = {
      id: `game-${week}-${index}`,
      week,
      homeTeam: matchup.home,
      awayTeam: matchup.away,
      trueLine,
      marketLine: trueLine,
      yourLine: trueLine,
      isComplete: false,
      news: [],
    };

    baseGame.news = generateGameNews(baseGame);
    return baseGame;
  });
}

function createInitialState(): GameState {
  const teams = generateTeams();
  const games = createWeekGames(teams, 1);
  const customers = generateStartingCustomers();

  return {
    week: 1,
    day: 1,
    bankroll: STARTING_BANKROLL,
    startingBankroll: STARTING_BANKROLL,
    energy: STARTING_ENERGY,
    maxEnergy: MAX_ENERGY,
    heat: 0,
    teams,
    games,
    customers,
    bets: [],
    debts: [],
    log: [
      {
        id: generateId(),
        week: 1,
        day: 1,
        message: `Week 1 begins. You have $${STARTING_BANKROLL.toLocaleString()} to start your book. Set your lines!`,
        type: 'info',
      },
    ],
    availableMissions: generateDailyMissions([], customers, 0, 1, games, [], STARTING_BANKROLL, false),
    actionsToday: 0,
    betsReceivedToday: false,
    isGameOver: false,
    hasScoutedThisWeek: false,
    hedgedGames: [],
    fixedGames: [],
  };
}

// Reveal news for current day and update market lines
function revealDailyNews(state: GameState): GameState {
  const updatedGames = state.games.map((game) => {
    if (game.week !== state.week || game.isComplete) return game;

    const updatedNews = game.news.map((n) =>
      n.day <= state.day ? { ...n, isRevealed: true } : n
    );

    const newsImpact = updatedNews
      .filter((n) => n.isRevealed)
      .reduce((sum, n) => sum + n.impact, 0);

    return {
      ...game,
      news: updatedNews,
      marketLine: Math.round((game.trueLine + newsImpact) * 2) / 2,
    };
  });

  return { ...state, games: updatedGames };
}

// Generate bets from customers
function receiveBets(state: GameState): GameState {
  if (state.betsReceivedToday || state.day === GAME_DAY) return state;

  const newBets: Bet[] = [];
  const logEntries: typeof state.log = [];

  for (const customer of state.customers.filter((c) => c.isActive)) {
    const customerBets = generateCustomerBets(
      customer,
      state.games.filter((g) => g.week === state.week && !g.isComplete),
      state.bankroll
    );

    for (const bet of customerBets) {
      const game = state.games.find((g) => g.id === bet.gameId);
      if (game) {
        newBets.push({
          id: generateId(),
          customerId: customer.id,
          gameId: bet.gameId,
          amount: bet.amount,
          pick: bet.pick,
          line: game.yourLine,
          dayPlaced: state.day,
          isPaid: false,
        });
      }
    }
  }

  if (newBets.length > 0) {
    const totalAction = newBets.reduce((sum, b) => sum + b.amount, 0);
    logEntries.push({
      id: generateId(),
      week: state.week,
      day: state.day,
      message: `${newBets.length} bets received totaling $${totalAction.toLocaleString()}`,
      type: 'info',
    });
  }

  return {
    ...state,
    bets: [...state.bets, ...newBets],
    betsReceivedToday: true,
    log: [...state.log, ...logEntries],
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return createInitialState();

    case 'LOAD_GAME':
      return action.payload;

    case 'SET_LINE': {
      const { gameId, line } = action.payload;
      return {
        ...state,
        games: state.games.map((game) =>
          game.id === gameId ? { ...game, yourLine: line } : game
        ),
      };
    }

    case 'DO_MISSION': {
      const { missionId } = action.payload;
      const mission = state.availableMissions.find((m) => m.id === missionId);

      if (!mission) return state;
      if (state.energy < mission.energyCost) return state;
      if (state.bankroll < mission.moneyCost) return state;

      const result = executeMission(mission, state.bankroll);

      let newCustomers = state.customers;
      let newDebts = state.debts;
      let newGames = state.games;
      let newHasScoutedThisWeek = state.hasScoutedThisWeek;
      let newHedgedGames = [...state.hedgedGames];
      let newFixedGames = [...state.fixedGames];

      if (result.success && mission.reward.newCustomer) {
        const newCustomer = generateCustomer(mission.reward.newCustomer);
        newCustomer.location = mission.location;
        newCustomers = [...state.customers, newCustomer];
      }

      if (result.success && result.debtCollected) {
        newDebts = state.debts.filter((d) => d.customerId !== result.debtCollected);
      }

      // Handle hedge mission - mark game as hedged
      if (result.success && mission.type === 'hedge' && mission.reward.hedgeGameId) {
        newHedgedGames.push(mission.reward.hedgeGameId);
      }

      // Handle scout mission - reveal market lines for all games
      if (result.success && mission.type === 'scout' && mission.reward.revealMarketLines) {
        newHasScoutedThisWeek = true;
        // Market lines are already visible via hasScoutedThisWeek flag
      }

      // Handle schmooze mission - improve customer reliability and bet size
      if (result.success && mission.type === 'schmooze' && mission.reward.improveCustomerId) {
        const targetId = mission.reward.improveCustomerId;
        newCustomers = state.customers.map((c) => {
          if (c.id !== targetId) return c;
          return {
            ...c,
            reliability: Math.min(1, c.reliability + 0.1),
            maxBet: Math.round(c.maxBet * 1.25), // 25% increase
          };
        });
      }

      // Handle fix game mission - add to fixed games list
      if (result.success && mission.type === 'fix_game' && mission.reward.fixGameId && mission.reward.fixedOutcome) {
        newFixedGames.push({
          gameId: mission.reward.fixGameId,
          outcome: mission.reward.fixedOutcome,
        });
      }

      const newBankroll = state.bankroll + result.moneyChange;
      const newHeat = Math.max(0, Math.min(100, state.heat + result.heatChange));
      const newEnergy = Math.max(0, state.energy + result.energyChange); // energyChange already includes -energyCost

      let isGameOver = false;
      let gameOverReason: string | undefined;

      if (newBankroll <= BANKRUPTCY_THRESHOLD) {
        isGameOver = true;
        gameOverReason = `You went bust! Bankroll dropped to $${newBankroll.toLocaleString()}.`;
      } else if (newHeat >= HEAT_THRESHOLD) {
        isGameOver = true;
        gameOverReason = `The heat got too high. Time to disappear.`;
      }

      return {
        ...state,
        bankroll: newBankroll,
        heat: newHeat,
        energy: newEnergy,
        customers: newCustomers,
        debts: newDebts,
        games: newGames,
        hasScoutedThisWeek: newHasScoutedThisWeek,
        hedgedGames: newHedgedGames,
        fixedGames: newFixedGames,
        actionsToday: state.actionsToday + 1,
        availableMissions: state.availableMissions.filter((m) => m.id !== missionId),
        log: [
          ...state.log,
          {
            id: generateId(),
            week: state.week,
            day: state.day,
            message: result.message,
            type: result.success ? 'info' : 'warning',
          },
        ],
        isGameOver,
        gameOverReason,
      };
    }

    case 'REST': {
      const energyGain = 3;
      const newEnergy = Math.min(state.maxEnergy, state.energy + energyGain);
      const actualGain = newEnergy - state.energy;

      return {
        ...state,
        energy: newEnergy,
        actionsToday: state.actionsToday + 1,
        log: [
          ...state.log,
          {
            id: generateId(),
            week: state.week,
            day: state.day,
            message: `Took it easy. Recovered ${actualGain} energy.`,
            type: 'info',
          },
        ],
      };
    }

    case 'COLLECT_DEBT': {
      const { customerId } = action.payload;
      const debt = state.debts.find((d) => d.customerId === customerId);
      const customer = state.customers.find((c) => c.id === customerId);

      if (!debt || !customer) return state;
      if (state.energy < ACTION_COSTS.collect) return state;

      // Collection success based on attempts (starts at 80%, increases)
      const successChance = Math.min(0.95, 0.8 + debt.attempts * 0.05);
      const success = Math.random() < successChance;

      let newBankroll = state.bankroll;
      let newDebts = state.debts;
      let newHeat = state.heat + 2; // Small heat increase for collection
      const logEntries: typeof state.log = [];

      if (success) {
        newBankroll += debt.amount;
        newDebts = state.debts.filter((d) => d.customerId !== customerId);
        logEntries.push({
          id: generateId(),
          week: state.week,
          day: state.day,
          message: `Collected $${debt.amount} from ${customer.name}.`,
          type: 'win',
        });
      } else {
        newDebts = state.debts.map((d) =>
          d.customerId === customerId ? { ...d, attempts: d.attempts + 1 } : d
        );
        logEntries.push({
          id: generateId(),
          week: state.week,
          day: state.day,
          message: `${customer.name} dodged you. Try again later.`,
          type: 'warning',
        });
      }

      return {
        ...state,
        bankroll: newBankroll,
        debts: newDebts,
        heat: Math.min(100, newHeat),
        energy: state.energy - ACTION_COSTS.collect,
        actionsToday: state.actionsToday + 1,
        log: [...state.log, ...logEntries],
      };
    }

    case 'END_DAY': {
      const nextDay = state.day + 1;

      if (nextDay > 7) {
        // End of week - start new week
        const nextWeek = state.week + 1;
        const newGames = createWeekGames(state.teams, nextWeek);
        const allGames = [...state.games, ...newGames];

        let newState: GameState = {
          ...state,
          week: nextWeek,
          day: 1,
          energy: MAX_ENERGY, // Reset to full energy at start of week
          games: allGames,
          availableMissions: generateDailyMissions(state.debts, state.customers, state.heat, 1, allGames, [], state.bankroll, false),
          actionsToday: 0,
          betsReceivedToday: false,
          hasScoutedThisWeek: false, // Reset scouting for new week
          hedgedGames: [], // Reset hedged games
          fixedGames: [], // Reset fixed games
          log: [
            ...state.log,
            {
              id: generateId(),
              week: nextWeek,
              day: 1,
              message: `Week ${nextWeek} begins. Bankroll: $${state.bankroll.toLocaleString()}`,
              type: 'info',
            },
          ],
        };

        // Reveal day 1 news
        newState = revealDailyNews(newState);
        return newState;
      }

      // Normal day transition - add 4 energy (capped at max) and reduce heat by 10%
      const restEnergy = Math.min(state.maxEnergy, state.energy + 4);
      const reducedHeat = Math.max(0, state.heat - 10);
      let newState: GameState = {
        ...state,
        day: nextDay,
        energy: restEnergy,
        heat: reducedHeat,
        availableMissions: generateDailyMissions(
          state.debts,
          state.customers,
          reducedHeat,
          nextDay,
          state.games,
          state.bets,
          state.bankroll,
          state.hasScoutedThisWeek
        ),
        actionsToday: 0,
        betsReceivedToday: false,
        log: [
          ...state.log,
          {
            id: generateId(),
            week: state.week,
            day: nextDay,
            message: `Day ${nextDay}${nextDay === GAME_DAY ? ' - Game Day!' : ''}`,
            type: 'info',
          },
        ],
      };

      // Reveal news for new day
      newState = revealDailyNews(newState);

      // Receive bets automatically (except game day)
      if (nextDay !== GAME_DAY) {
        newState = receiveBets(newState);
      }

      return newState;
    }

    case 'SIMULATE_GAMES': {
      if (state.day !== GAME_DAY) return state;

      let updatedTeams = state.teams;
      const updatedGames = state.games.map((game) => {
        if (game.isComplete || game.week !== state.week) return game;

        // Check if this game is fixed
        const fixedGame = state.fixedGames.find((fg) => fg.gameId === game.id);

        let homeScore: number;
        let awayScore: number;

        if (fixedGame) {
          // Fixed game - force the outcome
          if (fixedGame.outcome === 'home') {
            // Home team wins by a margin that covers any spread
            homeScore = 28 + Math.floor(Math.random() * 14);
            awayScore = homeScore - 10 - Math.floor(Math.random() * 10);
          } else {
            // Away team wins
            awayScore = 28 + Math.floor(Math.random() * 14);
            homeScore = awayScore - 10 - Math.floor(Math.random() * 10);
          }
        } else {
          // Normal simulation
          const result = simulateGame(game.homeTeam, game.awayTeam);
          homeScore = result.homeScore;
          awayScore = result.awayScore;
        }

        updatedTeams = updateTeamRecords(
          updatedTeams,
          game.homeTeam.id,
          game.awayTeam.id,
          homeScore,
          awayScore
        );

        return {
          ...game,
          homeScore,
          awayScore,
          isComplete: true,
        };
      });

      // Resolve bets with detailed tracking
      const resolvedBets: Bet[] = [];
      let newDebts: Debt[] = [...state.debts];
      const logEntries: typeof state.log = [];
      const potentialNonPayers: { customerId: string; customerName: string; amount: number }[] = [];

      // Analytics tracking
      let totalBetCount = 0;
      let customerWins = 0;      // Count of bets customers won
      let customerLosses = 0;    // Count of bets customers lost
      let moneyOut = 0;          // What we paid to winning customers
      let moneyIn = 0;           // What losing customers paid us
      let unpaidDebts = 0;       // Money owed but not paid

      for (const game of updatedGames.filter((g) => g.week === state.week && g.isComplete)) {
        const gameBets = state.bets.filter(
          (b) => b.gameId === game.id && b.isWin === undefined
        );
        const resolved = resolveBets(game, gameBets);

        for (const bet of resolved) {
          totalBetCount++;
          const payout = calculatePayout(bet, JUICE);
          const customer = state.customers.find((c) => c.id === bet.customerId);

          if (bet.isWin) {
            // Customer won - we pay them
            customerWins++;
            const payoutAmount = Math.round(payout);
            moneyOut += payoutAmount;
          } else if (bet.isWin === false) {
            // Customer lost - check if they pay (most do)
            customerLosses++;
            const willTryToSkip = customer && Math.random() > customer.reliability;

            if (willTryToSkip && newDebts.length < 4) {
              // They're trying to skip - add to potential non-payers for popup
              potentialNonPayers.push({
                customerId: bet.customerId,
                customerName: customer?.name || 'Unknown',
                amount: bet.amount,
              });
              unpaidDebts += bet.amount;
            } else {
              // They pay up (or we're at max debts - write off the rest)
              moneyIn += bet.amount;
            }
          }

          resolvedBets.push({ ...bet, isPaid: bet.isWin !== false });
        }

        logEntries.push({
          id: generateId(),
          week: state.week,
          day: state.day,
          message: `${game.awayTeam.city} ${game.awayScore} @ ${game.homeTeam.city} ${game.homeScore}`,
          type: 'info',
        });
      }

      // If there are non-payers, show popup for the first one
      let pendingNonPayer: NonPayerPopup | undefined;
      if (potentialNonPayers.length > 0) {
        const firstNonPayer = potentialNonPayers[0];
        pendingNonPayer = {
          customerId: firstNonPayer.customerId,
          customerName: firstNonPayer.customerName,
          amount: firstNonPayer.amount,
        };
        // Store remaining non-payers as debts (they'll need to be dealt with too)
        for (let i = 1; i < potentialNonPayers.length && newDebts.length < 4; i++) {
          const np = potentialNonPayers[i];
          const customer = state.customers.find((c) => c.id === np.customerId);
          newDebts.push({
            customerId: np.customerId,
            amount: np.amount,
            weekIncurred: state.week,
            attempts: 0,
            location: customer?.location || getRandomDebtLocation(),
          });
          logEntries.push({
            id: generateId(),
            week: state.week,
            day: state.day,
            message: `${np.customerName} won't pay the $${np.amount} they owe!`,
            type: 'danger',
          });
        }
      }

      const weeklyPnL = moneyIn - moneyOut;
      const newBankroll = state.bankroll + weeklyPnL;

      // Add detailed weekly summary to log
      logEntries.push({
        id: generateId(),
        week: state.week,
        day: state.day,
        message: `--- WEEK ${state.week} SUMMARY ---`,
        type: 'info',
      });
      logEntries.push({
        id: generateId(),
        week: state.week,
        day: state.day,
        message: `Bets: ${totalBetCount} total (${customerWins} wins, ${customerLosses} losses)`,
        type: 'info',
      });
      logEntries.push({
        id: generateId(),
        week: state.week,
        day: state.day,
        message: `Money IN: +$${moneyIn.toLocaleString()} (from ${customerLosses} losing bets)`,
        type: 'win',
      });
      logEntries.push({
        id: generateId(),
        week: state.week,
        day: state.day,
        message: `Money OUT: -$${moneyOut.toLocaleString()} (paid to ${customerWins} winners)`,
        type: 'loss',
      });
      if (unpaidDebts > 0) {
        logEntries.push({
          id: generateId(),
          week: state.week,
          day: state.day,
          message: `Unpaid: $${unpaidDebts.toLocaleString()} (${potentialNonPayers.length} deadbeats)`,
          type: 'danger',
        });
      }
      logEntries.push({
        id: generateId(),
        week: state.week,
        day: state.day,
        message: `NET P&L: ${weeklyPnL >= 0 ? '+' : ''}$${weeklyPnL.toLocaleString()}`,
        type: weeklyPnL >= 0 ? 'win' : 'loss',
      });

      let isGameOver = false;
      let gameOverReason: string | undefined;

      if (newBankroll <= BANKRUPTCY_THRESHOLD) {
        isGameOver = true;
        gameOverReason = `You went bust! Bankroll: $${newBankroll.toLocaleString()}`;
      } else if (newBankroll >= WIN_THRESHOLD) {
        isGameOver = true;
        gameOverReason = `You made it! Bankroll: $${newBankroll.toLocaleString()}!`;
      }

      return {
        ...state,
        teams: updatedTeams,
        games: updatedGames,
        bets: state.bets.map((b) => resolvedBets.find((r) => r.id === b.id) || b),
        bankroll: newBankroll,
        debts: newDebts,
        log: [...state.log, ...logEntries],
        isGameOver,
        gameOverReason,
        pendingNonPayer,
      };
    }

    case 'HANDLE_NONPAYER': {
      const { customerId, action: collectionAction } = action.payload;
      const popup = state.pendingNonPayer;

      if (!popup || popup.customerId !== customerId) return state;

      const customer = state.customers.find((c) => c.id === customerId);
      if (!customer) return { ...state, pendingNonPayer: undefined };

      const logEntries: typeof state.log = [];
      let newBankroll = state.bankroll;
      let newEnergy = state.energy;
      let newHeat = state.heat;
      let newDebts = [...state.debts];
      let newCustomers = state.customers;

      switch (collectionAction) {
        case 'let_slide':
          // They pay up when you talk to them nicely
          newBankroll += popup.amount;
          logEntries.push({
            id: generateId(),
            week: state.week,
            day: state.day,
            message: `Talked to ${customer.name}. They paid up the $${popup.amount}.`,
            type: 'win',
          });
          break;

        case 'pressure':
          // Costs 1 energy, 80% chance they pay, small heat increase
          newEnergy = Math.max(0, newEnergy - 1);
          newHeat = Math.min(100, newHeat + 5);
          const paysPressure = Math.random() < 0.8;
          if (paysPressure) {
            newBankroll += popup.amount;
            logEntries.push({
              id: generateId(),
              week: state.week,
              day: state.day,
              message: `Put pressure on ${customer.name}. They paid the $${popup.amount}.`,
              type: 'win',
            });
          } else {
            // Add to debts (if room)
            if (newDebts.length < 4) {
              newDebts.push({
                customerId: popup.customerId,
                amount: popup.amount,
                weekIncurred: state.week,
                attempts: 1,
                location: customer.location || getRandomDebtLocation(),
              });
            }
            logEntries.push({
              id: generateId(),
              week: state.week,
              day: state.day,
              message: `${customer.name} still won't pay. They owe $${popup.amount}.`,
              type: 'danger',
            });
          }
          break;

        case 'enforce':
          // Costs 2 energy, guaranteed payment, higher heat
          newEnergy = Math.max(0, newEnergy - 2);
          newHeat = Math.min(100, newHeat + 15);
          newBankroll += popup.amount;
          logEntries.push({
            id: generateId(),
            week: state.week,
            day: state.day,
            message: `Roughed up ${customer.name}. Got the $${popup.amount}. Word gets around.`,
            type: 'warning',
          });
          break;

        case 'cut_off':
          // Lose the money, but remove them as a customer
          newCustomers = state.customers.map((c) =>
            c.id === customerId ? { ...c, isActive: false } : c
          );
          logEntries.push({
            id: generateId(),
            week: state.week,
            day: state.day,
            message: `Cut off ${customer.name}. Lost $${popup.amount} but won't deal with them again.`,
            type: 'loss',
          });
          break;
      }

      // Check for game over conditions
      let isGameOver = state.isGameOver;
      let gameOverReason = state.gameOverReason;

      if (newBankroll <= BANKRUPTCY_THRESHOLD) {
        isGameOver = true;
        gameOverReason = `You went bust! Bankroll: $${newBankroll.toLocaleString()}`;
      } else if (newHeat >= HEAT_THRESHOLD) {
        isGameOver = true;
        gameOverReason = `The heat got too high. Time to disappear.`;
      }

      return {
        ...state,
        bankroll: newBankroll,
        energy: newEnergy,
        heat: newHeat,
        debts: newDebts,
        customers: newCustomers,
        log: [...state.log, ...logEntries],
        pendingNonPayer: undefined,
        isGameOver,
        gameOverReason,
      };
    }

    case 'DISMISS_POPUP':
      return {
        ...state,
        pendingNonPayer: undefined,
      };

    case 'ADD_LOG':
      return {
        ...state,
        log: [
          ...state.log,
          {
            id: generateId(),
            week: state.week,
            day: state.day,
            message: action.payload.message,
            type: action.payload.type,
          },
        ],
      };

    default:
      return state;
  }
}

export { createInitialState };
