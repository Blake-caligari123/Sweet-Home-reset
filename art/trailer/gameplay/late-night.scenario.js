// "Just one more spot… at 1:50am": Puff keeps cleaning just before 1am while the energy bar runs down,
// nods off (free, no penalty), wakes at home and writes the player a letter suggesting one tiny real chore.
module.exports = async (s) => {
  await s.skip(1.5);
  await s.click("Let's tidy!");
  await s.click('Done');
  await s.T('skipTips');
  await s.T('setMinutes', 1494);             // 12:54 am: past 1:00 the night runs fast
  await s.T('setFluff', 30);
  await s.skip(.6);
  s.mark('start');
  const asleep = async () => (await s.T('debug')).day > 1;
  for (let n = 0; n < 20 && !(await asleep()); n++) {
    const m = await s.nearestMess();
    if (!m) break;
    await s.clean(m, { stop: asleep });
  }
  s.mark('asleep');
  await s.rec(1.6);                           // "Zzz... just resting my fluff."
  s.mark('letter');
  await s.rec(2.6);                           // the letter
  await s.click('I did it!', { record: true });
  s.mark('did-it');
  await s.rec(3.2);                           // the reward
};
