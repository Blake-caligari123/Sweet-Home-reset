import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { ROOM_CLEAN_THRESHOLD } from '@sweet-home-reset/shared';
import { PALETTE } from './palette';
import { createPuff } from './puff';
import type { GameScene } from './scene';
import { loadCleanedSpots, saveCleanedSpots } from './save';

const WIDTH = 420;
const HEIGHT = 760;
const GRID_COLUMNS = 16;
const GRID_ROWS = 9;
const DIRT_TOTAL = GRID_COLUMNS * GRID_ROWS;
const BRUSH_RADIUS = 34;
const STAGES = [25, 50, 75, 100] as const;
const STAGE_X = [99, 173, 247, 321] as const;

interface DirtSpot {
  x: number;
  y: number;
  radius: number;
  graphics: Graphics;
}

interface PointerPoint {
  global: { x: number; y: number };
  target: unknown;
}

function textStyle(size: number, weight: '400' | '600' | '700' = '600'): TextStyle {
  return new TextStyle({
    fontFamily: 'system-ui, sans-serif',
    fontSize: size,
    fontWeight: weight,
    fill: PALETTE.ink
  });
}

function label(value: string, x: number, y: number, size: number, weight: '400' | '600' | '700' = '600') {
  const item = new Text({ text: value, style: textStyle(size, weight) });
  item.anchor.set(0.5);
  item.position.set(x, y);
  return item;
}

