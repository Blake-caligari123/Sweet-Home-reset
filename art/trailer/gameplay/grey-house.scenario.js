// "This house had no colour left": a new game in Puff's grey burrow, cleaned to 100%.
// Real speed for the first spots, fast in the middle, real speed again for the last spot and Puff's lines.
module.exports = async (s) => {
  await s.skip(1.5);
  await s.click("Let's tidy!");
  await s.click('Done');
  await s.T('skipTips');                     // every tool to hand, no tutorial pop-ups mid-clip
  s.mark('start');
  await s.rec(2.4);                          // the grey room, "Ooh. Grey. Let's fix that."
  let n = 0;
  for (;;) {
    const left = (await s.T('mess')).length;
    if (!left) break;
    s.speed(n < 3 || left <= 1 ? 1 : 6);
    if (n === 3) s.mark('fast');
    if (left === 1) s.mark('last');
    const m = await s.nearestMess();
    await s.clean(m);
    n += 1;
  }
  s.speed(1);
  s.mark('restored');
  await s.rec(6.5);                          // "It's... a home. Is it mine?" … "It's mine."
};
