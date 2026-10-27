import type { Container } from 'pixi.js';

export interface GameScene {
  container: Container;
  width: number;
  height: number;
  label: string;
  update(time: number): void;
  destroy(): void;
}
