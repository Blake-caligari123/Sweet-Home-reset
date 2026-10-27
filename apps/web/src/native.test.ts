import { describe, expect, it, vi } from 'vitest';
import { createNativeBridge, type NativePlugins } from './native';

function fakePlugins() {
  const listeners: Record<string, (data: unknown) => void> = {};
  const plugins: NativePlugins = {
    app: {
      addListener: vi.fn(async (event: string, handler: (data: never) => void) => {
        listeners[event] = handler as (data: unknown) => void;
        return { remove: async () => { delete listeners[event]; } };
      }),
      minimizeApp: vi.fn(async () => {})
    },
    haptics: {
      impact: vi.fn(async () => {}),
      notification: vi.fn(async () => {})
    },
    statusBar: {
      setStyle: vi.fn(async () => {}),
      setBackgroundColor: vi.fn(async () => {})
    }
  };
  return { plugins, listeners };
}

describe('native bridge on a phone', () => {
  it('fires a light impact for each clean stage and a success buzz when the room is done', async () => {
    const { plugins } = fakePlugins();
    const bridge = createNativeBridge('android', plugins);
    await bridge.haptic('stage');
    await bridge.haptic('complete');
    expect(plugins.haptics.impact).toHaveBeenCalledWith({ style: 'LIGHT' });
    expect(plugins.haptics.notification).toHaveBeenCalledWith({ type: 'SUCCESS' });
  });

  it('routes the Android back button to the handler', async () => {
    const { plugins, listeners } = fakePlugins();
    const bridge = createNativeBridge('android', plugins);
    const onBack = vi.fn();
    await bridge.onBack(onBack);
    listeners.backButton({ canGoBack: false });
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('reports when the app goes to the background and comes back', async () => {
    const { plugins, listeners } = fakePlugins();
    const bridge = createNativeBridge('ios', plugins);
    const onActive = vi.fn();
    await bridge.onActiveChange(onActive);
    listeners.appStateChange({ isActive: false });
    listeners.appStateChange({ isActive: true });
    expect(onActive.mock.calls).toEqual([[false], [true]]);
  });

  it('sets a dark status bar text on the cream background', async () => {
    const { plugins } = fakePlugins();
    await createNativeBridge('android', plugins).setup();
    expect(plugins.statusBar.setStyle).toHaveBeenCalledWith({ style: 'LIGHT' });
    expect(plugins.statusBar.setBackgroundColor).toHaveBeenCalledWith({ color: '#f8e8be' });
  });

  it('keeps playing when a plugin call throws', async () => {
    const { plugins } = fakePlugins();
    plugins.haptics.impact = vi.fn(async () => { throw new Error('no vibrator'); });
    await expect(createNativeBridge('android', plugins).haptic('stage')).resolves.toBeUndefined();
  });
});

describe('native bridge on the web', () => {
  it('never touches native plugins', async () => {
    const { plugins } = fakePlugins();
    const bridge = createNativeBridge('web', plugins);
    await bridge.setup();
    await bridge.haptic('complete');
    await bridge.onBack(() => {});
    await bridge.minimize();
    expect(bridge.isNative).toBe(false);
    expect(plugins.haptics.notification).not.toHaveBeenCalled();
    expect(plugins.app.addListener).not.toHaveBeenCalled();
    expect(plugins.app.minimizeApp).not.toHaveBeenCalled();
    expect(plugins.statusBar.setStyle).not.toHaveBeenCalled();
  });
});
