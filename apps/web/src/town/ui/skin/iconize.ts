import { dataUrl } from './frames';
import { ICONS, iconPixels } from './icons';

// Swaps the emoji in the UI's text for pixel icons (icons.ts), wherever text appears: the HUD,
// the tracker, banners, sheets, chat boxes, bubbles. The emoji itself stays in the text, just
// visually hidden, so screen readers still hear it and code that reads the text still sees it.

const keys = Object.keys(ICONS).sort((a, b) => b.length - a.length);
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const FIND = new RegExp(`(${keys.map(escape).join('|')})\\uFE0F?`, 'u');
const SPLIT = new RegExp(`(${keys.map(escape).join('|')})\\uFE0F?`, 'gu');

const urls = new Map<string, string>();
function url(emoji: string) {
  let u = urls.get(emoji);
  if (!u) { u = dataUrl(iconPixels(emoji)!); urls.set(emoji, u); }
  return u;
}

function icon(emoji: string) {
  const span = document.createElement('span'); span.className = 'ico';
  const img = document.createElement('img'); img.className = 'ico-img'; img.src = url(emoji); img.alt = ''; img.setAttribute('aria-hidden', 'true');
  const text = document.createElement('span'); text.className = 'ico-t'; text.textContent = emoji;
  span.append(img, text);
  return span;
}

/** Leave alone: text people type, the hidden emoji itself. */
const skip = (n: Node) => { const p = n.parentElement; return !p || p.closest('.ico, input, textarea, [contenteditable], .no-icons') !== null; };

/** One text node: split round the emoji it holds, icons in their place. */
function swap(node: Text) {
  const text = node.data;
  if (!FIND.test(text) || skip(node)) return;
  const parts = text.split(SPLIT);
  // One inline run in the text's place, so a flex box still sees one piece (icon and words together).
  const run = document.createElement('span'); run.className = 'ico-run';
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (!part) continue;
    if (i % 2 === 1) run.append(icon(part)); else run.append(part);
  }
  node.replaceWith(run);
}

function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) { swap(root as Text); return; }
  const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const found: Text[] = [];
  for (let n = it.nextNode(); n; n = it.nextNode()) if (FIND.test((n as Text).data)) found.push(n as Text);
  found.forEach(swap);
}

/** Watch the UI and keep its emoji as pixel icons from now on. */
export function startIconize(root: HTMLElement) {
  walk(root);
  new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'characterData') swap(r.target as Text);
      else r.addedNodes.forEach(walk);
    }
  }).observe(root, { childList: true, subtree: true, characterData: true });
}
