import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export interface ScrollRevealProps {
  children: React.ReactNode;
  baseOpacity?: number;
  enableBlur?: boolean;
  baseRotation?: number;
  blurStrength?: number;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  baseOpacity = 0,
  enableBlur = true,
  baseRotation = 5,
  blurStrength = 10,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 85%', 'end 35%'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.6], [baseOpacity, 1]);
  const rotation = useTransform(scrollYProgress, [0, 0.6], [baseRotation, 0]);
  const y = useTransform(scrollYProgress, [0, 0.6], [40, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.6], [0.95, 1]);

  const blurFilter = useTransform(
    scrollYProgress,
    [0, 0.6],
    [enableBlur ? `blur(${blurStrength}px)` : 'blur(0px)', 'blur(0px)']
  );

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <motion.div
        style={{
          opacity,
          rotateX: rotation,
          y,
          scale,
          filter: blurFilter,
          transformPerspective: 1000,
        }}
        className="will-change-[transform,opacity,filter]"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default ScrollReveal;
