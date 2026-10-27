import { drawPuff } from '../art/puff';
import type { Outfit } from '../art/puff';
import type { PixelCanvas } from '../art/pixel-canvas';
import { CLIP_MS, clipFrame } from './timeline';

// The before/after clip is made on the device from game art only: no upload, no personal data
// (FRONTEND-PLAN §10). 1080×1920 portrait, ready for TikTok, Reels and Shorts.
const W = 1080;
const H = 1920;

/** Largest whole-number upscale that fits the picture in the frame (180×390 rooms get 4×). */
function layout(w: number, h: number) {
  const scale = Math.max(1, Math.floor(Math.min((W - 24) / w, (H - 360) / h)));
  const rw = w * scale; const rh = h * scale;
  return { scale, w, h, rw, rh, x: Math.round((W - rw) / 2), y: Math.max(230, Math.round((H - rh) / 2)) };
}

function canvasOf(pc: PixelCanvas) {
  const c = document.createElement('canvas');
  c.width = pc.width; c.height = pc.height;
  c.getContext('2d')!.putImageData(new ImageData(pc.data, pc.width, pc.height), 0, 0);
  return c;
}

function drawFrame(ctx: CanvasRenderingContext2D, before: HTMLCanvasElement, after: HTMLCanvasElement, puffs: HTMLCanvasElement[], title: string, ms: number) {
  const f = clipFrame(ms);
  const L = layout(after.width, after.height);
  const SCALE = L.scale; const ROOM_X = L.x; const ROOM_Y = L.y;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#F9EDC2';
  ctx.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 60) { ctx.fillStyle = '#F6E3A1'; ctx.fillRect(x, 0, 22, H); }
  // Frame around the room.
  ctx.fillStyle = '#8A6E5E';
  ctx.beginPath(); ctx.roundRect(ROOM_X - 12, ROOM_Y - 12, L.rw + 24, L.rh + 24, 28); ctx.fill();
  ctx.drawImage(after, ROOM_X, ROOM_Y, L.rw, L.rh);
  const cut = Math.round(f.wipe * L.w) * SCALE;
  if (cut < L.rw) ctx.drawImage(before, cut / SCALE, 0, L.w - cut / SCALE, L.h, ROOM_X + cut, ROOM_Y, L.rw - cut, L.rh);
  if (f.label === 'wipe') {
    ctx.fillStyle = '#FFF8EC'; ctx.fillRect(ROOM_X + cut - 6, ROOM_Y, 12, L.rh);
    ctx.fillStyle = '#8A6E5E'; ctx.fillRect(ROOM_X + cut - 9, ROOM_Y, 3, L.rh); ctx.fillRect(ROOM_X + cut + 6, ROOM_Y, 3, L.rh);
    for (let i = 0; i < 6; i += 1) {
      const y = ROOM_Y + ((ms * 0.37 + i * 260) % L.rh);
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(ROOM_X + cut - 4 + ((i % 2) * 12 - 6), y, 8, 8);
    }
  }
  // Title and labels.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#534239';
  ctx.font = '900 70px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
  ctx.fillText(title, W / 2, 140);
  const label = f.label === 'before' ? 'BEFORE' : f.label === 'after' ? 'AFTER ✨' : '';
  if (label) {
    ctx.font = '900 46px ui-rounded, system-ui, sans-serif';
    const w = ctx.measureText(label).width + 60;
    ctx.fillStyle = '#FFF8EC'; ctx.strokeStyle = '#8A6E5E'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.roundRect(W / 2 - w / 2, ROOM_Y + 30, w, 76, 38); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#534239'; ctx.fillText(label, W / 2, ROOM_Y + 85);
  }
  // Puff hops in the corner at the end.
  const puff = puffs[f.label === 'after' ? Math.floor(ms / 90) % puffs.length : 0];
  ctx.drawImage(puff, W - 48 * 5 - 40, H - 48 * 5 - 20, 48 * 5, 48 * 5);
  ctx.font = '800 40px ui-rounded, system-ui, sans-serif';
  ctx.fillStyle = '#534239';
  ctx.textAlign = 'left';
  ctx.fillText('Sweet Home Reset', 60, H - 70);
}

function pickMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const type of ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm']) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return null;
}

export interface ClipInput { before: PixelCanvas; after: PixelCanvas; title: string; outfit: Outfit }

/** Record the clip. Falls back to a still before/after image when video recording is missing. */
export async function makeClip(input: ClipInput): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const before = canvasOf(input.before);
  const after = canvasOf(input.after);
  const puffs = [{}, { lift: -3, eyes: 'happy' as const }, { lift: -6, eyes: 'happy' as const, step: 'tuck' as const }, { lift: -3, eyes: 'happy' as const }].map((pose) => canvasOf(drawPuff(pose, input.outfit)));
  const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const mime = pickMime();
  if (!mime || typeof canvas.captureStream !== 'function') {
    drawFrame(ctx, before, after, puffs, input.title, 2400);
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
    return new File([blob], `sweet-home-reset-${slug}.png`, { type: 'image/png' });
  }
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const stopped = new Promise<void>((resolve) => { recorder.onstop = () => resolve(); });
  drawFrame(ctx, before, after, puffs, input.title, 0);
  recorder.start(250);
  const start = performance.now();
  await new Promise<void>((resolve) => {
    const tick = () => {
      const ms = performance.now() - start;
      drawFrame(ctx, before, after, puffs, input.title, ms);
      if (ms >= CLIP_MS) resolve(); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  recorder.stop();
  await stopped;
  stream.getTracks().forEach((t) => t.stop());
  const type = mime.split(';')[0];
  return new File([new Blob(chunks, { type })], `sweet-home-reset-${slug}.${type.endsWith('mp4') ? 'mp4' : 'webm'}`, { type });
}

/** Open the share sheet with the clip, or download it where sharing files isn't supported. */
export async function shareFile(file: File, text: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], text, title: 'Sweet Home Reset' }); return 'shared'; }
    catch (e) { if ((e as DOMException)?.name === 'AbortError') return 'cancelled'; }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url; a.download = file.name;
  document.body.append(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}
