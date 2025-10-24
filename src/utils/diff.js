/**
 * Membandingkan dua objek dan mengembalikan objek baru
 * yang hanya berisi key-value pair yang berbeda.
 * Berguna untuk logging perubahan data.
 * @param {object} before - Objek sebelum perubahan.
 * @param {object} after - Objek setelah perubahan.
 * @param {string[]} [allowKeys=[]] - Array opsional berisi kunci yang hanya ingin dibandingkan. Jika kosong, semua kunci dibandingkan.
 * @returns {object} Objek berisi perbedaan { key: { from: valueBefore, to: valueAfter } }.
 */
function diffFields(before = {}, after = {}, allowKeys = []) {
  const changed = {};
  const keys = allowKeys.length
    ? allowKeys
    : Array.from(
        new Set([...Object.keys(before || {}), ...Object.keys(after || {})])
      );

  for (const k of keys) {
    const a = before ? before[k] : undefined;
    const b = after ? after[k] : undefined;

    const same =
      Array.isArray(a) && Array.isArray(b)
        ? a.length === b.length && a.every((v, i) => v === b[i])
        : a === b;

    if (!same) {
      changed[k] = { from: a, to: b };
    }
  }
  return changed;
}

module.exports = { diffFields };
