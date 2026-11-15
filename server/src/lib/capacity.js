// Room capacity maths (pure, so it is unit-tested). Ranges are [startMs, endMs).

/**
 * Most bookings running at the same moment anywhere inside [start, end).
 * Two bookings that both overlap the slot but not each other only need one room,
 * so we check peak concurrency, not the raw overlap count. Concurrency only rises
 * at a start time, so checking `start` and each booking start inside the window
 * is enough.
 */
export function peakOverlap(ranges, start, end) {
  const hits = ranges.filter(([s, e]) => s < end && e > start)
  const points = [start, ...hits.map(([s]) => s).filter((s) => s > start)]
  let peak = 0
  for (const t of points) peak = Math.max(peak, hits.filter(([s, e]) => s <= t && e > t).length)
  return peak
}
