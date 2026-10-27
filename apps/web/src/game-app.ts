import type { Application } from 'pixi.js';
import { composeAfter, composeBefore, composeProgress } from './art/before-after';
import { PixelCanvas } from './art/pixel-canvas';
import { PROPS } from './art/props';
import { drawPuff, type Outfit } from './art/puff';
import { createFeedback, type FeedbackEvent } from './fx/feedback';
import type { Sound } from './fx/sound';
import { line, type LineKey } from './game/lines';
import type { DecorDef, Pack, RoomDef } from './game/pack';
import {
  BOOST_COST, buy, choresDoneToday, isUnlocked, localDate, REWARD, rewardRoom, rewardTask, roomState,
  showUp, spendEnergy, tickChore, type Profile
} from './game/profile';
import { RoomSession } from './game/session';
import { eraseSave, writeSave } from './game/storage';
import type { NativeBridge } from './native';
import { backAction, type Overlay, type Screen } from './nav';
import { BRUSH_RADIUS, RoomScene } from './scenes/room-scene';
import { clear, ENERGY, h, SPARKLE } from './ui/dom';
import { pixelImage, puffPortrait } from './ui/pixel-image';
import { makeClip, shareFile } from './share/clip';

const TASK_ICON: Record<string, string> = { scrub: '🧽', glass: '🪟', dust: '🪶', vacuum: '🌀', pop: '🐰', sort: '🧺' };
const STAGE_BANNER: Record<number, string> = { 25: 'Colour\'s coming back!', 50: 'Halfway sparkly!', 75: 'Almost there!' };

export class GameApp {
  private screen: Screen = 'title';
  private overlay: Overlay = null;
  private scene: RoomScene;
  private room: RoomDef | null = null;
  private session: RoomSession | null = null;
  private earned = 0;
  private boosted = false;
  private saveTimer = 0;
  private bubbleTimer = 0;
  private hud: {
    root: HTMLElement; percent: HTMLElement; fill: HTMLElement; marks: HTMLElement[]; tasks: HTMLElement[];
    next: HTMLElement; sparkles: HTMLElement; bubble: HTMLElement; caption: HTMLElement; help: HTMLButtonElement;
  } | null = null;
  private live: HTMLElement;
  private feedback;
  private welcomeBack = false;

