// platinum-roadmap.js — the nine-stage route to the platinum, in the order an
// efficient first run should take them. Hours are week-one pace estimates.
// Trophy ids refer to app/data/trophies.json. Missable callouts come from the
// sources named in the data file: the windowed stranger chains (TechWiser) and
// Positive Mental Attitude (GTABase / PowerPyx).
export const ROADMAP = [
  {
    n: 1, title: 'Prologue & Chapter 1', hours: '~4-5 h', trophyIds: [2, 3, 20, 44],
    note: 'Gone Fishing teaches the rod, so beat Cal while the lesson is fresh, and take the Ocean Beach cocktail the first time the story puts you on the strip. Two cheap bronzes ride along with the chapter.',
  },
  {
    n: 2, title: 'Chapters 2 & 3', hours: '~12-14 h', trophyIds: [4, 5, 8, 9],
    note: 'The story opens up and so do the stranger strands. From here on, a strand stage before a story mission is the rhythm that keeps the windowed chains safe.',
  },
  {
    n: 3, title: 'Stranger strands, first pass', hours: '~5-7 h', trophyIds: [22, 23, 24, 29],
    note: 'Andy, Kenton, Billy and Bret. TechWiser reports these chains sit in windows tied to story progress: open each on sight and never let one sit three chapters behind.',
  },
  {
    n: 4, title: 'Chapter 4', hours: '~7 h', trophyIds: [6, 10, 11],
    note: 'The last full chapter. Before its closing missions, sweep: every open strand finished, every meditation spot in the current regions used. The endgame forgives nothing.',
  },
  {
    n: 5, title: 'The finale', hours: '~4 h', trophyIds: [7, 12, 13, 47, 48],
    note: 'Point of no return. Hard manual save first — the choice-driven Actions Speak Louder and the partnership moment Personal Best both live around here, and the save turns a miss into a reload.',
  },
  {
    n: 6, title: 'Strands, second pass', hours: '~4-5 h', trophyIds: [26, 27, 25],
    note: 'Randy and Tyrone close out the named chains; the eighth completed strand pays the Strangers & Freaks silver. Any strand still open after the story is finished here, in free roam.',
  },
  {
    n: 7, title: 'Collectibles & the map', hours: '~14-18 h', trophyIds: [28, 30, 31, 35, 42],
    note: 'Meditation spots first — the one possibly-missable trophy on the list (GTABase, PowerPyx) — then card sets, WAiNK spots, vehicle discoveries and the full-map flyover, district by district.',
  },
  {
    n: 8, title: 'Activities, heists & partner work', hours: '~20-26 h', trophyIds: [15, 16, 17, 18, 19, 21, 32, 33, 34, 36, 37, 38, 39, 40, 41, 43, 45, 46, 49, 50, 51],
    note: 'The long tail, and most of it stacks: stunt ramps on story routes, gang operations feeding Marked Bills, partner robberies feeding the laundering total. Leave the 250 stunts and the range golds ticking from stage 1, not starting here.',
  },
  {
    n: 9, title: 'Money, property & the 100%', hours: '~6-8 h', trophyIds: [52, 53, 54, 55, 14, 1],
    note: 'Laundering reaches $250,000, the garages get bought, the Scooter Bros count fills — then the in-game checklist tops out at 100% and the platinum awards itself. A Long Road is the last long pole; everything else is already done.',
  },
];

export function roadmapStageFor(trophyId) {
  return ROADMAP.find((s) => s.trophyIds.includes(trophyId)) || null;
}
