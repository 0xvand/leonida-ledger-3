// ledger-app.js — the entry point: loads the trophy data, holds tracker
// state, wires the toolbar, and re-renders on every change. All work is
// client-side; the only file fetched is the app's own data/trophies.json.
import { loadEarned, saveEarned, loadShield, saveShield, exportProgress, parseImportedProgress } from './trophy-store.js';
import { applyFilters, sortTrophies } from './trophy-filters.js';
import { renderProgress, renderRoadmapStrip, renderList, renderDetail, renderRoadmap, renderSources } from './trophy-render.js';

const state = {
  trophies: [],
  byId: new Map(),
  earned: loadEarned(),
  shield: loadShield(),
  kind: 'all',
  tier: 'all',
  sort: 'order',
  query: '',
  remainingOnly: false,
  selectedId: null,
};

function refresh() {
  const visible = sortTrophies(applyFilters(state.trophies, state), state.sort);
  renderProgress(state.trophies, state.earned);
  renderRoadmapStrip(state.earned, scrollToStage);
  renderList(visible, state, selectTrophy, toggleEarned);
  renderDetail(state.byId.get(state.selectedId) || null, state, toggleEarned);
  renderRoadmap(state.byId, state.earned, selectTrophyAndScroll);
}

function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveEarned(state.earned);
  refresh();
}

function selectTrophy(id) {
  state.selectedId = id;
  refresh();
}

function selectTrophyAndScroll(id) {
  selectTrophy(id);
  document.getElementById('layout').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollToStage(stage) {
  const card = document.getElementById(`stage-${stage.n}`);
  if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function wireToolbar() {
  document.getElementById('search').addEventListener('input', (ev) => {
    state.query = ev.target.value;
    refresh();
  });
  document.getElementById('kind-chips').addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-kind]');
    if (!btn) return;
    state.kind = btn.dataset.kind;
    for (const chip of document.querySelectorAll('#kind-chips .chip')) {
      chip.classList.toggle('active', chip === btn);
    }
    refresh();
  });
  document.getElementById('tier-filter').addEventListener('change', (ev) => {
    state.tier = ev.target.value;
    refresh();
  });
  document.getElementById('sort-mode').addEventListener('change', (ev) => {
    state.sort = ev.target.value;
    refresh();
  });
  const shieldBox = document.getElementById('spoiler-shield');
  shieldBox.checked = state.shield;
  shieldBox.addEventListener('change', () => {
    state.shield = shieldBox.checked;
    saveShield(state.shield);
    refresh();
  });
  document.getElementById('remaining-only').addEventListener('change', (ev) => {
    state.remainingOnly = ev.target.checked;
    refresh();
  });
  document.getElementById('export-btn').addEventListener('click', () => exportProgress(state.earned));
  document.getElementById('import-file').addEventListener('change', async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    try {
      state.earned = parseImportedProgress(await file.text());
      saveEarned(state.earned);
      refresh();
    } catch {
      document.getElementById('list-summary').textContent = 'That file did not parse as a Leonida Ledger progress export.';
    }
    ev.target.value = '';
  });
}

async function boot() {
  const res = await fetch('data/trophies.json');
  const data = await res.json();
  state.trophies = data.trophies;
  state.byId = new Map(data.trophies.map((t) => [t.id, t]));
  renderSources(data.sources || []);
  wireToolbar();
  const fromHash = Number(new URLSearchParams(location.hash.slice(1)).get('trophy'));
  if (state.byId.has(fromHash)) state.selectedId = fromHash;
  refresh();
}

boot();
