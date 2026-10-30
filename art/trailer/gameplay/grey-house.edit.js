// Edit for grey-house: captions keyed to the capture's events (see grey-house.scenario.js and .cut.js).
// Puff's lines at the restore are slowed down and zoomed so the card that pops up below stays out of shot.
window.makeEdit = ({ at, atOr, length }) => {
  const first = at('cleaned'), fast = at('fast'), restored = at('restored'), last = atOr('last', restored - 1.2), end = length + 1.8;
  return {
    duration: end,
    captions: [
      { text: 'this little house has\nlost all its colour', from: 0, to: first },
      { text: 'every spot you clean\ngets its colour back', from: first, to: fast },
      { text: 'watch the whole\nroom come back', from: fast + .2, to: last },
      { text: 'the last spot…', from: last, to: restored - .3 },
    ],
    speed: [{ from: fast, to: last, x: 8, y: 1250 }],
    zooms: [{ from: restored - .6, to: end + 1, scale: 2.1, x: 540, y: 480, ease: .6 }],
    endCard: { from: length, line: 'tidy a little. colour comes back.' },
  };
};
