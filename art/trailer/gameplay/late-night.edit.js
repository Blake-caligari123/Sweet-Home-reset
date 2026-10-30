// Edit for late-night: captions keyed to the capture's events (see late-night.scenario.js).
window.makeEdit = ({ at, ev }) => {
  const end = ev.frames / ev.fps, fast = at('fast'), asleep = at('asleep'), letter = at('letter'), did = at('did-it');
  return {
    duration: end,
    captions: [
      { text: 'me at 12:56am:\n"just one more spot"', from: 0, to: fast },
      { text: 'the game literally\ntells you to go to bed', from: fast, to: asleep },
      { text: 'so Puff just\nfalls asleep 😴', from: asleep, to: letter },
      { text: 'next morning, Puff\nwrites YOU a letter', from: letter, to: did },
      { text: 'one tiny real chore.\nor just tea. no pressure.', from: did, to: end - 1.4 },
    ],
    callouts: [{ from: .2, to: asleep, x: 960, y: 80, rx: 150, ry: 78 }],
    speed: [{ from: fast, to: asleep, x: 10, y: 1250 }],
    endCard: { from: end - 1.4, line: 'the cosy game that cheers on your real home' },
  };
};
