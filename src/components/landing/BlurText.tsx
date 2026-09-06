import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { Variants } from 'framer-motion';

export interface BlurTextProps {
  text: string;
  delay?: number;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  onAnimationComplete?: () => void;
  className?: string;
  baseOpacity?: number;
}

export const BlurText: React.FC<BlurTextProps> = ({
  text,
  delay = 150,
  animateBy = 'words',
  direction = 'top',
  onAnimationComplete,
  className = '',
  baseOpacity = 0,
}) => {
  const ref = useRef<HTMLHeadingElement | HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' });

  const elements = animateBy === 'words' ? text.split(' ') : text.split('');

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: delay / 1000,
      },
    },
  };

  const yOffset = direction === 'top' ? -24 : 24;

  const childVariants: Variants = {
    hidden: {
      opacity: baseOpacity,
      filter: 'blur(12px)',
      y: yOffset,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={`inline-flex flex-wrap gap-x-[0.25em] gap-y-[0.1em] ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      onAnimationComplete={onAnimationComplete}
    >
      {elements.map((el, index) => (
        <motion.span
          key={index}
          variants={childVariants}
          className="inline-block will-change-[transform,filter,opacity]"
        >
          {el === ' ' ? '\u00A0' : el}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default BlurText;
