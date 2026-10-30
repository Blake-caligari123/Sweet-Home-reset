// Edit for bakery: captions keyed to the capture's events (see bakery.scenario.js), then a before/after wipe.
window.makeEdit = ({ at, atOr, length }) => {
  const cap = length, first = at('cleaned'), fast = at('fast'), restored = at('restored'), last = atOr('last', restored - .8);
  const end = cap + 4.5;                      // the last frame holds while the before/after wipe plays
  return {
    duration: end,
    captions: [
      { text: "Hazel's been too busy\nbaking to clean", from: 0, to: first },
      { text: 'so we helped 🧹', from: first, to: fast },
      { text: 'her whole bakery,\nspot by spot', from: fast + .2, to: last },
      { text: 'before → after', from: cap, to: end - 1.3, y: 1640, size: 64 },
    ],
    speed: [{ from: fast, to: last, x: 10, y: 1250 }],
    beforeAfter: { from: cap, to: end - 1.3, frame: 0 },
    endCard: { from: end - 1.3, line: 'tidy a little. colour comes back.' },
  };
};
