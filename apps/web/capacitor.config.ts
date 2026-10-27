import type { CapacitorConfig } from '@capacitor/cli';

// Bundle id is locked (claude/config/app.json). Universal/App Links wait for the real
// app domain, which is still the {APP_DOMAIN} placeholder, so no hostname is set here.
// ios/ and android/ are generated with `npx cap add` and are gitignored.
const config: CapacitorConfig = {
  appId: 'com.pixelvortexgames.sweethomereset',
  appName: 'Sweet Home Reset',
  webDir: 'dist',
  backgroundColor: '#f8e8be',
  ios: {
    backgroundColor: '#f8e8be',
    contentInset: 'automatic'
  },
  android: {
    backgroundColor: '#f8e8be'
  }
};

export default config;
