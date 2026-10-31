// Edit for bakery: captions keyed to the capture's events (see bakery.scenario.js and .cut.js), then a before/after
// wipe over the held last frame. Every caption stays up for at least letters ÷ 15 + 1.5 s.
window.makeEdit = ({ at, length }) => {
  const fast = at('fast'), held = length - 4.8, end = length + 1.4;
  return {
    duration: end,
    captions: [
      { text: "Hazel's too busy\nbaking to clean", from: 0, to: fast },
      { text: 'so we helped 🧹', from: fast, to: fast + 2.5 },
      { text: 'her whole bakery,\nspot by spot', from: fast + 2.5, to: held },
    ],
    speed: [{ from: fast, to: held, x: 14, y: 1250 }],
    beforeAfter: { from: held + .2, to: length, frame: 40 },
    endCard: { from: length, line: 'tidy a little. colour comes back.' },
  };
};
