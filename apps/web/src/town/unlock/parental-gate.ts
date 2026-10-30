// A grown-up check before any purchase (VISION §10: purchases sit behind a parental gate). A
// times-table question written in words takes reading and sums, which a young child usually can't.

const WORDS = ['six', 'seven', 'eight', 'nine'];

/** A question and its answer; `rand` gives 0–1 (Math.random in play, a fixed one in tests). */
export function parentQuestion(rand: () => number) {
  const a = Math.floor(rand() * WORDS.length); const b = Math.floor(rand() * WORDS.length);
  return { text: `Ask a grown-up: what is ${WORDS[a]} times ${WORDS[b]}?`, answer: (a + 6) * (b + 6) };
}

/** Only the right number, typed as digits. */
export const parentAnswerOk = (input: string, answer: number) => /^\d+$/.test(input.trim()) && Number(input.trim()) === answer;
