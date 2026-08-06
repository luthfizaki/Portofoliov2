import { useRef, useState, useEffect, type SyntheticEvent } from "react";
import {
  motion,
  useSpring,
  useMotionValue,
  useMotionTemplate,
} from "motion/react";
import { assetUrl } from "../lib/apiBase";

interface DynamicSpotlightPhotoProps {
  blurImageUrl?: string;
  sharpImageUrl?: string;
}

const FALLBACK_BLUR_IMAGE = "/luthfi_blur.png";
const FALLBACK_SHARP_IMAGE = "/luthfi_sharp.png";

export const DynamicSpotlightPhoto = ({
  blurImageUrl = FALLBACK_BLUR_IMAGE,
  sharpImageUrl = FALLBACK_SHARP_IMAGE,
}: DynamicSpotlightPhotoProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const blurImageSrc = assetUrl(blurImageUrl || FALLBACK_BLUR_IMAGE);
  const sharpImageSrc = assetUrl(sharpImageUrl || FALLBACK_SHARP_IMAGE);

  const useFallbackImage = (fallback: string) => (event: SyntheticEvent<HTMLImageElement>) => {
    if (!event.currentTarget.src.endsWith(fallback)) {
      event.currentTarget.src = fallback;
    }
  };

  // Tentukan posisi awal viewfinder di sini (0.0 hingga 1.0)
  // Contoh: 0.5 = tengah, 0.3 = kiri/atas, 0.7 = kanan/bawah
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const INITIAL_X_PERCENT = isMobile ? 0.98 : 0.6; // Centered on face for Desktop (adjusted for composition)
  const INITIAL_Y_PERCENT = 0.46; // Sedikit ke atas untuk rata-rata wajah

  // Ubah ukuran lebar dan tinggi viewfinder di sini (dalam pixel)
  const VIEWFINDER_WIDTH_MOBILE = 220;
  const VIEWFINDER_HEIGHT_MOBILE = 320;

  const VIEWFINDER_WIDTH_DESKTOP = 400;
  const VIEWFINDER_HEIGHT_DESKTOP = 560;

  // --- KONFIGURASI POSISI BACKGROUND FOTO (MOBILE VIEW) ---
  // Ubah persentase X pada class di bawah ini untuk menggeser gambar secara manual di layar HP.
  // - Nilai makin besar (contoh: object-[85%_center] atau object-[95%_center]): Fokus foto lebih ke sisi kanan (wajah bergeser).
  // - Class 'md:object-center' memastikan di tampilan Web/Desktop foto otomatis kembali ke tengah.
  const photoPositionClasses = "object-[30%_center] md:object-center";

  const mouseX = useMotionValue(
    typeof window !== "undefined" ? window.innerWidth * INITIAL_X_PERCENT : 0,
  );
  const mouseY = useMotionValue(
    typeof window !== "undefined" ? window.innerHeight * INITIAL_Y_PERCENT : 0,
  );

  const [showSpotlight, setShowSpotlight] = useState(false);
  const hasInitiallyMoved = useRef(false);
  const initialMousePos = useRef<{ x: number; y: number } | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 2500); // Tunggu sampai animasi teks muncul
    return () => clearTimeout(timer);
  }, []);

  const springX = useSpring(mouseX, { stiffness: 100, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 25 });

  const vfWidth = useMotionValue(
    typeof window !== "undefined"
      ? window.innerWidth >= 768
        ? VIEWFINDER_WIDTH_DESKTOP
        : VIEWFINDER_WIDTH_MOBILE
      : 260,
  );
  const vfHeight = useMotionValue(
    typeof window !== "undefined"
      ? window.innerWidth >= 768
        ? VIEWFINDER_HEIGHT_DESKTOP
        : VIEWFINDER_HEIGHT_MOBILE
      : 410,
  );

  // Ukuran jarak (margin) antara kotak spotlight dengan tepi viewfinder
  const SPOTLIGHT_PADDING_X = 40; // Untuk lebar
  const SPOTLIGHT_PADDING_Y = 40; // Untuk tinggi

  const maskPosition = useMotionTemplate`calc(${springX}px - (${vfWidth}px - ${SPOTLIGHT_PADDING_X}px) / 2) calc(${springY}px - (${vfHeight}px - ${SPOTLIGHT_PADDING_Y}px) / 2)`;
  const maskSize = useMotionTemplate`calc(${vfWidth}px - ${SPOTLIGHT_PADDING_X}px) calc(${vfHeight}px - ${SPOTLIGHT_PADDING_Y}px)`;

  useEffect(() => {
    const handleResize = () => {
      vfWidth.set(
        window.innerWidth >= 768
          ? VIEWFINDER_WIDTH_DESKTOP
          : VIEWFINDER_WIDTH_MOBILE,
      );
      vfHeight.set(
        window.innerWidth >= 768
          ? VIEWFINDER_HEIGHT_DESKTOP
          : VIEWFINDER_HEIGHT_MOBILE,
      );
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Touch devices never emit these mouse events, so skip the listeners and
    // the per-move spring churn entirely — the spotlight rests at its initial
    // (mobile-tuned) position instead.
    if (isMobile) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!hasInitiallyMoved.current) {
        if (!initialMousePos.current) {
          initialMousePos.current = { x: e.clientX, y: e.clientY };
        }

        const dx = e.clientX - initialMousePos.current.x;
        const dy = e.clientY - initialMousePos.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 50) {
          hasInitiallyMoved.current = true;
          setShowSpotlight(true);
        }
      } else {
        setShowSpotlight(true);
      }

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    };

    const handleGlobalMouseLeave = () => {
      if (hasInitiallyMoved.current) {
        setShowSpotlight(false);
        mouseX.set(window.innerWidth * INITIAL_X_PERCENT);
        mouseY.set(window.innerHeight * INITIAL_Y_PERCENT);
      }
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseleave", handleGlobalMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseleave", handleGlobalMouseLeave);
    };
  }, [mouseX, mouseY]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden">
      {/* Base Layer: Pre-Blurred Image */}
      <div className="absolute inset-0 bg-[#060A14]">
        <img
          src={blurImageSrc}
          alt="Luthfi Base Blurred"
          className={`w-full h-full object-cover opacity-80 ${photoPositionClasses}`}
          onError={useFallbackImage(FALLBACK_BLUR_IMAGE)}
        />
      </div>

      {/* Activated Background Layer: Transitions in after load */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded && !showSpotlight ? 1 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <img
          src={blurImageSrc}
          alt="Luthfi Activated Background"
          className={`w-full h-full object-cover ${photoPositionClasses}`}
          onError={useFallbackImage(FALLBACK_BLUR_IMAGE)}
        />
      </motion.div>

      {/* Spotlight Layer: Sharp Image + Masked */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded || showSpotlight ? 1 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        style={{
          WebkitMaskImage: "linear-gradient(black, black)",
          maskImage: "linear-gradient(black, black)",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: maskSize,
          maskSize: maskSize,
          WebkitMaskPosition: maskPosition,
          maskPosition: maskPosition,
        }}
      >
        <img
          src={sharpImageSrc}
          alt="Luthfi Sharp Spotlight"
          className={`w-full h-full object-cover ${photoPositionClasses}`}
          onError={useFallbackImage(FALLBACK_SHARP_IMAGE)}
        />
      </motion.div>

      {/* Dynamic Viewfinder following cursor */}
      <motion.div
        className="absolute z-20 pointer-events-none"
        style={{
          x: springX,
          y: springY,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded || showSpotlight ? 1 : 0 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      >
        <div
          className="-translate-x-1/2 -translate-y-1/2 relative hidden md:block"
          style={{
            width: VIEWFINDER_WIDTH_DESKTOP,
            height: VIEWFINDER_HEIGHT_DESKTOP,
          }}
        >
          <div className="absolute top-0 left-0 w-12 h-12 border-t-[2px] border-l-[2px] border-white/60" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-[2px] border-r-[2px] border-white/60" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[2px] border-l-[2px] border-white/60" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[2px] border-r-[2px] border-white/60" />

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/40 -translate-y-1/2" />
            <div className="absolute top-0 left-1/2 w-[1px] h-full bg-white/40 -translate-x-1/2" />
          </div>

          <div className="absolute top-7 left-7 font-mono text-[10px] text-white/90 font-medium tracking-widest hidden md:block drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] shimmer-white">
            FOCUS // ARZ
          </div>
          <motion.div
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="absolute bottom-7 right-7 font-mono text-[10px] text-[#ff3333]/90 font-medium tracking-widest hidden md:block drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
          >
            REC ●
          </motion.div>
        </div>

        {/* Mobile Version Spotlight */}
        <div
          className="-translate-x-1/2 -translate-y-1/2 relative block md:hidden"
          style={{
            width: VIEWFINDER_WIDTH_MOBILE,
            height: VIEWFINDER_HEIGHT_MOBILE,
          }}
        >
          <div className="absolute top-0 left-0 w-8 h-8 border-t-[2px] border-l-[2px] border-white/60" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-[2px] border-r-[2px] border-white/60" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[2px] border-l-[2px] border-white/60" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[2px] border-r-[2px] border-white/60" />

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/40 -translate-y-1/2" />
            <div className="absolute top-0 left-1/2 w-[1px] h-full bg-white/40 -translate-x-1/2" />
          </div>
        </div>
      </motion.div>

      {/* Minimal edge gradients for text readability */}
      <div className="absolute inset-y-0 left-0 w-[60%] lg:w-1/2 bg-gradient-to-r from-[#060A14] to-transparent pointer-events-none opacity-90 z-20" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#060A14] to-transparent pointer-events-none opacity-90 z-20" />
    </div>
  );
};
