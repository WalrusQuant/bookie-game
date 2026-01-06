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
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
        <h2 className="text-lg font-bold mb-2">Missions</h2>
        <p className="text-neutral-500 text-sm">No missions available right now.</p>
      </div>
    );
  }

  const handleMission = (missionId: string) => {
    dispatch({ type: 'DO_MISSION', payload: { missionId } });
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Missions</h2>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">ENERGY</span>
            <span className="font-mono">{energy}/{state.maxEnergy}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={heat > 60 ? 'text-red-500' : heat > 30 ? 'text-orange-500' : 'text-blue-500'}>
              HEAT
            </span>
            <span className="font-mono">{heat}%</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
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
  };

  const typeLabels: Record<string, string> = {
    collect: 'COLLECT',
    recruit: 'RECRUIT',
    avoid_heat: 'LAY LOW',
    rest: 'REST',
  };

  return (
    <div
      className={`border rounded-lg p-3 ${
        canAfford ? 'border-neutral-700 bg-neutral-800/50' : 'border-neutral-800 bg-neutral-900/50 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 border rounded ${typeColors[mission.type]}`}>
              {typeLabels[mission.type]}
            </span>
            <span className="text-neutral-500 text-xs">{mission.location}</span>
          </div>
          <h3 className="font-medium">{mission.title}</h3>
          <p className="text-neutral-400 text-sm mt-1">{mission.description}</p>

          <div className="flex items-center gap-4 mt-2 text-xs">
            {mission.energyCost > 0 && (
              <span className="text-yellow-500">
                -{mission.energyCost} Energy
              </span>
            )}
            {mission.moneyCost > 0 && (
              <span className="text-red-500">
                -${mission.moneyCost}
              </span>
            )}
            {mission.risk > 0 && (
              <span className="text-orange-500">
                {Math.round(mission.risk * 100)}% Risk
              </span>
            )}
            {mission.reward.money && (
              <span className="text-green-500">
                +${mission.reward.money}
              </span>
            )}
            {mission.reward.heat && (
              <span className={mission.reward.heat < 0 ? 'text-blue-500' : 'text-red-500'}>
                {mission.reward.heat > 0 ? '+' : ''}{mission.reward.heat} Heat
              </span>
            )}
            {mission.reward.energy && (
              <span className="text-purple-500">
                +{mission.reward.energy} Energy
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onExecute}
          disabled={!canAfford}
          className={`ml-4 px-4 py-2 rounded text-sm font-medium transition-colors ${
            canAfford
              ? 'bg-green-600 hover:bg-green-500 text-black'
              : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
          }`}
        >
          GO
        </button>
      </div>
    </div>
  );
}
