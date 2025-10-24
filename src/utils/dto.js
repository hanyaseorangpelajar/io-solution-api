/**
 * Mengonversi nilai tanggal (Date, string, number) menjadi format ISO string.
 * Mengembalikan null jika input tidak valid.
 * @param {Date | string | number | null | undefined} d - Nilai tanggal.
 * @returns {string | null} Tanggal dalam format ISO string atau null.
 */
function toIso(d) {
  if (!d) return null;
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  } catch (e) {
    console.error("Error converting date to ISO:", e);
    return null;
  }
}

module.exports = { toIso };
