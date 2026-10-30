// "Hazel's bakery": a busy baker's grey shop, cleaned spot by spot until Hazel notices the colour,
// then sped up to 100%. The first and last frames make the before/after.
module.exports = async (s) => {
  await s.skip(1.5);
  await s.click("Let's tidy!");
  await s.click('Done');
  await s.T('skipTips');
  await s.T('visit', 'bakery', 8, 11, false);
  await s.skip(2.5);                          // let the area settle
  s.mark('start');
  await s.rec(1.2);
  // clean towards Hazel at real speed, then say hello
  for (let i = 0; i < 4; i++) await s.clean(await s.nearestMess());
  s.mark('hello');
  await s.T('tapNeighbour', 'hazel');
  await s.recUntilIdle(4);
  await s.rec(2.6);                           // "Oh! The colour's back. No mayor here, petal..."
  await s.click('Skip');
  s.mark('fast');
  s.speed(8);
  for (;;) {
    const left = (await s.T('mess')).length;
    if (!left) break;
    if (left === 1) { s.speed(1); s.mark('last'); }
    await s.clean(await s.nearestMess());
  }
  s.speed(1);
  s.mark('restored');
  await s.rec(4.5);
};
