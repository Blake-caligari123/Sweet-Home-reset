import type { Sound } from '../../shared/audio/sound';
import type { Content } from '../data/content';
import type { View } from '../ui/view';
import type { World } from '../world/world';
import { passed, reached, type AliveStage } from './alive';

/** A Puff line, then the next one a beat later (lines are split with `|`). */
const LINE_GAP_MS = 2400;

/** The music layers this many stages have switched on. */
function bloomOf(stages: AliveStage[], count: number) {
  return Math.max(0, ...stages.slice(0, count).flatMap((s) => s.effects.map((e) => (e.type === 'music' ? e.bloom : 0))));
}

/**
 * A home coming alive in play: on entering, show what the room has already reached; as it gets
 * tidier, switch the next stage on with a chime, a sparkle and Puff's line, and let the music bloom.
 */
export class HomeLife {
  private area = '';
  private stages: AliveStage[] = [];
  private progress = 0;

  constructor(private host: { world: World; view: View; sound: Sound; content: Content }) {}

  /** `progress`: how tidy the room is, 1 once restored. */
  enter(area: string, stages: AliveStage[], progress: number) {
    Object.assign(this, { area, stages, progress });
    const n = reached(stages, progress);
    this.host.world.alive.load(stages, n);
    this.host.sound.bloom = bloomOf(stages, n);
  }

  /** Each frame: any stage just passed switches on. */
  tick(area: string, progress: number) {
    if (area !== this.area || progress <= this.progress) return;
    const { world, view, sound, content } = this.host;
    for (const i of passed(this.stages, this.progress, progress)) {
      const stage = this.stages[i];
      world.alive.add(stage);
      for (const e of stage.effects) if ('x' in e) world.sparkleBurst(Math.floor(e.x), Math.floor(e.y), 10);
      view.feedback('chime', 'light');
      (content.line(stage.say) ?? '').split('|').forEach((line, k) => window.setTimeout(() => view.say(line), k * LINE_GAP_MS));
    }
    sound.bloom = bloomOf(this.stages, reached(this.stages, progress));
    this.progress = progress;
  }
}
