import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Bundle id is locked. The deep-link host stays the placeholder in config/app.json
 * until Blake buys a domain. Do not invent a hostname here.
 * ios/ and android/ are added in frontend plan F19 and are gitignored.
 */
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
