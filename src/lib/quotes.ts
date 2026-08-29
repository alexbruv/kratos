export const QUOTES: readonly string[] = [
  "Strength doesn't come from what you can do. It comes from overcoming the things you once thought you couldn't.",
  "You don't have to be great to start, but you have to start to be great.",
  "The only bad workout is the one that didn't happen.",
  "Discipline is choosing between what you want now and what you want most.",
  "Small steps every day. That's the whole secret.",
  "Show up. That's ninety percent of it.",
  "Your streak isn't broken by a hard day. It's broken by quitting.",
  "The body achieves what the mind believes.",
  "One rep, one set, one day at a time.",
  "Progress is progress, no matter how small.",
  "You are one workout away from a good mood.",
  "The pain of discipline weighs ounces. The pain of regret weighs tons.",
  "Consistency is what transforms average into excellence.",
  "Every champion was once a contender who refused to give up.",
  "It never gets easier, you just get stronger.",
  "The comeback is always stronger than the setback.",
  "Don't count the days. Make the days count.",
  "A little progress each day adds up to big results.",
  "You didn't come this far to only come this far.",
  "Motivation gets you started. Habit keeps you going.",
  "Today's effort is tomorrow's strength.",
  "The hardest lift is getting off the couch.",
  "Sweat is just fat crying.",
  "Nobody who ever gave their best effort regretted it.",
  "Strength grows in the moments you think you can't go on but you keep going anyway.",
  "The only way out is through.",
  "Do something today that your future self will thank you for.",
  "Success is the sum of small efforts repeated daily.",
  "You're stronger than yesterday.",
  "Keep going. Everyone you admire started exactly where you are.",
];

function hashDateStr(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Deterministic pick for a given local date — same quote all day, a new one the next day. */
export function quoteForDate(dateStr: string, quotes: readonly string[] = QUOTES): string {
  return quotes[hashDateStr(dateStr) % quotes.length];
}
