export type WorldPoint = { x: number; y: number };

export type DragPoint = { id: number; x: number; y: number };

export type Drag = {
  active: number | null;
  points: DragPoint[];
};

export type DragStep = {
  drag: Drag;
  deltas: { dx: number; dy: number }[];
};

export function createDrag(): Drag {
  return { active: null, points: [] };
}

function writePoint(points: readonly DragPoint[], id: number, x: number, y: number): DragPoint[] {
  let found = false;
  const next = points.map((point) => {
    if (point.id !== id) {
      return point;
    }
    found = true;
    return { id, x, y };
  });
  if (!found) {
    next.push({ id, x, y });
  }
  return next;
}

export function beginPointer(drag: Drag, id: number, x: number, y: number): DragStep {
  return {
    drag: {
      active: drag.active ?? id,
      points: writePoint(drag.points, id, x, y),
    },
    deltas: [],
  };
}

export function movePointer(drag: Drag, id: number, samples: readonly WorldPoint[]): DragStep {
  const current = drag.points.find((point) => point.id === id);
  if (current === undefined) {
    return { drag, deltas: [] };
  }
  let x = current.x;
  let y = current.y;
  const deltas: { dx: number; dy: number }[] = [];
  for (const sample of samples) {
    const dx = sample.x - x;
    const dy = sample.y - y;
    x = sample.x;
    y = sample.y;
    if (drag.active === id && (dx !== 0 || dy !== 0)) {
      deltas.push({ dx, dy });
    }
  }
  return {
    drag: { active: drag.active, points: writePoint(drag.points, id, x, y) },
    deltas,
  };
}

export function endPointer(drag: Drag, id: number): DragStep {
  const points = drag.points.filter((point) => point.id !== id);
  const active = drag.active === id ? (points[0]?.id ?? null) : drag.active;
  return { drag: { active, points }, deltas: [] };
}
