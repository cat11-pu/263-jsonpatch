// jsonptr.js：JSON Pointer 解析、父容器定位与取值
function coded(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function decode(token) {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}

function toTokens(path) {
  if (typeof path !== "string" || path === "" || path.charAt(0) !== "/") return null;
  return path.slice(1).split("/").map(decode);
}

const INDEX_RE = /^(0|[1-9][0-9]*)$/;

function isArrayIndex(key) {
  return INDEX_RE.test(key);
}

export function parentOf(doc, path) {
  const tokens = toTokens(path);
  if (tokens === null) throw coded("E_PATH_MISSING", "指针必须以 / 开头：" + String(path));
  let container = doc;
  for (let i = 0; i < tokens.length; i += 1) {
    const key = tokens[i];
    const atEnd = i === tokens.length - 1;
    if (Array.isArray(container)) {
      if (!isArrayIndex(key) || Number(key) >= container.length) {
        throw coded("E_INDEX_RANGE", "数组下标越界：" + path);
      }
    } else if (container !== null && typeof container === "object") {
      if (!Object.prototype.hasOwnProperty.call(container, key)) {
        throw coded("E_PATH_MISSING", "路径不存在：" + path);
      }
    } else {
      throw coded("E_PATH_MISSING", "路径不存在：" + path);
    }
    if (atEnd) return { container: container, key: key };
    container = container[key];
  }
  throw coded("E_PATH_MISSING", "路径不存在：" + path);
}

export function readPath(doc, path) {
  if (path === "") return doc;
  const tokens = toTokens(path);
  if (tokens === null) return undefined;
  let cur = doc;
  for (const key of tokens) {
    if (Array.isArray(cur)) {
      if (!isArrayIndex(key) || Number(key) >= cur.length) return undefined;
    } else if (cur !== null && typeof cur === "object") {
      if (!Object.prototype.hasOwnProperty.call(cur, key)) return undefined;
    } else {
      return undefined;
    }
    cur = cur[key];
  }
  return cur;
}
