// trophy-filters.js — pure list logic: search, kind/tier filters, spoiler
// masking and sorting. No DOM in here; ledger-app feeds it state and
// trophy-render draws what comes back.
export const TIER_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

export function trophyMatchesSearch(t, query) {
  if (!query) return true;
  const hay = `${t.name} ${t.description} ${t.section} ${t.kind} ${t.guide}`.toLowerCase();
  return query.toLowerCase().split(/\s+/).every((word) => hay.includes(word));
}

export function trophyMatchesKind(t, kind) {
  if (kind === 'all') return true;
  if (kind === 'missable') return t.missable === true;
  if (kind === 'secret') return t.secret === true;
  return t.kind === kind;
}

export function applyFilters(trophies, state) {
  return trophies.filter(
    (t) =>
      trophyMatchesKind(t, state.kind) &&
      (state.tier === 'all' || t.grade === state.tier) &&
      (!state.remainingOnly || !state.earned.has(t.id)) &&
      trophyMatchesSearch(t, state.query),
  );
}

export function sortTrophies(list, mode) {
  const by = {
    order: (a, b) => a.id - b.id,
    rarest: (a, b) => a.earnPct - b.earnPct || a.id - b.id,
    common: (a, b) => b.earnPct - a.earnPct || a.id - b.id,
    tier: (a, b) => TIER_ORDER[a.grade] - TIER_ORDER[b.grade] || a.id - b.id,
    name: (a, b) => a.name.localeCompare(b.name),
  }[mode] || ((a, b) => a.id - b.id);
  return [...list].sort(by);
}

export function displayName(t, shieldOn, earned) {
  if (shieldOn && t.secret && !earned.has(t.id)) return 'Hidden trophy';
  return t.name;
}

export function displayDescription(t, shieldOn, earned) {
  if (shieldOn && t.secret && !earned.has(t.id)) {
    return 'Hidden on PlayStation until earned. Turn the spoiler shield off, or earn it, to read the official description.';
  }
  return t.description;
}

export function progressStats(trophies, earned) {
  const done = trophies.filter((t) => earned.has(t.id));
  return {
    count: done.length,
    total: trophies.length,
    pct: Math.round((done.length / trophies.length) * 100),
    points: done.reduce((sum, t) => sum + t.points, 0),
    totalPoints: trophies.reduce((sum, t) => sum + t.points, 0),
  };
}