export function createRoomScene(
  app: Application,
  announce: (message: string) => void = () => {},
  onHome?: () => void
): GameScene {
  const container = new Container();
  const roomArt = new Container();
  const dirtLayer = new Container();
  const hud = new Container();
  container.addChild(roomArt, dirtLayer, hud);

  const backdrop = new Graphics().rect(0, 0, WIDTH, HEIGHT).fill(PALETTE.cream);
  roomArt.addChild(backdrop);

  roomArt.addChild(new Graphics()
    .roundRect(20, 25, 380, 710, 34).fill(PALETTE.wall)
    .roundRect(20, 500, 380, 235, 0).fill('#e6c69c'));

  roomArt.addChild(new Graphics()
    .roundRect(52, 105, 145, 142, 22).fill('#fdf8ee')
    .roundRect(63, 116, 123, 120, 15).fill('#b8d4d6')
    .rect(121, 116, 6, 120).fill('#fdf8ee')
    .rect(63, 172, 123, 6).fill('#fdf8ee')
    .roundRect(75, 124, 16, 8, 4).fill('#ffffff'));

  roomArt.addChild(new Graphics()
    .roundRect(40, 352, 340, 28, 12).fill('#d68e70')
    .roundRect(53, 323, 314, 39, 12).fill('#f4d7b2')
    .roundRect(140, 290, 138, 47, 18).fill('#d8e3d3')
    .roundRect(152, 298, 114, 32, 12).fill('#f9f3e5')
    .roundRect(184, 276, 50, 23, 11).fill('#a9c0b4')
    .roundRect(202, 267, 14, 16, 6).fill('#a9c0b4')
    .roundRect(300, 242, 43, 54, 14).fill('#e6a881')
    .ellipse(321, 239, 46, 14).fill('#f2ba8f')
    .rect(316, 188, 10, 52).fill('#91aa87')
    .ellipse(304, 207, 15, 27).fill(PALETTE.sage)
    .ellipse(336, 195, 16, 29).fill(PALETTE.sage)
    .ellipse(311, 179, 13, 23).fill('#90b591')
    .roundRect(104, 456, 210, 78, 28).fill('#edc5a5')
    .roundRect(114, 465, 190, 60, 22).fill('#f6d5b7'));

  const spots: DirtSpot[] = [];
  const left = 68;
  const top = 388;
  const cellX = 18;
  const cellY = 16;
  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let column = 0; column < GRID_COLUMNS; column += 1) {
      const x = left + column * cellX + ((row * 5 + column * 3) % 7);
      const y = top + row * cellY + ((column * 3 + row * 2) % 6);
      const radius = 3 + ((row + column * 2) % 4);
      const graphics = new Graphics()
        .circle(x, y, radius)
        .fill({ color: PALETTE.dirt, alpha: 0.34 + ((row + column) % 4) * 0.09 });
      spots.push({ x, y, radius, graphics });
      dirtLayer.addChild(graphics);
    }
  }

  const keyboardCursor = new Graphics()
    .circle(0, 0, BRUSH_RADIUS)
    .stroke({ color: PALETTE.ink, width: 3, alpha: 0.75 });
  keyboardCursor.visible = false;
  roomArt.addChild(keyboardCursor);

  const puff = createPuff();
  const puffBaseY = 556;
  puff.position.set(260, puffBaseY);
  roomArt.addChild(puff);

  const title = label('A little kitchen reset', WIDTH / 2, 65, 27, '700');
  const subtitle = label('Hi! I’m Puff. Let’s tidy this spot.', WIDTH / 2, 91, 14, '400');
  const meterTrack = new Graphics().roundRect(36, 170, 348, 17, 9).fill('#eadcc2');
  const meterFill = new Graphics();
  const percentLabel = label('0% clean', WIDTH / 2, 147, 16, '700');
  const brushHint = label('DRAG OVER THE DUSTY COUNTER', WIDTH / 2, 572, 12, '700');
  const helper = label('Every little swipe helps ✨', WIDTH / 2, 597, 15, '400');
  const completionPanel = new Graphics();
  const completionText = label('Look at that glow!', WIDTH / 2, 420, 20, '700');
  const resetButton = new Graphics();
  const resetLabel = label('Reset room', WIDTH / 2, 464, 14, '700');
  completionText.visible = false;
  resetLabel.visible = false;
  hud.addChild(title, subtitle, percentLabel, meterTrack, meterFill, brushHint, helper, completionPanel, completionText, resetButton, resetLabel);

  if (onHome) {
    hud.addChild(new Graphics().roundRect(140, 686, 140, 44, 18).fill(PALETTE.peach));
    hud.addChild(label('House', WIDTH / 2, 708, 14, '700'));
  }

  const stageLabels = STAGES.map((stage, index) => label(`${stage}%`, STAGE_X[index], 207, 11, '600'));
  const stagePips = STAGE_X.map((x) => new Graphics().circle(x, 225, 5).fill('#d8cab1'));
  hud.addChild(...stageLabels, ...stagePips);

  let cleaned = new Set<number>();
  let isDragging = false;
  let completed = false;
  let leaving = false;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  let lastPoint: { x: number; y: number } | undefined;
  let announcedStage = 0;
  let cursorIndex = 0;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function percentClean() {
    return (cleaned.size / DIRT_TOTAL) * 100;
  }

  function updateHud() {
    let percent = percentClean();
    if (percent >= ROOM_CLEAN_THRESHOLD && !completed) {
      completed = true;
      cleaned = new Set(spots.map((_, index) => index));
      spots.forEach((spot) => { spot.graphics.visible = false; });
      completionPanel.clear().roundRect(63, 388, 294, 106, 24).fill({ color: '#fffaf0', alpha: 0.96 });
      completionText.visible = true;
      resetButton.clear().roundRect(152, 444, 136, 38, 18).fill(PALETTE.sage);
      resetLabel.visible = true;
      brushHint.text = 'ROOM RESTORED';
      helper.text = 'Puff is proud of you.';
      puff.scale.set(1.08);
      percent = 100;
    }
    percentLabel.text = `${Math.floor(percent)}% clean`;
    meterFill.clear();
    meterFill.roundRect(36, 170, Math.max(0, 348 * percent / 100), 17, 9).fill(PALETTE.sage);
    STAGES.forEach((stage, index) => {
      const pip = stagePips[index];
      pip.clear();
      pip.circle(STAGE_X[index], 225, 5).fill(percent >= stage ? PALETTE.sparkle : '#d8cab1');
      stageLabels[index].style.fill = percent >= stage ? PALETTE.ink : '#8f8479';
    });
    const reachedStage = STAGES.filter((stage) => percent >= stage).length;
    if (reachedStage > announcedStage) {
      announcedStage = reachedStage;
      const stage = STAGES[reachedStage - 1];
      announce(reachedStage === 4 ? 'Kitchen nook restored. 100% clean.' : `Kitchen nook ${stage}% clean.`);
    }
  }

  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { void saveCleanedSpots([...cleaned]); }, 120);
  }

  function flushSave() {
    if (!saveTimer) return;
    clearTimeout(saveTimer);
    saveTimer = undefined;
    void saveCleanedSpots([...cleaned]);
  }

  function scrubAt(x: number, y: number) {
    if (completed || y < 375 || y > 555) return;
    let changed = false;
    for (let index = 0; index < spots.length; index += 1) {
      if (cleaned.has(index)) continue;
      const spot = spots[index];
      if (Math.hypot(spot.x - x, spot.y - y) <= BRUSH_RADIUS + spot.radius) {
        cleaned.add(index);
        spot.graphics.visible = false;
        changed = true;
      }
    }
    if (changed) {
      updateHud();
      scheduleSave();
      puff.rotation = Math.sin(x * 0.04) * 0.045;
    }
  }

  function findNextSpot(fromIndex: number) {
    for (let offset = 0; offset < spots.length; offset += 1) {
      const index = (fromIndex + offset + spots.length) % spots.length;
      if (!cleaned.has(index)) return index;
    }
    return 0;
  }

  function localPoint(event: { global: { x: number; y: number } }) {
    return container.toLocal(event.global);
  }

  function hitsHouse(point: { x: number; y: number }) {
    return Boolean(onHome) && point.x >= 140 && point.x <= 280 && point.y >= 686 && point.y <= 730;
  }

  function leave() {
    if (leaving || !onHome) return;
    leaving = true;
    flushSave();
    queueMicrotask(onHome);
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (leaving) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      leave();
      return;
    }
    const current = spots[cursorIndex];
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') cursorIndex = findNextSpot(cursorIndex + 1);
    else if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') cursorIndex = findNextSpot(cursorIndex - 1);
    else if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') cursorIndex = findNextSpot(cursorIndex + GRID_COLUMNS);
    else if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') cursorIndex = findNextSpot(cursorIndex - GRID_COLUMNS);
    else if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (current && !completed) scrubAt(current.x, current.y);
      cursorIndex = findNextSpot(cursorIndex);
    } else return;
    event.preventDefault();
    const next = spots[cursorIndex];
    if (next) {
      keyboardCursor.position.set(next.x, next.y);
      keyboardCursor.visible = true;
    }
  };

  const onPointerDown = (event: PointerPoint) => {
    if (leaving) return;
    const point = localPoint(event);
    keyboardCursor.visible = false;
    if (hitsHouse(point)) {
      leave();
      return;
    }
    if (completed && point.x >= 142 && point.x <= 298 && point.y >= 435 && point.y <= 490) {
      cleaned.clear();
      spots.forEach((spot) => { spot.graphics.visible = true; });
      completed = false;
      completionText.visible = false;
      resetLabel.visible = false;
      completionPanel.clear();
      resetButton.clear();
      brushHint.text = 'DRAG OVER THE DUSTY COUNTER';
      helper.text = 'Every little swipe helps ✨';
      puff.scale.set(1);
      updateHud();
      scheduleSave();
      return;
    }
    if (point.y >= 375 && point.y <= 555) {
      isDragging = true;
      lastPoint = point;
      scrubAt(point.x, point.y);
    }
  };

  const onPointerMove = (event: PointerPoint) => {
    if (!isDragging || leaving) return;
    const point = localPoint(event);
    const from = lastPoint ?? point;
    const distance = Math.hypot(point.x - from.x, point.y - from.y);
    const steps = Math.max(1, Math.ceil(distance / 14));
    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps;
      scrubAt(from.x + (point.x - from.x) * t, from.y + (point.y - from.y) * t);
    }
    lastPoint = point;
  };

  const endStroke = () => {
    isDragging = false;
    lastPoint = undefined;
  };

  app.canvas.addEventListener('keydown', onKeyDown);
  app.stage.on('pointerdown', onPointerDown);
  app.stage.on('pointermove', onPointerMove);
  app.stage.on('pointerup', endStroke);
  app.stage.on('pointerupoutside', endStroke);

  void loadCleanedSpots().then((saved) => {
    if (leaving) return;
    saved.forEach((index) => {
      if (Number.isInteger(index) && index >= 0 && index < DIRT_TOTAL) {
        cleaned.add(index);
        spots[index].graphics.visible = false;
      }
    });
    updateHud();
  });

  return {
    container,
    width: WIDTH,
    height: HEIGHT,
    label: 'Kitchen nook. Drag across the dusty counter to clean it. Escape returns to the house.',
    update(time: number) {
      if (reduceMotion) return;
      puff.y = puffBaseY + Math.sin(time / 460) * 3;
    },
    destroy() {
      leaving = true;
      flushSave();
      app.canvas.removeEventListener('keydown', onKeyDown);
      app.stage.off('pointerdown', onPointerDown);
      app.stage.off('pointermove', onPointerMove);
      app.stage.off('pointerup', endStroke);
      app.stage.off('pointerupoutside', endStroke);
      container.destroy({ children: true });
    }
  };
}
