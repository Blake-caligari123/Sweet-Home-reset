import { describe, expect, it } from 'vitest';
import { Content } from '../data/content';
import { hollowfern as pack } from '../data/test-pack';
import type { Neighbours } from '../neighbours/neighbours';
import type { Clock } from '../play/clock';
import { TownState } from '../state';
import { TownLife } from './town-life';

describe('town life dramas', () => {
  const life = (inTown: string[], day: number) => {
    const state = new TownState();
    const neighbours = { arrived: (id: string) => inTown.includes(id) } as unknown as Neighbours;
    return new TownLife({ state, content: new Content(pack), clock: { state: { day, minutes: 600 } } as Clock, neighbours, tidiness: () => 0.5 });
  };

  it('waits for a newcomer: Fig and Pip\'s drama only brews once Fig has moved in', () => {
    const day = pack.dramas!.find((d) => d.id === 'seedlings')!.fromDay;
    expect(life(['pip'], day).brewing('pip')).not.toContain('seedlings');
    expect(life(['pip'], day).dramaStep('fig')).toBeNull();
    expect(life(['pip', 'fig'], day).brewing('pip')).toContain('seedlings');
    expect(life(['pip', 'fig'], day).dramaStep('fig')?.line).toBe('drama.seedlings.1');
  });
});
