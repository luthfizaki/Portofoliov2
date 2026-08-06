import React, { useState, useRef } from "react";
import { motion } from "motion/react";

type MagneticLinkProps = {
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
};

export const MagneticLink: React.FC<MagneticLinkProps> = ({
  children,
  isActive = false,
  onClick,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current!.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      onClick={onClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={`portfolio-nav-link ${isActive ? "is-active" : ""} relative cursor-pointer text-sm tracking-wide transition-colors ${
        isActive
          ? "text-[#4176F0] font-medium"
          : "text-[#E0E7F1] hover:text-white"
      }`}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId="dot"
          className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#4176F0] shadow-[0_0_8px_rgba(65,118,240,0.8)]"
        />
      )}
    </motion.div>
  );
};
