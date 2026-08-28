/** Frequency Dominion — shared curriculum types. */

export type Lesson = {
  id: string;
  title: string;
  /** Total lesson length (spoken script + drill + template). */
  minutes: number;
  outcome: string;
  /** Teleprompter / VO script. Paragraphs separated by \n. Written for the ear. */
  script: string;
  /** On-screen beats: what the student sees while the VO runs (workbook, vault filter, timer). */
  beats: string[];
  /** Same-day implementation drill. */
  drill: string;
  /** The drill counts as done when this artifact exists. */
  doneWhen: string;
  /** Common failure + the fix. */
  failure: { fail: string; fix: string };
  /** Which campaign day(s) this lesson commands, e.g. "Campaign days 1–7". */
  dayOf?: string;
  /** Fill-in-the-blank block students paste. */
  template?: string;
  /** Fulfillment-zip files referenced by this lesson (paths inside the zip). */
  files?: string[];
  /** Key into WORKED_EXAMPLE.sections — the worked-example drawer for this lesson. */
  example?: string;
};

export type Module = {
  id: string;
  n: string;
  title: string;
  promise: string;
  lessons: Lesson[];
};
