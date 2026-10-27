import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { createPuff } from './puff';
import { PALETTE } from './palette';
import { HOME_ROOMS } from './rooms';
import type { GameScene } from './scene';

const WIDTH = 420;
const HEIGHT = 760;

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

function cardTop(index: number) {
  return 156 + index * 148;
}

export function createHomeScene(
  app: Application,
  announce: (message: string) => void,
  onOpenRoom: (roomId: string) => void
): GameScene {
  const container = new Container();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let selected = 0;
  let leaving = false;

  container.addChild(new Graphics().rect(0, 0, WIDTH, HEIGHT).fill(PALETTE.cream));
  container.addChild(new Graphics().roundRect(16, 16, 388, 728, 32).fill(PALETTE.wall));
  container.addChild(label("Puff's house", WIDTH / 2, 58, 28, '700'));
  container.addChild(label('A stand-in home. Real pictures are not in yet.', WIDTH / 2, 96, 13, '400'));
  container.addChild(label('Tap a room, or use the arrow keys and Enter.', WIDTH / 2, 122, 13, '400'));

  HOME_ROOMS.forEach((room, index) => {
    const y = cardTop(index);
    container.addChild(new Graphics()
      .roundRect(48, y, 324, 124, 28)
      .fill(room.playable ? '#fdf8ee' : '#f7efe2')
      .stroke({ color: room.playable ? PALETTE.sage : PALETTE.lilac, width: 4 }));
    container.addChild(label(room.title, WIDTH / 2, y + 46, 22, '700'));
    container.addChild(label(
      room.playable ? 'Ready when you are' : 'Puff is still fluffing this room',
      WIDTH / 2,
      y + 82,
      14,
      '400'
    ));
  });

  const highlight = new Graphics();
  container.addChild(highlight);

  const puff = createPuff();
  puff.scale.set(0.62);
  puff.position.set(168, 612);
  const puffBaseY = puff.y;
  container.addChild(puff);

  function drawHighlight(index: number) {
    const y = cardTop(index);
    highlight.clear().roundRect(40, y - 8, 340, 140, 32).stroke({ color: PALETTE.ink, width: 3 });
  }

  function openSelected() {
    const room = HOME_ROOMS[selected];
    if (!room || leaving) return;
    if (!room.playable) {
      announce(`${room.title} is still being fluffed. The kitchen nook is ready when you are.`);
      return;
    }
    leaving = true;
    queueMicrotask(() => onOpenRoom(room.id));
  }

  function moveSelection(next: number) {
    const count = HOME_ROOMS.length;
    selected = (next + count) % count;
    drawHighlight(selected);
    const room = HOME_ROOMS[selected];
    if (room) announce(`${room.title}. ${room.playable ? 'Ready when you are.' : 'Puff is still fluffing this room.'}`);
  }

  drawHighlight(0);

  const onPointerDown = (event: { global: { x: number; y: number } }) => {
    if (leaving) return;
    const point = container.toLocal(event.global);
    const index = HOME_ROOMS.findIndex((_, card) => {
      const y = cardTop(card);
      return point.x >= 40 && point.x <= 380 && point.y >= y - 8 && point.y <= y + 132;
    });
    if (index < 0) return;
    selected = index;
    drawHighlight(selected);
    openSelected();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (leaving) return;
    if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') moveSelection(selected + 1);
    else if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') moveSelection(selected - 1);
    else if (event.key === 'Enter' || event.key === ' ') openSelected();
    else return;
    event.preventDefault();
  };

  app.stage.on('pointerdown', onPointerDown);
  app.canvas.addEventListener('keydown', onKeyDown);

  return {
    container,
    width: WIDTH,
    height: HEIGHT,
    label: "Puff's house. The kitchen nook is ready. Living room and bedroom are still being fluffed.",
    update(time: number) {
      if (reduceMotion) return;
      puff.y = puffBaseY + Math.sin(time / 460) * 3;
    },
    destroy() {
      leaving = true;
      app.stage.off('pointerdown', onPointerDown);
      app.canvas.removeEventListener('keydown', onKeyDown);
      container.destroy({ children: true });
    }
  };
}
