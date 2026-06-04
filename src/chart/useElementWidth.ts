import { useLayoutEffect, useRef, useState } from "react";

/** Tracks the live pixel width of a div via ResizeObserver, so an SVG chart can
 * render crisply at the container's real width instead of scaling a viewBox. */
export function useElementWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(element.clientWidth);
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}
