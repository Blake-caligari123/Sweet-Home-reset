/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** Build settings for selling the unlock; all optional, and none of them secret (BACKEND-PLAN §4). */
interface ImportMetaEnv {
  /** The API's origin on the web (Stripe checkout and sign-in go through it). */
  readonly VITE_API_ORIGIN?: string;
  /** RevenueCat's public SDK keys for the App Store and Google Play builds. */
  readonly VITE_RC_IOS_KEY?: string;
  readonly VITE_RC_ANDROID_KEY?: string;
}
