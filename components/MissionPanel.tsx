'use client';

import { useGame } from '@/context/GameContext';
import { Mission, GAME_DAY } from '@/lib/types';

export default function MissionPanel() {
  const { state, dispatch } = useGame();
  const { availableMissions, energy, heat, day } = state;

  // No missions on game day
  if (day === GAME_DAY) {
    return null;
  }

  // Available missions (they get removed when completed in the new system)
  const activeMissions = availableMissions;

  if (activeMissions.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
        <h2 className="text-sm font-bold mb-1">Missions</h2>
        <p className="text-neutral-500 text-sm">No missions available.</p>
      </div>
    );
  }

  const handleMission = (missionId: string) => {
    dispatch({ type: 'DO_MISSION', payload: { missionId } });
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-2 h-full flex flex-col">
      <div className="flex items-center justify-between mb-1.5 shrink-0">
        <h2 className="text-xs font-bold">Missions</h2>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-yellow-500">{energy}/{state.maxEnergy} EN</span>
          <span className={heat > 60 ? 'text-red-500' : heat > 30 ? 'text-orange-500' : 'text-blue-500'}>
            {heat}% HT
          </span>
        </div>
      </div>

      <div className="space-y-1 flex-1 min-h-0 overflow-y-auto">
        {activeMissions.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            canAfford={
              energy >= mission.energyCost &&
              state.bankroll >= mission.moneyCost
            }
            onExecute={() => handleMission(mission.id)}
          />
        ))}
      </div>
    </div>
  );
}

function MissionCard({
  mission,
  canAfford,
  onExecute,
}: {
  mission: Mission;
  canAfford: boolean;
  onExecute: () => void;
}) {
  const typeColors: Record<string, string> = {
    collect: 'text-green-500 border-green-800',
    recruit: 'text-blue-500 border-blue-800',
    avoid_heat: 'text-orange-500 border-orange-800',
    rest: 'text-purple-500 border-purple-800',
    hedge: 'text-cyan-500 border-cyan-800',
    scout: 'text-indigo-500 border-indigo-800',
    schmooze: 'text-pink-500 border-pink-800',
    fix_game: 'text-red-500 border-red-800',
  };

  const typeLabels: Record<string, string> = {
    collect: 'COLLECT',
    recruit: 'RECRUIT',
    avoid_heat: 'LAY LOW',
    rest: 'REST',
    hedge: 'HEDGE',
    scout: 'SCOUT',
    schmooze: 'SCHMOOZE',
    fix_game: 'FIX GAME',
  };

  return (
    <div
      className={`border rounded p-2 ${
        canAfford ? 'border-neutral-700 bg-neutral-800/50' : 'border-neutral-800 bg-neutral-900/50 opacity-60'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-[10px] px-1 py-0.5 border rounded ${typeColors[mission.type]}`}>
          {typeLabels[mission.type]}
        </span>
        <span className="text-neutral-500 text-[10px]">{mission.location}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs">{mission.title}</div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] mt-0.5">
            {mission.energyCost > 0 && (
              <span className="text-yellow-500">-{mission.energyCost} EN</span>
            )}
            {mission.moneyCost > 0 && (
              <span className="text-red-500">-${mission.moneyCost}</span>
            )}
            {mission.risk > 0 && (
              <span className="text-orange-500">{Math.round(mission.risk * 100)}% Risk</span>
            )}
            {mission.reward.money && (
              <span className="text-green-500">+${mission.reward.money}</span>
            )}
            {mission.reward.heat && (
              <span className={mission.reward.heat < 0 ? 'text-blue-500' : 'text-red-500'}>
                {mission.reward.heat > 0 ? '+' : ''}{mission.reward.heat} HT
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onExecute}
          disabled={!canAfford}
          className={`px-3 py-1 rounded text-xs font-bold shrink-0 transition-colors ${
            canAfford
              ? 'bg-green-600 hover:bg-green-500 active:bg-green-400 text-black'
              : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
          }`}
        >
          GO
        </button>
      </div>
    </div>
  );
}
