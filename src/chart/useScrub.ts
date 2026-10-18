import { useRef, useState } from "react";
import { HALF_WINDOW } from "../weather/groupByDay.ts";

/** Sideways travel (px) before a touch counts as a scrub, not a scroll. */
const TOUCH_SLOP = 4;

/**
 * A time cursor in hours from now, moved by dragging (touch) or hovering
 * (mouse) across a plot. It rests at now and springs back to now when the
 * finger lifts or the mouse leaves, like the iOS Weather charts.
 *
 * The element keeps `touch-action: pan-y`, so a vertical swipe still scrolls
 * the page: a touch only starts scrubbing once it has moved more sideways
 * than up or down. `plot` gives the plot's left edge and width inside the
 * element.
 */
export function useScrub(plot: { left: number; width: number }) {
  const [cursor, setCursor] = useState(0);
  const [active, setActive] = useState(false);
  const touch = useRef<{ id: number; x: number; y: number; scrubbing: boolean } | null>(null);

  const moveTo = (event: React.PointerEvent<HTMLElement>) => {
    if (plot.width <= 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left - plot.left) / plot.width;
    const rel = Math.round(ratio * HALF_WINDOW * 2 - HALF_WINDOW);
    setCursor(Math.max(-HALF_WINDOW, Math.min(HALF_WINDOW, rel)));
    setActive(true);
  };

  const reset = () => {
    touch.current = null;
    setActive(false);
    setCursor(0);
  };

  const handlers = {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse") return;
      touch.current = { id: event.pointerId, x: event.clientX, y: event.clientY, scrubbing: false };
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse") {
        moveTo(event);
        return;
      }
      const start = touch.current;
      if (!start || start.id !== event.pointerId) return;
      if (!start.scrubbing) {
        const dx = Math.abs(event.clientX - start.x);
        const dy = Math.abs(event.clientY - start.y);
        if (dx < TOUCH_SLOP || dx < dy) return;
        start.scrubbing = true;
        // Keep the moves coming even when the finger leaves the element.
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      moveTo(event);
    },
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType !== "mouse") reset();
    },
    onPointerCancel: reset,
    onPointerLeave: (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse") reset();
    },
  };

  const style: React.CSSProperties = {
    touchAction: "pan-y",
    userSelect: "none",
    WebkitUserSelect: "none",
    WebkitTouchCallout: "none",
  };

  return { cursor, active, handlers, style };
}
