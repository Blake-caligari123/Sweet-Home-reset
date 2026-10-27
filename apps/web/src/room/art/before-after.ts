import { drawCrumb } from './crumbs';
import { dingeAlpha, dingeLayer, dullen } from '../../shared/art/dull';
import { PixelCanvas } from '../../shared/art/pixel-canvas';
import { drawDustBunny, drawItem, ITEM_SIZE } from './props';
import { drawDecor, drawRoom, drawStageOverlay } from './room-art';
import { DirtMap } from '../game/dirt';
import { ROOM_H, ROOM_W, type DecorDef, type RoomDef } from '../game/pack';
import { scatter, type RoomSession } from '../game/session';

/** The room exactly as it looked when the mess began: drained, stained, cluttered. */
export function composeBefore(room: RoomDef, seed: number, decor: DecorDef[] = []) {
  const clean = drawRoom(room);
  clean.draw(drawDecor(decor), 0, 0);
  const dull = dullen(clean);
  const dirt = new DirtMap(room.tasks, seed);
  const out = clean.clone();
  out.blend(dingeLayer(dull, dirt.owner, room.theme.wallHeight, seed), 0, 0, dingeAlpha(0));
  const film = new PixelCanvas(ROOM_W, ROOM_H);
  dirt.paint(film.data, undefined, dull.data);
  out.blend(film);
  room.tasks.forEach((task) => {
    if (task.type === 'vacuum') scatter(task.areas, task.count, seed * 104729 + task.seed).forEach((c, i) => out.draw(drawCrumb(i), c.x - 1, c.y - 1));
    if (task.type === 'pop') task.bunnies.forEach((b, i) => out.draw(drawDustBunny((i % 2) as 0 | 1), b.x - 7, b.y - 11));
    if (task.type === 'sort') task.items.forEach((it) => out.draw(drawItem(it.kind), it.x - ITEM_SIZE / 2, it.y - ITEM_SIZE / 2));
  });
  return out;
}

/** The restored room with every stage reveal and the player's decor. */
export function composeAfter(room: RoomDef, decor: DecorDef[] = []) {
  const out = drawRoom(room);
  for (const effects of Object.values(room.stageArt)) {
    for (const effect of effects ?? []) {
      if (effect.effect === 'swap' || effect.effect === 'sunbeam' || effect.effect === 'glow') out.blend(drawStageOverlay(room, effect));
    }
  }
  out.draw(drawDecor(decor), 0, 0);
  return out;
}

/** The room as it stands mid-mess, for the home screen thumbnails. */
export function composeProgress(room: RoomDef, session: RoomSession, decor: DecorDef[] = []) {
  const clean = drawRoom(room);
  clean.draw(drawDecor(decor), 0, 0);
  const dull = dullen(clean);
  const out = clean.clone();
  out.blend(dingeLayer(dull, session.dirt.owner, room.theme.wallHeight, session.seed), 0, 0, dingeAlpha(session.stage));
  const film = new PixelCanvas(ROOM_W, ROOM_H);
  session.dirt.paint(film.data, undefined, dull.data);
  out.blend(film);
  room.tasks.forEach((task, t) => {
    if (task.type === 'vacuum') session.crumbs[t].forEach((c, i) => { if (!session.vacuumed[t][i]) out.draw(drawCrumb(i), c.x - 1, c.y - 1); });
    if (task.type === 'pop') task.bunnies.forEach((b, i) => { if (!session.popped[t][i]) out.draw(drawDustBunny((i % 2) as 0 | 1), b.x - 7, b.y - 11); });
    if (task.type === 'sort') task.items.forEach((it, i) => { if (!session.placed[t][i]) out.draw(drawItem(it.kind), it.x - ITEM_SIZE / 2, it.y - ITEM_SIZE / 2); });
  });
  return out;
}
