// Edit for late-night: captions keyed to the capture's events (see late-night.scenario.js and .cut.js).
// While the letter is open, captions sit high so they don't cover it. Every caption stays up for at least
// letters ÷ 15 + 1.5 s, and the letter itself stays up long enough to read.
window.makeEdit = ({ at, length }) => {
  const asleep = at('asleep'), did = at('did-it'), end = length + 1.6;
  return {
    duration: end,
    captions: [
      { text: 'me at 12:50am:\n"just one more spot"', from: 0, to: 3.8 },
      { text: 'the game literally\ntells you to go to bed', from: 3.8, to: asleep },
      { text: 'so Puff just\nfalls asleep 😴', from: asleep, to: asleep + 3.0, y: 640 },
      { text: 'next morning, Puff\nwrites YOU a letter', from: asleep + 3.0, to: did, y: 640 },
      { text: 'one tiny real chore.\nor just tea. no pressure.', from: did, to: length },
    ],
    callouts: [{ from: .2, to: asleep, x: 960, y: 80, rx: 150, ry: 78 }],
    endCard: { from: length, line: 'it cheers on your real home too' },
  };
};
