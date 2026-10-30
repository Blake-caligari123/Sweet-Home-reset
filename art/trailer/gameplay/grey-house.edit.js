// Edit for grey-house: captions keyed to the capture's events (see grey-house.scenario.js).
window.makeEdit = ({ at, ev }) => {
  const end = ev.frames / ev.fps, first = at('cleaned'), fast = at('fast'), last = at('last'), lines = at('lines');
  return {
    duration: end,
    captions: [
      { text: 'this little house has\nlost all its colour', from: 0, to: first },
      { text: 'every spot you clean\ngets its colour back', from: first, to: fast },
      { text: 'watch the whole\nroom come back', from: fast + .2, to: last },
      { text: 'and then Puff says…', from: lines - .2, to: lines + 1.4, y: 1500, size: 64 },
    ],
    speed: [{ from: fast, to: last, x: 8, y: 1250 }],
    zooms: [{ from: lines, to: end - 1.3, scale: 1.3, x: 540, y: 820 }],
    endCard: { from: end - 1.3, line: 'tidy a little. colour comes back.' },
  };
};
