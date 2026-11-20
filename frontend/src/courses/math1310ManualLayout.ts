type Position = {
  x: number
  y: number
}

const COLUMN_STEP = 320
const ROW_STEP = 145

function grid(column: number, row: number): Position {
  return {
    x: column * COLUMN_STEP,
    y: row * ROW_STEP,
  }
}

/**
 * Hand-tweakable planar seed for the default MATH 1310 dashboard.
 *
 * Every target sits on a common grid so columns and rows align exactly.
 * COLUMN_STEP leaves 40px between an expanded 390px card and a collapsed
 * 170px card in the neighboring column.
 *
 * The main body uses alternating occupied rows to keep the graph compact.
 * The lower integral chain continues the stagger through F1 -> I1 -> I3,
 * then finishes with the horizontal I3 -> I4 segment.
 *
 * The automatic rank layout remains available as a fallback for any target
 * without an explicit manual position.
 */
export const math1310ManualPositions = {
  // Left side
  L1: grid(0, 2),
  PS: grid(0, 4),
  L2: grid(1, 3),
  L3: grid(2, 2),
  L4: grid(2, 4),

  // Derivative chain
  D1: grid(3, 3),
  F2: grid(3, 5),
  D3: grid(4, 4),
  F1: grid(4, 6),
  D2: grid(5, 3),

  // Integral branch
  I2: grid(5, 5),
  I1: grid(5, 7),

  // Applications and FTC
  A2: grid(6, 0),
  D4: grid(6, 2),
  D5: grid(6, 6),
  I3: grid(6, 8),

  // Right edge
  A3: grid(7, 0),
  A4: grid(7, 2),
  A1: grid(7, 4),
  I5: grid(7, 6),
  I4: grid(7, 8),
} satisfies Record<string, Position>

export function withMath1310ManualPositions(
  fallbackPositions: ReadonlyMap<string, Position>,
): Map<string, Position> {
  const positions = new Map(fallbackPositions)

  for (const [id, position] of Object.entries(math1310ManualPositions)) {
    positions.set(id, position)
  }

  return positions
}
