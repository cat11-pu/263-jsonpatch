// patchrun.js：按更新预算应用并留账（基线：一律给空表）
import { parentOf, readPath } from "./jsonptr.js";

export function step(spec) {
  return { state: spec.state, applied: 0, pending_before: 0, pending_paths: [],
           judged: 0, judged_bound: 0 };
}

export function close(spec) {
  return { state: spec.state, catchup: 0 };
}
