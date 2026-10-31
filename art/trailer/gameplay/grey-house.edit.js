// Edit for grey-house: captions keyed to the capture's events (see grey-house.scenario.js and .cut.js).
// Puff's lines at the restore are slowed down and zoomed so the card that pops up below stays out of shot.
// Every caption stays up for at least letters ÷ 15 + 1.5 s.
window.makeEdit = ({ at, length }) => {
  const fast = at('fast'), restored = at('restored'), end = length + 1.8;
  return {
    duration: end,
    captions: [
      { text: 'this house lost\nits colour', from: 0, to: 3.1 },
      { text: 'every spot you clean\ngets its colour back', from: 3.1, to: 7.3 },
      { text: 'watch the whole\nroom come back', from: 7.3, to: restored - .9 },
    ],
    speed: [{ from: fast, to: restored - .9, x: 10, y: 1250 }],
    zooms: [{ from: restored - .9, to: end + 1, scale: 2.1, x: 540, y: 480, ease: .7 }],
    endCard: { from: length, line: 'tidy a little. colour comes back.' },
  };
};
