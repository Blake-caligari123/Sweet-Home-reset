// "This house had no colour left": a new game in Puff's grey burrow, cleaned to 100%.
// Real speed for the first spots, 8× in the middle, real speed for the last spot and Puff's lines.
module.exports = async (s) => {
  await s.skip(1.5);
  await s.click("Let's tidy!");
  await s.click('Done');
  await s.T('skipTips');                     // every tool to hand, no tutorial pop-ups mid-clip
  s.mark('start');
  await s.rec(1.5);                          // the grey room, "Ooh. Grey. Let's fix that."
  for (let n = 0; ; n++) {
    const left = (await s.T('mess')).length;
    if (!left) break;
    if (n === 3) { s.speed(8); s.mark('fast'); }
    if (left === 1) { s.speed(1); s.mark('last'); }
    await s.clean(await s.nearestMess());
  }
  s.speed(1);
  s.mark('restored');
  await s.rec(1.2);                          // the room complete; the game offers a before/after clip
  await s.click('Not now', { record: true });
  s.mark('lines');
  await s.rec(5);                            // "It's... a home. Is it mine?" … "It's mine."
};
