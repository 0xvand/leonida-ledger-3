// trophy-render.js — every DOM drawing job: progress header, roadmap strip,
// trophy rows, the detail card, roadmap stages and the source list. State and
// callbacks arrive from ledger-app; this file owns only presentation.
import { ROADMAP } from './platinum-roadmap.js';
import { displayName, displayDescription, progressStats } from './trophy-filters.js';

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

function pill(text, cls) {
  return el('span', `pill ${cls || ''}`.trim(), text);
}

export function renderProgress(trophies, earned) {
  const stats = progressStats(trophies, earned);
  document.getElementById('progress-pct').textContent = `${stats.pct}%`;
  document.getElementById('progress-fill').style.width = `${stats.pct}%`;
  document.getElementById('progress-line').textContent =
    `${stats.count} of ${stats.total} earned · ${stats.points.toLocaleString()} of ${stats.totalPoints.toLocaleString()} points`;
  const next = trophies.find((t) => !earned.has(t.id) && t.grade !== 'platinum')
    || trophies.find((t) => !earned.has(t.id));
  document.getElementById('progress-next').textContent = next
    ? `Next in guide order: ${next.name} (${next.grade}, ${next.earnPct}% of tracked players)`
    : 'Every trophy earned. Welcome to the legend club.';
}

export function renderRoadmapStrip(earned, onJump) {
  const strip = document.getElementById('roadmap-strip');
  strip.replaceChildren(el('span', 'strip-label', 'Roadmap:'));
  for (const stage of ROADMAP) {
    const done = stage.trophyIds.every((id) => earned.has(id));
    const chip = el('button', `stage-chip${done ? ' done' : ''}`);
    chip.type = 'button';
    chip.append(`${stage.n}. ${stage.title} `);
    chip.append(el('span', 'hrs', stage.hours));
    chip.addEventListener('click', () => onJump(stage));
    strip.append(chip);
  }
}

export function renderList(list, state, onSelect, onToggle) {
  const wrap = document.getElementById('trophy-list');
  wrap.replaceChildren();
  document.getElementById('list-summary').textContent =
    `Showing ${list.length} of 55 trophies · rarity is the live Exophase earn rate, read 21 Nov 2026`;
  if (list.length === 0) {
    wrap.append(el('p', '', 'No trophy matches the current filters. Loosen the search or clear a filter.'));
    return;
  }
  for (const t of list) {
    const isEarned = state.earned.has(t.id);
    const row = el('div', `trophy-row${isEarned ? ' earned' : ''}${state.selectedId === t.id ? ' selected' : ''}`);
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned;
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('click', (ev) => ev.stopPropagation());
    box.addEventListener('change', () => onToggle(t.id));
    const main = el('div', 'row-main');
    const name = el('div', 'row-name', displayName(t, state.shield, state.earned));
    if (isEarned) name.append(el('span', 'earned-tick', ' ✓'));
    main.append(name, el('div', 'row-desc', displayDescription(t, state.shield, state.earned)));
    const meta = el('div', 'row-meta');
    meta.append(
      pill(`${t.earnPct}% · ${t.rarity}`, 'rarity'),
      pill(t.section),
    );
    if (t.missable) meta.append(pill('⚠ missable', 'miss'));
    if (t.secret) meta.append(pill('secret', 'secret'));
    row.append(box, el('span', `grade-dot grade-${t.grade}`), main, meta);
    row.addEventListener('click', () => onSelect(t.id));
    wrap.append(row);
  }
}

export function renderDetail(t, state, onToggle) {
  const empty = document.getElementById('detail-empty');
  const card = document.getElementById('detail-card');
  if (!t) {
    empty.hidden = false;
    card.hidden = true;
    return;
  }
  empty.hidden = true;
  card.hidden = false;
  const isEarned = state.earned.has(t.id);
  card.replaceChildren();
  card.append(el('p', 'kicker', `${t.section} · ${t.kind}`));
  card.append(el('h2', '', displayName(t, state.shield, state.earned)));
  const gradeRow = el('div', 'detail-grade');
  gradeRow.append(
    pill(`${t.grade.toUpperCase()} · ${t.points} pts`),
    pill(`${t.earnPct}% earned · ${t.rarity}`, 'rarity'),
    pill(`Target: ${t.target}`),
    pill(`Time: ${t.time}`),
  );
  if (t.secret) gradeRow.append(pill('secret — hidden until earned', 'secret'));
  card.append(gradeRow);
  const bar = el('div', 'rarity-bar');
  const fill = el('div');
  fill.style.width = `${Math.max(1.5, Math.min(100, t.earnPct))}%`;
  bar.append(fill);
  card.append(bar);
  card.append(el('p', 'detail-facts', 'Share of Exophase-tracked players who have earned this trophy, two days after launch.'));
  const masked = state.shield && t.secret && !isEarned;
  card.append(el('p', 'official', masked
    ? displayDescription(t, state.shield, state.earned)
    : `“${t.description}” — official PlayStation description`));
  if (t.missable && t.missableNote) {
    const box = el('div', 'miss-box');
    box.append(el('strong', '', '⚠ MISSABLE — '), document.createTextNode(t.missableNote));
    card.append(box);
  }
  card.append(el('h3', '', 'How to earn it'));
  card.append(el('p', 'guide-text', t.guide));
  card.append(el('h3', '', 'Steps'));
  const steps = document.createElement('ol');
  for (const s of t.steps) steps.append(el('li', '', s));
  card.append(steps);
  card.append(el('h3', '', 'Sources'));
  const src = el('ul', 'sources-line');
  for (const s of t.sources) src.append(el('li', '', s));
  card.append(src);
  const btn = el('button', `earn-toggle${isEarned ? ' off' : ''}`, isEarned ? '✓ Earned — tap to undo' : 'Mark as earned');
  btn.type = 'button';
  btn.addEventListener('click', () => onToggle(t.id));
  card.append(btn);
}

export function renderRoadmap(trophiesById, earned, onSelect) {
  const wrap = document.getElementById('roadmap-stages');
  wrap.replaceChildren();
  for (const stage of ROADMAP) {
    const card = el('article', 'stage-card');
    card.id = `stage-${stage.n}`;
    card.append(el('h3', '', `Stage ${stage.n} — ${stage.title}`));
    card.append(el('p', 'stage-hrs', stage.hours));
    card.append(el('p', '', stage.note));
    const chips = el('div', 'stage-trophies');
    for (const id of stage.trophyIds) {
      const t = trophiesById.get(id);
      if (!t) continue;
      const chip = el('button', `${earned.has(id) ? 'done' : ''}${t.missable ? ' miss' : ''}`, t.name);
      chip.type = 'button';
      chip.addEventListener('click', () => onSelect(id));
      chips.append(chip);
    }
    card.append(chips);
    wrap.append(card);
  }
}

export function renderSources(sources) {
  const list = document.getElementById('source-list');
  list.replaceChildren();
  for (const s of sources) list.append(el('li', '', s));
}
