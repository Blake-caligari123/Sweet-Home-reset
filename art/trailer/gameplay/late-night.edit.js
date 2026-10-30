// Edit for late-night: captions keyed to the capture's events (see late-night.scenario.js and .cut.js).
// While the letter is open, captions sit high so they don't cover it.
window.makeEdit = ({ at, length }) => {
  const fast = at('fast'), asleep = at('asleep'), letter = at('letter'), did = at('did-it'), end = length + 1.6;
  return {
    duration: end,
    captions: [
      { text: 'me at 12:50am:\n"just one more spot"', from: 0, to: fast + 1.6 },
      { text: 'the game literally\ntells you to go to bed', from: fast + 1.6, to: asleep },
      { text: 'so Puff just\nfalls asleep 😴', from: asleep, to: asleep + 1.6, y: 640 },
      { text: 'next morning, Puff\nwrites YOU a letter', from: asleep + 1.6, to: did, y: 640 },
      { text: 'one tiny real chore.\nor just tea. no pressure.', from: did, to: length },
    ],
    callouts: [{ from: .2, to: asleep, x: 960, y: 80, rx: 150, ry: 78 }],
    speed: [{ from: fast, to: asleep, x: 10, y: 1250 }],
    endCard: { from: length, line: 'it cheers on your real home too' },
  };
};
