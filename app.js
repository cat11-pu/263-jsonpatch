// app.js：渲染结果
import { parentOf, readPath } from "./jsonptr.js";
import { step, close } from "./patchrun.js";

export function render(spec) {
  const events = spec.events || [];
  const half = Math.ceil(events.length / 2);
  const first = step(spec);
  const closed = close(Object.assign({}, spec, { state: first.state }));
  const r1 = step(Object.assign({}, spec, { events: events.slice(0, half) }));
  const r2 = step(Object.assign({}, spec, { state: r1.state, events: events.slice(half) }));
  const closedTwo = close(Object.assign({}, spec, { state: r2.state }));
  const replay = step(Object.assign({}, spec, { state: closed.state }));
  const wide = step(Object.assign({}, spec, { budget: spec.budget + 2 }));
  const full = step(Object.assign({}, spec, { budget: events.length + 2 }));
  const fullClosed = close(Object.assign({}, spec, { state: full.state }));
  const fingerprint = function (state) {
    return JSON.stringify({
      doc: state.doc,
      pending: state.pending.map(function (row) { return [row[0], row[1]]; }),
      applied: state.applied.length
    });
  };
  const watch = ["/a/b/0", "/a/b/1", "/c"];
  return { doc: closed.state.doc,
           values: watch.map(function (path) { return [path, readPath(closed.state.doc, path)]; }),
           applied_first: first.applied, applied_wide: wide.applied,
           pair_differs: first.applied !== wide.applied,
           pending_before: first.pending_before, pending_paths: first.pending_paths,
           catchup: closed.catchup, pending_after: closed.state.pending.length,
           mid_differs: fingerprint(r2.state) !== fingerprint(first.state),
           closed_equal: fingerprint(closedTwo.state) === fingerprint(closed.state),
           replay_new: replay.applied, judged: first.judged, judged_bound: first.judged_bound,
           full_diff: fingerprint(closed.state) === fingerprint(fullClosed.state) ? 0 : 1,
           count: events.length, tail: parentOf({ a: 1 }, "/a") ? 1 : 0 };
}
