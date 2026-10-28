// Plus (GDD v3: seasons 2–4 and neighbours 4–6). This is the M2 stub: test builds have everything,
// and `?plus=0` in the URL shows the free game. Real entitlement (RevenueCat) replaces it in M5.

/** Whether this build has Plus. */
export function plusFromUrl(search: string) {
  return new URLSearchParams(search).get('plus') !== '0';
}

/** A Plus neighbour without Plus: a silhouette with a kind "later", never a paywall. */
export function isLocked(neighbour: { plus?: boolean } | undefined, plus: boolean) {
  return !!neighbour?.plus && !plus;
}
