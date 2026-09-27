// patchrun.js：按更新预算应用并留账，收尾不限预算清账
import { parentOf } from "./jsonptr.js";

function coded(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function freshState(state) {
  if (!state || typeof state !== "object") return { doc: {}, pending: [], applied: [] };
  return {
    doc: JSON.parse(JSON.stringify(state.doc)),
    pending: (state.pending || []).map((row) => row.slice()),
    applied: (state.applied || []).slice()
  };
}

function isSetEvent(event) {
  return event !== null && typeof event === "object"
    && event.kind === "set"
    && typeof event.path === "string" && event.path.charAt(0) === "/"
    && Object.prototype.hasOwnProperty.call(event, "value");
}

function applyAt(doc, path, value) {
  const holder = parentOf(doc, path);
  holder.container[holder.key] = value;
}

function budgetOf(spec) {
  const budget = Number(spec && spec.budget);
  if (!Number.isFinite(budget) || budget < 0) return 0;
  return Math.floor(budget);
}

export function step(spec) {
  const state = freshState(spec && spec.state);
  const events = Array.isArray(spec && spec.events) ? spec.events : [];
  let budget = budgetOf(spec);
  let appliedCount = 0;
  const queue = [];

  for (const row of state.pending) {
    if (budget > 0) {
      applyAt(state.doc, row[0], row[1]);
      if (row[2] !== undefined) state.applied.push(row[2]);
      budget -= 1;
      appliedCount += 1;
    } else {
      queue.push(row);
    }
  }

  for (const event of events) {
    if (!isSetEvent(event)) throw coded("E_BAD_EVENT", "事件不合法：" + JSON.stringify(event));
    if (event.id !== undefined && state.applied.indexOf(event.id) !== -1) continue;
    parentOf(state.doc, event.path);
    if (budget > 0) {
      applyAt(state.doc, event.path, event.value);
      if (event.id !== undefined) state.applied.push(event.id);
      budget -= 1;
      appliedCount += 1;
    } else {
      queue.push([event.path, event.value, event.id]);
    }
  }

  state.pending = queue;
  return {
    state: state,
    applied: appliedCount,
    pending_before: queue.length,
    pending_paths: queue.map((row) => [row[0], row[1]]),
    judged: appliedCount,
    judged_bound: events.length
  };
}

export function close(spec) {
  const state = freshState(spec && spec.state);
  let catchup = 0;
  for (const row of state.pending) {
    applyAt(state.doc, row[0], row[1]);
    if (row[2] !== undefined) state.applied.push(row[2]);
    catchup += 1;
  }
  state.pending = [];
  return { state: state, catchup: catchup };
}
