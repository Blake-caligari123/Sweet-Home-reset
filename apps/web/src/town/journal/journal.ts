import { chapterNow, type StoryDef, type StoryState } from '../story/path';

// The Keeper's journal (claude/MAIN-PATH.md): everything to do and the story so far, in one
// place. Today's step and a couple of other ideas, the chapter's diary filling in as Puff goes,
// what's new to try, and the side quests. Pure: journal-sheet.ts draws it.

export interface JournalInput {
  def: StoryDef; story: StoryState; day: number;
  /** Text by id, with {puff} and {town} filled in. */
  line(id: string): string;
  /** Today's 📖 step (the tracker line), if one is on. */
  today: string | null;
  /** Other things to do today: a job, the café order, a quest step. */
  also: (string | null | undefined)[];
  /** The newest thing to try, if any. */
  tryNew: string | null;
  /** Side quests under way: name and where they're up to. */
  quests: { name: string; hint: string }[];
}

export interface JournalPage {
  chapter: string; done: number; total: number;
  today: string; also: string[];
  /** This chapter's story so far, and the chapters already told. */
  diary: string[]; past: string[];
  tryNew: string | null; quests: { name: string; hint: string }[];
}

export function journalPage(i: JournalInput): JournalPage {
  const { def, story } = i;
  const now = chapterNow(def, story);
  const next = def.steps[story.step];
  const today = i.today ?? (!next ? 'The year\'s story is told. The town glows!'
    : story.day === i.day ? 'That\'s today\'s story. More tomorrow!' : `The story carries on on day ${next.day}.`);
  const at = def.chapters.findIndex((c) => c.id === now.chapter.id);
  return {
    chapter: now.chapter.name, done: now.done.length, total: now.total, today,
    also: i.also.filter((x): x is string => !!x).slice(0, 2),
    diary: now.done.map((id) => i.line(`story.${id}.diary`)),
    past: def.chapters.slice(0, Math.max(0, at)).map((c) => c.name),
    tryNew: i.tryNew, quests: i.quests
  };
}
