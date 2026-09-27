// jsonptr.js：指针解析与取值
function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function segmentsOf(path) {
  if (typeof path !== "string" || path[0] !== "/") {
    fail("E_PATH_MISSING", "路径必须以斜杠开头: " + String(path));
  }
  return path.split("/").slice(1);
}

function isIndex(seg) {
  return /^\d+$/.test(seg);
}

function descend(node, seg) {
  if (Array.isArray(node)) {
    if (!isIndex(seg) || Number(seg) >= node.length) {
      fail("E_INDEX_RANGE", "数组下标越界: " + seg);
    }
    return node[Number(seg)];
  }
  if (node !== null && typeof node === "object") {
    if (!Object.prototype.hasOwnProperty.call(node, seg)) {
      fail("E_PATH_MISSING", "路径不存在: " + seg);
    }
    return node[seg];
  }
  fail("E_PATH_MISSING", "路径穿过非容器: " + seg);
}

export function parentOf(doc, path) {
  const segs = segmentsOf(path);
  let node = doc;
  for (let i = 0; i < segs.length - 1; i += 1) {
    node = descend(node, segs[i]);
  }
  const last = segs[segs.length - 1];
  if (Array.isArray(node)) {
    if (!isIndex(last) || Number(last) >= node.length) {
      fail("E_INDEX_RANGE", "数组下标越界: " + last);
    }
    return { holder: node, key: Number(last) };
  }
  if (node !== null && typeof node === "object") {
    if (!Object.prototype.hasOwnProperty.call(node, last)) {
      fail("E_PATH_MISSING", "路径末端不存在: " + last);
    }
    return { holder: node, key: last };
  }
  fail("E_PATH_MISSING", "父容器不存在: " + path);
}

export function readPath(doc, path) {
  try {
    const segs = segmentsOf(path);
    let node = doc;
    for (const seg of segs) {
      node = descend(node, seg);
    }
    return node;
  } catch (error) {
    return undefined;
  }
}
