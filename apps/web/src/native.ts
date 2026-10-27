// Thin wrapper over the Capacitor plugins the game uses. On the web every call is a no-op,
// and a plugin error never interrupts play.
export type Platform = 'web' | 'ios' | 'android';
export type HapticKind = 'light' | 'medium' | 'success';

interface ListenerHandle { remove(): Promise<void> }

export interface NativePlugins {
  app: {
    addListener(event: 'backButton', handler: (data: { canGoBack: boolean }) => void): Promise<ListenerHandle>;
    addListener(event: 'appStateChange', handler: (data: { isActive: boolean }) => void): Promise<ListenerHandle>;
    minimizeApp(): Promise<void>;
  };
  haptics: {
    impact(options: { style: 'LIGHT' | 'MEDIUM' }): Promise<void>;
    notification(options: { type: 'SUCCESS' }): Promise<void>;
  };
  statusBar: {
    setStyle(options: { style: 'LIGHT' }): Promise<void>;
    setBackgroundColor(options: { color: string }): Promise<void>;
  };
}

export type NativeBridge = ReturnType<typeof createNativeBridge>;

const BACKGROUND = '#f8e8be';

async function quietly(call: () => Promise<unknown>) {
  try {
    await call();
  } catch {
    // Native extras are nice to have; the room stays playable without them.
  }
}

export function createNativeBridge(platform: Platform, plugins: NativePlugins) {
  const isNative = platform !== 'web';

  return {
    isNative,
    platform,
    async setup() {
      if (!isNative) return;
      // Style.Light means dark status bar text, which suits the cream background.
      await quietly(() => plugins.statusBar.setStyle({ style: 'LIGHT' }));
      if (platform === 'android') await quietly(() => plugins.statusBar.setBackgroundColor({ color: BACKGROUND }));
    },
    async haptic(kind: HapticKind) {
      if (!isNative) return;
      await quietly(() => kind === 'success'
        ? plugins.haptics.notification({ type: 'SUCCESS' })
        : plugins.haptics.impact({ style: kind === 'medium' ? 'MEDIUM' : 'LIGHT' }));
    },
    async onBack(handler: () => void) {
      if (!isNative) return;
      await quietly(() => plugins.app.addListener('backButton', () => handler()));
    },
    async onActiveChange(handler: (isActive: boolean) => void) {
      if (!isNative) return;
      await quietly(() => plugins.app.addListener('appStateChange', ({ isActive }) => handler(isActive)));
    },
    async minimize() {
      if (!isNative) return;
      await quietly(() => plugins.app.minimizeApp());
    }
  };
}

export async function loadNativeBridge(): Promise<NativeBridge> {
  const { Capacitor } = await import('@capacitor/core');
  const platform = Capacitor.getPlatform() as Platform;
  const [{ App }, { Haptics }, { StatusBar }] = await Promise.all([
    import('@capacitor/app'),
    import('@capacitor/haptics'),
    import('@capacitor/status-bar')
  ]);
  return createNativeBridge(platform, {
    app: App as unknown as NativePlugins['app'],
    haptics: Haptics as unknown as NativePlugins['haptics'],
    statusBar: StatusBar as unknown as NativePlugins['statusBar']
  });
}
