'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { GameState, GameAction } from '@/lib/types';
import { gameReducer, createInitialState } from '@/lib/gameState';

const STORAGE_KEY = 'bookie-game-save';

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  saveGame: () => void;
  loadGame: () => boolean;
  hasSavedGame: () => boolean;
  isHydrated: boolean;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);

  // Load from localStorage after hydration
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const loadedState = JSON.parse(saved) as GameState;
        dispatch({ type: 'LOAD_GAME', payload: loadedState });
      } catch {
        // Invalid save, keep fresh state
      }
    }
    setIsHydrated(true);
  }, []);

  // Auto-save on state changes (only after hydration)
  useEffect(() => {
    if (isHydrated && !state.isGameOver) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isHydrated]);

  const saveGame = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const loadGame = useCallback((): boolean => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const loadedState = JSON.parse(saved) as GameState;
        dispatch({ type: 'LOAD_GAME', payload: loadedState });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  const hasSavedGame = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const savedState = JSON.parse(saved) as GameState;
        return !savedState.isGameOver;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch, saveGame, loadGame, hasSavedGame, isHydrated }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
