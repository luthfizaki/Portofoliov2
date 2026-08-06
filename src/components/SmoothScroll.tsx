import { type ReactNode, useEffect, useState } from "react";
import type { LenisOptions } from "lenis";
import { ReactLenis } from "lenis/react";

const smoothScrollOptions: LenisOptions = {
  autoRaf: true,
  smoothWheel: true,
  syncTouch: false,
  lerp: 0.078,
  wheelMultiplier: 0.86,
  overscroll: true,
  stopInertiaOnNavigate: true,
};

type SmoothScrollProps = {
  children: ReactNode;
};

export function SmoothScroll({ children }: SmoothScrollProps) {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionPreference = () => {
      setShouldReduceMotion(motionQuery.matches);
    };

    motionQuery.addEventListener("change", handleMotionPreference);
    return () => motionQuery.removeEventListener("change", handleMotionPreference);
  }, []);

  if (shouldReduceMotion) return <>{children}</>;

  return (
    <ReactLenis root options={smoothScrollOptions}>
      {children}
    </ReactLenis>
  );
}
