import { motion } from "motion/react";

export const StaggeredText = ({
  text,
  className,
  delayOffset = 0,
}: {
  text: string;
  className?: string;
  delayOffset?: number;
}) => {
  return (
    <div className={`flex flex-wrap overflow-hidden ${className}`}>
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 1.0,
            ease: [0.33, 1, 0.68, 1],
            delay: delayOffset + index * 0.08,
          }}
          className="inline-block whitespace-pre"
        >
          {char}
        </motion.span>
      ))}
    </div>
  );
};
