import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearFactoryFloorStorage,
  FACTORY_EDGES_STORAGE_KEY,
  FACTORY_LAYOUT_STORAGE_KEY,
  loadFactoryEdges,
  loadFactoryLayout,
  normalizeFactoryEdges,
  saveFactoryEdges,
  saveFactoryLayout,
} from '@/lib/factory-floor-storage';

describe('factory floor storage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads and clamps persisted layout values', () => {
    localStorage.setItem(FACTORY_LAYOUT_STORAGE_KEY, JSON.stringify({
      alpha: { x: -20, y: 140 },
      beta: { x: 20, y: 30 },
    }));

    expect(loadFactoryLayout()).toEqual({
      alpha: { x: 5, y: 95 },
      beta: { x: 20, y: 30 },
    });
  });

  it('saves and reloads manual edges', () => {
    saveFactoryEdges([
      { from: 'a', to: 'b' },
      { from: 'b', to: 'c' },
    ]);

    expect(loadFactoryEdges()).toEqual([
      { from: 'a', to: 'b' },
      { from: 'b', to: 'c' },
    ]);
  });

  it('normalizes manual edges by removing duplicates and self-links', () => {
    expect(normalizeFactoryEdges([
      { from: 'a', to: 'b' },
      { from: 'a', to: 'b' },
      { from: 'a', to: 'a' },
      { from: ' b ', to: ' c ' },
    ])).toEqual([
      { from: 'a', to: 'b' },
      { from: 'b', to: 'c' },
    ]);
  });

  it('clears both layout and edge keys', () => {
    saveFactoryLayout({ alpha: { x: 10, y: 10 } });
    saveFactoryEdges([{ from: 'alpha', to: 'beta' }]);

    clearFactoryFloorStorage();

    expect(localStorage.getItem(FACTORY_LAYOUT_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(FACTORY_EDGES_STORAGE_KEY)).toBeNull();
  });
});
