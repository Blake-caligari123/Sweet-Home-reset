import { P } from '../../shared/art/palette';
import { PixelCanvas } from '../../shared/art/pixel-canvas';

export type Tool = 'sponge' | 'squeegee' | 'duster' | 'vacuum' | 'hand';
export const TOOL_SIZE = 18;

// Each tool is drawn with its working edge at the bottom-left, which sits on the brush point.
const ART: Record<Exclude<Tool, 'hand'>, (pc: PixelCanvas) => void> = {
  sponge(pc) {
    pc.box(1, 7, 15, 9, P.butter, P.outline, 1);
    pc.box(1, 4, 15, 5, P.sageShade, P.outline, 1);
    pc.hline(3, 5, 11, P.sage);
    pc.set(4, 10, P.butterShade); pc.set(9, 12, P.butterShade); pc.set(12, 9, P.butterShade); pc.set(6, 13, P.butterShade);
    pc.ellipseBox(15, 4, 2, 2, P.white, P.blueLight); pc.ellipseBox(12, 1, 1, 1, P.white, P.blueLight);
  },
  squeegee(pc) {
    pc.box(6, 0, 4, 10, P.peach, P.outline, 1);
    pc.box(1, 9, 15, 4, P.blue, P.outline);
    pc.box(0, 12, 17, 3, P.ink, P.outline);
    pc.hline(2, 10, 11, P.blueLight);
  },
  duster(pc) {
    pc.box(11, 0, 3, 9, P.brown, P.outline);
    const feathers = [P.peach, P.butter, P.sage, P.blue, P.peachLight];
    feathers.forEach((c, i) => pc.ellipseBox(3 + i * 3, 11 + (i % 2), 3, 4, c, P.outline));
  },
  vacuum(pc) {
    pc.box(10, 0, 4, 10, P.grey, P.outline);
    pc.box(1, 9, 16, 7, P.peach, P.outline, 1);
    pc.box(0, 14, 18, 3, P.ink, P.outline);
    pc.hline(3, 11, 11, P.peachLight);
    pc.set(14, 11, P.sage);
  }
};

export function drawTool(tool: Tool) {
  const pc = new PixelCanvas(TOOL_SIZE, TOOL_SIZE);
  if (tool !== 'hand') ART[tool](pc);
  return pc;
}

export const TOOL_ICON: Record<Tool, string> = { sponge: '🧽', squeegee: '🪟', duster: '🪶', vacuum: '🌀', hand: '✋' };
