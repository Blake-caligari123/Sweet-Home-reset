import { Application, Container, Graphics, Rectangle, Text, TextStyle } from 'pixi.js';
import { loadCleanedSpots, saveCleanedSpots } from './save';

const WIDTH = 420;
const HEIGHT = 760;
const GRID_COLUMNS = 16;
const GRID_ROWS = 9;
const DIRT_TOTAL = GRID_COLUMNS * GRID_ROWS;
const BRUSH_RADIUS = 34;
const PALETTE = {
  ink: '#514353',
  cream: '#fbf4e6',
  peach: '#f6cdb1',
  wall: '#f6e4bd',
  tile: '#e7a889',
  sage: '#a8c5a4',
  lilac: '#c8b9df',
  dirt: '#9c826a',
  sparkle: '#f5b94f'
};

interface DirtSpot {
  x: number;
  y: number;
  radius: number;
  graphics: Graphics;
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

export function createRoomScene(app: Application, announce: (message: string) => void = () => {}) {
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
      const index = row * GRID_COLUMNS + column;
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

  const puff = new Container();
  puff.addChild(new Graphics()
    .ellipse(49, 45, 17, 35).fill(PALETTE.lilac)
    .ellipse(91, 45, 17, 35).fill(PALETTE.lilac)
    .ellipse(70, 75, 34, 32).fill(PALETTE.lilac)
    .circle(59, 73, 3.5).fill(PALETTE.ink)
    .circle(81, 73, 3.5).fill(PALETTE.ink)
    .ellipse(70, 83, 7, 4).fill('#9c7f92')
    .circle(43, 78, 5).fill('#efaaa8')
    .circle(97, 78, 5).fill('#efaaa8'));
  puff.position.set(260, 556);
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
  hud.addChild(title, subtitle, percentLabel, meterTrack, meterFill, brushHint, helper, completionPanel, completionText, resetButton, resetLabel);

  const stageLabels = [25, 50, 75, 100].map((stage, index) => label(`${stage}%`, [99, 173, 247, 321][index], 207, 11, '600'));
  const stagePips = [
    new Graphics().circle(99, 225, 5).fill('#d8cab1'),
    new Graphics().circle(173, 225, 5).fill('#d8cab1'),
    new Graphics().circle(247, 225, 5).fill('#d8cab1'),
    new Graphics().circle(321, 225, 5).fill('#d8cab1')
  ];
  hud.addChild(...stageLabels, ...stagePips);

  let cleaned = new Set<number>();
  let isDragging = false;
  let completed = false;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  let lastPoint: { x: number; y: number } | undefined;
  let announcedStage = 0;
  let cursorIndex = 0;

  function percentClean() {
    return (cleaned.size / DIRT_TOTAL) * 100;
  }

  function updateHud() {
    let percent = percentClean();
    if (percent >= 95 && !completed) {
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
    [25, 50, 75, 100].forEach((stage, index) => {
      const pip = stagePips[index];
      pip.clear();
      pip.circle([99, 173, 247, 321][index], 225, 5)
        .fill(percent >= stage ? PALETTE.sparkle : '#d8cab1');
      stageLabels[index].style.fill = percent >= stage ? PALETTE.ink : '#8f8479';
    });
    const reachedStage = [25, 50, 75, 100].filter((stage) => percent >= stage).length;
    if (reachedStage > announcedStage) {
      announcedStage = reachedStage;
      announce(reachedStage === 4 ? 'Kitchen nook restored. 100% clean.' : `Kitchen nook ${[25, 50, 75, 100][reachedStage - 1]}% clean.`);
    }
  }

  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { void saveCleanedSpots([...cleaned]); }, 120);
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

  app.canvas.addEventListener('keydown', (event) => {
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
  });

  function localPoint(event: { global: { x: number; y: number } }) {
    return container.toLocal(event.global);
  }

  app.stage.eventMode = 'static';
  app.stage.hitArea = new Rectangle(-10000, -10000, 20000, 20000);
  app.stage.on('pointerdown', (event) => {
    const point = localPoint(event);
    keyboardCursor.visible = false;
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
  });
  app.stage.on('pointermove', (event) => {
    if (!isDragging) return;
    const point = localPoint(event);
    const from = lastPoint ?? point;
    const distance = Math.hypot(point.x - from.x, point.y - from.y);
    const steps = Math.max(1, Math.ceil(distance / 14));
    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps;
      scrubAt(from.x + (point.x - from.x) * t, from.y + (point.y - from.y) * t);
    }
    lastPoint = point;
  });
  app.stage.on('pointerup', () => { isDragging = false; lastPoint = undefined; });
  app.stage.on('pointerupoutside', () => { isDragging = false; lastPoint = undefined; });

  void loadCleanedSpots().then((saved) => {
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
    update(time: number) {
      puff.y = Math.sin(time / 460) * 3;
    }
  };
}
