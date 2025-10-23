function diffFields(before = {}, after = {}, allowKeys = []) {
  const changed = {};
  const keys = allowKeys.length
    ? allowKeys
    : Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  for (const k of keys) {
    const a = before[k];
    const b = after[k];
    const same =
      Array.isArray(a) && Array.isArray(b)
        ? a.length === b.length && a.every((v, i) => v === b[i])
        : a === b;
    if (!same) changed[k] = { from: a, to: b };
  }
  return changed;
}

module.exports = { diffFields };
