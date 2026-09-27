// patchrun.js：按更新预算应用并留账
import { parentOf } from "./jsonptr.js";

function cloneState(state) {
  return {
    doc: JSON.parse(JSON.stringify(state.doc)),
    pending: (state.pending || []).map(function (row) { return row.slice(); }),
    applied: (state.applied || []).slice()
  };
}

function locate(spec, doc, path) {
  try {
    return parentOf(doc, path);
  } catch (error) {
    if (error && error.code === "E_PATH_MISSING" && spec.path_error_code) {
      error.code = spec.path_error_code;
    } else if (error && error.code === "E_INDEX_RANGE" && spec.index_error_code) {
      error.code = spec.index_error_code;
    }
    throw error;
  }
}

function checkEvent(spec, event) {
  const ok = event !== null && typeof event === "object"
    && event.kind === "set"
    && typeof event.path === "string"
    && Object.prototype.hasOwnProperty.call(event, "value");
  if (!ok) {
    const error = new Error("事件不合法: " + JSON.stringify(event));
    error.code = spec.event_error_code || "E_BAD_EVENT";
    throw error;
  }
}

function applyOne(spec, doc, path, value) {
  const spot = locate(spec, doc, path);
  spot.holder[spot.key] = value;
}

export function step(spec) {
  const events = spec.events || [];
  const budget = spec.budget === undefined ? 0 : spec.budget;
  const state = cloneState(spec.state);
  const done = new Set(state.applied);
  let applied = 0;
  let judged = 0;
  events.forEach(function (event, index) {
    const key = event && event.id !== undefined ? event.id : index;
    if (done.has(key)) {
      return;
    }
    checkEvent(spec, event);
    judged += 1;
    if (applied < budget) {
      applyOne(spec, state.doc, event.path, event.value);
      applied += 1;
      done.add(key);
    } else {
      state.pending.push([event.path, event.value, key]);
    }
  });
  state.applied = Array.from(done);
  return {
    state: state,
    applied: applied,
    pending_before: state.pending.length,
    pending_paths: state.pending.map(function (row) { return [row[0], row[1]]; }),
    judged: judged,
    judged_bound: events.length
  };
}

export function close(spec) {
  const state = cloneState(spec.state);
  const done = new Set(state.applied);
  let catchup = 0;
  state.pending.forEach(function (row) {
    applyOne(spec, state.doc, row[0], row[1]);
    catchup += 1;
    if (row.length > 2) {
      done.add(row[2]);
    }
  });
  state.pending = [];
  state.applied = Array.from(done);
  return { state: state, catchup: catchup };
}
