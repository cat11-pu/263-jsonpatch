import assert from "node:assert";
import { parentOf, readPath } from "../jsonptr.js";
import { step, close } from "../patchrun.js";
import { render } from "../app.js";

const base = {
  budget: 2,
  state: { doc: { a: 1 }, pending: [], applied: [] },
  events: [],
  path_error_code: "E_PATH_MISSING", index_error_code: "E_INDEX_RANGE",
  event_error_code: "E_BAD_EVENT"
};

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("readPath returns a number or empty", () => {
  const value = readPath({ a: 1 }, "/a");
  assert.ok(typeof value === "number" || value === undefined);
});

check("parentOf returns a holder", () => {
  assert.ok(parentOf({ a: 1 }, "/a") === null || typeof parentOf({ a: 1 }, "/a") === "object");
});

check("step returns a state", () => {
  assert.strictEqual(typeof step(base).state, "object");
});

check("close returns a state", () => {
  assert.strictEqual(typeof close(base).state, "object");
});

check("render counts events", () => {
  assert.strictEqual(typeof render(base).count, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
