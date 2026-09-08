import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';

/**
 * Cubic Bezier solver for matching CSS cubic-bezier(0.35, 0, 0.25, 1)
 */
function solveCubicBezier(x, p1x = 0.35, p1y = 0.0, p2x = 0.25, p2y = 1.0) {
  let t = x;
  for (let i = 0; i < 6; i++) {
    const currentX = 3 * (1 - t) * (1 - t) * t * p1x + 3 * (1 - t) * t * t * p2x + t * t * t;
    const currentSlope = 3 * (1 - t) * (1 - t) * p1x + 6 * (1 - t) * t * (p2x - p1x) + 3 * t * t * (1 - p2x);
    if (Math.abs(currentSlope) < 1e-5) break;
    t -= (currentX - x) / currentSlope;
    t = Math.max(0, Math.min(1, t));
  }
  return 3 * (1 - t) * (1 - t) * t * p1y + 3 * (1 - t) * t * t * p2y + t * t * t;
}

/**
 * AnimatedBorderFrame:
 * Fast, snappy border tracing starting from bottom-center:
 * Bottom-Center -> LEFT -> UP -> RIGHT -> DOWN -> LEFT -> Bottom-Center
 * Accompanied by a bold, prominent white percentage capsule counting from 0% to 100%
 * that immediately disappears the instant the line reaches 100%.
 */
export default function AnimatedBorderFrame({ isIntroActive, onBorderComplete }) {
  const containerRef = useRef(null);
  const onBorderCompleteRef = useRef(onBorderComplete);
  onBorderCompleteRef.current = onBorderComplete;

  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? Math.max(300, window.innerWidth - 72) : 1400,
    height: typeof window !== 'undefined' ? Math.max(200, window.innerHeight - 54) : 700
  }));

  const [progress, setProgress] = useState(0);
  const [showCapsule, setShowCapsule] = useState(isIntroActive);
  const [capsuleFading, setCapsuleFading] = useState(false);

  // ResizeObserver for responsive SVG dimensions
  useLayoutEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current?.parentElement) {
        const rect = containerRef.current.parentElement.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setDimensions({ width: rect.width, height: rect.height });
        }
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current?.parentElement) {
      observer.observe(containerRef.current.parentElement);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      observer.disconnect();
    };
  }, []);

  // Sync the 0% -> 100% progress countdown with stroke animation (runs strictly ONCE per intro)
  useEffect(() => {
    if (!isIntroActive) {
      setProgress(100);
      setShowCapsule(false);
      setCapsuleFading(true);
      return;
    }

    setProgress(0);
    setShowCapsule(true);
    setCapsuleFading(false);

    let animId = null;
    let fadeTimer = null;
    const startDelay = 100; // ms (snappy start)
    const duration = 1100;  // ms (fast tracing ~1.1s)
    const startTime = performance.now() + startDelay;

    const step = (now) => {
      if (now < startTime) {
        setProgress(0);
        animId = requestAnimationFrame(step);
        return;
      }

      const elapsed = now - startTime;
      const rawFraction = Math.min(1, Math.max(0, elapsed / duration));
      const easedFraction = solveCubicBezier(rawFraction, 0.35, 0.0, 0.25, 1.0);
      const currentPct = Math.round(easedFraction * 100);
      setProgress(currentPct);

      if (rawFraction < 1) {
        animId = requestAnimationFrame(step);
      } else {
        // Line reached 100% -> notify parent & instantly fade out capsule
        setProgress(100);
        onBorderCompleteRef.current?.();
        setCapsuleFading(true);
        fadeTimer = setTimeout(() => {
          setShowCapsule(false);
        }, 180);
      }
    };

    animId = requestAnimationFrame(step);

    return () => {
      clearTimeout(fadeTimer);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isIntroActive]);

  const { width, height } = dimensions;
  const radius = 36;
  const strokeWidth = 2.5;
  const offset = strokeWidth / 2;
  const left = offset;
  const top = offset;
  const right = Math.max(left + radius * 2, width - offset);
  const bottom = Math.max(top + radius * 2, height - offset);
  const r = Math.min(radius, (right - left) / 2, (bottom - top) / 2);

  // Exact starting point: Bottom-Center
  const midX = width / 2;

  // Path tracing CLOCKWISE as marked in the user's diagram:
  // 1. Start at (midX, bottom)
  // 2. Move LEFT to (left + r, bottom)
  // 3. Curve UP around bottom-left corner to (left, bottom - r)
  // 4. Move UP to (left, top + r)
  // 5. Curve RIGHT around top-left corner to (left + r, top)
  // 6. Move RIGHT to (right - r, top)
  // 7. Curve DOWN around top-right corner to (right, top + r)
  // 8. Move DOWN to (right, bottom - r)
  // 9. Curve LEFT around bottom-right corner to (right - r, bottom)
  // 10. Move LEFT back to (midX, bottom)
  // 11. Close path (Z)
  const pathD = [
    `M ${midX.toFixed(2)} ${bottom.toFixed(2)}`,
    `L ${(left + r).toFixed(2)} ${bottom.toFixed(2)}`,
    `A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${left.toFixed(2)} ${(bottom - r).toFixed(2)}`,
    `L ${left.toFixed(2)} ${(top + r).toFixed(2)}`,
    `A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${(left + r).toFixed(2)} ${top.toFixed(2)}`,
    `L ${(right - r).toFixed(2)} ${top.toFixed(2)}`,
    `A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${right.toFixed(2)} ${(top + r).toFixed(2)}`,
    `L ${right.toFixed(2)} ${(bottom - r).toFixed(2)}`,
    `A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${(right - r).toFixed(2)} ${bottom.toFixed(2)}`,
    `L ${midX.toFixed(2)} ${bottom.toFixed(2)}`,
    'Z'
  ].join(' ');

  return (
    <div ref={containerRef} className="animated-border-container">
      <svg
        className={`animated-border-svg ${isIntroActive ? 'animating' : 'completed'}`}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="borderGlowFilter" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="rgba(255,255,255,0.7)" />
            <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="rgba(0,0,0,0.35)" />
          </filter>
        </defs>
        <path
          d={pathD}
          pathLength="1000"
          className="animated-border-path"
          filter="url(#borderGlowFilter)"
        />
      </svg>

      {/* Prominent solid white percentage capsule centered directly on bottom border */}
      {showCapsule && (
        <div
          className={`border-progress-capsule ${capsuleFading ? 'capsule-fade-out' : 'capsule-visible'}`}
          aria-live="polite"
        >
          <span className="progress-percent-val">{progress}%</span>
        </div>
      )}
    </div>
  );
}
