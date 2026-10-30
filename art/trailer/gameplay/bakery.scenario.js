// "Hazel's bakery": a busy baker's grey shop, cleaned to 100% (real speed, then 10×, then real speed).
// The first and last frames make the before/after.
module.exports = async (s) => {
  await s.skip(1.5);
  await s.click("Let's tidy!");
  await s.click('Done');
  await s.T('skipTips');
  await s.T('visit', 'bakery', 8, 11, false);
  await s.skip(2.5);                          // let the area settle
  s.mark('start');
  await s.rec(1.2);
  for (let n = 0; ; n++) {
    const left = (await s.T('mess')).length;
    if (!left) break;
    if (n === 3) { s.speed(10); s.mark('fast'); }
    if (left === 1) { s.speed(1); s.mark('last'); }
    await s.clean(await s.nearestMess());
  }
  s.speed(1);
  s.mark('restored');
  await s.rec(2.5);
};