  constructor(
    private app: Application,
    private ui: HTMLElement,
    private pack: Pack,
    private profile: Profile,
    private native: NativeBridge,
    private sound: Sound
  ) {
    this.live = h('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
    document.body.append(this.live);
    this.feedback = createFeedback({
      play: (id, level) => sound.play(id, level),
      haptic: (kind) => { void native.haptic(kind); },
      vibrate: !native.isNative && 'vibrate' in navigator ? (pattern) => { try { navigator.vibrate(pattern); } catch { /* ignore */ } } : null,
      caption: (text) => this.caption(text),
      now: () => performance.now(),
      settings: () => this.profile.settings
    });
    this.scene = new RoomScene(app, {
      feedback: (event, level) => this.feedback.emit(event, level),
      say: (text) => this.say(text),
      progress: () => this.updateHud(),
      taskDone: () => { this.earned += rewardTask(this.profile); this.bumpSparkles(`+${REWARD.task} ${SPARKLE}`); },
      stage: (stage) => { this.announce(`${this.room?.title} ${stage}% clean.`); if (STAGE_BANNER[stage]) this.banner(`${stage}% · ${STAGE_BANNER[stage]}`); },
      combo: (count) => { this.feedback.emit('combo'); this.banner(`Combo ×${count}!`, 'combo'); if (count % 10 === 0) this.say(line('combo')); },
      tool: () => {},
      helpReady: (ready) => { if (this.hud) this.hud.help.hidden = !ready; },
      save: () => this.saveSoon(),
      finished: () => this.showRestored()
    });
    app.stage.addChild(this.scene.root);
    app.ticker.add((ticker) => {
      this.scene.update(ticker.deltaMS);
      this.placeBubble();
    });
    window.addEventListener('resize', () => { this.app.resize(); this.scene.resize(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.back(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.background(); });
    this.applyMotion();
    const showed = showUp(profile, localDate());
    this.welcomeBack = showed.welcomeBack;
    this.saveSoon();
  }

  start() {
    if (!this.profile.onboarded) this.showTitle();
    else this.showHome();
  }

  // ---- helpers -----------------------------------------------------------------------------

  private get motionReduced() { return this.profile.settings.reducedMotion; }

  private applyMotion() { document.documentElement.classList.toggle('reduce-motion', this.motionReduced); }

  private saveSoon() {
    window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => this.saveNow(), 400);
  }

  saveNow() {
    window.clearTimeout(this.saveTimer);
    if (this.room && this.session && !this.session.complete) roomState(this.profile, this.room.id).session = this.session.save();
    void writeSave(this.profile);
  }

  private announce(text: string) { this.live.textContent = text; }

  private toast(text: string) {
    const el = h('div', { class: 'toast', role: 'status' }, text);
    this.ui.append(el);
    window.setTimeout(() => el.remove(), 1700);
  }

  /** A big pill across the middle for stage-ups and combos. */
  private banner(text: string, kind: 'stage' | 'combo' = 'stage') {
    if (!this.hud) return;
    this.hud.root.querySelector('.banner')?.remove();
    const el = h('div', { class: `banner ${kind}`, 'aria-hidden': 'true' }, text);
    this.hud.root.append(el);
    window.setTimeout(() => el.remove(), kind === 'combo' ? 1000 : 1800);
  }

  private caption(text: string) {
    if (!this.hud) return;
    this.hud.caption.textContent = text;
    this.hud.caption.classList.add('show');
    window.setTimeout(() => this.hud?.caption.classList.remove('show'), 1200);
  }

  private say(text: string) {
    if (!this.hud) return;
    this.hud.bubble.textContent = text;
    this.hud.bubble.classList.add('show');
    this.announce(`Puff: ${text}`);
    window.clearTimeout(this.bubbleTimer);
    this.bubbleTimer = window.setTimeout(() => this.hud?.bubble.classList.remove('show'), 2400);
  }

  private placeBubble() {
    if (!this.hud || !this.hud.bubble.classList.contains('show')) return;
    const p = this.scene.puffScreenPoint();
    if (!p) return;
    const half = Math.min(110, this.hud.bubble.offsetWidth / 2 + 8);
    const x = Math.min(window.innerWidth - half, Math.max(half, p.x));
    this.hud.bubble.style.left = `${x}px`;
    this.hud.bubble.style.top = `${Math.max(150, p.y)}px`;
  }

  private bumpSparkles(text?: string) {
    if (this.hud) {
      this.hud.sparkles.textContent = `${SPARKLE} ${this.profile.sparkles}`;
      this.hud.sparkles.classList.remove('bump'); void this.hud.sparkles.offsetWidth; this.hud.sparkles.classList.add('bump');
    }
    if (text) this.toast(text);
  }

  private tap(event: FeedbackEvent = 'tap') { this.sound.unlock(); this.feedback.emit(event); }

  private setScreen(screen: Screen) {
    if (this.screen === 'room' && screen !== 'room') this.leaveRoom();
    this.screen = screen;
    this.overlay = null;
    clear(this.ui);
    this.hud = null;
    this.app.canvas.style.visibility = screen === 'room' ? 'visible' : 'hidden';
    if (screen === 'room') this.app.ticker.start(); else this.app.ticker.stop();
  }

  private decorFor(room: RoomDef): DecorDef[] {
    return room.decor.filter((d) => this.profile.owned.includes(d.itemId));
  }

  // ---- navigation ----------------------------------------------------------------------------

  back() {
    const action = backAction(this.screen, this.overlay);
    if (action === 'pause') this.pause();
    else if (action === 'resume') this.resume();
    else if (action === 'home') this.showHome();
    else if (action === 'minimize') void this.native.minimize();
  }

  background() {
    this.sound.stopMusic();
    this.saveNow();
    if (this.screen === 'room' && this.overlay === null) this.pause();
  }

  // ---- title -------------------------------------------------------------------------------

  private showTitle() {
    this.setScreen('title');
    const puff = puffPortrait(4, this.profile.outfit, this.motionReduced);
    this.ui.append(h('main', { class: 'screen title-screen' },
      h('div', { class: 'panel title-card' },
        puff.el,
        h('h1', { class: 'logo' }, h('small', {}, 'Puff\'s'), 'Sweet Home Reset'),
        h('p', { class: 'muted' }, 'Scrub a little room back to sparkling with Puff the dust bunny, then do one tiny real thing at home.'),
        h('button', { class: 'btn primary big', onClick: () => {
          this.tap();
          this.profile.onboarded = true;
          this.saveSoon();
          this.enterRoom(this.pack.rooms[0]);
        } }, 'Let\'s tidy!'),
        h('p', { class: 'muted', style: { fontSize: '0.85rem' } }, 'No ads. Nothing is lost for taking a break.')
      )
    ));
  }

  // ---- home --------------------------------------------------------------------------------

  showHome() {
    this.saveNow();
    this.setScreen('home');
    const p = this.profile;
    const puff = puffPortrait(2, p.outfit, this.motionReduced);
    const restoredRooms = Object.values(p.rooms).filter((r) => r.restored > 0).length;
    const hello = this.welcomeBack ? line('welcomeBack') : restoredRooms ? 'Which room next?' : 'Let\'s make it cosy!';
    if (this.welcomeBack) { puff.play('spin', 3); this.welcomeBack = false; }
    const cards = this.pack.rooms.map((room) => this.roomCard(room));
    this.ui.append(h('main', { class: 'screen', 'aria-label': 'Puff\'s home' },
      h('div', { class: 'screen-inner' },
        h('header', { class: 'topbar' },
          h('h1', {}, 'Puff\'s Home'),
          h('span', { class: 'spacer' }),
          h('span', { class: 'chip', 'aria-label': `${p.sparkles} Sparkles` }, `${SPARKLE} ${p.sparkles}`),
          h('span', { class: 'chip', 'aria-label': `${p.energy} Energy` }, `${ENERGY} ${p.energy}`),
          h('button', { class: 'icon-btn', 'aria-label': 'Settings', onClick: () => { this.tap(); this.showSettings(); } }, '⚙')
        ),
        h('section', { class: 'panel home-hero' }, puff.el, h('p', { class: 'say' }, hello)),
        h('section', { class: 'stats', 'aria-label': 'Our Home' },
          h('div', { class: 'stat' }, h('b', {}, String(restoredRooms)), h('span', {}, 'rooms restored')),
          h('div', { class: 'stat' }, h('b', {}, String(p.chores.total)), h('span', {}, 'tiny real things')),
          h('div', { class: 'stat' }, h('b', {}, String(p.cosyDays)), h('span', {}, 'cosy days'))
        ),
        ...cards,
        h('div', { class: 'home-actions' },
          h('button', { class: 'btn warm', onClick: () => { this.tap(); this.showChores(); } }, '✔ One tiny thing'),
          h('button', { class: 'btn', onClick: () => { this.tap(); this.showShop('decor'); } }, '🛍 Shop')
        )
      )
    ));
  }

  private roomThumb(room: RoomDef) {
    const state = this.profile.rooms[room.id];
    const decor = this.decorFor(room);
    const fresh = !state?.restored || state.session;
    const pc = fresh ? composeProgress(room, new RoomSession(room, state?.seed ?? 1, state?.session), decor) : composeAfter(room, decor);
    return pixelImage(pc, 1, `${room.title} preview`);
  }

  private roomCard(room: RoomDef) {
    const p = this.profile;
    const state = p.rooms[room.id];
    const unlocked = isUnlocked(p, room);
    const meter = state?.session ? Math.floor(new RoomSession(room, state.seed, state.session).meter()) : 0;
    const restored = state?.restored ?? 0;
    let status: Node;
    let action: HTMLButtonElement;
    if (!unlocked) {
      const after = this.pack.rooms.find((r) => r.id === room.unlock?.afterRoom);
      status = h('p', { class: 'muted' }, `Ready when you are: opens after ${after?.title ?? 'the last room'}, or after ${room.unlock?.chores} tiny real things (${Math.min(p.chores.total, room.unlock?.chores ?? 0)}/${room.unlock?.chores}).`);
      action = h('button', { class: 'btn small', disabled: true }, '🔒 Not yet');
    } else {
      status = h('div', { class: 'list', style: { gap: '4px' } },
        h('p', { class: 'muted' }, meter > 0 ? `${meter}% sparkly` : restored ? `Restored ${restored}× · a fresh mess is waiting` : room.blurb),
        h('div', { class: 'bar', role: 'progressbar', 'aria-valuenow': meter, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': `${room.title} progress` }, h('i', { style: { width: `${meter}%` } }))
      );
      action = h('button', { class: 'btn primary small', onClick: () => { this.tap(); this.enterRoom(room); } }, meter > 0 ? 'Keep tidying' : restored ? 'Fresh mess' : 'Tidy it');
    }
    return h('article', { class: `panel room-card${unlocked ? '' : ' locked'}` },
      h('div', { class: 'thumb' }, this.roomThumb(room)),
      h('div', { class: 'info' },
        h('h2', {}, room.title, restored ? h('span', { class: 'badge' }, 'Restored ✓') : null),
        status, action)
    );
  }

  // ---- room --------------------------------------------------------------------------------

  enterRoom(room: RoomDef) {
    this.setScreen('room');
    const state = roomState(this.profile, room.id);
    this.room = room;
    this.session = new RoomSession(room, state.seed, state.session);
    this.earned = 0;
    this.boosted = false;
    this.buildHud(room);
    this.scene.enter(room, this.session, {
      outfit: this.profile.outfit,
      decor: this.decorFor(room),
      brush: this.brushRadius(),
      reducedMotion: this.motionReduced
    });
    this.updateHud();
  }

  private brushRadius() {
    return BRUSH_RADIUS * (this.profile.settings.bigBrush ? 1.5 : 1) * (this.boosted ? 1.4 : 1);
  }

  private leaveRoom() {
    this.saveNow();
    this.scene.exit();
    this.room = null;
    this.session = null;
  }

  private buildHud(room: RoomDef) {
    const marks = [25, 50, 75].map((m) => h('b', { style: { left: `${m}%` } }));
    const fill = h('i');
    const percent = h('span', {}, '0%');
    const sparkles = h('span', { class: 'chip', 'aria-label': 'Sparkles' }, `${SPARKLE} ${this.profile.sparkles}`);
    const tasks = room.tasks.map((task) => {
      const icon = task.type === 'wipe' ? TASK_ICON[task.surface] : TASK_ICON[task.type];
      return h('div', { class: 'task', title: task.label, role: 'img', 'aria-label': task.label }, h('span', { 'aria-hidden': 'true' }, icon), h('span', { class: 'mini' }, h('i', { style: { width: '0%' } })));
    });
    const help = h('button', { class: 'btn warm small', hidden: true, onClick: () => { this.tap(); this.scene.help(); help.hidden = true; } }, '🐰 Help Puff');
    const next = h('div', { class: 'next', 'aria-live': 'polite' });
    const bubble = h('div', { class: 'bubble', 'aria-hidden': 'true' });
    const caption = h('div', { class: 'caption', 'aria-hidden': 'true' });
    const root = h('div', { class: 'hud' },
      h('header', { class: 'hud-top' },
        h('button', { class: 'icon-btn', 'aria-label': 'Pause', onClick: () => { this.tap(); this.pause(); } }, '❚❚'),
        h('div', { class: 'meter-box' },
          h('div', { class: 'meter-head' }, h('span', {}, room.title), percent),
          h('div', { class: 'meter', role: 'progressbar', 'aria-label': `${room.title} clean`, 'aria-valuemin': 0, 'aria-valuemax': 100 }, fill, ...marks)
        ),
        sparkles
      ),
      bubble, caption,
      h('footer', { class: 'tray' },
        h('div', { class: 'tray-actions' }, h('span'), help),
        next,
        h('div', { class: 'tasks' }, ...tasks)
      )
    );
    this.ui.append(root);
    this.hud = { root, percent, fill, marks, tasks, next, sparkles, bubble, caption, help };
  }

  private updateHud() {
    if (!this.hud || !this.session || !this.room) return;
    const meter = Math.floor(this.session.meter());
    this.hud.percent.textContent = `${meter}%`;
    this.hud.fill.style.width = `${meter}%`;
    this.hud.fill.parentElement!.setAttribute('aria-valuenow', String(meter));
    this.hud.marks.forEach((m, i) => m.classList.toggle('on', meter >= [25, 50, 75][i]));
    const nextIndex = this.session.nextTask();
    this.hud.tasks.forEach((el, i) => {
      const progress = this.session!.taskProgress(i);
      (el.querySelector('.mini > i') as HTMLElement).style.width = `${Math.round(progress * 100)}%`;
      el.classList.toggle('done', progress >= 1);
      el.classList.toggle('current', i === nextIndex);
    });
    this.hud.next.textContent = this.session.complete ? 'Room restored!' : nextIndex >= 0 ? this.room.tasks[nextIndex].label : '';
    this.hud.next.hidden = !this.hud.next.textContent;
    this.hud.sparkles.textContent = `${SPARKLE} ${this.profile.sparkles}`;
  }

  private pause() {
    if (this.screen !== 'room' || this.overlay) return;
    this.overlay = 'pause';
    this.app.ticker.stop();
    const resume = h('button', { class: 'btn primary big', onClick: () => { this.tap(); this.resume(); } }, 'Keep cleaning');
    const dialog = h('div', { class: 'scrim center', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'pause-title', 'data-overlay': 'pause' },
      h('div', { class: 'panel sheet' },
        h('h2', { id: 'pause-title' }, 'Taking a breather'),
        h('p', { class: 'muted' }, 'Your room will be right here.'),
        h('div', { class: 'btn-row' },
          resume,
          h('button', { class: 'btn', onClick: () => { this.tap(); this.showHome(); } }, 'Puff\'s home')
        ),
        this.boostButton()
      )
    );
    this.ui.append(dialog);
    resume.focus();
  }

  /** Optional boost paid with Energy from real chores. Scrubbing never needs it. */
  private boostButton() {
    if (this.boosted) return h('p', { class: 'muted' }, `${ENERGY} Big sponge is on for this room.`);
    const enough = this.profile.energy >= BOOST_COST;
    return h('button', { class: 'btn warm', disabled: !enough, onClick: () => {
      if (!spendEnergy(this.profile, BOOST_COST)) return;
      this.tap();
      this.boosted = true;
      this.scene.setBrush(this.brushRadius());
      this.saveSoon();
      this.resume();
      this.toast(`Big sponge on! −${BOOST_COST} ${ENERGY}`);
    } }, enough ? `${ENERGY} Big sponge (${BOOST_COST} Energy)` : `${ENERGY} Big sponge: do a real chore for Energy`);
  }

  private resume() {
    if (this.overlay !== 'pause') return;
    this.overlay = null;
    this.ui.querySelector('[data-overlay="pause"]')?.remove();
    this.app.ticker.start();
    this.app.canvas.focus();
  }

  // ---- restored + real chore ---------------------------------------------------------------

  private showRestored() {
    if (!this.room) return;
    const room = this.room;
    const messSeed = this.session?.seed ?? 1;
    const before = this.pack.rooms.filter((r) => isUnlocked(this.profile, r)).map((r) => r.id);
    const roomReward = rewardRoom(this.profile, room.id);
    const comboBonus = this.scene.comboBonus;
    this.profile.sparkles += comboBonus;
    this.earned += roomReward + comboBonus;
    this.saveNow();
    const opened = this.pack.rooms.find((r) => !before.includes(r.id) && isUnlocked(this.profile, r));
    this.overlay = 'restored';
    if (this.hud) this.hud.root.querySelector('.tray')?.setAttribute('hidden', '');
    const puff = puffPortrait(3, this.profile.outfit, this.motionReduced);
    puff.play('hop', 4);
    const chores = room.chores.filter((c) => !choresDoneToday(this.profile, localDate()).includes(c.choreKey));
    const chore = chores[Math.floor(Math.random() * chores.length)] ?? null;
    const body = h('div', { class: 'list', style: { width: '100%', alignItems: 'center' } });
    const sheet = h('div', { class: 'panel sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'restored-title' },
      puff.el,
      h('h2', { id: 'restored-title' }, `${room.title} restored!`),
      h('div', { class: 'reward' },
        h('span', { class: 'total' }, `+${this.earned} ${SPARKLE}`),
        h('span', { class: 'muted' }, `${this.earned - roomReward - comboBonus} from tasks · ${roomReward} for the room${comboBonus ? ` · ${comboBonus} combo bonus` : ''}`)
      ),
      opened ? h('p', { class: 'badge warm' }, `${opened.title} is ready when you are!`) : null,
      this.shareButton(room, messSeed),
      body
    );
    const scrim = h('div', { class: 'scrim', 'data-overlay': 'restored' }, sheet);
    const done = (text: string, rewardText?: string) => {
      clear(body);
      body.append(
        h('p', { style: { fontWeight: '800' } }, `Puff: “${text}”`),
        ...(rewardText ? [h('p', { class: 'reward' }, rewardText)] : []),
        h('div', { class: 'btn-row', style: { width: '100%' } },
          h('button', { class: 'btn primary', onClick: () => { this.tap(); this.showHome(); } }, 'Puff\'s home'),
          h('button', { class: 'btn', onClick: () => { this.tap(); this.enterRoom(room); } }, 'Fresh mess')
        )
      );
      (body.querySelector('button') as HTMLButtonElement)?.focus();
    };
    if (chore) {
      const yes = h('button', { class: 'btn primary', onClick: () => {
        const result = tickChore(this.profile, localDate(), chore.choreKey);
        this.feedback.emit('chore');
        puff.play('spin', 2);
        this.saveSoon();
        if (!result || result.capped) done(line('choreCap'));
        else done(line('choreYes'), `+${result.sparkles} ${SPARKLE}  +${result.energy} ${ENERGY}`);
      } }, 'Do it for real');
      body.append(
        h('p', { style: { fontWeight: '800' } }, 'Want to do one tiny thing for real?'),
        h('div', { class: 'chore-card' }, chore.label),
        h('p', { class: 'muted', style: { fontSize: '0.85rem' } }, 'No photo, just tick it when it\'s done. Skipping is fine too.'),
        h('div', { class: 'btn-row', style: { width: '100%' } },
          yes,
          h('button', { class: 'btn', onClick: () => { this.tap(); done(line('choreNo')); } }, 'Not now')
        )
      );
      window.setTimeout(() => yes.focus(), 50);
    } else {
      done(line('roomClean'));
    }
    this.ui.append(scrim);
    this.announce(`${room.title} restored. You earned ${this.earned} Sparkles.`);
  }

  /** Make the before/after clip, then share it on a second tap (iOS needs a fresh tap to share). */
  private shareButton(room: RoomDef, seed: number) {
    const button = h('button', { class: 'btn warm', style: { width: '100%' } }, '🎬 Make my before/after clip');
    let file: File | null = null;
    button.addEventListener('click', async () => {
      this.tap();
      if (file) {
        const result = await shareFile(file, `I restored the ${room.title} with Puff ✨ #SweetHomeReset`);
        if (result === 'downloaded') this.toast('Saved your clip');
        return;
      }
      button.disabled = true;
      button.textContent = 'Making your clip…';
      try {
        const decor = this.decorFor(room);
        file = await makeClip({ before: composeBefore(room, seed, decor), after: composeAfter(room, decor), title: room.title, outfit: this.profile.outfit });
        button.textContent = file.type.startsWith('video') ? '📤 Share my clip' : '📤 Share my before/after';
      } catch {
        button.textContent = 'Clip didn\'t work this time';
      } finally {
        button.disabled = false;
      }
    });
    return button;
  }

  // ---- chores --------------------------------------------------------------------------------

  private showChores() {
    this.setScreen('chores');
    const today = localDate();
    const unlocked = this.pack.rooms.filter((r) => isUnlocked(this.profile, r));
    const chores = unlocked.flatMap((r) => r.chores.map((c) => ({ ...c, room: r.title })));
    const done = choresDoneToday(this.profile, today);
    const rewarded = this.profile.chores.day === today ? this.profile.chores.today : 0;
    const puff = puffPortrait(2, this.profile.outfit, this.motionReduced);
    const say = h('p', { class: 'say' }, rewarded >= 5 ? line('choreCap') : 'Just one counts. Pick any!');
    const list = h('div', { class: 'list' }, ...chores.map((c) => {
      const isDone = done.includes(c.choreKey);
      const button = h('button', { class: `btn ${isDone ? '' : 'primary'} small`, disabled: isDone, 'aria-label': `I did it: ${c.label}` }, isDone ? 'Done ✓' : 'I did it');
      button.addEventListener('click', () => {
        const result = tickChore(this.profile, today, c.choreKey);
        if (!result) return;
        this.sound.unlock();
        this.feedback.emit('chore');
        puff.play('spin', 2);
        button.textContent = 'Done ✓'; button.disabled = true; button.classList.remove('primary');
        say.textContent = result.capped ? line('choreCap') : line('choreYes');
        if (!result.capped) this.toast(`+${result.sparkles} ${SPARKLE}  +${result.energy} ${ENERGY}`);
        this.saveSoon();
      });
      return h('div', { class: 'panel chore' }, h('div', { class: 'label' }, c.label, h('small', {}, `${c.room} · ${c.size}`)), button);
    }));
    this.ui.append(h('main', { class: 'screen' },
      h('div', { class: 'screen-inner' },
        h('header', { class: 'topbar' },
          h('button', { class: 'icon-btn', 'aria-label': 'Back', onClick: () => { this.tap(); this.showHome(); } }, '←'),
          h('h1', {}, 'One tiny thing')
        ),
        h('section', { class: 'panel home-hero' }, puff.el, say),
        h('p', { class: 'muted' }, `Tick a real chore on trust, no photo. Each one gives ${REWARD.chore} ${SPARKLE} and ${REWARD.choreEnergy} ${ENERGY} (up to 5 a day). Energy powers the Big sponge.`),
        list
      )
    ));
  }

  // ---- shop --------------------------------------------------------------------------------

  private showShop(tab: 'decor' | 'puff') {
    this.setScreen('shop');
    const p = this.profile;
    const tabButton = (id: 'decor' | 'puff', label: string) => h('button', { class: 'btn small', role: 'tab', 'aria-selected': String(tab === id), onClick: () => { this.tap(); this.showShop(id); } }, label);
    const grid = h('div', { class: 'grid' });
    const priceButton = (price: number, onBuy: () => void) => {
      const short = p.sparkles < price;
      return h('div', { class: 'list', style: { width: '100%', gap: '4px' } },
        h('button', { class: `btn ${short ? '' : 'primary'} small`, disabled: short, 'aria-label': `Buy for ${price} Sparkles`, onClick: onBuy }, `${price} ${SPARKLE}`),
        short ? h('span', { class: 'where' }, `${price - p.sparkles} more to go`) : null);
    };
    const purchase = (itemId: string, price: number) => {
      if (buy(p, itemId, price) === 'bought') { this.feedback.emit('purchase'); this.toast(line('shop')); this.saveSoon(); }
      this.showShop(tab);
    };
    if (tab === 'decor') {
      for (const room of this.pack.rooms) for (const d of room.decor) {
        const pc = new PixelCanvas(64, 36);
        PROPS[d.prop]?.(pc, { ...d, x: d.prop === 'fairyLights' ? 2 : 22, y: d.prop === 'fairyLights' ? 12 : 4, w: d.prop === 'fairyLights' ? 60 : undefined });
        const owned = p.owned.includes(d.itemId);
        grid.append(h('article', { class: 'panel item' },
          h('div', { class: 'preview' }, pixelImage(pc, 2, d.name)),
          h('h2', { style: { fontSize: '1rem' } }, d.name),
          h('span', { class: 'where' }, owned ? `In your ${room.title} ✓` : `For the ${room.title}`),
          owned ? h('button', { class: 'btn small', disabled: true }, 'Owned') : priceButton(d.price, () => purchase(d.itemId, d.price))
        ));
      }
    } else {
      for (const o of this.pack.outfits) {
        const owned = p.owned.includes(o.itemId);
        const wearing = p.outfit === o.itemId;
        grid.append(h('article', { class: 'panel item' },
          h('div', { class: 'preview' }, pixelImage(drawPuff({ eyes: 'happy' }, o.itemId as Outfit), 2, `Puff wearing the ${o.name}`)),
          h('h2', { style: { fontSize: '1rem' } }, o.name),
          owned
            ? h('button', { class: `btn ${wearing ? '' : 'primary'} small`, onClick: () => { this.tap(); p.outfit = wearing ? null : o.itemId; this.saveSoon(); this.showShop('puff'); } }, wearing ? 'Take off' : 'Wear')
            : priceButton(o.price, () => purchase(o.itemId, o.price))
        ));
      }
    }
    this.ui.append(h('main', { class: 'screen' },
      h('div', { class: 'screen-inner' },
        h('header', { class: 'topbar' },
          h('button', { class: 'icon-btn', 'aria-label': 'Back', onClick: () => { this.tap(); this.showHome(); } }, '←'),
          h('h1', {}, 'Shop'), h('span', { class: 'spacer' }),
          h('span', { class: 'chip', 'aria-label': `${p.sparkles} Sparkles` }, `${SPARKLE} ${p.sparkles}`)
        ),
        h('p', { class: 'muted' }, 'Fixed prices, paid with Sparkles you earn by cleaning. Nothing is random.'),
        h('div', { class: 'tabs', role: 'tablist' }, tabButton('decor', '🪴 Decor'), tabButton('puff', '🐰 Puff\'s outfits')),
        grid
      )
    ));
  }

  // ---- settings ----------------------------------------------------------------------------

  private showSettings() {
    this.setScreen('settings');
    const s = this.profile.settings;
    const toggle = (key: keyof typeof s, label: string, hint: string) => {
      const button = h('button', { class: 'switch', role: 'switch', 'aria-checked': String(s[key]), 'aria-label': label });
      button.addEventListener('click', () => {
        s[key] = !s[key];
        button.setAttribute('aria-checked', String(s[key]));
        if (key === 'sound' && s.sound) this.sound.unlock();
        this.sound.enabled = s.sound;
        this.sound.musicOn = s.music;
        if (s.music) this.sound.startMusic(); else this.sound.stopMusic();
        this.applyMotion();
        this.tap();
        this.saveSoon();
      });
      return h('div', { class: 'panel row' }, h('div', { class: 'label' }, label, h('small', {}, hint)), button);
    };
    this.ui.append(h('main', { class: 'screen' },
      h('div', { class: 'screen-inner' },
        h('header', { class: 'topbar' },
          h('button', { class: 'icon-btn', 'aria-label': 'Back', onClick: () => { this.tap(); this.showHome(); } }, '←'),
          h('h1', {}, 'Settings')
        ),
        h('div', { class: 'list' },
          toggle('sound', 'Sound', 'Scrubs, pops and chimes. Captions show when it\'s off.'),
          toggle('music', 'Music', 'A calm little background tune.'),
          toggle('haptics', 'Haptics', 'Little buzzes on phones that support them.'),
          toggle('reducedMotion', 'Reduce motion', 'Fewer particles, fades instead of wipes.'),
          toggle('bigBrush', 'Big brush', 'A wider sponge for easier cleaning.')
        ),
        h('section', { class: 'panel row', style: { flexDirection: 'column', alignItems: 'flex-start' } },
          h('h2', {}, 'About'),
          h('p', { class: 'muted' }, 'Sweet Home Reset · PixelVortex Games. Made to be calm: no ads, no streaks to lose, and nothing goes away while you rest.'),
          h('p', { class: 'muted' }, 'Pixel art is drawn in code for now. Sounds are made live with WebAudio.')
        ),
        h('button', { class: 'btn', onClick: async () => {
          if (!window.confirm('Start over? This clears rooms, Sparkles and outfits on this device.')) return;
          await eraseSave();
          window.location.reload();
        } }, 'Start over on this device')
      )
    ));
  }
}
